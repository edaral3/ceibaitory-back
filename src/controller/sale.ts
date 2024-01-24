import Mongoose, { type ClientSession } from "mongoose";
import { generateBill, cancelBill, getPDF } from "./bill";

const updateProduct = async (
  CollectionProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
): Promise<void> => {
  for (const product of products) {
    const { _id, amount } = product;
    const config = { $inc: { existence: amount * incDes } };
    const data = await CollectionProduct.findByIdAndUpdate(_id, config, {
      session,
    });
    if (incDes === -1) {
      if (!data || data.existence - amount < 0) {
        throw {
          type: 400,
          message: `not enough "${product.name}" to create credit`,
        };
      }
    }
  }
};

const createSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession();
  session.startTransaction();
  try {
    const products = req.body.products;
    const collections = {
      collectionBillingToken: req.collectionBillingToken,
      CollectionCompany: req.CollectionCompany,
    };
    await updateProduct(req.CollectionProduct, products, session);
    let newBill: any = null;

    if (req.body.clientNit) {
      const bill = await generateBill(
        collections,
        req.companyName,
        req.body.products
      );
      newBill = {
        name: req.body.clientName,
        nit: req.body.clientNit,
        direction: req.body.direction,
        uuid: bill.uuid,
        uuidEmision: bill.uuidEmision,
      };
    }

    const newSale: any = {
      bill: newBill,
      total: req.body.total,
      date: req.body.date,
      products: products,
    };
    const sale = new req.CollectionSale(newSale);
    await sale.save({ session });

    await session.commitTransaction();
    res.send({ message: "OK" });
  } catch (error: any) {
    await session.abortTransaction();
    if(error.type === 400){
      res.status(400).json({ message: error.message });

    }else{
      res.status(500).json({ message: "Error creating sale" });

    }
  } finally {
    await session.endSession();
  }
};

const getOneSale = async (req: any, res: any): Promise<any> => {
  try {
    const data = await req.CollectionSale.findById(req.params.id);
    res.send(data);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `Error buscando la venta ${req.params.id}` });
  }
};

const getAllItems = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionSale.find().sort({date:-1});
    return res.send(items);
  } catch (error) {
    return res.status(500).json({ message: "Error gettin all purchases" });
  }
};

const cancelSale = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession();
  session.startTransaction();
  try {
    const data = await req.CollectionSale.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          canceled: true,
          cancellationDate: new Date(),
        },
      },
      { session }
    );
    await updateProduct(req.CollectionProduct, data.products, session, 1);
    if(data.bill){
      await cancelBill(req.collections, req.companyName, req.body.products);
    }
    await session.commitTransaction();
    res.send("OK");
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: "Error cancelling sale" });
  } finally {
    await session.endSession();
  }
};

const getPdfBill = async (req: any, res: any): Promise<void> => {
  try {
    const pdf = await getPDF(req.collections, req.companyName, req.params.uuid);

    res.send({ pdf });
  } catch (error) {
    res.status(500).json({ message: "Error getting bill" });
  }
};

export default {
  create: createSale,
  cancel: cancelSale,
  getOne: getOneSale,
  getAll: getAllItems,
  getBill: getPdfBill,
};
