import {
  createItem,
  deleteItem,
  updateItem,
  getOneItem,
  getAllItems,
} from "../common/CRUD/genericCRUD";
import { getClientDetails } from "./bill";

const getBillInformation = async (req: any, res: any) => {
  try {
    const billingInformation = await getClientDetails(
      req.collections,
      req.companyName,
      req.params.nit
    );
    res.send(billingInformation);
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

export default {
  create: createItem,
  delete: deleteItem,
  update: updateItem,
  getOne: getOneItem,
  getAll: getAllItems,
  getBillInformation: getBillInformation,
};
