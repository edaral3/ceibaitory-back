import { Schema } from 'mongoose'
import mongoose from 'mongoose'
import mongooseSequence from 'mongoose-sequence'
import BirdTypeEnum from '../enum/bird-type.enum';

const AutoIncrement = mongooseSequence(mongoose);

const getSchema = (company: string): Schema => {
    const batch = new Schema({
        batchId: {
            type: Number,
            unique: true
        },
        amount: {
            type: Number,
            required: true
        },
        birdType: {
            type: String,
            enum: BirdTypeEnum,
            required: true
        },
        shed: {
            type: Schema.Types.ObjectId,
            ref: `shed_${company}`,
            default: null
        },
        inCharge: {
            type: Schema.Types.ObjectId,
            ref: `user_`,
            default: null
        },
        state: {
            type: Boolean,
            default: true
        },
        concentrateStore: {
            type: Schema.Types.ObjectId,
            ref: `concentrateStore_${company}`,
            default: null
        },
        startDate: {
            type: Date,
            required: true
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

    batch.plugin(AutoIncrement, { inc_field: 'batchId' });

    return batch
}

export default getSchema
