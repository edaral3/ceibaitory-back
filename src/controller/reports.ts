// @ts-nocheck
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const getSalesByDay = async (CollectionSale: any, date: string) => {
  const sales = await CollectionSale.find({ canceled: false })
  const salesAux = []
  for (const item of sales) {
    const saleDate = new Date(item.date)
      .toLocaleString('es-GT', {
        timeZone: 'America/Guatemala'
      })
      .split(',')[0]
    if (saleDate === date) {
      salesAux.push(item)
    }
  }
  return salesAux
}

const getSalesPerDay = async (
  CollectionSale: any,
  date: string
): Promise<any> => {
  const sales = await getSalesByDay(CollectionSale, date)
  let total = 0
  for (const item of sales) {
    total += item.total
  }

  return Math.round(total * 100) / 100
}

const getAmountSales = async (
  CollectionSale: any,
  date: string
): Promise<any> => {
  const sales = await getSalesByDay(CollectionSale, date)
  return sales.length
}

const getUtilityPerDay = async (
  CollectionSale: any,
  date: string
): Promise<any> => {
  const sales = await getSalesByDay(CollectionSale, date)
  let total = 0
  for (const sale of sales) {
    for (const item of sale.products) {
      total += item.amount * item.salesPrice - item.amount * item.priceCost
    }
  }
  return Math.round(total * 100) / 100
}

const getInventoryExcel = async (req: any, res: any): Promise<void> => {
  try {
    const products = await req.CollectionProduct.find().sort({ fecha: -1 })
    let csvResponse = '#,Nombre,Cantidad,Precio Costo\n'

    products.forEach((item, index) => {
      csvResponse += `${index},${item.name.replaceAll(',', '')},${item.existence
        .toString()
        .replace(',', '')},${item.priceCost.toString().replace(',', '')}\n`
    })

    res.send({ csv: csvResponse })
  } catch (error) {
    res.status(500).json({ message: 'Error creando el reporte' })
  }
}

const getABC = (list: any): any => {
  const listSorted = list.sort((a, b) => {
    const worthA = a.salesPrice
    const worthB = b.priceCost

    if (worthA < worthB) {
      return 1
    }
    if (worthA > worthB) {
      return -1
    }
    return 0
  })

  const A: any[] = []
  const B: any[] = []
  const C: any[] = []

  let index = 0
  listSorted.forEach((item) => {
    const percent = (index / listSorted.length) * 100
    if (percent < 20) {
      A.push(item.name)
    } else if (percent < 50) {
      B.push(item.name)
    } else {
      C.push(item.name)
    }
    index++
  })

  return { A, B, C }
}

const filterByCategory = (itemsCategory, items): any => {
  let newArray = items.filter((item) => {
    return itemsCategory.includes(item.name)
  })

  newArray = newArray.sort((a, b) => {
    return b.amount - a.amount
  })

  newArray = newArray.slice(0, 9)

  const labels = newArray.map((item) => item.name)
  const listSeries = newArray.map((item) => item.amount)
  return { labels, datasets: { label: 'Productos', data: listSeries } }
}

const getTop10ABC = async (req: any, res: any): Promise<void> => {
  const sales = await getListSaleMonth(req.CollectionSale, req.query.date)
  try {
    const list: any[] = []
    let list2: any[] = []
    for (const item of sales) {
      list.push(...item.products)
    }

    for (const item of list) {
      if (list2.find((item2) => item.name === item2.name)) {
        list2 = list2.map((item2) => {
          if (item.name === item2.name) {
            item2.amount += item.amount
            return item2
          }
          return item2
        })
      } else {
        list2.push({
          id: item._id,
          name: item.name,
          amount: item.amount
        })
      }
    }

    const dataList = getABC(await getProducts(req.CollectionProduct))

    const dataA = filterByCategory(dataList.A, [...list2])
    const dataB = filterByCategory(dataList.B, [...list2])
    const dataC = filterByCategory(dataList.C, [...list2])

    return res.send({ grapA: dataA, grapB: dataB, grapC: dataC })
  } catch (error) {
    return res.status(500).json({ message: 'Error creando el reporte' })
  }
}

