import Mongoose from "mongoose";

const schema = Mongoose.Schema;

const getSchema = (company: string) => {
  const user = new Mongoose.Schema({
    user: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    pwd: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: true,
    },
    mail: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    company: {
      type: schema.Types.ObjectId,
      ref: `company_${company}`,
      required: true,
    },
    branch: [
      {
        type: schema.Types.ObjectId,
        ref: `branch_${company}`,
        required: true,
      },
    ],
  });

  user.index({ user: 1 }, { unique: true });
  return user;
};

export default getSchema;
