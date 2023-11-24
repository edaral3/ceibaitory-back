import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import config from '../config/config'

const login = async (req: any, res: any): Promise<any> => {
  try {
    const msj = 'User or password wrong'
    const user = await req.collection.findOne({ user: req.body.user })
    if (!user) {
      return res.status(401).json({ message: msj })
    }
    if (bcrypt.compareSync(req.body.pwd, user.pwd)) {
      const newToken = {
        id: user._id,
        company: req.body.company
      }
      const jwToken = jwt.sign(JSON.stringify(newToken), config.secret)

      return res.send({ jwt: jwToken })
    } else {
      return res.status(401).json({ message: msj })
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: 'OHHH, NOOO!!! was a problem in login' })
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
