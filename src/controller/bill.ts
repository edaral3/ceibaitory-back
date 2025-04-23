import certifiers from '../utils/certifiers'
import CryptoJS from 'crypto-js'
import config from '../config/config.js'
import { redisConnection } from '../redisdb/redisConnection.js'
import {
  getClientInformationMP,
  generateBillMP,
  cancelBillMP,
  getPDFMP,
  generateTokenMP
} from './megaprint.js'

const deleteToken = async (companyName: string): Promise<void> => {
  const redisClient = await redisConnection()
  await redisClient.del(`${companyName}_token`)
}

const getToken = async (companyName: string, company: any): Promise<string> => {
  const redisClient = await redisConnection()
  const exist = await redisClient.exists(`${companyName}_token`)
  if (!exist) {
    await setToken(companyName, company)
  }
  const token = await redisClient.get(`${companyName}_token`)
  return token
}

const setToken = async (companyName: string, company: any): Promise<void> => {
  const redisClient = await redisConnection()
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
  await redisClient.set(`${companyName}_token`, token)
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
