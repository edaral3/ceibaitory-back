import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

const getSalesPerDay = async (CollectionSale: any, date): Promise<any> => {
  const data = await CollectionSale.aggregate([
    {
      $match: {
        $and: [
          { anulado: { $ne: true } },
          {
            $expr: {
              $eq: [
                date,
                { $dateToString: { date: '$date', format: '%d/%m/%Y' } }
              ]
            }
          }
        ]
      }
    },
    { $group: { _id: null, total: { $sum: '$total' } } }
  ])

  if (data.length === 0) {
    return 0
  }

  return data[0].total
}

const getAmountSales = async (CollectionSale: any, date): Promise<any> => {
  const data = await CollectionSale.aggregate([
    {
      $match: {
        $and: [
          { anulado: { $ne: true } },
          {
            $expr: {
              $eq: [
                date,
                { $dateToString: { date: '$fecha', format: '%d/%m/%Y' } }
              ]
            }
          }
        ]
      }
    },
    { $group: { _id: null, total: { $sum: 1 } } }
  ])

  if (data.length === 0) {
    return 0
  }
  return data[0].total
}

const getUtility = (data: any): number => {
  let total = 0
  for (let i = 0; i < data.cantidad.length; i++) {
    const cantidad = data.cantidad[i]
    const precioCosto = data.precioCosto[i]
    const precioVenta = data.precioVenta[i]
    for (let j = 0; j < cantidad.length; j++) {
      total += (precioVenta[j] - precioCosto[j]) * cantidad[j]
    }
  }
  return Math.round(total * 100) / 100
}

const getUtilityPerDay = async (CollectionSale: any, date): Promise<any> => {
  const data = await CollectionSale.aggregate([
    {
      $match: {
        $and: [
          { anulado: { $ne: true } },
          {
            $expr: {
              $eq: [
                date,
                { $dateToString: { date: '$fecha', format: '%d/%m/%Y' } }
              ]
            }
          }
        ]
      }
    },
    {
      $group: {
        _id: null,
        precioCosto: { $push: '$productos.precioCosto' },
        precioVenta: { $push: '$productos.precioVenta' },
        cantidad: { $push: '$productos.cantidad' }
      }
    }
  ])
  if (data.length === 0) {
    return 0
  }
  return getUtility(data[0])
}

const getInventoryExcel = async (req: any, res: any): Promise<void> => {
  try {
    const products = await req.CollectionProduct.find().sort({ fecha: -1 })
    let csvResponse = '#,Nombre,Cantidad,Precio Costo\n'

    products.forEach((item, index) => {
      csvResponse += `${index},${item.nombre.replaceAll(
        ',',
        ''
      )},${item.existencia.toString().replace(',', '')},${item.precioCosto
        .toString()
        .replace(',', '')}\n`
    })

    res.send({ csv: csvResponse })
  } catch (error) {
    res.status(500).json({ message: 'Error creando el reporte' })
  }
}

const getABC = (list: any): any => {
  const listSorted = list.sort((a, b) => {
    const worthA = a.precioVenta
    const worthB = b.precioVenta

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
      A.push(item.nombre)
    } else if (percent < 50) {
      B.push(item.nombre)
    } else {
      C.push(item.nombre)
    }
    index++
  })

  return { A, B, C }
}

const filterByCategory = (itemsCategory, items): any => {
  let newArray = items.filter((item) => {
    return itemsCategory.includes(item.nombre)
  })

  newArray = newArray.sort((a, b) => {
    return b.cantidad - a.cantidad
  })

  newArray = newArray.slice(0, 9)

  const labels = newArray.map((item) => item.nombre)
  const listSeries = newArray.map((item) => item.cantidad)
  return { labels, series: [listSeries] }
}

