import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from '../config/config'
import { getCollection } from '../models'

const login = async (req: any, res: any): Promise<any> => {
  try {
    const msj = 'Usuario o contraseña incorrecto'
    const user = await req.CollectionCrud.findOne({ user: req.body.user }).populate('company')
    req.CollectionBranch = getCollection('branch', user.company.schemaName)

    if (!user) {
      return res.status(401).json({ message: msj })
    }
    if (bcrypt.compareSync(req.body.pwd, user.pwd)) {
      const branches: any = []
      if (user.type === 'owner') {
        const branchesAux = await req.CollectionBranch.find()
        for (const branch of branchesAux) {
          branches.push({ name: branch.name, _id: branch._id })
        }
      } else {
        for (const branch of user.branch) {
          const item = await req.CollectionBranch.findById(branch)
          branches.push({ name: item.name, _id: item._id })
        }
      }
      const newToken = {
        id: user._id,
        user: user.user,
        company: { name: user.company.name, _id: user.company._id },
        branches,
        roles: user.type
      }
      const jwToken = jwt.sign(JSON.stringify(newToken), config.secret)

      return res.send({ jwt: jwToken })
    } else {
      return res.status(401).json({ message: msj })
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'OHHH, NOOO!!! hubo un problema iniciando sesion' })
  }
}

const validate = async (req: any, res: any): Promise<any> => {
  try {
    jwt.verify(req.params.jwt, config.secret, (error: any, decoded: any) => {
      if (error) {
        return res.status(401).json({
          message: 'Error with jwt'
        })
      }
      res.send({ user: decoded })
    })
  } catch (error) {
    return res.status(500).json({
      message:
        'OHHH, NOOO!!! Was a probmen validating your identiti, please login again'
    })
  }
}

export default { login, validate }
