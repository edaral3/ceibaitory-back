import Mongoose, { type ClientSession } from 'mongoose'
import { generateBill, cancelBill, getPDF } from "./bill";

const updateProduct = async (
  ControllerProduct: any,
  products: any,
  session: ClientSession,
  incDes: 1 | -1 = -1
): Promise<void> => {
  for (const product of products) {
    const { _id, amount } = product;
    const config = { $inc: { existence: amount * incDes } };
    const data = await ControllerProduct.findByIdAndUpdate(_id, config, {
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

const createCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession();
  session.startTransaction();
  try {
    const data = await req.CollectionCredit.findByIdAndUpdate(
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
}

const getTotalUntilDate = (payments: any): number => {
  let paid = 0
  for (const pay of payments) {
    paid += pay.amount
  }
  return paid
}

const payCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession()
  session.startTransaction()
  try {
    const credit = await req.CollectionCredit.findById(req.params.id)
    const paid = getTotalUntilDate(credit.payments)
    const data = await req.CollectionCredit.findByIdAndUpdate(
      req.params.id,
      {
        $push: { pagos: req.body },
        $set: { state: paid >= credit.total ? 2 : 1, paid }
      },
      { session }
    )
    res.send(data)
    await session.commitTransaction()
  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Error paying credit' })
  } finally {
    await session.endSession()
  }
}

const getOneCredit = async (req: any, res: any): Promise<void> => {
  try {
    const data = await req.CollectionCredit
      .findById(req.params.id)
      .populate('client')
    res.send(data)
  } catch (error) {
    res.status(500).json({ message: 'Error getting one credit' })
  }
}

const cancelCredit = async (req: any, res: any): Promise<void> => {
  const session = await Mongoose.startSession();
  session.startTransaction();
  try {
    const data = await req.CollectionCredit.findByIdAndUpdate(
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
}

const unpaidCredit = async (req: any, res: any): Promise<void> => {
  try {
    const data = await req.CollectionCredit.findByIdAndUpdate(req.query.id, {
      $set: 4
    })
    res.send(data)
  } catch (error) {
    res.status(500).json({ message: 'Error unpaying credit' })
  }
}

const getAllCredits = async (req: any, res: any): Promise<any> => {
  try {
    const items = await req.CollectionCredit.find().populate(`client`)
    res.send(items)
  } catch (error) {
    res.status(500).json({ message: 'Error gettin all purchases' })
  }
}

export default {
  create: createCredit,
  cancel: cancelCredit,
  getOne: getOneCredit,
  getAll: getAllCredits,
  unpaid: unpaidCredit,
  pay: payCredit
}
