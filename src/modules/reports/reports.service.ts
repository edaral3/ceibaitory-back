import { Injectable, InternalServerErrorException } from '@nestjs/common'
import {
  addMonths,
  aggregateProducts,
  buildCategoryDataset,
  buildDayRange,
  buildMonthRange,
  buildRange,
  categorizeProductsABC,
  calculateSaleUtility,
  DateRange,
  formatDayLabel,
  isoDateKey,
  linearRegressionForecast,
  ProductDocument,
  productsExpiringSoon,
  productsRunningOut,
  roundCurrency,
  SaleDocument,
  SaleSummary,
  summarizeSales,
} from '../../utils/reporting'
import {
  generateCreditPdf,
  generateExpiringProductsPdf,
  generateProductsOutOfStockPdf,
  generateSalesPdf,
} from '../../utils/pdfReports'
import { CollectionsService } from '../../core/context/collections.service'
import { RequestContextService } from '../../core/context/request-context.service'

const TIMEZONE_OFFSET = -6;
const DEFAULT_PREDICTION_MONTHS = 6;
const MIN_PREDICTION_MONTHS = 3;
const MAX_PREDICTION_MONTHS = 18;

type ReportContext = {
  CollectionProduct: any
  CollectionSale: any
  CollectionStoreItem: any
  CollectionStore: any
  companyName: string
  query?: Record<string, any>
  body?: any
}

const clampPredictionMonths = (value?: any): number => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return Math.min(
      Math.max(Math.floor(parsed), MIN_PREDICTION_MONTHS),
      MAX_PREDICTION_MONTHS
    );
  }
  return DEFAULT_PREDICTION_MONTHS;
};

const roundValue = (value: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

const monthKeyFromDate = (value: Date | string): string => {
  return isoDateKey(value).slice(0, 7);
};

const buildDateFilter = (range: DateRange, inclusiveEnd = false) => {
  const comparator = inclusiveEnd ? "$lte" : "$lt";
  return {
    date: {
      $gte: range.start,
      [comparator]: range.end,
    },
  };
};

const fetchSales = async (
  CollectionSale: any,
  range: DateRange,
  options?: { inclusiveEnd?: boolean; sort?: Record<string, 1 | -1> }
): Promise<SaleDocument[]> => {
  const dateFilter = buildDateFilter(range, options?.inclusiveEnd);
  return CollectionSale.find({
    canceled: false,
    ...dateFilter,
  })
    .sort(options?.sort ?? { date: 1 })
    .lean();
};

const fetchProducts = async (
  CollectionProduct: any,
  sort: Record<string, 1 | -1> = { expirationDate: -1 }
): Promise<ProductDocument[]> => {
  return CollectionProduct.find().sort(sort).lean();
};

const getStoreDisplayName = (store: any): string => {
  return store?.name ?? store?.ubication ?? "Bodega";
};

const toObjectIdString = (value: any): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value.toString === "function") {
    return value.toString();
  }
  return undefined;
};

const buildProductsWithStoreReportData = async (
  CollectionProduct: any,
  CollectionStore: any,
  CollectionStoreItem: any
) => {
  const [products, stores] = await Promise.all([
    fetchProducts(CollectionProduct),
    CollectionStore ? CollectionStore.find().lean() : [],
  ]);
  const productIds = products
    .map((product: any) => toObjectIdString(product._id))
    .filter((id): id is string => Boolean(id));

  let storeItems: any[] = [];
  if (CollectionStoreItem && productIds.length > 0) {
    storeItems = await CollectionStoreItem.find({
      productId: { $in: productIds },
    }).lean();
  }

  const amountsByProduct = new Map<string, Map<string, number>>();
  storeItems.forEach((item: any) => {
    const productId = toObjectIdString(item.productId);
    const storeId = toObjectIdString(item.ubication);
    if (!productId || !storeId) {
      return;
    }
    if (!amountsByProduct.has(productId)) {
      amountsByProduct.set(productId, new Map());
    }
    amountsByProduct.get(productId)!.set(storeId, item.amount ?? 0);
  });

  const decoratedProducts = products.map((product: any) => {
    const productId = toObjectIdString(product._id);
    const productStoreMap = productId
      ? amountsByProduct.get(productId)
      : undefined;
    const storeAmounts = stores.map((store: any) => {
      const storeId = toObjectIdString(store._id);
      const amount =
        (storeId && productStoreMap && productStoreMap.get(storeId)) ?? 0;
      return {
        storeId,
        storeName: getStoreDisplayName(store),
        amount,
      };
    });
    const warehouseExistence = storeAmounts.reduce(
      (sum: number, entry: any) => sum + (entry?.amount ?? 0),
      0
    );
    return {
      ...product,
      storeAmounts,
      warehouseExistence,
    };
  });

  return { stores, products: decoratedProducts };
};

