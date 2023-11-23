import Mongoose from "mongoose";
import trade from "./trade";

const schema = Mongoose.Schema;

const getSchema = (company: string) => {
  const payments = new Mongoose.Schema({
    date: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  });

  const credit = new Mongoose.Schema({
    state: {
      type: Number,
      default: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    paid: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      required: false,
    },
    reminder: {
      type: String,
      required: false,
    },
    client: {
      type: schema.Types.ObjectId,
      ref: `client_${company}`,
      require: true,
    },
    payments: [payments],
    products: [trade],
  });
  return credit;
};

export default getSchema;