const getDayReports = async (req: any, res: any): Promise<any> => {
  const date = new Date(req.query.date)
    .toLocaleString('es-GT', {
      timeZone: 'America/Guatemala'
    })
    .split(',')[0]
  const CollectionSale = req.CollectionSale
  try {
    const data = {
      dailySales: await getSalesPerDay(CollectionSale, date),
      utilityByDay: await getUtilityPerDay(CollectionSale, date),
      salesAmount: await getAmountSales(CollectionSale, date)
    }
    return res.send(data)
  } catch (error) {
    return res.status(500).json({ message: 'Error creando el reporte' })
  }
}

const buildHeader = (companyName: string, typeReport: string): any => {
  return {
    body: [
      [
        {
          content: companyName,
          styles: {
            halign: 'left',
            fontSize: 20,
            textColor: '#ffffff'
          }
        },
        {
          content: typeReport,
          styles: {
            halign: 'right',
            fontSize: 20,
            textColor: '#ffffff'
          }
        }
      ]
    ],
    theme: 'plain',
    styles: {
      fillColor: '#3366ff'
    }
  }
}

const buildDate = (startDate: string, endDate: string): any => {
  return {
    body: [
      [
        {
          content: 'Inicio: ' + startDate + '\nFin: ' + endDate,
          styles: {
            halign: 'right'
          }
        }
      ]
    ],
    theme: 'plain'
  }
}

const isBtweenDates = (start: string, end: string, between: string) => {
  const startSplit = start.split('/')
  const endSplit = end.split('/')
  const betweenSplit = between.split('/')
  if (
    Number(betweenSplit[2]) >= Number(startSplit[2]) &&
    Number(betweenSplit[2]) <= Number(endSplit[2])
  ) {
    if (
      Number(betweenSplit[0]) >= Number(startSplit[0]) &&
      Number(betweenSplit[0]) <= Number(endSplit[0])
    ) {
      if (
        Number(betweenSplit[1]) >= Number(startSplit[1]) &&
        Number(betweenSplit[1]) <= Number(endSplit[1])
      ) {
        return true
      }
    }
  }
}

const getListSaleRange = async (
  CollectionSale: any,
  startDate: string,
  endDate: string
): Promise<any> => {
  const sales = await CollectionSale.find({ canceled: false })
  const salesAux = []
  for (const item of sales) {
    const saleDate = new Date(item.date)
      .toLocaleString('es-GT', {
        timeZone: 'America/Guatemala'
      })
      .split(',')[0]
    if (isBtweenDates(startDate, endDate, saleDate)) {
      salesAux.push(item)
    }
  }

  return salesAux
}

const getListSaleMonth = async (
  CollectionSale: any,
  date: string
): Promise<any> => {
  const dateAux = new Date(date).toISOString().slice(0, 7)
  const sales = await CollectionSale.find({ canceled: false })
  const salesAux = []
  for (const item of sales) {
    const saleDate = new Date(item.date).toISOString().slice(0, 7)
    if (dateAux === saleDate) {
      salesAux.push(item)
    }
  }

  return salesAux
}

const getProducts = async (CollectionProduct): Promise<any> => {
  return await CollectionProduct.find().sort({ expirationDate: -1 })
}

const tableTemplateHead = [
  'Producto',
  'Cantidad',
  'Precio',
  'Utilidades',
  'Total'
]

const getColorTble = (type: string): any => {
  let color = '#7DCEA0'
  switch (type) {
    case 'NF':
      color = '#F4D03F'
      break
    case 'CF':
      color = '#85C1E9'
      break
  }

  return {
    theme: 'striped',
    headStyles: {
      fillColor: color
    }
  }
}

const buildCompleteBody = (doc: any, sales: any): any => {
  let total = 0
  let totalUtilities = 0
  for (const sale of sales) {
    const body: any[] = []
    let utilLocal = 0
    for (const item of sale.products) {
      const utility = (item.salesPrice - item.priceCost) * item.amount
      totalUtilities += Math.round(utility * 100) / 100
      utilLocal += Math.round(utility * 100) / 100
      body.push([
        item.name,
        item.amount,
        `Q${item.salesPrice}`,
        `Q${Math.round(utility * 100) / 100}`,
        `Q${item.salesPrice * item.amount}`
      ])
    }

    body.push(['', '', 'Total', `Q${utilLocal}`, `Q${sale.total}`])
    total += sale.total
    doc.autoTable({
      body,
      head: [[sale.name, sale.nit, '', '', '', ''], tableTemplateHead],
      ...getColorTble(sale.nit)
    })
  }

  return { total, totalUtilities }
}

