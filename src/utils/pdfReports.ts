import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  aggregateProducts,
  CreditDocument,
  formatMoney,
  ProductDocument,
  productsExpiringSoon,
  SaleDocument,
  SaleSummary,
  summarizeSales,
} from "./reporting";

const tableTemplateHead = ["Producto", "Cantidad", "Precio", "Utilidades", "Total"];

const palette = {
  primary: "#1F4172",
  secondary: "#F2F7FF",
  accent: "#FF8243",
  muted: "#7C93C3",
  border: "#DDE5F2",
};

const applyDocBranding = (doc: jsPDF) => {
  doc.setFont("helvetica", "normal");
  doc.setTextColor("#1B2430");
};

const getStoreDisplayName = (store: any): string => {
  return store?.name ?? store?.ubication ?? "Bodega";
};

const tableDecorators = {
  headStyles: {
    fillColor: palette.primary,
    textColor: "#ffffff",
    fontStyle: "bold" as const,
    fontSize: 11,
  },
  bodyStyles: {
    textColor: "#1B2430",
    fontSize: 10,
    minCellHeight: 10,
  },
  alternateRowStyles: {
    fillColor: palette.secondary,
  },
  styles: {
    lineColor: palette.border,
    lineWidth: 0.2,
    halign: "center" as const,
  },
  columnStyles: {
    0: { halign: "left" as const },
  },
};

const currency = (value: number): string => `Q${formatMoney(value)}`;

const buildHeader = (companyName: string, title: string) => ({
  body: [
    [
      {
        content: companyName,
        styles: {
          halign: "left",
          fontSize: 20,
          textColor: "#ffffff",
          fontStyle: "bold",
        },
      },
      {
        content: title,
        styles: {
          halign: "right",
          fontSize: 16,
          textColor: "#ffffff",
          fontStyle: "bold",
        },
      },
    ],
  ],
  theme: "plain",
  styles: { fillColor: palette.primary, cellPadding: 8 },
});

const buildDateBlock = (startDate: string, endDate: string) => ({
  body: [
    [
      {
        content: `Inicio: ${startDate}\nFin: ${endDate}`,
        styles: { halign: "right", textColor: palette.muted },
      },
    ],
  ],
  theme: "plain",
  styles: { fillColor: "#ffffff" },
});

const getTableTheme = () => ({
  theme: "striped",
  ...tableDecorators,
});

const buildTotalsBlock = (totals: SaleSummary) => ({
  body: [
    [
      {
        content: "Total",
        styles: { halign: "left", fontStyle: "bold", textColor: palette.muted },
      },
      {
        content: currency(totals.total),
        styles: { halign: "right", fontStyle: "bold", textColor: palette.primary },
      },
    ],
    [
      {
        content: "Total Utilidades",
        styles: { halign: "left", fontStyle: "bold", textColor: palette.muted },
      },
      {
        content: currency(totals.utilities),
        styles: { halign: "right", fontStyle: "bold", textColor: palette.primary },
      },
    ],
  ],
  theme: "plain",
  styles: { fillColor: palette.secondary, cellPadding: 6 },
});

const appendDetailedSales = (doc: jsPDF, sales: SaleDocument[]) => {
  sales.forEach((sale) => {
    const body = sale.products.map((product) => {
      const utility =
        (product.salesPrice - product.priceCost) * product.amount;
      return [
        product.name,
        product.amount,
        currency(product.salesPrice),
        currency(utility),
        currency(product.salesPrice * product.amount),
      ];
    });
    const saleUtilities = sale.products.reduce((acc, product) => {
      return (
        acc + (product.salesPrice - product.priceCost) * product.amount
      );
    }, 0);
    body.push(["", "", "Total", currency(saleUtilities), currency(sale.total)]);
    doc.autoTable({
      body,
      head: [[sale.name ?? "", sale.nit ?? "", "", "", "", ""], tableTemplateHead],
      ...getTableTheme(),
    });
  });
};

const appendSimpleSales = (doc: jsPDF, sales: SaleDocument[]) => {
  const products = aggregateProducts(sales);
  const body = products.map((product) => {
    const prices = Array.from(product.salesPrices).join(" ");
    return [
      product.name,
      product.amount,
      `Q[ ${prices} ]`,
      currency(product.utilities),
      currency(product.total),
    ];
  });
  doc.autoTable({
    body,
    head: [tableTemplateHead],
    ...getTableTheme(),
  });
};

export interface SalesPdfOptions {
  companyName: string;
  startDate: string;
  endDate: string;
  typeReport: "simple" | "detail";
  sales: SaleDocument[];
}

export const generateSalesPdf = ({
  companyName,
  startDate,
  endDate,
  typeReport,
  sales,
}: SalesPdfOptions): string => {
  const doc = new jsPDF();
  applyDocBranding(doc);
  doc.autoTable(buildHeader(companyName, "Reporte de ventas"));
  doc.autoTable(buildDateBlock(startDate, endDate));
  if (typeReport === "detail") {
    appendDetailedSales(doc, sales);
  } else {
    appendSimpleSales(doc, sales);
  }
  const totals = summarizeSales(sales);
  doc.autoTable(buildTotalsBlock(totals));
  return doc.output("datauristring");
};

