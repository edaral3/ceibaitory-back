import Mongoose, { type ClientSession } from 'mongoose'
import BatchInfoTypeEnum from '../../enum/batch-info-type.enum'
import ConcentrateStoreInfoEnum from '../../enum/concentrate-store-info.enum'
import PDFDocument from 'pdfkit';
import "pdfkit-table";

const makeAnAction = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { batchId, action } = req.body

    const foundBatch = await req.CollectionBatch.findById(batchId)

    if (!foundBatch) {
      throw { type: 400, message: 'Batch not found' }
    }

    switch (action) {
      case BatchInfoTypeEnum.CONCENTRATE:
        await concentrateStoreAction(req, foundBatch, session)
        break;
      case BatchInfoTypeEnum.MORTALITY:
      case BatchInfoTypeEnum.OBASERVATION:
      case BatchInfoTypeEnum.DISCARDED:
      case BatchInfoTypeEnum.DAILY_PRODUCTION:
      case BatchInfoTypeEnum.WASTED:
        await simpleAction(req, foundBatch, action, session)
        break;
    }

    await session.commitTransaction()

    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error creating sale' })
    }
  } finally {
    await session.endSession()
  }
}

const concentrateStoreAction = async (req: any, batch, session: ClientSession): Promise<void> => {
  const { amount, type } = req.body

  const concentrate = await req.CollectionConcentrateStore.findById(batch.concentrateStore._id)

  let newPrices: number[] = []
  let newAmounts: number[] = []
  let newTypes: string[] = []
  let difference = amount;

  let pricesInfo: number[] = []
  let amountsInfo: number[] = []
  let typesInfo: string[] = []

  let discountedAll = false

  for (let i = 0; i < concentrate.price.length; i++) {
    if (discountedAll) {
      newPrices.push(concentrate.price[i])
      newAmounts.push(concentrate.amount[i])
      newTypes.push(concentrate.type[i])
      continue
    }
    if (concentrate.type[i] === type) {
      difference = concentrate.amount[i] - difference
      if (difference < 0) {
        pricesInfo.push(concentrate.price[i])
        amountsInfo.push(concentrate.amount[i])
        typesInfo.push(concentrate.type[i])

        difference = Math.abs(difference)
      } else {
        if (difference !== 0) {
          pricesInfo.push(concentrate.price[i])
          amountsInfo.push(concentrate.amount[i] - difference)
          typesInfo.push(concentrate.type[i])
        }
        newAmounts.push(difference)
        newPrices.push(concentrate.price[i])
        newTypes.push(concentrate.type[i])
        discountedAll = true
        difference = 0
      }
    } else {
      newPrices.push(concentrate.price[i])
      newAmounts.push(concentrate.amount[i])
      newTypes.push(concentrate.type[i])
    }
  }

  if (difference > 0 && !discountedAll) {
    throw { type: 400, message: 'No hay suficiente concentrado en la bodega' }
  }

  let total = 0;
  for (let i = 0; i < amountsInfo.length; i++) {
    total += amountsInfo[i] * pricesInfo[i];
  }

  const newAction = {
    batchId: batch._id,
    action: BatchInfoTypeEnum.CONCENTRATE,
    amount,
    price: total / amountsInfo.reduce((a, b) => a + b, 0)
  }

  const newDoc = new req.CollectionBatchInfo(newAction);
  await newDoc.save({ session });

  const body = {
    concentrateStore: batch.concentrateStore,
    type: ConcentrateStoreInfoEnum.OUTPUT,
    amount: amountsInfo,
    price: pricesInfo,
    typeConcentrate: typesInfo
  }

  const newConcentrateStoreInfo = new req.CollectionConcentrateStoreInfo(body);
  await newConcentrateStoreInfo.save({ session });
  await req.CollectionConcentrateStore.findByIdAndUpdate(batch.concentrateStore._id, { $set: { amount: newAmounts, price: newPrices, type: newTypes } }, { session })

}

const simpleAction = async (req: any, batch, action: BatchInfoTypeEnum, session: ClientSession): Promise<void> => {
  const newAction = {
    batchId: batch._id,
    ...req.body,
  }

  const newDoc = new req.CollectionBatchInfo(newAction);
  await newDoc.save({ session });
}

