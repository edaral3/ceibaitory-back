const jwt = require( 'jsonwebtoken')
const config = require( '../config/config')
const { getCollection } = require( '../models')

const validateToken = (roles: string[]) => {
  return (req: any, res: any, next: any) => {
    const token = req.headers.authorization
    jwt.verify(token, config.secret, async (error: any, decoded: any) => {
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
      const userCollection = getCollection('user', decoded.company.name)
      const user = await userCollection.findById(decoded.id)
      if (user.type !== 'owner' && !user.branch.find((item: any) => item === req.headers.branch)) {
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
