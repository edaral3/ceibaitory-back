import certifiers from '../utils/certifiers'
import CryptoJS from 'crypto-js'
import config from '../config/config'
import {
  getClientInformationMP,
  generateBillMP,
  cancelBillMP,
  getPDFMP,
  generateTokenMP
} from './megaprint'

const cache = new Map();

const deleteToken = async (companyName: string): Promise<void> => {
  cache.delete(`${companyName}_token`)
}

const getToken = async (companyName: string, company: any): Promise<string> => {
  let token = cache.get(`${companyName}_token`);
  
  if (!token) {
    token = await setToken(companyName, company)
  }
  return token
}

const setToken = async (companyName: string, company: any): Promise<void> => {
  let token: any
  const bytes = CryptoJS.AES.decrypt(
    company.billingCompanyCredentials,
    config.secret
  )
  const decript = bytes.toString(CryptoJS.enc.Utf8)
  company.billingCompanyCredentials = decript
  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      token = await generateTokenMP(company)
  }

  cache.set(`${companyName}_token`, token);
  await token
}

const generateBill = async (
  CollectionCompany: any,
  companyName: string,
  body: any
): Promise<any> => {
  const company = await CollectionCompany.findOne({
    name: companyName
  })

  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = await generateBillMP(token, body)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

const cancelBill = async (
  CollectionCompany: any,
  companyName: string,
  body: any
): Promise<void> => {
  const company = await CollectionCompany.findOne({
    name: companyName
  })
  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = await cancelBillMP(token, body)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

const getClientDetails = async (
  CollectionCompany: any,
  companyName: string,
  nit: string
): Promise<any> => {
  const company = await CollectionCompany.findOne({
    name: companyName
  })

  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = await getClientInformationMP(token, nit)
  }

  if (billData === 'El nit no existe') {
    throw new Error(billData)
  }
  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

const getPDF = async (
  CollectionCompany: any,
  companyName: any,
  uuid: string
): Promise<any> => {
  const company = await CollectionCompany.findOne({
    name: companyName
  })

  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = await getPDFMP(token, uuid)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

export { generateBill, getClientDetails, getPDF, cancelBill }