const addConcentrate = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const { owner, price, amount, type } = req.body

    const store = await req.CollectionConcentrateStore.findOne({ owner })

    let newAmounts = [...store.amount]
    let newPrices = [...store.price]
    let newTypes = [...store.type]

    newAmounts.push(amount)
    newPrices.push(price)
    newTypes.push(type)


    const newDoc = new req.CollectionConcentrateStoreInfo({ concentrateStore: store._id, type: ConcentrateStoreInfoEnum.BUY, amount: [amount], price: [price], typeConcentrate: [type] });
    await newDoc.save({ session });

    await req.CollectionConcentrateStore.findByIdAndUpdate(store._id, { $set: { amount: newAmounts, price: newPrices, type: newTypes } }, { session })

    await session.commitTransaction()

    res.send({ message: 'OK' })
  } catch (error: any) {
    await session.abortTransaction()
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error creating sale' })
    }
  } finally {
    await session.endSession()
  }
}

const createBatch = async (req: any, res: any): Promise<void> => {
  try {
    const { shedId, startDate, concentrateStoreId, employeeId, initialChickenAmount } = req.body

    const foundShed = await req.CollectionShed.findById(shedId)

    if (!foundShed) {
      throw { type: 400, message: 'Shed not found' }
    }

    const foundBatch = await req.CollectionBatch.findOne({ shed: foundShed, state: true })

    if (foundBatch) {
      throw { type: 400, message: 'Ya hay un lote activo en este galpón' }
    }
    const newBatch = {
      shed: foundShed._id,
      birdType: foundShed.birdType,
      inCharge: employeeId,
      concentrateStore: concentrateStoreId,
      amount: initialChickenAmount,
      startDate: startDate
    }

    await req.CollectionBatch.create(newBatch)
    res.send({ message: 'OK' })
  } catch (error: any) {
    throw { type: 400, message: 'Error creating batch' }
  }
}

const getActiveBatches = async (req: any, res: any): Promise<void> => {
  try {
    const batches = await req.CollectionBatch.find({ state: true }).populate('shed').populate('inCharge').populate('concentrateStore')
    res.send(batches)
  } catch (error) {
    res.status(400).json({ message: 'Error getting batches' })
  }
}


const getBatches = async (req: any, res: any): Promise<void> => {
  try {
    const batches = await req.CollectionBatch.find().populate('shed').populate('inCharge').populate('concentrateStore')
    res.send(batches)
  } catch (error) {
    res.status(400).json({ message: 'Error getting batches' })
  }
}

const getSheds = async (req: any, res: any): Promise<void> => {
  try {
    const sheds = await req.CollectionShed.find()

    res.send(sheds)
  } catch (error) {
    res.status(400).json({ message: 'Error getting sheds' })
  }
}

const getStores = async (req: any, res: any): Promise<void> => {
  try {
    const stores = await req.CollectionConcentrateStore.find()
    res.send(stores)
  } catch (error) {
    res.status(400).json({ message: 'Error getting stores' })
  }
}

const updateBatch = async (req: any, res: any): Promise<void> => {
  try {
    const { batchId, shed, startDate, concentrateStore: concentrateStoreId, employees, initialChickenAmount, state } = req.body

    const foundBatch = await req.CollectionBatch.findById(batchId)
    if (!foundBatch) {
      throw { type: 400, message: 'Batch not found' }
    }

    if (foundBatch.shed.toString() !== shed._id.toString()) {
      const anotherBatch = await req.CollectionBatch.findOne({ shed: shed._id, state: true })

      if (anotherBatch) {
        throw { type: 400, message: 'Ya hay un lote activo en este galpón' }
      }
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
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating batch' })
    }
  }
}

