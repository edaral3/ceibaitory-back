import PDFDocument from 'pdfkit'

const CM_TO_POINTS = 72 / 2.54
const VERTICAL_PAGE_PADDING = 2 * CM_TO_POINTS
const BASE_MARGIN = 14
const PAGE_WIDTH = 250
const MEASURE_PAGE_HEIGHT = 2000
const BORDER_INSET = 6
const BORDER_WIDTH = 2.5

type TableColumn = {
  label: string
  width: number
  align?: 'left' | 'center' | 'right'
}

type TableCellObject = {
  value: string | number
  colSpan?: number
  align?: 'left' | 'center' | 'right'
  bold?: boolean
}

type TableRow = Array<string | number | TableCellObject>

const formatSizeShort = (size?: string) => {
  if (!size) return ''
  const s = size.toLowerCase()
  if (s.includes('peque')) return 'Peq'
  if (s.includes('mediano')) return 'Med'
  if (s.includes('grande')) return 'Grd'
  if (s.includes('jumbo')) return 'Jmb'
  if (s.includes('quebrado')) return 'Qbd'
  return size
}

const formatTypeShort = (type?: string) => {
  if (!type) return ''
  const t = type.toLowerCase()
  if (t === 'caja') return 'Cja'
  if (t === 'carton') return 'Crt'
  return type
}

const formatCurrency = (value: number | undefined | null) => `Q${(Number(value) || 0).toFixed(2)}`

