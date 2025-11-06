import "jspdf";

declare module "jspdf" {
  interface jsPDF {
    // Provided by jspdf-autotable at runtime.
    autoTable: (options: any) => jsPDF;
  }
}