const chickenSale = async (req: any, res: any): Promise<void> => {
  const { chickenBatch, clientId, saleDate } = req.body

  const session = await Mongoose.startSession()
  session.startTransaction()

  try {
    const client = await req.CollectionClient.findById(clientId)

    if (!client) {
      throw { type: 400, message: 'Client not found' }
    }

    const totalChickenAmount = chickenBatch.reduce((acc: number, batch: any) => acc + batch.amount, 0)
    const totalChickenPound = chickenBatch.reduce((acc: number, batch: any) => acc + batch.pound, 0)
    const totalSale = totalChickenPound * client.salePrice

    const chickenSale = new req.CollectionChickenSale({ client: clientId, date: saleDate, chickenAmount: totalChickenAmount, weight: totalChickenPound, total: totalSale, averageWeight: totalChickenPound / totalChickenAmount, paid: false });

    await chickenSale.save({ session });
    for (const batchSale of chickenBatch) {
      const batch = await req.CollectionBatch.findOne({ shed: batchSale.shed, state: true })
      const newAction = {
        batchId: batch._id,
        action: BatchInfoTypeEnum.SALE,
        amount: totalChickenAmount,
        price: client.salePrice,
        chikenSale: chickenSale._id,

      }
      const newDoc = new req.CollectionBatchInfo(newAction);
      await newDoc.save({ session });
    }


    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket-${chickenSale._id}.pdf`);

    const doc = new PDFDocument({ size: [250, 400], margin: 12 }); // small receipt size
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Granja Aldana", { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(17).text(`Ticket: ${chickenSale._id}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(17).text(`Fecha: ${saleDate}`);
    doc.fontSize(17).text(`Cliente: ${client.name}`);

    doc.moveDown(1.5);
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke();

    // Items
    doc.moveDown(0.5);

    doc.fontSize(17).text(`Cantidad de pollos`, { continued: true }).text(`${totalChickenAmount}`, { align: 'right' });
    doc.fontSize(17).text(`Cantidad de libras`, { continued: true }).text(`${totalChickenPound}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke();

    // Total
    doc.moveDown(0.5);
    doc.fontSize(19).text('TOTAL', { continued: true }).text(` Q${totalSale.toFixed(2)}`, { align: 'right' });

    // Footer
    doc.moveDown(1);
    doc.fontSize(17).text('Gracias por la compra!', { align: 'center' });


    await session.commitTransaction()
    doc.end();
  } catch (error: any) {
    await session.abortTransaction()
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating batch' })
    }
  } finally {
    await session.endSession()
  }
}

const getClients = async (req: any, res: any): Promise<void> => {
  try {
    const clients = await req.CollectionClient.find()

    res.send(clients)
  } catch (error) {
    res.status(400).json({ message: 'Error getting clients' })
  }
}

const chickenSales = async (req: any, res: any): Promise<void> => {
  try {
    const sales = await req.CollectionChickenSale.find().populate('client').limit(50).sort({ date: -1 })
    res.send(sales)
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting sales' })
    }
  }
}

const getChickenBill = async (req: any, res: any): Promise<void> => {
  const { billId } = req.params
  try {
    const chickenSale = await req.CollectionChickenSale.findById(billId).populate('client')

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket-${chickenSale._id}.pdf`);

    const doc = new PDFDocument({ size: [250, 400], margin: 12 }); // small receipt size
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Granja Aldana", { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(17).text(`Ticket: ${chickenSale._id}`, { align: 'center' });
    doc.moveDown(1);
    const newDate = new Date(chickenSale.date);
    doc.fontSize(17).text(`Fecha: ${newDate.toISOString().split('T')[0]}`);
    doc.fontSize(17).text(`Cliente: ${chickenSale.client?.name}`);

    doc.moveDown(1.5);
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke();

    // Items
    doc.moveDown(0.5);

    doc.fontSize(17).text(`Cantidad de pollos`, { continued: true }).text(`${chickenSale.chickenAmount}`, { align: 'right' });
    doc.fontSize(17).text(`Cantidad de libras`, { continued: true }).text(`${chickenSale.weight}`, { align: 'right' });

    doc.moveDown(0.5);
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke();

    // Total
    doc.moveDown(0.5);
    doc.fontSize(19).text('TOTAL', { continued: true }).text(` Q${chickenSale.total.toFixed(2)}`, { align: 'right' });

    // Footer
    doc.moveDown(1);
    doc.fontSize(17).text('Gracias por la compra!', { align: 'center' });

    doc.end();
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting bill' })
    }
  }
}

const updateChickenBillState = async (req: any, res: any): Promise<void> => {
  const { billId } = req.params
  try {
    const chickenSale = await req.CollectionChickenSale.findById(billId)

    if (!chickenSale) {
      throw { type: 400, message: 'Bill not found' }
    }

    await req.CollectionChickenSale.findByIdAndUpdate(billId, { $set: { paid: true } })

    res.send({ message: 'OK' })
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating bill' })
    }
  }
}

const getBatchInfo = async (req: any, res: any): Promise<void> => {
  const { batchId } = req.params
  try {
    const batchInfo = await req.CollectionBatchInfo.find({ batchId }).populate('chikenSale')
    res.send(batchInfo)
  } catch (error) {
    res.status(400).json({ message: 'Error getting batch info' })
  }
}

const getUsers = async (req: any, res: any): Promise<void> => {
  try {
    const users = await req.CollectionUser.find({ company: req.company }, '-pwd')
    res.send(users)
  } catch (error) {
    res.status(400).json({ message: 'Error getting users' })
  }
}

