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
} from "../utils/reporting";
import {
  generateCreditPdf,
  generateExpiringProductsPdf,
  generateProductsOutOfStockPdf,
  generateSalesPdf,
} from "../utils/pdfReports";

const TIMEZONE_OFFSET = -6;
const DEFAULT_PREDICTION_MONTHS = 6;
const MIN_PREDICTION_MONTHS = 3;
const MAX_PREDICTION_MONTHS = 18;

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

const getInventoryExcel = async (req: any, res: any): Promise<void> => {
  try {
    const products = await req.CollectionProduct.find().sort({ fecha: -1 }).lean();
    const csvResponse = buildInventoryCsv(products);
    res.send({ csv: csvResponse });
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const getTop10ABC = async (req: any, res: any): Promise<void> => {
  try {
    const date = new Date(req.query.date);
    const range = buildTrailingMonthsRange(date, 3);
    const sales = await fetchSales(req.CollectionSale, range);
    const aggregatedProducts = aggregateProducts(sales);
    const categories = categorizeProductsABC(aggregatedProducts);
    const dataA = buildCategoryDataset(categories.A, aggregatedProducts);
    const dataB = buildCategoryDataset(categories.B, aggregatedProducts);
    const dataC = buildCategoryDataset(categories.C, aggregatedProducts);
    const descriptions = {
      A: "Productos tipo A concentran la mayor parte de los ingresos en los últimos 3 meses; requieren control estricto.",
      B: "Productos tipo B aportan de forma intermedia; se gestionan con seguimiento regular.",
      C: "Productos tipo C tienen bajo impacto en ingresos; conviene optimizar inventario y reposición.",
    };
    const withDescription = (category: "A" | "B" | "C", data: any) => ({
      description: descriptions[category],
      ...data,
    });

    res.send({
      grapA: withDescription("A", dataA),
      grapB: withDescription("B", dataB),
      grapC: withDescription("C", dataC),
    });
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const getDayReports = async (req: any, res: any): Promise<void> => {
  try {
    const date = new Date(req.query.date);
    const snapshot = await getDailySnapshot(req.CollectionSale, date);
    res.send({
      dailyBillingSales: roundCurrency(snapshot.billedTotal),
      dailySales: roundCurrency(snapshot.total),
      utilityByDay: roundCurrency(snapshot.utilities),
      salesAmount: snapshot.saleCount,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const getSalesReport = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, typeReport } = req.query;
  try {
    const range = buildGuatemalaRange(startDate, endDate);
    const sales = await fetchSales(req.CollectionSale, range, {
      inclusiveEnd: true,
    });
    const pdf = generateSalesPdf({
      companyName: req.companyName,
      startDate,
      endDate,
      typeReport,
      sales,
    });
    res.send({ pdf });
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const getProductsOutOfStockReport = async (
  req: any,
  res: any
): Promise<void> => {
  try {
    const { stores, products } = await buildProductsWithStoreReportData(
      req.CollectionProduct,
      req.CollectionStore,
      req.CollectionStoreItem
    );
    const pdf = generateProductsOutOfStockPdf(
      req.companyName,
      products,
      stores
    );
    res.send({ pdf });
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const getProductsOutOfStockWithWarehouseReport = async (
  req: any,
  res: any
): Promise<void> => {
  try {
    const { stores, products } = await buildProductsWithStoreReportData(
      req.CollectionProduct,
      req.CollectionStore,
      req.CollectionStoreItem
    );
    const filteredProducts = filterRunningOutProducts(products, {
      requireWarehouseStock: true,
    });
    const pdf = generateProductsOutOfStockPdf(
      req.companyName,
      filteredProducts,
      stores
    );
    res.send({ pdf });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creando el reporte con bodegas" });
  }
};

const getProductsOutOfStockWithWarehouseData = async (
  req: any,
  res: any
): Promise<void> => {
  try {
    const { stores, products } = await buildProductsWithStoreReportData(
      req.CollectionProduct,
      req.CollectionStore,
      req.CollectionStoreItem
    );
    const filteredProducts = filterRunningOutProducts(products, {
      requireWarehouseStock: true,
    });
    const rows = buildProductsOutOfStockRows(stores, filteredProducts);
    const headers = [
      "#",
      "Nombre",
      "Cantidad",
      "Cantidad minima",
      ...stores.map((store: any) => getStoreDisplayName(store)),
    ];
    res.send({ headers, rows });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error obteniendo los datos del reporte" });
  }
};

const getExpiringProducts = async (req: any, res: any): Promise<void> => {
  try {
    const products = await fetchProducts(req.CollectionProduct);
    const pdf = generateExpiringProductsPdf(req.companyName, products);
    res.send({ pdf });
  } catch (error) {
    res.status(500).json({ message: "Error creating report" });
  }
};

const montlyReports = async (req: any, res: any): Promise<void> => {
  try {
    const date = new Date(req.query.date);
    const data = await buildMonthlyDailySeries(req.CollectionSale, date);
    res.send(data);
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const sixMonthsReports = async (req: any, res: any): Promise<void> => {
  try {
    const date = new Date(req.query.date);
    const data = await buildYearlySeries(req.CollectionSale, date);
    res.send(data);
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const productsOutOfStockOfExpired = async (
  req: any,
  res: any
): Promise<void> => {
  try {
    const products = await fetchProducts(req.CollectionProduct);
    const productsOutOfStock = productsRunningOut(products);
    const productsExpired = productsExpiringSoon(products, 30);

    res.send({
      productsOutOfStock: productsOutOfStock.length,
      productsExpired: productsExpired.length,
    });
  } catch (error) {
    res.status(500).json({ message: "Error creando el reporte" });
  }
};

const getInventoryAlerts = async (req: any, res: any): Promise<void> => {
  try {
    const products = await fetchProducts(req.CollectionProduct);
    const productsOutOfStock = productsRunningOut(products);
    const productsExpiring = productsExpiringSoon(products);
    res.send({
      productsOutOfStock,
      productsExpiring,
    });
  } catch (error) {
    res.status(500).json({ message: "Error obteniendo los productos" });
  }
};

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

const predictProductDemand = async (req: any, res: any): Promise<void> => {
  try {
    const referenceDate = req.query.date ? new Date(req.query.date) : new Date();
    const months = clampPredictionMonths(req.query.months);
    const { buckets, range } = buildHistoricalBuckets(referenceDate, months);
    const sales = await fetchSales(req.CollectionSale, range, { sort: { date: 1 } });
    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));
    const seriesMap = new Map<string, number[]>();

    sales.forEach((sale) => {
      const key = monthKeyFromDate(sale.date);
      const index = bucketIndex.get(key);
      if (index === undefined) {
        return;
      }
      sale.products?.forEach((product) => {
        if (!seriesMap.has(product.name)) {
          seriesMap.set(product.name, new Array(buckets.length).fill(0));
        }
        seriesMap.get(product.name)![index] += product.amount;
      });
    });

    const metadata = buildPredictionMetadata(buckets);
    const products = Array.from(seriesMap.entries())
      .map(([name, history]) => {
        const prediction = linearRegressionForecast(history);
        return {
          product: name,
          predictedAmount: roundValue(prediction),
          history: history.map((value, idx) => ({
            label: metadata.labels[idx] ?? "",
            value: roundValue(value),
          })),
        };
      })
      .filter(
        (item) =>
          item.predictedAmount > 0 ||
          item.history.some((point) => point.value > 0)
      )
      .sort((a, b) => b.predictedAmount - a.predictedAmount)
      .slice(0, 30);

    res.send({
      monthsAnalyzed: buckets.length,
      ...metadata,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generando la predicción" });
  }
};

const predictMonthlyProfit = async (req: any, res: any): Promise<void> => {
  try {
    const referenceDate = req.query.date ? new Date(req.query.date) : new Date();
    const months = clampPredictionMonths(req.query.months);
    const { buckets, range } = buildHistoricalBuckets(referenceDate, months);
    const sales = await fetchSales(req.CollectionSale, range, { sort: { date: 1 } });
    const bucketIndex = new Map(buckets.map((bucket, index) => [bucket.key, index]));
    const utilities = new Array(buckets.length).fill(0);

    sales.forEach((sale) => {
      const key = monthKeyFromDate(sale.date);
      const index = bucketIndex.get(key);
      if (index === undefined) {
        return;
      }
      utilities[index] += calculateSaleUtility(sale);
    });

    const metadata = buildPredictionMetadata(buckets);
    const history = utilities.map((value) => roundValue(value));
    const prediction = roundValue(linearRegressionForecast(utilities));

    res.send({
      monthsAnalyzed: buckets.length,
      ...metadata,
      history,
      prediction,
    });
  } catch (error) {
    res.status(500).json({ message: "Error generando la predicción" });
  }
};

const getCreditInfo = async (req: any, res: any): Promise<void> => {
  try {
    const pdf = generateCreditPdf(req.companyName, req.body.credit);
    res.send({ pdf });
  } catch (error) {
    res.status(500).json({ message: "Error creating report" });
  }
};

export default {
  getCreditInfo,
  getInventoryAlerts,
  getDayReports,
  getInventoryExcel,
  getSalesReport,
  getProductsOutOfStockReport,
  getProductsOutOfStockWithWarehouseReport,
  getProductsOutOfStockWithWarehouseData,
  getExpiringProducts,
  getTop10ABC,
  montlyReports,
  productsOutOfStockOfExpired,
  predictMonthlyProfit,
  predictProductDemand,
  sixMonthsReports,
};
