import bcrypt from 'bcryptjs'
import { getCollection } from '../models'

const autenticacion = (type: string[]) => {
  return async (req: any, res: any, next: any) => {
    const { user: userName, pwd } = req.headers
    try {
      if (userName && pwd) {
        const userCollection = getCollection('user', '')
        getCollection('company', '')
        const user = await userCollection.findOne({ user: userName }).populate('company')

        if (bcrypt.compareSync(pwd, user.pwd)) {

          req.companyName = user.company.schemaName.trim().toLowerCase()
          req.company = user.company._id
          if (type.length === 0 || type.includes(user.type)) {
            return next()
          }
        }
      }
      throw new Error('Unauthorized')
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" })
    }
  }
}

export { autenticacion }