export const generateProductsOutOfStockPdf = (
  companyName: string,
  products: any[], // now expects products with storeAmounts
  stores: any[]
): string => {
  const doc = new jsPDF();
  applyDocBranding(doc);
  doc.autoTable(buildHeader(companyName, "Reporte de productos por agotar"));
  // Table header: static columns + one per store
  const storeHeaders = stores.map((store: any) => getStoreDisplayName(store));
  const head = [["#", "Nombre", "Cantidad", "Cantidad minima", ...storeHeaders]];
  // Table body: static columns + one per store (amount)
  const body = products
    .filter((item) => item.existence - item.minExistence <= 0)
    .map((item, index) => {
      const staticCols = [
        index + 1,
        item.name,
        item.existence,
        item.minExistence,
      ];
      // storeAmounts: [{ storeId, storeName, amount }]
      const storeAmounts = stores.map((store: any) => {
        const storeId = store._id?.toString();
        const storeName = getStoreDisplayName(store);
        const found = item.storeAmounts?.find((sa: any) => {
          if (storeId && sa.storeId) {
            return String(sa.storeId) === storeId;
          }
          if (sa.storeName && storeName) {
            return sa.storeName === storeName;
          }
          return false;
        });
        return found ? found.amount : 0;
      });
      return [...staticCols, ...storeAmounts];
    });
  doc.autoTable({
    body,
    head,
    ...getTableTheme(),
  });
  return doc.output("datauristring");
};

export const generateExpiringProductsPdf = (
  companyName: string,
  products: ProductDocument[],
  alertDays = 60
): string => {
  const doc = new jsPDF();
  applyDocBranding(doc);
  doc.autoTable(buildHeader(companyName, "Reporte de productos por vencer"));
  const expiring = productsExpiringSoon(products, alertDays);
  const body = expiring.map((item, index) => [
    index + 1,
    item.name,
    item.existence,
    item.expirationDate
      ? new Date(item.expirationDate).toLocaleDateString("es-GT")
      : "",
    currency(item.priceCost),
  ]);

  doc.autoTable({
    body,
    head: [["#", "Nombre", "Cantidad", "Fecha vencimiento", "Precio costo"]],
    ...getTableTheme(),
  });
  return doc.output("datauristring");
};

const buildCreditInfo = (date: string, name: string, nit: string) => ({
  body: [
    [
      {
        content: `Fecha de compra: ${date}\nNombre: ${name}\nNIT: ${nit}`,
        styles: { halign: "right", textColor: palette.primary },
      },
    ],
  ],
  theme: "plain",
  styles: { fillColor: palette.secondary, cellPadding: 6 },
});

const buildCreditTitle = (title: string) => ({
  body: [[
    {
      content: title,
      styles: {
        halign: "left",
        fontStyle: "bold",
        textColor: "#ffffff",
      },
    },
  ]],
  theme: "plain",
  styles: { fillColor: palette.primary, cellPadding: 5 },
});

const buildCreditTotals = (total: string, paid: string) => ({
  body: [
    [
      {
        content: `Total: ${total} \nTotal cancelado a la fecha: ${paid}`,
        styles: { halign: "right", fontStyle: "bold", textColor: palette.accent },
      },
    ],
  ],
  theme: "plain",
  styles: { fillColor: "#ffffff", cellPadding: 6, lineColor: palette.border },
});

export const generateCreditPdf = (
  companyName: string,
  credit: CreditDocument
): string => {
  const doc = new jsPDF();
  applyDocBranding(doc);
  doc.autoTable(buildHeader(companyName, "Credito"));
  const purchaseDate = new Date(credit.date).toLocaleString("es-MX", {
    timeZone: "America/Guatemala",
  });
  doc.autoTable(buildCreditInfo(purchaseDate, credit.client.name, credit.client.nit));

  const payments = credit.payments.map((payment, index) => [
    index + 1,
    currency(payment.amount),
    new Date(payment.date).toLocaleString("es-MX", {
      timeZone: "America/Guatemala",
    }),
  ]);

  const products = credit.products.map((product, index) => [
    index + 1,
    product.name,
    product.amount,
    currency(product.salesPrice),
  ]);

  doc.autoTable(buildCreditTitle("Pagos"));
  doc.autoTable({
    body: payments,
    head: [["#", "Pago", "Fecha"]],
    ...getTableTheme(),
  });

  doc.autoTable(buildCreditTitle("Productos"));
  doc.autoTable({
    body: products,
    head: [["#", "Nombre", "Cantidad", "Precio venta"]],
    ...getTableTheme(),
  });

  doc.autoTable(buildCreditTotals(currency(credit.total), currency(credit.paid)));

  return doc.output("datauristring");
};
