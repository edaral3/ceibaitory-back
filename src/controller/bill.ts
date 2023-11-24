import certifiers from '../utils/certifiers'
import { redisConnection } from '../redisdb/redisConnection'
import {
  getClientInformationMP,
  generateBillMP,
  cancelBillMP,
  getPDFMP,
  generateTokenMP
} from './megaprint'

const redisClient = redisConnection()

const deleteToken = async (companyName: string): Promise<void> => {
  await redisClient.del(`${companyName}_token`)
}

const getToken = async (companyName: string, company: any): Promise<string> => {
  const exist = await redisClient.exists(`${companyName}_token`)
  if (!exist) {
    await setToken(companyName, company)
  }
  const token = await redisClient.get(`${companyName}_token`)
  return token
}

const setToken = async (companyName: string, company: any): Promise<void> => {
  let token: any
  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      token = generateTokenMP(token)
  }
  await redisClient.set(`${companyName}_token`, token)
}

const generateBill = async (
  collections: any,
  companyName: string,
  body: any
): Promise<any> => {
  const company = await collections.CollectionCompany.finOne({
    name: companyName
  })

  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = generateBillMP(token, body)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

const cancelBill = async (
  collections: any,
  companyName: string,
  body: any
): Promise<void> => {
  const company = await collections.CollectionCompany.finOne({
    name: companyName
  })
  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = cancelBillMP(token, body)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

const getClientDetails = async (
  collections: any,
  companyName: string,
  nit: string
): Promise<any> => {
  const company = await collections.CollectionCompany.finOne({
    name: companyName
  })

  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = getClientInformationMP(token, nit)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

const getPDF = async (
  collections: any,
  companyName: any,
  uuid: string
): Promise<any> => {
  const company = await collections.CollectionCompany.finOne({
    name: companyName
  })

  const token = await getToken(companyName, company)

  let billData: any

  switch (company.billingCompanyName) {
    case certifiers.MEGAPRINT:
      billData = getPDFMP(token, uuid)
  }

  if (billData === 'invalid Token') {
    await deleteToken(companyName)
    throw new Error('Invalid token')
  }
  return billData
}

export { generateBill, getClientDetails, getPDF, cancelBill }
