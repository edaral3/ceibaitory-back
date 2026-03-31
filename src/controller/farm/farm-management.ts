import Mongoose, { type ClientSession } from 'mongoose'
import { decreaseCashBalance } from '../delivery/services/cash-balance.service'
import BatchInfoTypeEnum from '../../enum/batch-info-type.enum'
import ConcentrateStoreInfoEnum from '../../enum/concentrate-store-info.enum'
import PDFDocument from 'pdfkit'
import 'pdfkit-table'

const CM_TO_POINTS = 72 / 2.54
const EXTRA_VERTICAL_SPACE = 2 * CM_TO_POINTS
const MEASURE_PAGE_HEIGHT = 2000
const EGG_BORDER_INSET = 6
const EGG_BORDER_WIDTH = 2.5

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

type RowCell =
  | string
  | number
  | null
  | undefined
  | TableCellObject

type TableRow = RowCell[]

// ---------- Helpers ------------------------------------------------------
const sendError = (res: any, error: any, defaultMessage = 'Internal server error') => {
  if (error?.type === 400) return res.status(400).json({ message: error.message })
  return res.status(500).json({ message: defaultMessage })
}

const fixBatchInfoCounterIfNeeded = async (error: any, req: any): Promise<boolean> => {
  if (error?.code !== 11000 || !error?.keyPattern?.batchInfoId) return false
  const companyName = req.companyName.trim().toLowerCase().replaceAll(' ', '-')
  const maxDoc = await req.CollectionBatchInfo.findOne().sort({ batchInfoId: -1 })
  await req.CollectionBatchInfo.collection.conn.db
    .collection('counters')
    .updateOne(
      { id: `batchInfo_${companyName}_seq` },
      { $set: { seq: maxDoc?.batchInfoId ?? 0 } }
    )
  console.log(`[batchInfoId counter fixed] reset to ${maxDoc?.batchInfoId ?? 0}`)
  return true
}

const startSessionWithTransaction = async () => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  return session
}

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

const formatCurrency = (value: number | undefined | null) => `Q${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const toFileSlug = (str: string) =>
  str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9\s-]/g, '').trim().replace(/\s+/g, '-').toLowerCase()

const pipePdfToResponse = (res: any, doc: PDFDocument, fileName: string) => {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename=${fileName}`)
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  doc.pipe(res)
}

const createTicketDoc = (width: number, pageHeight: number, sideMargin: number) => {
  return new PDFDocument({
    size: [width, pageHeight],
    margins: {
      top: EXTRA_VERTICAL_SPACE,
      bottom: EXTRA_VERTICAL_SPACE,
      left: sideMargin,
      right: sideMargin
    }
  })
}

const drawEggBorder = (doc: PDFDocument) => {
  doc.save()
  doc.lineWidth(EGG_BORDER_WIDTH)
  doc.strokeColor('#111827')
  doc.rect(
    EGG_BORDER_INSET,
    EGG_BORDER_INSET,
    doc.page.width - EGG_BORDER_INSET * 2,
    doc.page.height - EGG_BORDER_INSET * 2
  ).stroke()
  doc.restore()
}

const drawTableHeaders = (doc: PDFDocument, tableTop: number, rowHeight: number, columns: TableColumn[]) => {
  const startX = doc.page.margins.left
  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0)
  let currentX = startX

  // Top border
  doc.lineWidth(1.5).strokeColor('#000000')
    .moveTo(startX, tableTop).lineTo(startX + totalWidth, tableTop).stroke()

  columns.forEach((column) => {
    doc.font('Helvetica-Bold')
      .fontSize(10)
      .fillColor('#000000')
      .text(column.label, currentX + 3, tableTop + (rowHeight - 10) / 2, {
        width: column.width - 6,
        align: column.align ?? 'left',
        lineBreak: false,
      })
    currentX += column.width
  })

  // Bottom border under headers
  doc.lineWidth(1.5).strokeColor('#000000')
    .moveTo(startX, tableTop + rowHeight).lineTo(startX + totalWidth, tableTop + rowHeight).stroke()

  doc.fillColor('#000000').strokeColor('#000000')
}

