import Mongoose from "mongoose";

const schema = Mongoose.Schema;

const getSchema = (company: string) => {
  const store = new Mongoose.Schema({
    productId: {
      type: schema.Types.ObjectId,
      ref: `product_${company}`,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    ubication: {
      type: String,
      required: true,
    },
  });

  return store;
};

export default getSchema;