const eggSale = async (req: any, res: any): Promise<void> => {
  const { data, saleDate } = req.body

  try {
    const prices = await req.CollectionEggPrice.find()

    const size: number[] = []
    const type: string[] = []
    const amount: number[] = []
    const price: number[] = []
    const totals: number[] = []
    let total = 0;

    for (const item of data) {
      const priceItem = prices.find(pr => pr.type.toLowerCase() === item.size.toLowerCase())

      size.push(item.size)
      type.push(item.type.toLowerCase())
      price.push(priceItem.price)
      amount.push(item.amount)

      if (item.type.toLowerCase() === 'caja') {
        total += priceItem.price * item.amount
        totals.push(priceItem.price * item.amount)
      } else {
        total += priceItem.price / 12 * item.amount
        totals.push(priceItem.price / 12 * item.amount)
      }
    }

    const eggSale = new req.CollectionEggSale({ size, type, amount, price, total, date: saleDate });

    await eggSale.save();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket-${eggSale._id}.pdf`);

    const doc = new PDFDocument({ size: [250, 400], margin: 12 }); // small receipt size
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Granja Aldana", { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(17).text(`Ticket: ${eggSale._id}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(17).text(`Fecha: ${saleDate}`);

    doc.moveDown(0.1);
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke();


    // Table settings
    const tableTop = 140;
    const itemHeight = 20;

    // Draw headers
    doc.rect(5, tableTop, 45, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Tam', 15, tableTop + 5);

    doc.rect(50, tableTop, 30, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Tipo', 53, tableTop + 5);

    doc.rect(80, tableTop, 30, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Cant', 82, tableTop + 5);

    doc.rect(110, tableTop, 50, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Precio', 118, tableTop + 5);


    doc.rect(160, tableTop, 85, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Total', 195, tableTop + 5);

    // Example rows
    const rows: any = [];

    for (const item of data) {
      const priceItem = prices.find(pr => pr.type.toLowerCase() === item.size.toLowerCase())
      let size = item.size

      if (size.toLowerCase() === 'pequeño') {
        size = 'Peq'
      }
      else if (size.toLowerCase() === 'mediano') {
        size = 'Med'
      }
      else if (size.toLowerCase() === 'grande') {
        size = 'Grd'
      }
      else if (size.toLowerCase() === 'jumbo') {
        size = 'Jmb'
      }
      if (item.type.toLowerCase() === 'caja') {
        rows.push([size, 'Cja', `${item.amount}`, `${priceItem.price}`, `${item.amount * priceItem.price}`])
      } else {
        rows.push([size, 'Crt', `${item.amount}`, `${(priceItem.price / 12).toFixed(2)}`, `${((item.amount * priceItem.price) / 12).toFixed(2)}`])
      }
    }

    rows.push([``, '', '', ``, ``])
    rows.push([``, '', '', `Total`, `${total.toFixed(2)}`])

    // Draw rows
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        let x = 0;
        const y = tableTop + (rowIndex + 1) * itemHeight;
        let width = 0;
        if (colIndex === 0) {
          x = 5;
          width = 45;
        } else if (colIndex === 1) {
          x = 50;
          width = 30;
        } else if (colIndex === 2) {
          x = 80;
          width = 30;
        } else if (colIndex === 3) {
          x = 110;
          width = 50;
        } else if (colIndex === 4) {
          x = 160;
          width = 85;
        }
        doc
          .rect(x, y, width, itemHeight)
          .stroke()
          .fontSize(14)
          .text(cell, x + 5, y + 5);
      });
    });

    doc.end();
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating batch' })
    }
  }
}

const eggSales = async (req: any, res: any): Promise<void> => {
  try {
    const sales = await req.CollectionEggSale.find().limit(100).sort({ date: -1 })
    res.send(sales)
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting sales' })
    }
  }
}

const eggPrice = async (req: any, res: any): Promise<void> => {
  try {
    const sales = await req.CollectionEggPrice.find()
    res.send(sales)
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting sales' })
    }
  }
}


const updateEggPrice = async (req: any, res: any): Promise<void> => {
  try {
    const { id, price } = req.body
    const sales = await req.CollectionEggPrice.findByIdAndUpdate(id, { $set: { price: price } }, { new: true })
    res.send(sales)
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting sales' })
    }
  }
}

