import Mongoose from "mongoose";

const getSchema = () => {
  const client = new Mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    phone: {
      type: String,
      required: true,
    },
  });
  return client;
};

export default getSchema;
