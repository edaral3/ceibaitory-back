import { Schema } from 'mongoose'

const getSchema = (): Schema => {
    const concentrateType = new Schema({
        name: {
            type: String,
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
    return concentrateType
}

export default getSchema
