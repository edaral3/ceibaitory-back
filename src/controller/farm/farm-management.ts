import Mongoose, { type ClientSession } from 'mongoose'
import BatchInfoTypeEnum from '../../enum/batch-info-type.enum'
import ConcentrateStoreInfoEnum from '../../enum/concentrate-store-info.enum'
import PDFDocument from 'pdfkit'
import "pdfkit-table";

// ---------- Helpers ------------------------------------------------------
const sendError = (res: any, error: any, defaultMessage = 'Internal server error') => {
  if (error?.type === 400) return res.status(400).json({ message: error.message })
  return res.status(500).json({ message: defaultMessage })
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

const pipePdfToResponse = (res: any, doc: PDFDocument, fileName: string) => {
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `inline; filename=${fileName}`)
  doc.pipe(res)
}

const drawTableHeaders = (doc: PDFDocument, tableTop: number, itemHeight: number) => {
  const draw = (x: number, width: number, label: string) => {
    doc.rect(x, tableTop, width, itemHeight).stroke()
    doc.font('Helvetica-Bold').fontSize(12).text(label, x + 10, tableTop + 5)
  }
  draw(5, 45, 'Tam')
  draw(50, 30, 'Tipo')
  draw(80, 30, 'Cant')
  draw(110, 50, 'Precio')
  draw(160, 85, 'Total')
}

const drawRows = (doc: PDFDocument, rows: any[], tableTop: number, itemHeight: number) => {
  rows.forEach((row, rowIndex) => {
    row.forEach((cell: any, colIndex: number) => {
      let x = 0
      const y = tableTop + (rowIndex + 1) * itemHeight
      let width = 0
      if (colIndex === 0) { x = 5; width = 45 }
      else if (colIndex === 1) { x = 50; width = 30 }
      else if (colIndex === 2) { x = 80; width = 30 }
      else if (colIndex === 3) { x = 110; width = 50 }
      else if (colIndex === 4) { x = 160; width = 85 }
      doc.rect(x, y, width, itemHeight).stroke().fontSize(14).text(cell, x + 5, y + 5)
    })
  })
}

// Generic small ticket helpers (used for both chicken and eggs) ----------------
const writeTicketHeader = (doc: PDFDocument, title: string, id: string, dateText?: string) => {
  doc.fontSize(20).text('Granja Aldana', { align: 'center' })
  doc.moveDown(0.5)
  doc.fontSize(17).text(`Ticket: ${id}`, { align: 'center' })
  doc.moveDown(1)
  if (dateText) doc.fontSize(17).text(`Fecha: ${dateText}`)
}

const writeTicketFooter = (doc: PDFDocument, totalText: string) => {
  doc.moveDown(1)
  doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke()
  doc.moveDown(0.5)
  doc.fontSize(19).text('TOTAL', { continued: true }).text(` ${totalText}`, { align: 'right' })
  doc.moveDown(1)
  doc.fontSize(17).text('Gracias por la compra!', { align: 'center' })
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

    for (const batchSale of chickenBatch) {
      const batch = await req.CollectionBatch.findOne({ shed: batchSale.shed, state: true })
      const newAction = {
        batchId: batch._id,
        action: BatchInfoTypeEnum.SALE,
        amount: batchSale.amount,
        price: client.salePrice,
        chikenSale: chickenSale._id
      }
      const newDoc = new req.CollectionBatchInfo(newAction)
      await newDoc.save({ session })
    }

    // PDF generation (shared helper)
    generateChickenPdf(res, chickenSale, saleDate)

    await session.commitTransaction()
  } catch (error: any) {
    await session.abortTransaction()
    sendError(res, error, 'Error creating chicken sale')
  } finally {
    await session.endSession()
  }
}

