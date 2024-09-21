import jwt from 'jsonwebtoken'
import config from '../config/config'
import { getCollection } from '../models'

const validateBranch = (branches, branch): boolean => {
  const exist = branches.find((item: any) => {
    return item._id.toString() === branch;
  })
  return exist
}

const validateToken = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization
    jwt.verify(token, config.secret, async (error, decoded) => {
      if (error) {
        return res.status(401).json({
          message: 'Invalid token'
        })
      }
      if (!roles.includes(decoded.roles)) {
        return res.status(401).json({
          message: 'Permissions error'
        })
      }
      const company = decoded.company.name?decoded.company.name?.toLowerCase().replaceAll(' ','-'):''
      const userCollection = getCollection('user', company)
      const user = await userCollection.findById(decoded.id)
      if (user.type !== 'owner' && !user.branch.find((item: any) => item._id == req.headers.branch)) {
        return res.status(401).json({
          message: 'Permissions error'
        })
      }
      req.userId = decoded.userId
      req.companyName = decoded.company.name
      req.company = decoded.company._id
      req.branch = req.headers.branch
      return next()
    })
  }
}


export { validateToken }