const drawRows = (doc: PDFDocument, rows: TableRow[], tableTop: number, rowHeight: number, columns: TableColumn[]) => {
  const startX = doc.page.margins.left
  const totalWidth = columns.reduce((acc, col) => acc + col.width, 0)

  rows.forEach((row, rowIndex) => {
    const y = tableTop + (rowIndex + 1) * rowHeight
    const rowHasBold = row.some((cell) => typeof cell === 'object' && cell !== null && 'bold' in cell && Boolean((cell as TableCellObject).bold))
    let currentX = startX
    let colPointer = 0

    if (rowHasBold) {
      // Solid separator before total row
      doc.lineWidth(1.5).strokeColor('#000000')
        .moveTo(startX, y).lineTo(startX + totalWidth, y).stroke()
    } else if (rowIndex > 0) {
      // Thin dashed separator between data rows
      doc.save()
      doc.dash(2, { space: 2 }).lineWidth(0.4).strokeColor('#888888')
        .moveTo(startX, y).lineTo(startX + totalWidth, y).stroke()
      doc.restore()
    }

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

      const cellWidth = columns.slice(colPointer, colPointer + colSpan).reduce((acc, col) => acc + col.width, 0)
      const isBold = boldCell || rowHasBold
      const fontSize = isBold ? 13 : 11
      const textValue = cellValue === null || cellValue === undefined ? '' : String(cellValue)

      doc.font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(fontSize)
        .fillColor('#000000')
        .text(textValue, currentX + 3, y + (rowHeight - fontSize) / 2, {
          width: cellWidth - 6,
          align: cellAlign,
          ellipsis: true,
          lineBreak: false,
        })

      currentX += cellWidth
      colPointer += colSpan
    }
  })

  // Bottom border after last row
  const lastRowY = tableTop + (rows.length + 1) * rowHeight
  doc.lineWidth(1.5).strokeColor('#000000')
    .moveTo(startX, lastRowY).lineTo(startX + totalWidth, lastRowY).stroke()

  doc.fillColor('#000000').strokeColor('#000000')
}

// Generic small ticket helpers (used for both chicken and eggs) ----------------
const writeTicketHeader = (doc: PDFDocument, title: string, _id: string, dateText?: string) => {
  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const contentWidth = right - left
  const headerTop = doc.y

  // Double top border: thick then thin
  doc.lineWidth(2.5).strokeColor('#000000')
    .moveTo(left, headerTop).lineTo(right, headerTop).stroke()
  doc.lineWidth(0.6).strokeColor('#000000')
    .moveTo(left, headerTop + 5).lineTo(right, headerTop + 5).stroke()

  // Store name
  doc.fillColor('#000000')
    .font('Helvetica-Bold')
    .fontSize(20)
    .text(title, left, headerTop + 13, { width: contentWidth, align: 'center' })

  if (dateText) {
    doc.font('Helvetica')
      .fontSize(13)
      .fillColor('#000000')
      .text(dateText, left, doc.y + 2, { width: contentWidth, align: 'center' })
  }

  const headerBottom = doc.y + 8

  // Double bottom border: thin then thick
  doc.lineWidth(0.6).strokeColor('#000000')
    .moveTo(left, headerBottom).lineTo(right, headerBottom).stroke()
  doc.lineWidth(2.5).strokeColor('#000000')
    .moveTo(left, headerBottom + 5).lineTo(right, headerBottom + 5).stroke()

  doc.y = headerBottom + 15
  doc.fillColor('#000000').strokeColor('#000000')
}

const writeTicketFooter = (doc: PDFDocument, totalText: string) => {
  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const contentWidth = right - left

  doc.moveDown(0.8)

  // Double separator before total: thin then thick
  const sep1Y = doc.y
  doc.lineWidth(0.6).strokeColor('#000000')
    .moveTo(left, sep1Y).lineTo(right, sep1Y).stroke()
  doc.lineWidth(2.5).strokeColor('#000000')
    .moveTo(left, sep1Y + 5).lineTo(right, sep1Y + 5).stroke()

  // "TOTAL A PAGAR" label and large amount — both centered
  const totalLabelY = sep1Y + 15
  doc.font('Helvetica').fontSize(12).fillColor('#000000')
    .text('TOTAL A PAGAR', left, totalLabelY, { width: contentWidth, align: 'center' })
  doc.font('Helvetica-Bold').fontSize(23).fillColor('#000000')
    .text(totalText, left, totalLabelY + 16, { width: contentWidth, align: 'center' })

  const afterTotalY = totalLabelY + 46

  // Double separator after total: thick then thin
  doc.lineWidth(2.5).strokeColor('#000000')
    .moveTo(left, afterTotalY).lineTo(right, afterTotalY).stroke()
  doc.lineWidth(0.6).strokeColor('#000000')
    .moveTo(left, afterTotalY + 5).lineTo(right, afterTotalY + 5).stroke()

  doc.font('Helvetica').fontSize(13).fillColor('#000000')
    .text('¡Gracias por su compra!', left, afterTotalY + 12, { width: contentWidth, align: 'center' })

  doc.y = afterTotalY + 32
  doc.fillColor('#000000').strokeColor('#000000')
}