const pipePdfToResponse = (res: any, doc: PDFDocument, fileName: string) => {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename=${fileName}`)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  doc.pipe(res)
}

const createReceiptDoc = (pageHeight: number) => {
  return new PDFDocument({
    size: [PAGE_WIDTH, pageHeight],
    margins: {
      top: VERTICAL_PAGE_PADDING,
      bottom: VERTICAL_PAGE_PADDING,
      left: BASE_MARGIN,
      right: BASE_MARGIN
    }
  })
}

const drawDeliveryBorder = (doc: PDFDocument) => {
  doc.save()
  doc.lineWidth(BORDER_WIDTH)
  doc.strokeColor('#111827')
  doc.rect(
    BORDER_INSET,
    BORDER_INSET,
    doc.page.width - BORDER_INSET * 2,
    doc.page.height - BORDER_INSET * 2
  ).stroke()
  doc.restore()
}

const drawTableHeaders = (doc: PDFDocument, tableTop: number, rowHeight: number, columns: TableColumn[]) => {
  const startX = doc.page.margins.left
  let currentX = startX

  columns.forEach((column) => {
    doc.save()
    doc.lineWidth(1)
    doc.rect(currentX, tableTop, column.width, rowHeight).fillAndStroke('#f5f5f5', '#d1d5db')
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#1f2937')
      .text(column.label, currentX + 3, tableTop + (rowHeight - 10) / 2, {
        width: column.width - 6,
        align: column.align ?? 'left'
      })
    doc.restore()
    currentX += column.width
  })

  doc.fillColor('#1f2937').strokeColor('#1f2937')
}

const drawRows = (doc: PDFDocument, rows: TableRow[], tableTop: number, rowHeight: number, columns: TableColumn[]) => {
  const startX = doc.page.margins.left

  rows.forEach((row, rowIndex) => {
    const y = tableTop + (rowIndex + 1) * rowHeight
    const rowHasBold = row.some((cell) => typeof cell === 'object' && cell !== null && 'bold' in cell && Boolean((cell as TableCellObject).bold))
    let currentX = startX
    let colPointer = 0

    while (colPointer < columns.length) {
      const column = columns[colPointer]
      const rawCell = row[colPointer]

      if (rawCell === null || rawCell === undefined) {
        currentX += column.width
        colPointer += 1
        continue
      }

      let cellValue: string | number = ''
      let colSpan = 1
      let cellAlign: 'left' | 'center' | 'right' = column.align ?? 'left'
      let boldCell = false

      if (typeof rawCell === 'object' && rawCell !== null && 'value' in rawCell) {
        const cellObject = rawCell as TableCellObject
        cellValue = cellObject.value ?? ''
        colSpan = Math.max(1, cellObject.colSpan ?? 1)
        cellAlign = cellObject.align ?? cellAlign
        boldCell = Boolean(cellObject.bold)
      } else {
        cellValue = rawCell as string | number
      }

      const spanWidth = columns.slice(colPointer, colPointer + colSpan).reduce((sum, col) => sum + col.width, 0)
      doc.save()
      doc.rect(currentX, y, spanWidth, rowHeight).stroke('#e5e7eb')
      doc.font(boldCell || rowHasBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(10)
        .fillColor('#1f2937')
        .text(`${cellValue}`, currentX + 3, y + (rowHeight - 10) / 2, {
          width: spanWidth - 6,
          align: cellAlign
        })
      doc.restore()

      currentX += spanWidth
      colPointer += colSpan
    }
  })
}

const resolveClientName = (sale: any): string => {
  const rawClient = sale?.clientId
  if (rawClient && typeof rawClient === 'object') {
    const name = rawClient.name ?? rawClient.fullName
    if (typeof name === 'string' && name.trim().length > 0) return name.trim()
  }
  if (sale?.client && typeof sale.client === 'object') {
    const name = sale.client.name ?? sale.client.fullName
    if (typeof name === 'string' && name.trim().length > 0) return name.trim()
  }
  return 'Cliente'
}

const writeTicketHeader = (doc: PDFDocument, title: string, clientName: string, dateText?: string) => {
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827').text(title)
  doc.moveDown(0.2)
  doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(`Cliente: ${clientName}`)
  if (dateText) {
    doc.text(`Fecha: ${dateText}`)
  }
  doc.moveDown(0.6)
}

const buildSaleRows = (sale: any): TableRow[] => {
  const items = Array.isArray(sale.items) ? sale.items : []
  const rows: TableRow[] = []

  items.forEach((item: any) => {
    rows.push([
      formatSizeShort(item.eggSize),
      formatTypeShort(item.eggType),
      `${item.quantity ?? 0}`,
      formatCurrency(item.unitPrice),
      formatCurrency(item.lineTotal)
    ])
  })

  rows.push([
    { value: 'Total', bold: true, align: 'left' },
    '',
    '',
    { value: formatCurrency(sale.total), bold: true, align: 'right', colSpan: 2 }
  ])

  return rows
}

const renderDeliveryReceiptContent = (doc: PDFDocument, sale: any, saleDate: string) => {
  writeTicketHeader(doc, 'Granja Aldana', resolveClientName(sale), saleDate)
  doc.font('Helvetica-Bold').fontSize(12)
    .fillColor('#1f2937')
    .text('Detalle - Resumen de articulos')
  doc.moveDown(0.6)

  const columns: TableColumn[] = [
    { label: 'Tam', width: 38, align: 'center' },
    { label: 'Tipo', width: 36, align: 'center' },
    { label: 'Cant.', width: 32, align: 'right' },
    { label: 'Precio', width: 56, align: 'right' },
    { label: 'Importe', width: 58, align: 'right' }
  ]
  const rowHeight = 22
  const tableTop = doc.y
  const rows = buildSaleRows(sale)
  drawTableHeaders(doc, tableTop, rowHeight, columns)
  drawRows(doc, rows, tableTop, rowHeight, columns)

  const tableHeight = rowHeight * (rows.length + 1)
  doc.y = tableTop + tableHeight + 14

  if (sale?.status === 'pending') {
    const left = doc.page.margins.left
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const payments = Array.isArray(sale.payments) ? sale.payments : []
    const paidAmount = payments.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0)
    const remaining = Math.max(0, (Number(sale.total) || 0) - paidAmount)

    if (paidAmount > 0) {
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).stroke('#d1d5db')
      doc.moveDown(0.4)
      doc.font('Helvetica')
        .fontSize(10)
        .fillColor('#1f2937')
        .text(`Abonado: ${formatCurrency(paidAmount)}`, left, doc.y, { width, align: 'left' })
      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#b91c1c')
        .text(`Saldo pendiente: ${formatCurrency(remaining)}`, left, doc.y, { width, align: 'left' })
      doc.moveDown(0.4)
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#b91c1c')
        .text('Pago parcial - Saldo pendiente.', left, doc.y, { width, align: 'left' })
    } else {
      doc.font('Helvetica-Bold')
        .fontSize(20)
        .fillColor('#b91c1c')
        .text('Pendiente de pago.', left, doc.y, { width, align: 'left', lineBreak: false })
    }
    doc.moveDown(0.4)
  }
}

export const generateDeliveryReceipt = (res: any, sale: any, saleDate: string) => {
  const measureDoc = createReceiptDoc(MEASURE_PAGE_HEIGHT)
  renderDeliveryReceiptContent(measureDoc, sale, saleDate)
  const computedHeight = Math.max(Math.ceil(measureDoc.y + VERTICAL_PAGE_PADDING), PAGE_WIDTH)
  measureDoc.end()

  const doc = createReceiptDoc(computedHeight)
  pipePdfToResponse(res, doc, `ticket-${sale._id}.pdf`)
  drawDeliveryBorder(doc)
  renderDeliveryReceiptContent(doc, sale, saleDate)

  doc.end()
}
