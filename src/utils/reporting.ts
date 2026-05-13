export type DateInput = Date | string | number;

export interface SaleProduct {
  _id?: string;
  name: string;
  amount: number;
  salesPrice: number;
  priceCost: number;
}

export interface SaleDocument {
  _id?: string;
  total: number;
  bill?: unknown;
  date: Date;
  nit?: string;
  name?: string;
  products: SaleProduct[];
}

export interface ProductDocument {
  _id?: string;
  name: string;
  existence: number;
  minExistence: number;
  priceCost: number;
  salesPrice: number;
  expirationDate?: Date | string;
}

export interface CreditPayment {
  amount: number;
  date: Date | string;
}

export interface CreditDocument {
  date: Date | string;
  client?: { name?: string; nit?: string } | null;
  products: SaleProduct[];
  payments?: CreditPayment[];
  total: number;
  paid: number;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface SaleSummary {
  total: number;
  billedTotal: number;
  utilities: number;
  saleCount: number;
}

export interface AggregatedProduct {
  name: string;
  amount: number;
  utilities: number;
  total: number;
  salesPrices: Set<number>;
}

const cloneDate = (input: DateInput): Date => {
  const date = input instanceof Date ? input : new Date(input);
  return new Date(date.getTime());
};

export const startOfDay = (value: DateInput): Date => {
  const date = cloneDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const addDays = (date: Date, amount: number): Date => {
  const next = cloneDate(date);
  next.setDate(next.getDate() + amount);
  return next;
};

export const addMonths = (date: Date, amount: number): Date => {
  const next = cloneDate(date);
  next.setMonth(next.getMonth() + amount);
  return next;
};

export const buildDayRange = (value: DateInput): DateRange => {
  const start = startOfDay(value);
  const end = addDays(start, 1);
  return { start, end };
};

export const buildRange = (
  startInput: DateInput,
  endInput: DateInput,
  timezoneOffsetHours = 0
): DateRange => {
  const start = cloneDate(startInput);
  const end = cloneDate(endInput);
  if (timezoneOffsetHours !== 0) {
    start.setHours(start.getHours() + timezoneOffsetHours);
    end.setHours(end.getHours() + timezoneOffsetHours);
  }
  return { start, end };
};

export const buildMonthRange = (value: DateInput): DateRange => {
  const start = startOfDay(value);
  start.setDate(1);
  const end = addMonths(start, 1);
  return { start, end };
};

export const isoDateKey = (value: Date | string): string => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().split("T")[0];
};

export const formatDayLabel = (isoDate: string): string => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

export const roundCurrency = (value: number, decimals = 2): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
};

export const formatMoney = (value: number): string => {
  return roundCurrency(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const getProductUtility = (product: SaleProduct): number => {
  return (product.salesPrice - product.priceCost) * product.amount;
};

export const summarizeSales = (
  sales: ReadonlyArray<SaleDocument>
): SaleSummary => {
  return sales.reduce<SaleSummary>(
    (acc, sale) => {
      const saleTotal = Number(sale.total ?? 0);
      acc.total += saleTotal;
      acc.saleCount += 1;
      if (sale.bill) {
        acc.billedTotal += saleTotal;
      }
      acc.utilities += sale.products?.reduce((util, product) => {
        return util + getProductUtility(product);
      }, 0) ?? 0;
      return acc;
    },
    { total: 0, billedTotal: 0, utilities: 0, saleCount: 0 }
  );
};

export const aggregateProducts = (
  sales: ReadonlyArray<SaleDocument>
): AggregatedProduct[] => {
  const map = new Map<string, AggregatedProduct>();
  sales.forEach((sale) => {
    sale.products?.forEach((product) => {
      const existing = map.get(product.name);
      const utility = getProductUtility(product);
      if (existing) {
        existing.amount += product.amount;
        existing.total += product.amount * product.salesPrice;
        existing.utilities += utility;
        existing.salesPrices.add(product.salesPrice);
      } else {
        map.set(product.name, {
          name: product.name,
          amount: product.amount,
          total: product.amount * product.salesPrice,
          utilities: utility,
          salesPrices: new Set([product.salesPrice]),
        });
      }
    });
  });
  return Array.from(map.values());
};

export const categorizeProductsABC = (
  products: AggregatedProduct[],
  thresholds = { A: 0.8, B: 0.95 }
): Record<"A" | "B" | "C", string[]> => {
  const result = { A: [] as string[], B: [] as string[], C: [] as string[] };
  if (products.length === 0) {
    return result;
  }

  const sorted = [...products].sort(
    (a, b) => (b.total ?? 0) - (a.total ?? 0)
  );
  const totalValue = sorted.reduce((sum, product) => sum + (product.total ?? 0), 0);

  if (totalValue <= 0) {
    sorted.forEach((product, index) => {
      const percentile = (index / sorted.length) * 100;
      if (percentile < 20) {
        result.A.push(product.name);
      } else if (percentile < 50) {
        result.B.push(product.name);
      } else {
        result.C.push(product.name);
      }
    });
    return result;
  }

  let cumulative = 0;
  sorted.forEach((product) => {
    cumulative += product.total ?? 0;
    const ratio = cumulative / totalValue;
    if (ratio <= thresholds.A) {
      result.A.push(product.name);
    } else if (ratio <= thresholds.B) {
      result.B.push(product.name);
    } else {
      result.C.push(product.name);
    }
  });

  return result;
};

export const buildCategoryDataset = (
  categoryNames: string[],
  items: { name: string; amount: number }[]
) => {
  const sorted = items
    .filter((item) => categoryNames.includes(item.name))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 9);

  return {
    labels: sorted.map((item) => item.name),
    datasets: { label: "Productos", data: sorted.map((item) => item.amount) },
  };
};

export const buildLocalizedNow = (
  timeZone = "America/Guatemala"
): Date => {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone })
  );
};

export const productsRunningOut = (
  products: ProductDocument[]
): ProductDocument[] => {
  return products.filter(
    (item) => item.existence - item.minExistence <= 0
  );
};

export const productsExpiringSoon = (
  products: ProductDocument[],
  alertDays = 60,
  referenceDate = buildLocalizedNow()
): ProductDocument[] => {
  const threshold = addDays(referenceDate, alertDays);
  return products.filter((item) => {
    if (!item.expirationDate) {
      return false;
    }
    const expirationDate = new Date(item.expirationDate);
    return expirationDate <= threshold;
  });
};

export const calculateSaleUtility = (sale: SaleDocument): number => {
  return (
    sale.products?.reduce((total, product) => total + getProductUtility(product), 0) ?? 0
  );
};

export const linearRegressionForecast = (series: number[]): number => {
  const values = series.map((value) => (Number.isFinite(value) ? Number(value) : 0));
  const n = values.length;
  if (n === 0) {
    return 0;
  }
  if (n === 1) {
    return Math.max(0, values[0]);
  }
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, value) => sum + value, 0) / n;

  let numerator = 0;
  let denominator = 0;
  values.forEach((value, index) => {
    const diffX = index - meanX;
    numerator += diffX * (value - meanY);
    denominator += diffX * diffX;
  });

  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = meanY - slope * meanX;
  const prediction = intercept + slope * n;
  return Math.max(0, prediction);
};