// ---------- Actions ------------------------------------------------------
const makeAnAction = async (req: any, res: any): Promise<void> => {
  const session = await startSessionWithTransaction()
  try {
    const { batchId, action } = req.body
    const foundBatch = await req.CollectionBatch.findById(batchId)
    if (!foundBatch) throw { type: 400, message: 'Batch not found' }

    switch (action) {
      case BatchInfoTypeEnum.CONCENTRATE:
        await concentrateStoreAction(req, foundBatch, session)
        break
      case BatchInfoTypeEnum.EXTRA:
      case BatchInfoTypeEnum.MORTALITY:
      case BatchInfoTypeEnum.OBASERVATION:
      case BatchInfoTypeEnum.DISCARDED:
      case BatchInfoTypeEnum.DAILY_PRODUCTION:
      case BatchInfoTypeEnum.DAILY_PRODUCTION:
      case BatchInfoTypeEnum.WASTED:
        await simpleAction(req, foundBatch, action, session)
        break
      default:
        throw { type: 400, message: 'Invalid action' }
    }

    await session.commitTransaction()
    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    console.error('Error creating action:', error)
    const counterFixed = await fixBatchInfoCounterIfNeeded(error, req)
    if (counterFixed) return res.status(500).json({ message: 'Hubo un error inesperado, por favor intenta de nuevo.' })
    sendError(res, error, 'Error creating action')
  } finally {
    await session.endSession()
  }
}

const concentrateStoreAction = async (req: any, batch: any, session: ClientSession): Promise<void> => {
  const { amount, type } = req.body
  const concentrate = await req.CollectionConcentrateStore.findById(batch.concentrateStore._id)
  if (!concentrate) throw { type: 400, message: 'Concentrate store not found' }

  const newPrices: number[] = []
  const newAmounts: number[] = []
  const newTypes: string[] = []

  const takenPrices: number[] = []
  const takenAmounts: number[] = []
  const takenTypes: string[] = []

  let remaining = amount
  let discountedAll = false

  for (let i = 0; i < concentrate.price.length; i++) {
    const cType = concentrate.type[i]
    const cAmount = concentrate.amount[i]
    const cPrice = concentrate.price[i]

    if (discountedAll || cType !== type) {
      newPrices.push(cPrice)
      newAmounts.push(cAmount)
      newTypes.push(cType)
      continue
    }

    if (remaining <= 0) {
      newPrices.push(cPrice)
      newAmounts.push(cAmount)
      newTypes.push(cType)
      continue
    }

    if (cAmount > remaining) {
      takenPrices.push(cPrice)
      takenAmounts.push(remaining)
      takenTypes.push(cType)

      newPrices.push(cPrice)
      newAmounts.push(cAmount - remaining)
      newTypes.push(cType)

      remaining = 0
      discountedAll = true
    } else {
      takenPrices.push(cPrice)
      takenAmounts.push(cAmount)
      takenTypes.push(cType)
      remaining -= cAmount
    }
  }

  if (remaining > 0) throw { type: 400, message: 'No hay suficiente concentrado en la bodega' }

  const totalCost = takenAmounts.reduce((acc, a, idx) => acc + a * takenPrices[idx], 0)
  const unitsTaken = takenAmounts.reduce((a, b) => a + b, 0)
  const avgPrice = unitsTaken > 0 ? totalCost / unitsTaken : 0

  const newAction = {
    batchId: batch._id,
    action: BatchInfoTypeEnum.CONCENTRATE,
    amount,
    price: avgPrice,
    typeConcentrate: type,
    concentrateStore: batch.concentrateStore._id

  }
  const newDoc = new req.CollectionBatchInfo(newAction)
  await newDoc.save({ session })

  const storeInfoBody = {
    concentrateStore: batch.concentrateStore,
    type: ConcentrateStoreInfoEnum.OUTPUT,
    amount: takenAmounts,
    price: takenPrices,
    typeConcentrate: takenTypes
  }
  const newConcentrateStoreInfo = new req.CollectionConcentrateStoreInfo(storeInfoBody)
  await newConcentrateStoreInfo.save({ session })

  await req.CollectionConcentrateStore.findByIdAndUpdate(
    batch.concentrateStore._id,
    { $set: { amount: newAmounts, price: newPrices, type: newTypes } },
    { session }
  )
}

const simpleAction = async (req: any, batch: any, action: BatchInfoTypeEnum, session: ClientSession): Promise<void> => {
  const newAction = {
    batchId: batch._id,
    ...req.body
  }
  const newDoc = new req.CollectionBatchInfo(newAction)
  await newDoc.save({ session })
}

const addConcentrate = async (req: any, res: any): Promise<void> => {
  const session = await startSessionWithTransaction()
  try {
    const { owner, price, amount, type } = req.body
    const store = await req.CollectionConcentrateStore.findOne({ owner })
    if (!store) throw { type: 400, message: 'Store not found' }

    const newAmounts = [...store.amount, amount]
    const newPrices = [...store.price, price]
    const newTypes = [...store.type, type]

    const newDoc = new req.CollectionConcentrateStoreInfo({
      concentrateStore: store._id,
      type: ConcentrateStoreInfoEnum.BUY,
      amount: [amount],
      price: [price],
      typeConcentrate: [type]
    })
    await newDoc.save({ session })

    await req.CollectionConcentrateStore.findByIdAndUpdate(store._id, { $set: { amount: newAmounts, price: newPrices, type: newTypes, concentrateStore: newDoc._id } }, { session })

    await session.commitTransaction()
    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error adding concentrate')
  } finally {
    await session.endSession()
  }
}