const filterRunningOutProducts = (
  products: any[],
  options?: { requireWarehouseStock?: boolean }
) => {
  return products.filter((product: any) => {
    const existence = Number(product.existence ?? 0);
    const minExistence = Number(product.minExistence ?? 0);
    const isRunningOut = existence - minExistence <= 0;
    if (!isRunningOut) {
      return false;
    }
    if (options?.requireWarehouseStock) {
      const warehouseExistence =
        typeof product.warehouseExistence === "number"
          ? product.warehouseExistence
          : (product.storeAmounts ?? []).reduce(
              (sum: number, entry: any) => sum + (entry?.amount ?? 0),
              0
            );
      return warehouseExistence > 0;
    }
    return true;
  });
};

const buildProductsOutOfStockRows = (stores: any[], products: any[]) => {
  return products.map((product: any, index: number) => {
    const warehouseExistence =
      typeof product.warehouseExistence === "number"
        ? product.warehouseExistence
        : (product.storeAmounts ?? []).reduce(
            (sum: number, entry: any) => sum + (entry?.amount ?? 0),
            0
          );
    const storeDetails = stores.map((store: any) => {
      const storeId = toObjectIdString(store._id);
      const storeName = getStoreDisplayName(store);
      const match = product.storeAmounts?.find((entry: any) => {
        if (storeId && entry.storeId) {
          return String(entry.storeId) === storeId;
        }
        if (entry.storeName && storeName) {
          return entry.storeName === storeName;
        }
        return false;
      });
      return {
        storeId,
        storeName,
        amount: match ? match.amount ?? 0 : 0,
      };
    });
    return {
      index: index + 1,
      productId: product._id,
      name: product.name,
      existence: product.existence,
      minExistence: product.minExistence,
      warehouseExistence,
      stores: storeDetails,
    };
  });
};

const getDailySnapshot = async (
  CollectionSale: any,
  date: Date
): Promise<SaleSummary> => {
  const sales = await fetchSales(CollectionSale, buildDayRange(date));
  return summarizeSales(sales);
};

const bucketSalesByDate = (sales: SaleDocument[]) => {
  const bucket = new Map<string, SaleDocument[]>();
  sales.forEach((sale) => {
    const key = isoDateKey(sale.date);
    if (!bucket.has(key)) {
      bucket.set(key, []);
    }
    bucket.get(key)!.push(sale);
  });
  return bucket;
};

const buildMonthlyDailySeries = async (
  CollectionSale: any,
  referenceDate: Date
) => {
  const sales = await fetchSales(
    CollectionSale,
    buildMonthRange(referenceDate)
  );
  const bucket = bucketSalesByDate(sales);
  const sortedKeys = Array.from(bucket.keys()).sort();
  const summaries = sortedKeys.map((key) => summarizeSales(bucket.get(key)!));
  const labels = sortedKeys.map((key) => formatDayLabel(key));
  const data1 = summaries.map((summary) => roundCurrency(summary.utilities));
  const data2 = summaries.map((summary) => roundCurrency(summary.total));
  return { labels, data1, data2 };
};