const buildSimpleBody = (doc, sales): any => {
  let total = 0
  let totalUtilities = 0
  const products: any[] = []
  for (const sale of sales) {
    for (const item of sale.products) {
      const util = (item.salesPrice - item.priceCost) * item.amount
      totalUtilities += Math.round(util * 100) / 100
      const index = products.findIndex((product) => product.name === item.name)
      if (index !== -1) {
        products[index].amount += item.amount
        products[index].total += item.amount * item.salesPrice
        products[index].utilities += util
        products[index].salesPrices.add(item.salesPrice)
      } else {
        const salesPrices = new Set()
        salesPrices.add(item.salesPrice)
        products.push({
          name: item.name,
          amount: item.amount,
          utilities: util,
          salesPrices,
          total: item.amount * item.salesPrice
        })
      }
    }
    total += sale.total
  }

  const body: any[] = []
  for (const item of products) {
    let salesPrices = ''
    for (const price of item.salesPrices) {
      salesPrices += price + ' '
    }
    body.push([
      item.name,
      item.amount,
      `Q[ ${salesPrices}]`,
      `Q${Math.round(item.utilities * 100) / 100}`,
      `Q${Math.round(item.total * 100) / 100}`
    ])
  }
  doc.autoTable({
    body,
    head: [tableTemplateHead],
    ...getColorTble('CF')
  })
  return { total, totalUtilities }
}

const createProductsOutOfStockReport = async (
  CollectionProduct: any,
  companyName: string
): Promise<any> => {
  const doc = new jsPDF()
  doc.autoTable(buildHeader(companyName, 'Reporte de productor por agotar'))
  const data = await getProducts(CollectionProduct)
  const body: any[] = []
  data.forEach((item, index) => {
    if (item.existence - item.minExistence <= 0) {
      body.push([
        index + 1,
        item.name,
        item.existence,
        item.minExistence,
        `Q${item.salesPrice}`,
        `Q${item.priceCost}`
      ])
    }
  })
  doc.autoTable({
    body,
    head: [
      [
        '#',
        'Nombre',
        'Cantidad',
        'Cantidad minima',
        'Precio costo',
        'Precio venta'
      ]
    ],
    ...getColorTble('CF')
  })
  return doc.output('datauristring')
}

const createExpiringProducts = async (
  CollectionProduct: any,
  companyName: string
): Promise<any> => {
  const doc = new jsPDF()
  doc.autoTable(buildHeader(companyName, 'Reporte de productor por vencer'))
  const data = await getProducts(CollectionProduct)
  const body: any[] = []
  data.forEach((item: any, index: number) => {
    if (item.expirationDate) {
      const expirationDate = new Date(item.expirationDate)
      const now = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'America/Guatemala' })
      )
      const difference = Math.abs(expirationDate - now)
      const days = difference / (1000 * 3600 * 24)
      if (days < 60) {
        body.push([
          index + 1,
          item.name,
          item.existence,
          item.expirationDate,
          `Q${item.salesPrice}`,
          `Q${item.priceCost}`
        ])
      }
    }
  })
  doc.autoTable({
    body,
    head: [['#', 'Nombre', 'Cantidad', 'Fecha vencimiento', 'Precio costo']],
    ...getColorTble('CF')
  })
  return doc.output('datauristring')
}

