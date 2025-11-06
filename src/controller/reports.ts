import {
  addMonths,
  aggregateProducts,
  buildCategoryDataset,
  buildDayRange,
  buildMonthRange,
  buildRange,
  categorizeProductsABC,
  DateRange,
  formatDayLabel,
  isoDateKey,
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

const getProductsOutOfStockReport = async (req: any, res: any): Promise<void> => {
  try {
    const products = await fetchProducts(req.CollectionProduct);
    const pdf = generateProductsOutOfStockPdf(req.companyName, products);
    res.send({ pdf });
  } catch (error) {
    res.status(500).json({ message: "Error creating report" });
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
  getExpiringProducts,
  getTop10ABC,
  montlyReports,
  productsOutOfStockOfExpired,
  sixMonthsReports,
};