const generateChickenPdf = (res: any, chickenSale: any, saleDate: string) => {
  const doc = new PDFDocument({ size: [250, 400], margin: 12 })
  pipePdfToResponse(res, doc, `ticket-${chickenSale._id}.pdf`)

  // Header
  writeTicketHeader(doc, 'Granja Aldana', chickenSale._id, saleDate)
  doc.fontSize(17).text(`Cliente: ${chickenSale.client ?? ''}`)

  doc.moveDown(1.5)
  doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke()

  // Items
  const totalChickenAmount = chickenSale.chickenAmount ?? 0
  const totalChickenPound = chickenSale.weight ?? 0
  doc.moveDown(0.5)
  doc.fontSize(17).text(`Cantidad de pollos`, { continued: true }).text(`${totalChickenAmount}`, { align: 'right' })
  doc.fontSize(17).text(`Cantidad de libras`, { continued: true }).text(`${totalChickenPound}`, { align: 'right' })

  writeTicketFooter(doc, `Q${(chickenSale.total ?? 0).toFixed(2)}`)
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

    generateChickenPdf(res, chickenSale, new Date(chickenSale.date).toISOString().split('T')[0])
  } catch (error: any) {
    sendError(res, error, 'Error getting bill')
  }
}

const updateChickenBillState = async (req: any, res: any): Promise<void> => {
  try {
    const { billId } = req.params
    const chickenSale = await req.CollectionChickenSale.findById(billId)
    if (!chickenSale) throw { type: 400, message: 'Bill not found' }

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
    const users = await req.CollectionUser.find({ company: req.company }, '-pwd')
    res.send(users)
  } catch (error: any) {
    sendError(res, error, 'Error getting users')
  }
}

// ---------- Egg sale ----------------------------------------------------
const buildEggRows = (eggSale: any) => {
  const rows: any[] = []
  for (let i = 0; i < eggSale.size.length; i++) {
    const s = formatSizeShort(eggSale.size[i])
    const t = formatTypeShort(eggSale.type[i])
    let unitPrice = eggSale.price[i]
    let rowTotal = 0
    if (eggSale.type[i].toLowerCase() !== 'caja') {
      unitPrice = unitPrice / 12
      rowTotal = (eggSale.amount[i] * eggSale.price[i]) / 12
    } else {
      rowTotal = eggSale.amount[i] * eggSale.price[i]
    }
    rows.push([s, t, `${eggSale.amount[i]}`, `${unitPrice.toFixed(2)}`, `${rowTotal.toFixed(2)}`])
  }
  rows.push(['', '', '', '', ''])
  rows.push(['', '', '', 'Total', `${(eggSale.total ?? 0).toFixed(2)}`])
  return rows
}

const generateEggPdf = (res: any, eggSale: any, saleDate: string) => {
  const doc = new PDFDocument({ size: [250, 450], margin: 12 })
  pipePdfToResponse(res, doc, `ticket-${eggSale._id}.pdf`)

  writeTicketHeader(doc, 'Granja Aldana', eggSale._id, saleDate)
  doc.moveDown(0.1)
  doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke()

  const tableTop = 140
  const itemHeight = 20
  drawTableHeaders(doc, tableTop, itemHeight)

  const rows = buildEggRows(eggSale)
  drawRows(doc, rows, tableTop, itemHeight)

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

    generateEggPdf(res, eggSale, saleDate)
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
    await req.CollectionEggSale.findByIdAndUpdate(billId, { $set: { paid: true } })
    res.send({ message: 'OK' })
  } catch (error: any) {
    sendError(res, error, 'Error updating bill')
  }
}

const getEggBill = async (req: any, res: any): Promise<void> => {
  try {
    const { billId } = req.params
    const eggSale = await req.CollectionEggSale.findById(billId)
    if (!eggSale) throw { type: 400, message: 'Bill not found' }

    generateEggPdf(res, eggSale, new Date(eggSale.date).toISOString().split('T')[0])
  } catch (error: any) {
    sendError(res, error, 'Error getting bill')
  }
}

const eggSalesBetween = async (req: any, res: any): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) throw { type: 400, message: 'Start date and end date are required' }
    const sales = await req.CollectionEggSale.find({ date: { $gte: new Date(startDate), $lte: new Date(endDate) } })
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
  deleteAction,
  createChikenShed,
  deleteChikenShed,
  updateChikenShed,
  createConcentrateStore
}