const getMoneyFormat = (number: any): string => {
  return number.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const getTotals = (totals: any): any => {
  return {
    body: [
      [
        {
          content: 'Total:',
          styles: {
            halign: 'right'
          }
        },
        {
          content: `Q${getMoneyFormat(Math.round(totals.total * 100) / 100)}`,
          styles: {
            halign: 'right'
          }
        }
      ],
      [
        {
          content: 'Total Utilidades:',
          styles: {
            halign: 'right'
          }
        },
        {
          content: `Q${getMoneyFormat(
            Math.round(totals.totalUtilities * 100) / 100
          )}`,
          styles: {
            halign: 'right'
          }
        }
      ]
    ],
    theme: 'plain'
  }
}

const createSalesReport = async (
  CollectionSale: any,
  companyName: string,
  startDate: any,
  endDate: any,
  typeReport: string
): Promise<any> => {
  const doc = new jsPDF()
  doc.autoTable(buildHeader(companyName, 'Reporte de ventas'))
  doc.autoTable(buildDate(startDate, endDate))
  const sales = await getListSaleRange(CollectionSale, startDate, endDate)
  let totals: any
  if (typeReport === 'simple') {
    totals = buildSimpleBody(doc, sales)
  } else if (typeReport === 'detail') {
    totals = buildCompleteBody(doc, sales)
  }

  doc.autoTable(getTotals(totals))

  return doc.output('datauristring')
}

const formatDate = (date: string) => {
  const dateSplit = date.split('-')
  return `${dateSplit[2]}/${dateSplit[1]}/${dateSplit[0]}`
}

const getSalesReport = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, typeReport } = req.query
  try {
    const pdf = await createSalesReport(
      req.CollectionSale,
      req.companyName,
      formatDate(startDate),
      formatDate(endDate),
      typeReport
    )
    res.send({ pdf })
  } catch (error) {
    return res.status(500).json({ message: 'Error creando el reporte' })
  }
}

const getProductsOutOfStockReport = async (
  req: any,
  res: any
): Promise<void> => {
  const pdf = await createProductsOutOfStockReport(
    req.CollectionProduct,
    req.companyName
  )
  res.send({ pdf })
}

const getExpiringProducts = async (req: any, res: any): Promise<void> => {
  const pdf = await createExpiringProducts(
    req.CollectionProduct,
    req.companyName
  )
  res.send({ pdf })
}

const compareMonth = (date1: string, date2: string) => {
  const date1Split = date1.split('/')
  const date2Split = date2.split('/')
  return date1Split[1] === date2Split[1] && date1Split[2] === date2Split[2]
}

const salesByMonth = async (CollectionSale: any, date: string) => {
  const sales = await CollectionSale.find({ canceled: false }).sort({
    date: 1
  })
  const dates = []
  for (const item of sales) {
    const saleDate = new Date(item.date)
      .toLocaleString('es-GT', {
        timeZone: 'America/Guatemala'
      })
      .split(',')[0]
    if (compareMonth(date, saleDate)) {
      if (!dates.includes(saleDate)) {
        dates.push(saleDate)
      }
    }
  }
  return dates
}

const salesByDay = async (CollectionSale: any, dates: any) => {
  const labels = []
  const data1 = []
  const data2 = []
  for (const date of dates) {
    labels.push(date.split('/')[0])
    data1.push(await getUtilityPerDay(CollectionSale, date))
    data2.push(await getSalesPerDay(CollectionSale, date))
  }
  return { labels, data1, data2 }
}

const montlyReports = async (req: any, res: any): Promise<void> => {
  try {
    const date = new Date(req.query.date)
      .toLocaleString('es-GT', {
        timeZone: 'America/Guatemala'
      })
      .split(',')[0]
    const dates = await salesByMonth(req.CollectionSale, date)
    const { labels, data1, data2 } = await salesByDay(
      req.CollectionSale,
      dates
    )
    return res.send({ labels, data1, data2 })
  } catch (error) {
    return res.status(500).json({ message: 'Error creando el reporte' })
  }
}

const productsOutOfStockOfExpired = async (
  req: any,
  res: any
): Promise<void> => {
  try {
    // let products = await req.CollectionProduct.find({branch: req.branch});
    const products = await req.CollectionProduct.find()

    const productsOutOfStock = products.filter(
      (item: any) => item.existence - item.minExistence <= 0
    )

    const now = new Date()
    now.setHours(now.getHours() - 6)
    now.setMonth(now.getMonth + 1)

    const productsExpired = products.filter(
      (item: any) => item.expirationDate > now
    )
    return res.send({
      productsOutOfStock: productsOutOfStock.length,
      productsExpired: productsExpired.length
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error creando el reporte' })
  }
}
export default {
  getDayReports,
  getInventoryExcel,
  getSalesReport,
  getProductsOutOfStockReport,
  getExpiringProducts,
  getTop10ABC,
  montlyReports,
  productsOutOfStockOfExpired
}
