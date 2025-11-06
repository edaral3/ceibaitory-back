import { Schema } from 'mongoose'
import mongoose from 'mongoose'
import mongooseSequence from 'mongoose-sequence'

const getSchema = (company: string): Schema => {
    const AutoIncrement = mongooseSequence(mongoose);
    
    const batchInfo = new Schema({
        batchId: {
            type: Schema.Types.ObjectId,
            ref: `batch_${company}`,
            default: null
        },
        concentrateStore: {
            type: Schema.Types.ObjectId,
            ref: `concentrateStore_${company}`,
            default: null
        },
        chikenSale: {
            type: Schema.Types.ObjectId,
            ref: `chickenSale_${company}`,
            default: null
        },
        batchInfoId: {
            type: Number,
            unique: true
        },
        action: {
            type: String,
            required: false
        },
        amount: {
            type: Number,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        price: {
            type: Number,
            required: false
        },
        typeConcentrate: {
            type: String,
            required: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    })
    
    batchInfo.plugin(AutoIncrement, { 
        inc_field: 'batchInfoId',
        id: `batchInfo_${company}_seq`
    });

    return batchInfo
}

export default getSchema
