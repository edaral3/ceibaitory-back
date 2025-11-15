import { Injectable } from '@nestjs/common'
import PDFDocument from 'pdfkit'

type TicketColumn = {
  label: string
  width: number
  align?: 'left' | 'center' | 'right'
}

@Injectable()
export class FarmPdfService {
  async generateEggTicket (sale: any, saleDate: string): Promise<Buffer> {
    const doc = new PDFDocument({ size: [250, 480], margin: 14 })
    this.writeTicketHeader(doc, 'Granja Aldana', sale._id, saleDate)
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#1f2937')
      .text('Detalle · Resumen de artículos')
    doc.moveDown(0.6)

    const columns: TicketColumn[] = [
      { label: 'Tam', width: 38, align: 'center' },
      { label: 'Tipo', width: 36, align: 'center' },
      { label: 'Cant.', width: 32, align: 'right' },
      { label: 'Precio', width: 56, align: 'right' },
      { label: 'Importe', width: 58, align: 'right' }
    ]

    const rows = this.buildEggRows(sale)
    const rowHeight = 22
    const tableTop = doc.y
    this.drawTableHeaders(doc, tableTop, rowHeight, columns)
    this.drawRows(doc, rows, tableTop, rowHeight, columns)

    const tableHeight = rowHeight * (rows.length + 1)
    doc.y = tableTop + tableHeight + 14

    doc.end()
    return await this.toBuffer(doc)
  }

  async generateChickenTicket (
    sale: any,
    saleDate: string
  ): Promise<Buffer> {
    const doc = new PDFDocument({ size: [250, 400], margin: 12 })
    this.writeTicketHeader(doc, 'Granja Aldana', sale._id, saleDate)
    doc.fontSize(17).text(`Cliente: ${sale.client?.name ?? ''}`)
    doc.moveDown(1.5)
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke()

    const totalChickenAmount = sale.chickenAmount ?? 0
    const totalChickenPound = sale.weight ?? 0
    doc.moveDown(0.5)
    doc.fontSize(17)
      .text('Cantidad de pollos', { continued: true })
      .text(`${totalChickenAmount}`, { align: 'right' })
    doc.fontSize(17)
      .text('Cantidad de libras', { continued: true })
      .text(`${totalChickenPound}`, { align: 'right' })

    this.writeTicketFooter(doc, `Q${(sale.total ?? 0).toFixed(2)}`)
    doc.end()
    return await this.toBuffer(doc)
  }

  private buildEggRows (sale: any): Array<any[]> {
    const rows: Array<any[]> = []
    for (let i = 0; i < sale.size.length; i++) {
      const size = this.formatSizeShort(sale.size[i])
      const type = this.formatTypeShort(sale.type[i])
      const amount = sale.amount[i]
      const itemPrice = sale.price[i]
      const isBox = sale.type[i]?.toLowerCase() === 'caja'
      const unitPrice = isBox ? itemPrice : itemPrice / 12
      const total = isBox ? itemPrice * amount : (itemPrice / 12) * amount
      rows.push([
        size,
        type,
        `${amount}`,
        this.formatCurrency(unitPrice),
        this.formatCurrency(total)
      ])
    }
    rows.push([
      { value: 'Total', bold: true, align: 'left' },
      '',
      '',
      {
        value: this.formatCurrency(sale.total),
        bold: true,
        align: 'right',
        colSpan: 2
      }
    ])
    return rows
  }

