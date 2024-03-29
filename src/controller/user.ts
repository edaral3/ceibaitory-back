import Mongoose, { type ClientSession } from 'mongoose'
import {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems
} from '../common/CRUD/genericCRUD'
import { getCollection } from '../models'

import { getClientDetails } from './bill'

const getBillInformation = async (req: any, res: any): Promise<void> => {
  try {
    // res.send({ name: "EDGAR ARNOLDO", direction: "granua aldana" });
    const billingInformation = await getClientDetails(
      req.CollectionCompany,
      req.companyName,
      req.params.nit
    )
    res.send(billingInformation)
  } catch (error: any) {
    if (error.message === 'El nit no existe') {
      res.status(400).json({ message: error.message })
    } else {
      res.status(500).json({ message: error.message })
    }
  }
}

const createCompany = async (
  CollectionCompany: any,
  companyBody: any,
  session: ClientSession
) => {
  const company = await CollectionCompany(companyBody)
  const data = await company.save({ session })
  return data._id
}

const createBranch = async (
  companyName: string,
  branchBody: any,
) => {
  const CollectionBranch = getCollection('branch', companyName)
  const branch = await CollectionBranch(branchBody)
  const data = await branch.save()
  return data._id
}

const createUser = async (
  CollectionUser: any,
  userBody: any,
  session: ClientSession
) => {
  const user = await CollectionUser(userBody)
  const data = await user.save({ session })
  return data
}

const createOwnerUser = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()

  let status = 'compañia'
  try {
    const { user, name, phone, pwd, companyName, phoneCompany, direction } =
      req.body

    const companyBody = {
      name: companyName,
      schemaName: companyName.trim().replaceAll(' ', '-'),
      ownerName: name
    }
    const companyId = await createCompany(
      req.CollectionCompany,
      companyBody,
      session
    )

    status = 'sucursal'
    const branchBody = {
      name: 'Principal',
      direction,
      phone: phoneCompany
    }
    const branchId = await createBranch(companyName, branchBody)

    status = 'usuario'
    const userBody = {
      user,
      name,
      pwd,
      type: 'owner',
      phone,
      company: companyId,
      branch: [branchId]
    }
    await createUser(req.CollectionCrud, userBody, session)

    await session.commitTransaction()
    res.send({ message: 'Empresa creado con exito' })
  } catch (error: any) {
    try {
      await session.abortTransaction()
    } catch (error) {}
    if (error.code === 11000) {
      res.status(400).json({
        type: 'error',
        message: `Ya existe el/la ${status}, ingresa otro nombre`
      })
    } else {
      res.status(500).json({ message: 'Error creating company' })
    }
  } finally {
    await session.endSession()
  }
}

const addFelInformation = async (req: any, res: any): Promise<void> => {
  try {
    const { name, credentiasls, id } = req.body

    await req.CollectionCompany.findByIdAndUpdate(id, {
      billingCompanyName: name,
      billingCompanyCredentials: credentiasls
    })

    res.send({ message: 'Informacion de facturacion agregada' })
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating company' })
  }
}

const isCompanyBilling = async (req: any, res: any): Promise<void> => {
  try {
    const company = await req.CollectionCompany.findOne({ name: req.companyName })
    const isBilling = !!company.billingCompanyCredentials
    res.send({ isBilling })
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating company' })
  }
}

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems,
  getBillInformation,
  createOwnerUser,
  addFelInformation,
  isCompanyBilling
}
