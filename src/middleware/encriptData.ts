const bcrypt = require( 'bcrypt')
const CryptoJS = require( 'crypto-js')
const config = require( '../config/config')

const encriptData = (bodyName: string) => {
  return (req: any, _res: any, next: any) => {
    switch (bodyName) {
      case 'user':
        req.body.pwd = bcrypt.hashSync(req.body.pwd, 10)
        break
      case 'company':
        req.body.credentiasls = CryptoJS.AES.encrypt(req.body.credentiasls, config.secret).toString()
        break
      case 'purchase':
        break
      case 'sale':
        break
      case 'credit':
        break
      case 'report':
        break
    }
    next()
  }
}

export { encriptData }