const getTop10ABC = async (req: any, res: any): Promise<void> => {
  const date = req.query.date

  try {
    const find = {
      $match: {
        $expr: {
          $eq: [date, { $dateToString: { date: '$fecha', format: '%m/%Y' } }]
        }
      }
    }
    const data = await req.CollectionProduct.aggregate([
      find,
      {
        $project: {
          productos: '$productos'
        }
      }
    ])
    const list: any[] = []
    let list2: any[] = []
    data.forEach((item) => {
      list.push(...item.productos)
    })

    list.forEach((item) => {
      if (list2.find((item2) => item.nombre === item2.nombre)) {
        list2 = list2.map((item2) => {
          if (item.nombre === item2.nombre) {
            item2.cantidad += item.cantidad
            return item2
          }
          return item2
        })
      } else {
        list2.push({
          id: item._id,
          nombre: item.nombre,
          cantidad: item.cantidad
        })
      }
    })

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
  const date = req.query.date
  const CollectionSale = req.CollectionSale
  try {
    const data = {
      ventasDiarias: await getSalesPerDay(CollectionSale, date),
      utilidadPorDia: await getUtilityPerDay(CollectionSale, date),
      cantidadVentas: await getAmountSales(CollectionSale, date)
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

const buildDate = (startDate, endDate): any => {
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

const getListSaleRange = async (
  CollectionSale,
  startDate,
  endDate
): Promise<any> => {
  const data = await CollectionSale.aggregate([
    {
      $match: {
        fecha: { $gte: startDate, $lt: endDate }
      }
    }
  ])

  return data
}

const getProducts = async (CollectionProduct): Promise<any> => {
  const products = await CollectionProduct.find().sort({ fecha: -1 })
  return products
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

const buildCompleteBody = (doc, products): any => {
  let total = 0
  let totalUtilidades = 0
  products.forEach((sale) => {
    if (sale.anulado === undefined || sale.anulado) {
      return
    }
    const body: any[] = []
    let utilLocal = 0
    sale.productos.forEach((item: any) => {
      const util = (item.precioVenta - item.precioCosto) * item.cantidad
      totalUtilidades += Math.round(util * 100) / 100
      utilLocal += Math.round(util * 100) / 100
      body.push([
        item.nombre,
        item.cantidad,
        `Q${item.precioVenta}`,
        `Q${Math.round(util * 100) / 100}`,
        `Q${item.total}`
      ])
    })

    body.push(['', '', 'Total', `Q${utilLocal}`, `Q${sale.total}`])
    total += sale.total
    doc.autoTable({
      body,
      head: [[sale.nombre, sale.nit, '', '', '', ''], tableTemplateHead],
      ...getColorTble(sale.nit)
    })
  })

  return { total, totalUtilidades }
}

const buildSimpleBody = (doc, products): any => {
  let total = 0
  let totalUtilidades = 0
  const productos: any[] = []
  products.forEach((sale) => {
    if (sale.anulado === undefined || sale.anulado) {
      return
    }
    sale.productos.forEach((item) => {
      const util = (item.precioVenta - item.precioCosto) * item.cantidad
      totalUtilidades += Math.round(util * 100) / 100
      const index = productos.findIndex(
        (producto) => producto.nombre === item.nombre
      )
      if (index !== -1) {
        productos[index].cantidad += item.cantidad
        productos[index].total += item.total
        productos[index].utilidad += util
        productos[index].precioVenta.add(item.precioVenta)
      } else {
        const preciosVenta = new Set()
        preciosVenta.add(item.precioVenta)
        productos.push({
          nombre: item.nombre,
          cantidad: item.cantidad,
          utilidad: util,
          precioVenta: preciosVenta,
          total: item.total
        })
      }
    })
    total += sale.total
  })

  const body: any[] = []
  productos.forEach((item) => {
    let preciosVenta = ''
    item.precioVenta.forEach((precio) => {
      preciosVenta += precio + ' '
    })
    body.push([
      item.nombre,
      item.cantidad,
      `Q[ ${preciosVenta}]`,
      `Q${Math.round(item.impuesto * 100) / 100}`,
      `Q${Math.round(item.utilidad * 100) / 100}`,
      `Q${Math.round(item.total * 100) / 100}`
    ])
  })
  doc.autoTable({
    body,
    head: [tableTemplateHead],
    ...getColorTble('CF')
  })
  return { total, totalUtilidades }
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
    if (item.existencia - item.existenciaMinima <= 0) {
      body.push([
        index + 1,
        item.nombre,
        item.existencia,
        item.existenciaMinima,
        `Q${item.precioVenta}`
      ])
    }
  })
  doc.autoTable({
    body,
    head: [['#', 'Nombre', 'Cantidad', 'Cantidad minima', 'Precio costo']],
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
  data.forEach((item: any, index) => {
    if (item.fechaVencimiento) {
      const difference = Math.abs(item.fechaVencimiento - new Date())
      const days = difference / (1000 * 3600 * 24)
      if (days < 60) {
        body.push([
          index + 1,
          item.nombre,
          item.existencia,
          item.fechaVencimiento,
          `Q${item.precioVenta}`
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

const getTotals = (totales: any): any => {
  return {
    body: [
      [
        {
          content: 'Subtotal:',
          styles: {
            halign: 'right'
          }
        },
        {
          content: `Q${getMoneyFormat(
            Math.round((totales.total - totales.totalImpesto) * 100) / 100
          )}`,
          styles: {
            halign: 'right'
          }
        }
      ],
      [
        {
          content: 'Total impuesto:',
          styles: {
            halign: 'right'
          }
        },
        {
          content: `Q${getMoneyFormat(
            Math.round(totales.totalImpesto * 100) / 100
          )}`,
          styles: {
            halign: 'right'
          }
        }
      ],
      [
        {
          content: 'Total:',
          styles: {
            halign: 'right'
          }
        },
        {
          content: `Q${getMoneyFormat(Math.round(totales.total * 100) / 100)}`,
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
            Math.round(totales.totalUtilidades * 100) / 100
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
  const products = getListSaleRange(CollectionSale, startDate, endDate)
  let totals: any
  if (typeReport === 'simple') {
    totals = buildSimpleBody(doc, products)
  } else if (typeReport === 'complete') {
    totals = buildCompleteBody(doc, products)
  }

  doc.autoTable(getTotals(totals))
  // await getPDFProductosPorAgotar(doc);
  // await getPDFProductosPorVencer(doc);

  return doc.output('datauristring')
}

const getSalesReport = async (req: any, res: any): Promise<void> => {
  const { startDate, endDate, typeReport } = req.body
  try {
    const pdf = await createSalesReport(
      req.CollectionSale,
      req.companyName,
      startDate,
      endDate,
      typeReport
    )
    res.send({ pdf })
  } catch (error) {}
}

const getProductsOutOfStockReport = async (
  req: any,
  res: any
): Promise<void> => {
  const pdf = await createProductsOutOfStockReport(
    req.CollectionSale,
    req.companyName
  )
  res.send({ pdf })
}

const getExpiringProducts = async (req: any, res: any): Promise<void> => {
  const pdf = await createExpiringProducts(req.CollectionSale, req.companyName)
  res.send({ pdf })
}

export default {
  getDayReports,
  getInventoryExcel,
  getSalesReport,
  getProductsOutOfStockReport,
  getExpiringProducts,
  getTop10ABC
}
