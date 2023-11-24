import fs from 'fs'
import { uuidv4 } from 'uuid'

interface product {
  total: number
  name: string
  salesPrice: number
  amount: number
}

interface body {
  products: product[]
  date: Date
  name: string
  nit: string
  direction: string
  total: number
}

const buildProductList = (products: product[]): any => {
  const itemTemplate = fs.readFileSync('./itemTemplate.xml', 'utf-8')
  let items = ''
  let taxSum = 0
  let index = 0
  for (const product of products) {
    const totalTaxes = Math.round((product.total / 1.12) * 100) / 100
    const tax = Math.round((product.total - totalTaxes) * 100) / 100
    index++
    taxSum += tax
    items += itemTemplate
      .replace('$INDEX', index.toString())
      .replace('$CANTIDAD', product.amount.toString())
      .replace('$DESCRIPCION', product.name)
      .replace('$PUNIT', product.salesPrice.toString())
      .replaceAll('$PTOTAL', (Math.round(product.total * 100) / 100).toString())
      .replace('$MONTOSINIMPUESTO', totalTaxes.toString())
      .replace('%IMPUESTO', tax.toString())
  }

  return { items, taxSum }
}

const buildXmlBill = (body: body): string => {
  const data = buildProductList(body.products)
  return fs
    .readFileSync('./templateFirmaFactura.xml', 'utf-8')
    .replace('$UUID', uuidv4().toUpperCase())
    .replace('$FECHA', body.date.toISOString())
    .replace('$NIT', body.nit)
    .replace('$NOMBRE', body.name)
    .replace('$CORREO', '')
    .replace('$DIRECCIONR', body.direction)
    .replace('$CODIGOPOSTALR', '0')
    .replace('$ITEMS', data.items)
    .replace('$TOTALI', (Math.round(data.taxSum * 100) / 100).toString())
    .replace('$TOTALV', (Math.round(body.total * 100) / 100).toString())
}

const buildRequestBill = (signedDocument: string): any => {
  const uuidEmision = uuidv4().toUpperCase()
  return {
    uuidEmision,
    bodyRequest: fs
      .readFileSync('utilities/templateRegistrarFactur.xml', 'utf-8')
      .replace('&FACTURA', signedDocument)
      .replace('$UUID', uuidEmision)
  }
}

const buildCancelBill = (body: any): string => {
  return fs
    .readFileSync('utilities/templateFirmaAnulacion.xml', 'utf-8')
    .replace('$UUIDFA', uuidv4().toUpperCase())
    .replace('$UUIDDOCUMENTO', body.uuid)
    .replace('$NITRECEPTOR', body.nit)
    .replace('$FECHADOCUMENTO', body.createDate)
    .replace('$FECHAANULACION', body.cancelDate)
    .replace('$MOTIVO', body.reason)
}

const buildClientRequest = (nit: string): string => {
  return fs
    .readFileSync('utilities/tempateDatosCliente.xml', 'utf-8')
    .replace('$NIT', nit)
}

export { buildXmlBill, buildRequestBill, buildClientRequest, buildCancelBill }