// ---------- Batch CRUD --------------------------------------------------
const createBatch = async (req: any, res: any): Promise<void> => {
  try {
    const { shedId, startDate, concentrateStoreId, employeeId, initialChickenAmount } = req.body
    const foundShed = await req.CollectionShed.findById(shedId)
    if (!foundShed) throw { type: 400, message: 'Shed not found' }

    const foundBatch = await req.CollectionBatch.findOne({ shed: foundShed, state: true })
    if (foundBatch) throw { type: 400, message: 'Ya hay un lote activo en este galpón' }

    const newBatch = {
      shed: foundShed._id,
      birdType: foundShed.birdType,
      inCharge: employeeId,
      concentrateStore: concentrateStoreId,
      amount: initialChickenAmount,
      startDate
    }

    await req.CollectionBatch.create(newBatch)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error creating batch')
  }
}

const getActiveBatches = async (req: any, res: any): Promise<void> => {
  try {
    const batches = await req.CollectionBatch.find({ state: true }).populate('shed').populate('inCharge').populate('concentrateStore')
    res.send(batches)
  } catch (error: any) {
    sendError(res, error, 'Error getting batches')
  }
}

const getBatches = async (req: any, res: any): Promise<void> => {
  try {
    const batches = await req.CollectionBatch.find().populate('shed').populate('inCharge').populate('concentrateStore')
    res.send(batches)
  } catch (error: any) {
    sendError(res, error, 'Error getting batches')
  }
}

const getSheds = async (req: any, res: any): Promise<void> => {
  try {
    const sheds = await req.CollectionShed.find()
    res.send(sheds)
  } catch (error: any) {
    sendError(res, error, 'Error getting sheds')
  }
}

const getStores = async (req: any, res: any): Promise<void> => {
  try {
    const stores = await req.CollectionConcentrateStore.find()
    res.send(stores)
  } catch (error: any) {
    sendError(res, error, 'Error getting stores')
  }
}

const updateBatch = async (req: any, res: any): Promise<void> => {
  try {
    const { batchId, shed, startDate, concentrateStore: concentrateStoreId, employees, initialChickenAmount, state } = req.body
    const foundBatch = await req.CollectionBatch.findById(batchId)
    if (!foundBatch) throw { type: 400, message: 'Batch not found' }

    if (foundBatch.shed.toString() !== shed._id.toString()) {
      const anotherBatch = await req.CollectionBatch.findOne({ shed: shed._id, state: true })
      if (anotherBatch) throw { type: 400, message: 'Ya hay un lote activo en este galpón' }
    }

    const updatedBatch = {
      shed: shed._id,
      birdType: shed.birdType,
      inCharge: employees,
      concentrateStore: concentrateStoreId,
      amount: initialChickenAmount,
      startDate,
      state
    }

    await req.CollectionBatch.findByIdAndUpdate(batchId, updatedBatch)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error updating batch')
  }
}

// ---------- Chicken sale ------------------------------------------------
const chickenSale = async (req: any, res: any): Promise<void> => {
  const { chickenBatch, clientId, saleDate } = req.body
  const session = await startSessionWithTransaction()

  try {
    const client = await req.CollectionClient.findById(clientId)
    if (!client) throw { type: 400, message: 'Client not found' }

    const totalChickenAmount = chickenBatch.reduce((acc: number, b: any) => acc + (b.amount || 0), 0)
    const totalChickenPound = chickenBatch.reduce((acc: number, b: any) => acc + (b.pound || 0), 0)
    const totalSale = totalChickenPound * client.salePrice

    const chickenSale = new req.CollectionChickenSale({
      client: clientId,
      date: saleDate,
      chickenAmount: totalChickenAmount,
      weight: totalChickenPound,
      total: totalSale,
      averageWeight: totalChickenPound / (totalChickenAmount || 1),
      paid: false
    })

    await chickenSale.save({ session })
    chickenSale.client = client // attach populated client for PDF generation

    for (const batchSale of chickenBatch) {
      const batch = await req.CollectionBatch.findOne({ shed: batchSale.shed, state: true })
      if (!batch) throw { type: 400, message: `No active batch found for shed ${batchSale.shed}` }
      const newAction = {
        batchId: batch._id,
        action: BatchInfoTypeEnum.SALE,
        amount: batchSale.amount,
        price: client.salePrice,
        chikenSale: chickenSale._id,
        createdAt: saleDate ? new Date(saleDate) : new Date(),
        updatedAt: saleDate ? new Date(saleDate) : new Date(),
      }
      const newDoc = new req.CollectionBatchInfo(newAction)
      await newDoc.save({ session })
    }

    await session.commitTransaction()

    // PDF generation (shared helper)
    const eggSaleDate = new Date(chickenSale.date)
    eggSaleDate.setHours(eggSaleDate.getHours() + 6) // Ajustar zona horaria si es necesario
    const saleDateFormatted = eggSaleDate.toLocaleDateString('es-GT')
    generateChickenPdf(res, chickenSale, saleDateFormatted)
  } catch (error: any) {
    await session.abortTransaction()
    console.error('Error creating chicken sale:', error)
    const counterFixed = await fixBatchInfoCounterIfNeeded(error, req)
    if (counterFixed) return res.status(500).json({ message: 'Hubo un error inesperado, por favor intenta de nuevo.' })
    sendError(res, error, 'Error creating chicken sale')
  } finally {
    await session.endSession()
  }
}

