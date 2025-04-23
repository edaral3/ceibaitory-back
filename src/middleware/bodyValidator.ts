import schemas from '../schemas/index.js'

const validator = (schemaName: string): any => {
  const schema = schemas[schemaName]
  return (req: any, res: any, next: any) => {
    const validatorRes = schema.validate(req.body)
    if (validatorRes.error) { return res.status(406).json({ message: validatorRes.error }) }
    return next()
  }
}

export { validator }
