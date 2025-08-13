import axios from 'axios'
import decode from 'unescape'

import {
  buildXmlBill,
  buildRequestBill,
  buildRequestCancellBill,
  buildClientRequest,
  buildCancelBill
} from '../utils/megaprint/certifier'

import {
  getPDF
} from '../utils/megaprint/templates'

const getToken = async (credentials: string): Promise<string> => {
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

const generateTokenMP = async (company: any): Promise<string> => {
  try {
    const token = await getToken(company.billingCompanyCredentials)
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

  if (!validateResponse(res.data)) return 'invalid Token'

  return decode(signedBill)
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
  if (!validateResponse(res.data)) return 'invalid Token'

  return {
    uuid: res.data.match(/<uuid>([^<]*)<\/uuid>/)[1],
    uuidEmision
  }
}

const generateBillMP = async (token: string, body: any): Promise<any> => {
  const generateXML = buildXmlBill(body)
  const signedBill = await signBill(generateXML, token)
  if (signedBill === 'invalid Token') return signedBill

  const registedBill = await registerBillDocument(signedBill, token)
  return registedBill
}

const getPDFMP = async (token: string, uuid: string): Promise<any> => {
  const bodyRequest = getPDF.replace('$UUID', uuid)
  const res = await axios.post(
    'https://apiv2.ifacere-fel.com/api/retornarPDF',
    bodyRequest,
    {
      headers: {
        'Content-Type': 'application/xml',
        Authorization: token
      }
    }
  )
  if (!validateResponse(res.data)) return 'invalid Token'

  return res.data.match(/<pdf>([^<]*)<\/pdf>/)[1]
}

const registerCancelBillDocument = async (
  signedDocument: any,
  token: string
): Promise<any> => {
  const { bodyRequest, uuidEmision } = buildRequestCancellBill(signedDocument)
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
  if (!validateResponse(res.data)) return 'invalid Token'
  return {
    uuid: res.data.match(/<uuid>([^<]*)<\/uuid>/)[1],
    uuidEmision
  }
}

const cancelBillMP = async (token: any, body: any): Promise<any> => {
  const generateXML = buildCancelBill(body)
  const signedCancelBill = await signBill(generateXML, token)
  if (signedCancelBill === 'invalid Token') return signedCancelBill

  const cancelBill = await registerCancelBillDocument(signedCancelBill, token)
  return cancelBill
}

const getClientInformationMP = async (
  token: string,
  nit: string
): Promise<any> => {
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
  if (!validateResponse(res.data)) return 'El nit no existe'

  if (res.data.match(/<tipo_respuesta>([^<]*)<\/tipo_respuesta>/)[1] === '0') {
    const name = res.data.match(/<nombre>([^<]*)<\/nombre>/)[1]
    const direction = res.data.includes('<direcciones/>')? 'Ciudad' : res.data.match(/<direccion>([^<]*)<\/direccion>/)[1]
    return {
      name: beautifulerName(name).replace('undefined ', ''),
      direction
    }
  } else {
    return 'NIT does not exist'
  }
}

const beautifulerName = (name): string => {
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
