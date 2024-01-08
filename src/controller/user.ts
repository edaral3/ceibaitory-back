import Mongoose, { type ClientSession } from "mongoose";
import {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems,
} from "../common/CRUD/genericCRUD";
import { getCollection } from "../models";

import { getClientDetails } from "./bill";

const getBillInformation = async (req: any, res: any): Promise<void> => {
  try {
    res.send({ name: "EDGAR ARNOLDO", direction: "granua aldana" });
    /*const billingInformation = await getClientDetails(
      req.collections,
      req.companyName,
      req.params.nit
    )
    res.send(billingInformation)*/
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

const createCompany = async (
  CollectionCompany: any,
  companyBody: any,
  session: ClientSession
) => {
  const company = await CollectionCompany(companyBody);
  const data = await company.save({ session });
  return data._id;
};

const createBranch = async (
  companyName: string,
  branchBody: any,
  session: ClientSession
) => {
  const CollectionBranch =  getCollection("branch", companyName)
  const branch = await CollectionBranch(branchBody);
  const data = await branch.save({ session });
  return data._id;
};

const createUser = async (
  CollectionUser: any,
  userBody: any,
  session: ClientSession
) => {
  const user = await CollectionUser(userBody);
  const data = await user.save({ session });
  return data;
};

const createOwnerUser = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession();
  session.startTransaction();
  try {
    const { user, name, phone, pwd, companyName, phoneCompany, direction } =
      req.body;

    const companyBody = {
      name: companyName,
      ownerName: name,
    };
    const companyId = await createCompany(
      req.CollectionCompany,
      companyBody,
      session
    );

    const branchBody = {
      name: "Principal",
      direction: direction,
      phone: phoneCompany,
    };
    const branchId = await createBranch(
      companyName,
      branchBody,
      session
    );

    const userBody = {
      user: user,
      name: name,
      pwd: pwd,
      type: "owner",
      phone: phone,
      company: companyId,
      branch: branchId,
    };
    await createUser(req.CollectionCrud, userBody, session);

    await session.commitTransaction();
    res.send({ message: "Empresa creado con exito" });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    await session.endSession();
  }
};

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems,
  getBillInformation,
  createOwnerUser,
};