  private drawTableHeaders (
    doc: PDFDocument,
    tableTop: number,
    rowHeight: number,
    columns: TicketColumn[]
  ) {
    const startX = doc.page.margins.left
    let currentX = startX
    columns.forEach((column) => {
      doc.save()
      doc.lineWidth(1)
      doc
        .rect(currentX, tableTop, column.width, rowHeight)
        .fillAndStroke('#f5f5f5', '#d1d5db')
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

  private drawRows (
    doc: PDFDocument,
    rows: Array<any[]>,
    tableTop: number,
    rowHeight: number,
    columns: TicketColumn[]
  ) {
    const startX = doc.page.margins.left
    rows.forEach((row, rowIndex) => {
      const y = tableTop + (rowIndex + 1) * rowHeight
      const rowHasBold = row.some(
        (cell) => typeof cell === 'object' && cell?.bold
      )
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
          cellValue = rawCell.value ?? ''
          colSpan = Math.max(1, rawCell.colSpan ?? 1)
          cellAlign = rawCell.align ?? cellAlign
          boldCell = Boolean(rawCell.bold)
        } else {
          cellValue = rawCell as string | number
        }
        const cellWidth = columns
          .slice(colPointer, colPointer + colSpan)
          .reduce((acc, col) => acc + col.width, 0)
        const highlightColor = rowHasBold ? '#eef2ff' : '#ffffff'
        doc.save()
        doc.lineWidth(1)
        doc
          .rect(currentX, y, cellWidth, rowHeight)
          .fillAndStroke(highlightColor, '#d1d5db')
        doc.font(boldCell ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(boldCell ? 11.5 : 10)
          .fillColor(boldCell ? '#1e3a8a' : '#1f2937')
          .text(String(cellValue), currentX + 3, y + (rowHeight - 10) / 2, {
            width: cellWidth - 6,
            align: cellAlign,
            ellipsis: true,
            lineBreak: false
          })
        doc.restore()
        currentX += cellWidth
        colPointer += colSpan
      }
    })
    doc.fillColor('#1f2937').strokeColor('#1f2937')
  }

  private writeTicketHeader (
    doc: PDFDocument,
    title: string,
    id: string,
    dateText?: string
  ) {
    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right
    const contentWidth = right - left
    const headerTop = doc.y
    const headerHeight = 56
    const readableId = id ? `Ticket #${String(id).slice(-8)}` : ''
    doc.save()
    doc.roundedRect(left, headerTop, contentWidth, headerHeight, 10).fill('#1e3a8a')
    doc.restore()
    doc.fillColor('#f9fafb')
      .font('Helvetica-Bold')
      .fontSize(18)
      .text(title, left, headerTop + 12, { width: contentWidth, align: 'center' })
    doc.font('Helvetica')
      .fontSize(9)
      .text(readableId, left + 14, headerTop + 36, { width: contentWidth - 28 })
    if (dateText) {
      doc.text(`Fecha: ${dateText}`, left + 14, headerTop + 36, {
        width: contentWidth - 28,
        align: 'right'
      })
    }
    doc.strokeColor('#d1d5db')
      .lineWidth(1)
      .moveTo(left, headerTop + headerHeight + 6)
      .lineTo(right, headerTop + headerHeight + 6)
      .stroke()
    doc.y = headerTop + headerHeight + 16
    doc.fillColor('#1f2937').strokeColor('#1f2937')
  }

  private writeTicketFooter (doc: PDFDocument, totalText: string) {
    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right
    const contentWidth = right - left
    doc.moveDown(1)
    doc.strokeColor('#d1d5db')
      .lineWidth(1)
      .moveTo(left, doc.y)
      .lineTo(right, doc.y)
      .stroke()
    doc.moveDown(0.5)
    doc.font('Helvetica-Bold')
      .fontSize(16)
      .text(`Total: ${totalText}`, left, doc.y + 4, { width: contentWidth, align: 'right' })
  }

  private formatSizeShort (size?: string) {
    if (!size) return ''
    const s = size.toLowerCase()
    if (s.includes('peque')) return 'Peq'
    if (s.includes('mediano')) return 'Med'
    if (s.includes('grande')) return 'Grd'
    if (s.includes('jumbo')) return 'Jmb'
    if (s.includes('quebrado')) return 'Qbd'
    return size
  }

  private formatTypeShort (type?: string) {
    if (!type) return ''
    const t = type.toLowerCase()
    if (t === 'caja') return 'Cja'
    if (t === 'carton') return 'Crt'
    return type
  }

  private formatCurrency (value: number | undefined | null) {
    return `Q${(Number(value) || 0).toFixed(2)}`
  }

  private toBuffer (doc: PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      doc.on('data', (chunk) => chunks.push(chunk as Buffer))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })
  }
}