const formatMonthLabel = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${month}/${date.getFullYear()}`;
};

interface MonthBucket extends DateRange {
  key: string;
  label: string;
}

const buildHistoricalBuckets = (
  referenceDate: Date,
  months: number
): { buckets: MonthBucket[]; range: DateRange } => {
  const { start } = buildMonthRange(referenceDate);
  const buckets: MonthBucket[] = [];
  for (let i = months; i >= 1; i--) {
    const bucketStart = addMonths(start, -i);
    const bucketEnd = addMonths(bucketStart, 1);
    buckets.push({
      key: monthKeyFromDate(bucketStart),
      label: formatMonthLabel(bucketStart),
      start: bucketStart,
      end: bucketEnd,
    });
  }

  if (buckets.length === 0) {
    return { buckets, range: { start, end: start } };
  }

  return {
    buckets,
    range: { start: buckets[0].start, end: buckets[buckets.length - 1].end },
  };
};

const buildYearlySeries = async (CollectionSale: any, referenceDate: Date) => {
  const monthRange = buildMonthRange(referenceDate);
  const range: DateRange = {
    start: addMonths(monthRange.start, -11),
    end: monthRange.end,
  };
  const sales = await fetchSales(CollectionSale, range);
  const bucket = new Map<string, SaleDocument[]>();
  sales.forEach((sale) => {
    const key = formatMonthLabel(new Date(sale.date));
    if (!bucket.has(key)) {
      bucket.set(key, []);
    }
    bucket.get(key)!.push(sale);
  });

  const labels: string[] = [];
  const revenue: number[] = [];
  const totals: number[] = [];
  for (let i = 0; i < 12; i++) {
    const monthStart = addMonths(range.start, i);
    const key = formatMonthLabel(monthStart);
    labels.push(key);
    const summary = summarizeSales(bucket.get(key) ?? []);
    revenue.push(roundCurrency(summary.utilities));
    totals.push(roundCurrency(summary.total));
  }

  return { labels, revenue, sales: totals };
};

const buildGuatemalaRange = (startDate: string, endDate: string): DateRange => {
  return buildRange(startDate, endDate, TIMEZONE_OFFSET);
};

const buildTrailingMonthsRange = (
  referenceDate: Date,
  months = 3
): DateRange => {
  const { end } = buildMonthRange(referenceDate);
  const start = new Date(end);
  start.setMonth(start.getMonth() - months);
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return { start, end };
};

const buildInventoryCsv = (products: any[]) => {
  let csvResponse = "#,Nombre,Cantidad,Precio Costo\n";
  products.forEach((item: any, index: number) => {
    const name = String(item.name ?? "").replace(/,/g, "");
    const existence = String(item.existence ?? "").replace(/,/g, "");
    const priceCost = String(item.priceCost ?? "").replace(/,/g, "");
    csvResponse += `${index + 1},${name},${existence},${priceCost}\n`;
  });
  return csvResponse;
};

const getInventoryExcel = async (ctx: ReportContext) => {
  const products = await ctx.CollectionProduct.find().sort({ fecha: -1 }).lean()
  const csvResponse = buildInventoryCsv(products)
  return { csv: csvResponse }
}

const getTop10ABC = async (ctx: ReportContext) => {
  const date = ctx.query?.date ? new Date(ctx.query.date as string) : new Date()
  const range = buildTrailingMonthsRange(date, 3)
  const sales = await fetchSales(ctx.CollectionSale, range)
  const aggregatedProducts = aggregateProducts(sales)
  const categories = categorizeProductsABC(aggregatedProducts)
  const dataA = buildCategoryDataset(categories.A, aggregatedProducts)
  const dataB = buildCategoryDataset(categories.B, aggregatedProducts)
  const dataC = buildCategoryDataset(categories.C, aggregatedProducts)
  const descriptions = {
    A: 'Productos tipo A concentran la mayor parte de los ingresos en los últimos 3 meses; requieren control estricto.',
    B: 'Productos tipo B aportan de forma intermedia; se gestionan con seguimiento regular.',
    C: 'Productos tipo C tienen bajo impacto en ingresos; conviene optimizar inventario y reposición.',
  }
  const withDescription = (category: 'A' | 'B' | 'C', data: any) => ({
    description: descriptions[category],
    ...data,
  })
  return {
    grapA: withDescription('A', dataA),
    grapB: withDescription('B', dataB),
    grapC: withDescription('C', dataC),
  }
}

const getDayReports = async (ctx: ReportContext) => {
  const date = ctx.query?.date ? new Date(ctx.query.date as string) : new Date()
  const snapshot = await getDailySnapshot(ctx.CollectionSale, date)
  return {
    dailyBillingSales: roundCurrency(snapshot.billedTotal),
    dailySales: roundCurrency(snapshot.total),
    utilityByDay: roundCurrency(snapshot.utilities),
    salesAmount: snapshot.saleCount,
  }
}

const getSalesReport = async (ctx: ReportContext) => {
  const { startDate, endDate, typeReport } = ctx.query ?? {}
  const range = buildGuatemalaRange(startDate as string, endDate as string)
  const sales = await fetchSales(ctx.CollectionSale, range, {
    inclusiveEnd: true,
  })
  const pdf = generateSalesPdf({
    companyName: ctx.companyName,
    startDate,
    endDate,
    typeReport,
    sales,
  })
  return { pdf }
}

const getProductsOutOfStockReport = async (ctx: ReportContext) => {
  const { stores, products } = await buildProductsWithStoreReportData(
    ctx.CollectionProduct,
    ctx.CollectionStore,
    ctx.CollectionStoreItem
  )
  const pdf = generateProductsOutOfStockPdf(
    ctx.companyName,
    products,
    stores
  )
  return { pdf }
}

const getProductsOutOfStockWithWarehouseReport = async (
  ctx: ReportContext
) => {
  const { stores, products } = await buildProductsWithStoreReportData(
    ctx.CollectionProduct,
    ctx.CollectionStore,
    ctx.CollectionStoreItem
  )
  const filteredProducts = filterRunningOutProducts(products, {
    requireWarehouseStock: true,
  })
  const pdf = generateProductsOutOfStockPdf(
    ctx.companyName,
    filteredProducts,
    stores
  )
  return { pdf }
}

const getProductsOutOfStockWithWarehouseData = async (ctx: ReportContext) => {
  const { stores, products } = await buildProductsWithStoreReportData(
    ctx.CollectionProduct,
    ctx.CollectionStore,
    ctx.CollectionStoreItem
  )
  const filteredProducts = filterRunningOutProducts(products, {
    requireWarehouseStock: true,
  })
  const rows = buildProductsOutOfStockRows(stores, filteredProducts)
  const headers = [
    '#',
    'Nombre',
    'Cantidad',
    'Cantidad minima',
    ...stores.map((store: any) => getStoreDisplayName(store)),
  ]
  return { headers, rows }
}

const getExpiringProducts = async (ctx: ReportContext) => {
  const products = await fetchProducts(ctx.CollectionProduct)
  const pdf = generateExpiringProductsPdf(ctx.companyName, products)
  return { pdf }
}

const montlyReports = async (ctx: ReportContext) => {
  const date = ctx.query?.date ? new Date(ctx.query.date as string) : new Date()
  const data = await buildMonthlyDailySeries(ctx.CollectionSale, date)
  return data
}

const sixMonthsReports = async (ctx: ReportContext) => {
  const date = ctx.query?.date ? new Date(ctx.query.date as string) : new Date()
  const data = await buildYearlySeries(ctx.CollectionSale, date)
  return data
}

const productsOutOfStockOfExpired = async (ctx: ReportContext) => {
  const products = await fetchProducts(ctx.CollectionProduct)
  const productsOutOfStock = productsRunningOut(products)
  const productsExpired = productsExpiringSoon(products, 30)
  return {
    productsOutOfStock: productsOutOfStock.length,
    productsExpired: productsExpired.length,
  }
}

const getInventoryAlerts = async (ctx: ReportContext) => {
  const products = await fetchProducts(ctx.CollectionProduct)
  const productsOutOfStock = productsRunningOut(products)
  const productsExpiring = productsExpiringSoon(products)
  return {
    productsOutOfStock,
    productsExpiring,
  }
}

const buildPredictionMetadata = (buckets: MonthBucket[]) => {
  if (buckets.length === 0) {
    const now = new Date();
    return {
      labels: [],
      nextMonth: {
        key: monthKeyFromDate(now),
        label: formatMonthLabel(now),
      },
    };
  }
  const labels = buckets.map((bucket) => bucket.label);
  const nextMonthStart = buckets[buckets.length - 1].end;
  return {
    labels,
    nextMonth: {
      key: monthKeyFromDate(nextMonthStart),
      label: formatMonthLabel(nextMonthStart),
    },
  };
};

const predictProductDemand = async (ctx: ReportContext) => {
  const referenceDate = ctx.query?.date
    ? new Date(ctx.query.date as string)
    : new Date()
  const months = clampPredictionMonths(ctx.query?.months)
  const { buckets, range } = buildHistoricalBuckets(referenceDate, months)
  const sales = await fetchSales(ctx.CollectionSale, range, { sort: { date: 1 } })
  const bucketIndex = new Map(
    buckets.map((bucket, index) => [bucket.key, index])
  )
  const seriesMap = new Map<string, number[]>()

  sales.forEach((sale) => {
    const key = monthKeyFromDate(sale.date)
    const index = bucketIndex.get(key)
    if (index === undefined) {
      return
    }
    sale.products?.forEach((product) => {
      if (!seriesMap.has(product.name)) {
        seriesMap.set(product.name, new Array(buckets.length).fill(0))
      }
      seriesMap.get(product.name)![index] += product.amount
    })
  })

  const metadata = buildPredictionMetadata(buckets)
  const products = Array.from(seriesMap.entries())
    .map(([name, history]) => {
      const prediction = linearRegressionForecast(history)
      return {
        product: name,
        predictedAmount: roundValue(prediction),
        history: history.map((value, idx) => ({
          label: metadata.labels[idx] ?? '',
          value: roundValue(value),
        })),
      }
    })
    .filter(
      (item) =>
        item.predictedAmount > 0 ||
        item.history.some((point) => point.value > 0)
    )
    .sort((a, b) => b.predictedAmount - a.predictedAmount)
    .slice(0, 30)

  return {
    monthsAnalyzed: buckets.length,
    ...metadata,
    products,
  }
}

const predictMonthlyProfit = async (ctx: ReportContext) => {
  const referenceDate = ctx.query?.date
    ? new Date(ctx.query.date as string)
    : new Date()
  const months = clampPredictionMonths(ctx.query?.months)
  const { buckets, range } = buildHistoricalBuckets(referenceDate, months)
  const sales = await fetchSales(ctx.CollectionSale, range, { sort: { date: 1 } })
  const bucketIndex = new Map(
    buckets.map((bucket, index) => [bucket.key, index])
  )
  const utilities = new Array(buckets.length).fill(0)

  sales.forEach((sale) => {
    const key = monthKeyFromDate(sale.date)
    const index = bucketIndex.get(key)
    if (index === undefined) {
      return
    }
    utilities[index] += calculateSaleUtility(sale)
  })

  const metadata = buildPredictionMetadata(buckets)
  const history = utilities.map((value) => roundValue(value))
  const prediction = roundValue(linearRegressionForecast(utilities))

  return {
    monthsAnalyzed: buckets.length,
    ...metadata,
    history,
    prediction,
  }
}

const getCreditInfo = async (ctx: ReportContext) => {
  const pdf = generateCreditPdf(ctx.companyName, ctx.body.credit)
  return { pdf }
}

@Injectable()
export class ReportsService {
  constructor (
    private readonly collections: CollectionsService,
    private readonly requestContext: RequestContextService
  ) {}

  private buildContext (
    query?: Record<string, any>,
    body?: any
  ): ReportContext {
    return {
      CollectionProduct: this.collections.get('product'),
      CollectionSale: this.collections.get('sale'),
      CollectionStoreItem: this.collections.get('storeItem'),
      CollectionStore: this.collections.get('store'),
      companyName: this.requestContext.companyName ?? '',
      query,
      body
    }
  }

  private async executeReport<T> (
    handler: () => Promise<T>,
    message: string
  ): Promise<T> {
    try {
      return await handler()
    } catch (error) {
      throw new InternalServerErrorException(message)
    }
  }

  getInventoryExcelReport (): Promise<any> {
    return this.executeReport(
      () => getInventoryExcel(this.buildContext()),
      'Error creando el reporte'
    )
  }

  getTop10ABCReport (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => getTop10ABC(this.buildContext(query)),
      'Error creando el reporte'
    )
  }

  getDailyReports (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => getDayReports(this.buildContext(query)),
      'Error creando el reporte'
    )
  }

  getSalesReportPdf (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => getSalesReport(this.buildContext(query)),
      'Error creando el reporte'
    )
  }

  getProductsOutOfStockPdf (): Promise<any> {
    return this.executeReport(
      () => getProductsOutOfStockReport(this.buildContext()),
      'Error creando el reporte'
    )
  }

  getProductsOutOfStockWithWarehousePdf (): Promise<any> {
    return this.executeReport(
      () => getProductsOutOfStockWithWarehouseReport(this.buildContext()),
      'Error creando el reporte con bodegas'
    )
  }

  getProductsOutOfStockWithWarehouseData (): Promise<any> {
    return this.executeReport(
      () => getProductsOutOfStockWithWarehouseData(this.buildContext()),
      'Error obteniendo los datos del reporte'
    )
  }

  getExpiringProductsPdf (): Promise<any> {
    return this.executeReport(
      () => getExpiringProducts(this.buildContext()),
      'Error creando el reporte'
    )
  }

  getMonthlyReports (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => montlyReports(this.buildContext(query)),
      'Error creando el reporte'
    )
  }

  getSixMonthsReports (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => sixMonthsReports(this.buildContext(query)),
      'Error creando el reporte'
    )
  }

  getProductsOutOfStockVsExpired (): Promise<any> {
    return this.executeReport(
      () => productsOutOfStockOfExpired(this.buildContext()),
      'Error creando el reporte'
    )
  }

  getInventoryAlertsReport (): Promise<any> {
    return this.executeReport(
      () => getInventoryAlerts(this.buildContext()),
      'Error obteniendo los productos'
    )
  }

  predictProductDemandReport (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => predictProductDemand(this.buildContext(query)),
      'Error generando la predicción'
    )
  }

  predictMonthlyProfitReport (query: Record<string, any>): Promise<any> {
    return this.executeReport(
      () => predictMonthlyProfit(this.buildContext(query)),
      'Error generando la predicción'
    )
  }

  getCreditInfoPdf (body: any): Promise<any> {
    return this.executeReport(
      () => getCreditInfo(this.buildContext(undefined, body)),
      'Error creando el reporte'
    )
  }
}