const updateEggBillState = async (req: any, res: any): Promise<void> => {
  const { billId } = req.params
  try {
    const eggSale = await req.CollectionEggSale.findById(billId)

    if (!eggSale) {
      throw { type: 400, message: 'Bill not found' }
    }

    await req.CollectionEggSale.findByIdAndUpdate(billId, { $set: { paid: true } })

    res.send({ message: 'OK' })
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error updating bill' })
    }
  }
}

const getEggBill = async (req: any, res: any): Promise<void> => {
  const { billId } = req.params
  try {
    const eggSale = await req.CollectionEggSale.findById(billId)

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=ticket-${eggSale._id}.pdf`);

    const doc = new PDFDocument({ size: [250, 450], margin: 12 }); // small receipt size
    doc.pipe(res);

    // Header
    doc.fontSize(20).text("Granja Aldana", { align: 'center' });
    doc.moveDown(0.5);

    doc.fontSize(17).text(`Ticket: ${eggSale._id}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(17).text(`Fecha: ${eggSale.date.toISOString().split('T')[0]}`);

    doc.moveDown(0.1);
    doc.moveTo(12, doc.y).lineTo(238, doc.y).stroke();


    // Table settings
    const tableTop = 140;
    const itemHeight = 20;

    // Draw headers
    doc.rect(5, tableTop, 45, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Tam', 15, tableTop + 5);

    doc.rect(50, tableTop, 30, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Tipo', 53, tableTop + 5);

    doc.rect(80, tableTop, 30, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Cant', 82, tableTop + 5);

    doc.rect(110, tableTop, 50, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Precio', 118, tableTop + 5);

    doc.rect(160, tableTop, 85, itemHeight)
      .stroke()
      .font('Helvetica-Bold')   // <- set font to bold
      .fontSize(12)
      .text('Total', 195, tableTop + 5);

    // Example rows
    const rows: any = [];

    for (let i = 0; i < eggSale.size.length; i++) {
      let total = 0;
      let price = 0;
      if (eggSale.type[i].toLowerCase() !== 'caja') {
        price = eggSale.price[i] / 12;
        total = (eggSale.amount[i] * eggSale.price[i]) / 12;
      } else {
        price = eggSale.price[i];
        total = eggSale.amount[i] * eggSale.price[i];
      }
      let size = eggSale.size[i]

      if (size.toLowerCase() === 'pequeño') {
        size = 'Peq'
      }
      else if (size.toLowerCase() === 'mediano') {
        size = 'Med'
      }
      else if (size.toLowerCase() === 'grande') {
        size = 'Grd'
      }
      else if (size.toLowerCase() === 'jumbo') {
        size = 'Jmb'
      }

      let type = eggSale.type[i]
      if (type.toLowerCase() === 'caja') {
        type = 'Cja'
      }
      else if (type.toLowerCase() === 'carton') {
        type = 'Crt'
      }

      rows.push([size, type, `${eggSale.amount[i]}`, `${(price).toFixed(2)}`, `${(total).toFixed(2)}`])
    }

    rows.push([``, '', '', ``, ``])
    rows.push([``, '', '', `Total`, `${eggSale.total.toFixed(2)}`])

    // Draw rows
    rows.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        let x = 0;
        const y = tableTop + (rowIndex + 1) * itemHeight;
        let width = 0;
        if (colIndex === 0) {
          x = 5;
          width = 45;
        } else if (colIndex === 1) {
          x = 50;
          width = 30;
        } else if (colIndex === 2) {
          x = 80;
          width = 30;
        } else if (colIndex === 3) {
          x = 110;
          width = 50;
        } else if (colIndex === 4) {
          x = 160;
          width = 85;
        }
        doc
          .rect(x, y, width, itemHeight)
          .stroke()
          .fontSize(14)
          .text(cell, x + 5, y + 5);
      });
    });


    doc.end();
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting bill' })
    }
  }
}

const eggSalesBetween = async (req: any, res: any): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      throw { type: 400, message: 'Start date and end date are required' }
    }
    const sales = await req.CollectionEggSale.find({
      date: { $gte: new Date(startDate), $lte: new Date(endDate) }
    })
    res.send(sales)
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting sales' })
    }
  }
}

const updateClientPrice = async (req: any, res: any): Promise<void> => {
  try {
    const { id, price } = req.body
    const sales = await req.CollectionClient.findByIdAndUpdate(id, { $set: { salePrice: price } }, { new: true })
    res.send(sales)
  } catch (error: any) {
    if (error.type === 400) {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: 'Error getting sales' })
    }
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
  updateClientPrice
}
