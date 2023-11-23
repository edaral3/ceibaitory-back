import Mongoose from "mongoose";

const trade = new Mongoose.Schema({
	name: {
		type: String,
		required: true
	},
	amount: {
		type: Number,
		required: true
	},
	salesPrice: {
		type: Number,
		required: true
	},
	priceCost: {
		type: Number,
		required: true
	},
	total: {
		type: Number,
		required: true
	},
    expirationDate: {
      type: Date,
      default: null,
    },
})

export default trade;