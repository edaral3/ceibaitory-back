const { v4: uuidv4 } = require( 'uuid')

const {
  item,
  clientData,
  cancel,
  cancelSign,
  registerBill,
  signBill
} = require( './templates')

interface product {
  total: number
  name: string
  salesPrice: number
  amount: number
}

const buildProductList = (products: product[]): any => {
  const itemTemplate = item
  let items = ''
  let taxSum = 0
  let index = 0
  for (const product of products) {
    const totalTaxes =
      Math.round(((product.salesPrice * product.amount) / 1.12) * 100) / 100
    const tax =
      Math.round((product.salesPrice * product.amount - totalTaxes) * 100) /
      100
    index++
    taxSum += tax
    items += itemTemplate
      .replace('$INDEX', index.toString())
      .replace('$CANTIDAD', product.amount.toString())
      .replace('$DESCRIPCION', product.name)
      .replace('$PUNIT', product.salesPrice.toString())
      .replaceAll('$PTOTAL', (Math.round((product.salesPrice * product.amount) * 100) / 100).toString())
      .replace('$MONTOSINIMPUESTO', totalTaxes.toString())
      .replace('%IMPUESTO', tax.toString())
  }

  return { items, taxSum }
}

const buildXmlBill = (body: any): string => {
  const isoDate = body.date.split('.')
  const data = buildProductList(body.products)
  return signBill
    .replace('$UUID', uuidv4().toUpperCase())
    .replace('$FECHA', isoDate[0] + '.000-06:00')
    .replace('$NIT', body.clientNit)
    .replace('$NOMBRE', body.clientName)
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
    bodyRequest: registerBill
      .replace('&FACTURA', signedDocument)
      .replace('$UUID', uuidEmision)
  }
}

const buildRequestCancellBill = (signedDocument: string): any => {
  const uuidEmision = uuidv4().toUpperCase()
  return {
    uuidEmision,
    bodyRequest: cancel
      .replace('$UUID', uuidEmision)
      .replace('$DATA', signedDocument)
  }
}

const buildCancelBill = (body: any): string => {
  const cancelDate = new Date()
  cancelDate.setHours(cancelDate.getHours() - 6)
  const isoCancelDate = cancelDate.toISOString().split('.')
  const isoCreateDate = body.createDate.toISOString().split('.')
  return cancelSign
    .replace('$UUIDFA', uuidv4().toUpperCase())
    .replace('$UUIDDOCUMENTO', body.uuid)
    .replace('$NITRECEPTOR', body.nit)
    .replace('$FECHADOCUMENTO', isoCreateDate[0] + '.000-06:00')
    .replace('$FECHAANULACION', isoCancelDate[0] + '.000-06:00')
    .replace('$MOTIVO', 'cancelar')
}

const buildClientRequest = (nit: string): string => {
  return clientData.replace('$NIT', nit)
}

export { buildXmlBill, buildRequestBill, buildRequestCancellBill, buildClientRequest, buildCancelBill }