const renderChickenPdfContent = (doc: PDFDocument, chickenSale: any, saleDate: string) => {
  writeTicketHeader(doc, 'Granja Aldana', chickenSale._id, saleDate)

  const left = doc.page.margins.left
  const right = doc.page.width - doc.page.margins.right
  const contentWidth = right - left

  if (!chickenSale.paid) {
    const badgeTop = doc.y
    doc.lineWidth(2).strokeColor('#000000')
      .roundedRect(left, badgeTop, contentWidth, 28, 4).stroke()
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(13)
      .text('PENDIENTE DE PAGO', left, badgeTop + 7, { width: contentWidth, align: 'center' })
    doc.y = badgeTop + 36
  }

  // Client — small label above, bold name below
  doc.font('Helvetica').fontSize(11).fillColor('#000000')
    .text('CLIENTE', left, doc.y)
  doc.font('Helvetica-Bold').fontSize(17).fillColor('#000000')
    .text(chickenSale.client?.name ?? '', left, doc.y + 1)
  doc.y = doc.y + 24

  // Thin separator
  doc.lineWidth(0.8).strokeColor('#000000')
    .moveTo(left, doc.y).lineTo(right, doc.y).stroke()
  doc.y = doc.y + 9

  // Items — two-column rows
  const renderRow = (label: string, value: string) => {
    const rowY = doc.y
    doc.font('Helvetica').fontSize(13).fillColor('#000000')
      .text(label, left, rowY, { width: contentWidth * 0.65 })
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#000000')
      .text(value, left, rowY, { width: contentWidth, align: 'right' })
    doc.y = rowY + 21
  }

  renderRow('Cantidad de pollos', `${chickenSale.chickenAmount ?? 0}`)
  renderRow('Cantidad de libras', `${chickenSale.weight ?? 0}`)

  writeTicketFooter(doc, `Q${(Number(chickenSale.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
}

const generateChickenPdf = (res: any, chickenSale: any, saleDate: string) => {
  const measureDoc = createTicketDoc(250, MEASURE_PAGE_HEIGHT, 12)
  renderChickenPdfContent(measureDoc, chickenSale, saleDate)
  const computedHeight = Math.max(Math.ceil(measureDoc.y + EXTRA_VERTICAL_SPACE), 250)
  measureDoc.end()

  const doc = createTicketDoc(250, computedHeight, 12)
  const clientSlug = toFileSlug(chickenSale.client?.name ?? 'cliente')
  pipePdfToResponse(res, doc, `${clientSlug}-${saleDate}.pdf`)
  renderChickenPdfContent(doc, chickenSale, saleDate)
  doc.end()
}

const getClients = async (req: any, res: any): Promise<void> => {
  try {
    const clients = await req.CollectionClient.find()
    res.send(clients)
  } catch (error: any) {
    sendError(res, error, 'Error getting clients')
  }
}

const chickenSales = async (req: any, res: any): Promise<void> => {
  try {
    const sales = await req.CollectionChickenSale.find().populate('client').limit(50).sort({ date: -1 })
    res.send(sales)
  } catch (error: any) {
    sendError(res, error, 'Error getting sales')
  }
}

const getChickenBill = async (req: any, res: any): Promise<void> => {
  try {
    const { billId } = req.params
    const chickenSale = await req.CollectionChickenSale.findById(billId).populate('client')
    if (!chickenSale) throw { type: 400, message: 'Bill not found' }

    const eggSaleDate = new Date(chickenSale.date)
    eggSaleDate.setHours(eggSaleDate.getHours() + 6) // Ajustar zona horaria si es necesario
    const saleDateFormatted = eggSaleDate.toLocaleDateString('es-GT')
    generateChickenPdf(res, chickenSale, saleDateFormatted)
  } catch (error: any) {
    sendError(res, error, 'Error getting bill')
  }
}

const updateChickenBillState = async (req: any, res: any): Promise<void> => {
  try {
    const { billId } = req.params
    const chickenSale = await req.CollectionChickenSale.findById(billId)
    if (!chickenSale) throw { type: 400, message: 'Bill not found' }
    if (chickenSale.paid === true) throw { type: 400, message: 'Sale is already paid' }

    await req.CollectionChickenSale.findByIdAndUpdate(billId, { $set: { paid: true } })
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error updating bill')
  }
}

const getBatchInfo = async (req: any, res: any): Promise<void> => {
  try {
    const { batchId } = req.params
    const batchInfo = await req.CollectionBatchInfo.find({ batchId }).populate('chikenSale')
    res.send(batchInfo)
  } catch (error: any) {
    sendError(res, error, 'Error getting batch info')
  }
}

const getUsers = async (req: any, res: any): Promise<void> => {
  try {
    const users = await req.CollectionUser.find({ company: req.company, deleted: { $ne: true } }, '-pwd')
    res.send(users)
  } catch (error: any) {
    sendError(res, error, 'Error getting users')
  }
}

// ---------- Egg sale ----------------------------------------------------
const buildEggRows = (eggSale: any) => {
  const rows: TableRow[] = []
  for (let i = 0; i < eggSale.size.length; i++) {
    const s = formatSizeShort(eggSale.size[i])
    const t = formatTypeShort(eggSale.type[i])
    let unitPrice = eggSale.price[i]
    let rowTotal = 0
    const isBox = eggSale.type[i].toLowerCase() === 'caja'
    if (!isBox) {
      unitPrice = unitPrice / 12
      rowTotal = (eggSale.amount[i] * eggSale.price[i]) / 12
    } else {
      rowTotal = eggSale.amount[i] * eggSale.price[i]
    }
    rows.push([
      s,
      t,
      `${eggSale.amount[i]}`,
      formatCurrency(unitPrice),
      formatCurrency(rowTotal)
    ])
  }
  rows.push([
    { value: 'Total', bold: true, align: 'left' },
    '',
    '',
    { value: formatCurrency(eggSale.total), bold: true, align: 'right', colSpan: 2 }
  ])
  return rows
}

const renderEggPdfContent = (doc: PDFDocument, eggSale: any, saleDate: string) => {
  writeTicketHeader(doc, 'Granja Aldana', eggSale._id, saleDate)

  if (!eggSale.paid) {
    const left = doc.page.margins.left
    const right = doc.page.width - doc.page.margins.right
    const contentWidth = right - left
    const badgeTop = doc.y
    doc.lineWidth(2).strokeColor('#000000')
      .roundedRect(left, badgeTop, contentWidth, 28, 4).stroke()
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(13)
      .text('PENDIENTE DE PAGO', left, badgeTop + 7, { width: contentWidth, align: 'center' })
    doc.y = badgeTop + 36
  }

  // Section label with decorative side lines
  const sectionY = doc.y
  const sectionLeft = doc.page.margins.left
  const sectionRight = doc.page.width - doc.page.margins.right
  doc.lineWidth(0.7).strokeColor('#000000')
    .moveTo(sectionLeft, sectionY + 6).lineTo(sectionLeft + 16, sectionY + 6).stroke()
  doc.lineWidth(0.7).strokeColor('#000000')
    .moveTo(sectionRight - 16, sectionY + 6).lineTo(sectionRight, sectionY + 6).stroke()
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000')
    .text('ARTÍCULOS', sectionLeft, sectionY, { width: sectionRight - sectionLeft, align: 'center' })
  doc.y = sectionY + 16

  const columns: TableColumn[] = [
    { label: 'Tam', width: 34, align: 'center' },
    { label: 'Tipo', width: 36, align: 'center' },
    { label: 'Cant.', width: 36, align: 'right' },
    { label: 'Precio', width: 56, align: 'right' },
    { label: 'Importe', width: 58, align: 'right' }
  ]
  const rowHeight = 26
  const tableTop = doc.y
  const rows = buildEggRows(eggSale)
  drawTableHeaders(doc, tableTop, rowHeight, columns)
  drawRows(doc, rows, tableTop, rowHeight, columns)

  const tableHeight = rowHeight * (rows.length + 1)
  doc.y = tableTop + tableHeight + 14
}

const generateEggPdf = (res: any, eggSale: any, saleDate: string) => {
  const measureDoc = createTicketDoc(250, MEASURE_PAGE_HEIGHT, 14)
  renderEggPdfContent(measureDoc, eggSale, saleDate)
  const computedHeight = Math.max(Math.ceil(measureDoc.y + EXTRA_VERTICAL_SPACE), 250)
  measureDoc.end()

  const doc = createTicketDoc(250, computedHeight, 14)
  pipePdfToResponse(res, doc, `huevo-${saleDate}.pdf`)
  drawEggBorder(doc)
  renderEggPdfContent(doc, eggSale, saleDate)
  doc.end()
}

const eggSale = async (req: any, res: any): Promise<void> => {
  try {
    const { data, saleDate } = req.body
    const prices = await req.CollectionEggPrice.find()

    const size: string[] = []
    const type: string[] = []
    const amount: number[] = []
    const price: number[] = []
    let total = 0

    for (const item of data) {
      const priceItem = prices.find((pr: any) => pr.type.toLowerCase() === item.size.toLowerCase())
      const itemPrice = priceItem?.price ?? 0

      size.push(item.size)
      type.push(item.type.toLowerCase())
      price.push(itemPrice)
      amount.push(item.amount)

      if (item.type.toLowerCase() === 'caja') total += itemPrice * item.amount
      else total += (itemPrice / 12) * item.amount
    }

    const eggSale = new req.CollectionEggSale({ size, type, amount, price, total, date: saleDate })
    await eggSale.save()

    // Formatear fecha sin cambiar la fecha original
    const date = new Date(saleDate + 'T00:00:00')
    const saleDateFormatted = date.toLocaleDateString('es-GT')
    generateEggPdf(res, eggSale, saleDateFormatted)
  } catch (error: any) {
    sendError(res, error, 'Error creating egg sale')
  }
}

const eggSales = async (req: any, res: any): Promise<void> => {
  try {
    const sales = await req.CollectionEggSale.find().limit(100).sort({ date: -1 })
    res.send(sales)
  } catch (error: any) {
    sendError(res, error, 'Error getting sales')
  }
}

const eggPrice = async (req: any, res: any): Promise<void> => {
  try {
    const prices = await req.CollectionEggPrice.find()
    res.send(prices)
  } catch (error: any) {
    sendError(res, error, 'Error getting egg prices')
  }
}

const updateEggPrice = async (req: any, res: any): Promise<void> => {
  try {
    const { id, price } = req.body
    const updated = await req.CollectionEggPrice.findByIdAndUpdate(id, { $set: { price } }, { new: true })
    res.send(updated)
  } catch (error: any) {
    sendError(res, error, 'Error updating egg price')
  }
}

const updateEggBillState = async (req: any, res: any): Promise<void> => {
  try {
    const { billId } = req.params
    const eggSale = await req.CollectionEggSale.findById(billId)
    if (!eggSale) throw { type: 400, message: 'Bill not found' }
    if (eggSale.paid === true) throw { type: 400, message: 'Sale is already paid' }
    const paymentAmount = Number(req.body?.amount ?? eggSale.total)
    if (Number.isNaN(paymentAmount) || paymentAmount <= 0) {
      throw { type: 400, message: 'Invalid amount' }
    }
    const toMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100
    const currentPaid = toMoney(Number(eggSale.paidAmount ?? 0))
    const total = toMoney(Number(eggSale.total ?? 0))
    const nextPaid = toMoney(Math.min(currentPaid + paymentAmount, total))
    const nextPaidAt = nextPaid >= total ? new Date() : eggSale.paidAt ?? null

    const updated = await req.CollectionEggSale.findByIdAndUpdate(
      billId,
      { $set: { paid: nextPaid >= total, paidAmount: nextPaid, paidAt: nextPaidAt } },
      { new: true }
    )
    if (req.CollectionDeliveryCashBalance && paymentAmount > 0) {
      await decreaseCashBalance(req.CollectionDeliveryCashBalance, paymentAmount)
    }
    res.send(updated)
  } catch (error: any) {
    sendError(res, error, 'Error updating bill')
  }
}

const getEggBill = async (req: any, res: any): Promise<void> => {
  try {
    const { billId } = req.params
    const eggSale = await req.CollectionEggSale.findById(billId)
    if (!eggSale) throw { type: 400, message: 'Bill not found' }

    // Formatear fecha sin cambiar la fecha original
    const eggSaleDate = new Date(eggSale.date)
    eggSaleDate.setHours(eggSaleDate.getHours() + 6) // Ajustar zona horaria si es necesario
    const saleDateFormatted = eggSaleDate.toLocaleDateString('es-GT')
    generateEggPdf(res, eggSale, saleDateFormatted)
  } catch (error: any) {
    sendError(res, error, 'Error getting bill')
  }
}

const eggSalesBetween = async (req: any, res: any): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) throw { type: 400, message: 'Start date and end date are required' }
    const start = new Date(`${startDate}T00:00:00.000Z`)
    const end = new Date(`${endDate}T00:00:00.000Z`)
    end.setUTCDate(end.getUTCDate() + 1)
    const sales = await req.CollectionEggSale.find({
      date: { $gte: start, $lt: end },
      cancelled: { $ne: true }
    })
    res.send(sales)
  } catch (error: any) {
    sendError(res, error, 'Error getting sales between dates')
  }
}

const updateClientPrice = async (req: any, res: any): Promise<void> => {
  try {
    const { id, price } = req.body
    const updated = await req.CollectionClient.findByIdAndUpdate(id, { $set: { salePrice: price } }, { new: true })
    res.send(updated)
  } catch (error: any) {
    sendError(res, error, 'Error updating client price')
  }
}

const deleteChickenSale = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.body
    await req.CollectionClient.findByIdAndDelete(id)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error updating client price')
  }
}

const deleteEggSale = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.body
    await req.CollectionEggSale.findByIdAndDelete(id)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error updating client price')
  }
}

const cancelChickenSale = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params
    const sale = await req.CollectionChickenSale.findById(id)
    if (!sale) throw { type: 404, message: 'Sale not found' }
    if (sale.cancelled === true) throw { type: 400, message: 'Sale is already cancelled' }
    await req.CollectionChickenSale.findByIdAndUpdate(id, { $set: { cancelled: true } })
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error cancelling chicken sale')
  }
}

const cancelEggSale = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params
    const sale = await req.CollectionEggSale.findById(id)
    if (!sale) throw { type: 404, message: 'Sale not found' }
    if (sale.cancelled === true) throw { type: 400, message: 'Sale is already cancelled' }
    await req.CollectionEggSale.findByIdAndUpdate(id, { $set: { cancelled: true } })
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error cancelling egg sale')
  }
}

const deleteAction = async (req: any, res: any): Promise<void> => {
  const session = await startSessionWithTransaction()
  try {
    const { id, action } = req.query

    if (action === 'concentrado') {
      const { typeConcentrate, amount, price, concentrateStore } = await req.CollectionBatchInfo.findById(id)

      const store = await req.CollectionConcentrateStore.findById(concentrateStore)

      await req.CollectionConcentrateStore.findByIdAndUpdate(
        concentrateStore,
        { $set: { amount: [...store.amount, amount], price: [...store.price, price], type: [...store.type, typeConcentrate] } },
        { session }
      )
    } else if (action === 'venta') {
      const { chikenSale } = await req.CollectionBatchInfo.findById(id)
      await req.CollectionChickenSale.findByIdAndDelete(chikenSale, { session })
    }

    await req.CollectionBatchInfo.findByIdAndDelete(id, { session })

    await session.commitTransaction()
    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error deleting action')
  } finally {
    await session.endSession()
  }
}

const createChikenShed = async (req: any, res: any): Promise<void> => {
  try {
    const { shedNumber, birdType } = req.body

    const newShed = new req.CollectionShed({ shedNumber, birdType })
    await newShed.save()
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error creating chicken shed')
  }
}

const deleteChikenShed = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.body
    await req.CollectionShed.findByIdAndDelete(id)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error deleting chicken shed')
  }
}

const updateChikenShed = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params
    const { shedNumber, birdType } = req.body

    const updated = await req.CollectionShed.findByIdAndUpdate(id, { shedNumber, birdType }, { new: true })
    res.send(updated)
  } catch (error: any) {
    sendError(res, error, 'Error updating chicken shed')
  }
}

const createConcentrateStore = async (req: any, res: any): Promise<void> => {
  try {
    const { owner } = req.body

    const newStore = new req.CollectionConcentrateStore({ owner, amount: [], price: [], type: [] })
    await newStore.save()
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error creating concentrate store')
  }
}

const createConcentrateType = async (req: any, res: any): Promise<void> => {
  try {
    const { name: type } = req.body

    const newType = new req.CollectionConcentrateType({ name: type })
    await newType.save()
    res.send({ message: 'OK' })
  }
  catch (error: any) {
    sendError(res, error, 'Error creating concentrate type')
  }
}

const getConcentrateTypes = async (req: any, res: any): Promise<void> => {
  try {
    const types = await req.CollectionConcentrateType.find()
    res.send(types)
  } catch (error: any) {
    sendError(res, error, 'Error getting concentrate types')
  }
}

const deleteConcentrateType = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params
    await req.CollectionConcentrateType.findByIdAndDelete(id)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error deleting concentrate type')
  }
}

const createEggType = async (req: any, res: any): Promise<void> => {
  try {
    const { name: type } = req.body

    const newType = new req.CollectionEggPrice({ type, price: 0 })
    await newType.save()
    res.send({ message: 'OK' })
  }
  catch (error: any) {
    sendError(res, error, 'Error creating egg type')
  }
}

const getEggTypes = async (req: any, res: any): Promise<void> => {
  try {
    const types = await req.CollectionEggPrice.find()
    res.send(types)
  } catch (error: any) {
    sendError(res, error, 'Error getting egg types')
  }
}

const deleteEggType = async (req: any, res: any): Promise<void> => {
  try {
    const { id } = req.params
    await req.CollectionEggPrice.findByIdAndDelete(id)
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error deleting egg type')
  }
}

export default {
  makeAnAction,
  addConcentrate,
  createBatch,
  getActiveBatches,
  getSheds,
  getStores,
  updateBatch,
  chickenSale,
  getClients,
  chickenSales,
  getChickenBill,
  updateChickenBillState,
  getBatchInfo,
  getUsers,
  eggSale,
  eggSales,
  eggPrice,
  updateEggPrice,
  updateEggBillState,
  getEggBill,
  getBatches,
  eggSalesBetween,
  updateClientPrice,
  deleteChickenSale,
  deleteEggSale,
  cancelChickenSale,
  cancelEggSale,
  deleteAction,
  createChikenShed,
  deleteChikenShed,
  updateChikenShed,
  createConcentrateStore,
  createConcentrateType,
  deleteConcentrateType,
  createEggType,
  deleteEggType,
  getConcentrateTypes,
  getEggTypes
}
