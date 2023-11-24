import axios from 'axios'

import {
  buildXmlBill,
  buildRequestBill,
  buildClientRequest,
  buildCancelBill
} from '../utils/megaprint/certifier'

const getToken = async (credentials: string) => {
  const newToken = await axios.post(
    'https://apiv2.ifacere-fel.com/api/solicitarToken',
    credentials,
    {
      headers: {
        'Content-Type': 'application/xml'
      }
    }
  )
  return `Bearer ${newToken.data.match(/<token>([^<]*)<\/token>/)[1]}`
}

const generateTokenMP = async (company: any) => {
  try {
    const token = await getToken(company.billingCompanyCredentials.credentials)
    return token
  } catch (error) {
    throw { message: 'Error generating token' }
  }
}

const validateResponse = (data: any): boolean => {
  const tipoRespuesta = data.match(
    /<tipo_respuesta>([^<]*)<\/tipo_respuesta>/
  )[1]
  return tipoRespuesta === '0'
}

const signBill = async (body: any, token: string): Promise<string> => {
  const res = await axios.post(
    'https://api.soluciones-mega.com/api/solicitaFirma',
    body,
    {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: token
      }
    }
  )

  const signedBill = res.data.match(/<xml_dte>([^<]*)<\/xml_dte>/)[1]

  if (validateResponse(res.data)) return 'invalid Token'

  return signedBill
  // return decode(signedBill);
}

const registerBillDocument = async (
  signedDocument: any,
  token: string
): Promise<any> => {
  const { bodyRequest, uuidEmision } = buildRequestBill(signedDocument)
  const res = await axios.post(
    'https://apiv2.ifacere-fel.com/api/registrarDocumentoXML',
    bodyRequest,
    {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: token
      }
    }
  )

  if (validateResponse(res.data)) return 'invalid Token'

  return {
    uuid: res.data.match(/<uuid>([^<]*)<\/uuid>/)[1],
    uuidEmision
  }
}

const generateBillMP = async (token: string, body: any) => {
  const generateXML = buildXmlBill(body)

  const signedBill = await signBill(generateXML, token)
  if (signedBill === 'invalid Token') return signedBill

  const registedBill = await registerBillDocument(signedBill, token)
  return registedBill
}

const getPDFMP = async (token: string, uuid: string) => {
  const template = `
    <?xml version="1.0" encoding="UTF-8"?>
    <RetornaPDFRequest>
    <uuid>$UUID</uuid> 
    </RetornaPDFRequest>
  `

  const res = await axios.post(
    'https://apiv2.ifacere-fel.com/api/retornarPDF',
    template.replace('$UUID', uuid),
    {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: token
      }
    }
  )
  if (validateResponse(res.data)) return 'invalid Token'

  return res.data.match(/<pdf>([^<]*)<\/pdf>/)[1]
}

const registerCancelBillDocument = async (
  signedDocument: any,
  token: string
): Promise<any> => {
  const { bodyRequest, uuidEmision } = buildRequestBill(signedDocument)
  const res = await axios.post(
    'https://apiv2.ifacere-fel.com/api/anularDocumentoXML',
    bodyRequest,
    {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: token
      }
    }
  )
  if (validateResponse(res.data)) return 'invalid Token'
  return {
    uuid: res.data.match(/<uuid>([^<]*)<\/uuid>/)[1],
    uuidEmision
  }
}

const cancelBillMP = async (token: any, body: any) => {
  const generateXML = buildCancelBill(body)
  const signedCancelBill = await signBill(generateXML, token)
  if (signedCancelBill === 'invalid Token') return signedCancelBill

  const cancelBill = await registerCancelBillDocument(signedCancelBill, token)
  return cancelBill
}

const getClientInformationMP = async (token: string, nit: string) => {
  const res = await axios.post(
    'https://apiv2.ifacere-fel.com/api/retornarDatosCliente',
    buildClientRequest(nit),
    {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: token
      }
    }
  )
  if (validateResponse(res.data)) return 'invalid Token'

  if (res.data.match(/<tipo_respuesta>([^<]*)<\/tipo_respuesta>/)[1] === '0') {
    const nombre = res.data.match(/<nombre>([^<]*)<\/nombre>/)[1]
    const direccion = res.data.match(/<direccion>([^<]*)<\/direccion>/)[1]
    return {
      nombre: beautifulerName(nombre).replace('undefined ', ''),
      direccion
    }
  } else {
    return 'NIT does not exist'
  }
}

const beautifulerName = (name) => {
  if (name.includes(',')) {
    return name.replace(',', '').replace(' ', ' ')
  } else {
    const splitName = name.split('  ')
    return splitName[1] + ' ' + splitName[0]
  }
}

export {
  generateBillMP,
  generateTokenMP,
  getClientInformationMP,
  getPDFMP,
  cancelBillMP
}
