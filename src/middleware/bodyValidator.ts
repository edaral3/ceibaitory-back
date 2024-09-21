import schemas from '../schemas/index'

const validator = (schemaName: string): any => {
  const schema = schemas[schemaName]
  return (req: any, res: any, next: any) => {
    console.log('schemaName', schemaName)
    if(schemaName === 'user'){
      delete req.body.branchData
    }
    const validatorRes = schema.validate(req.body)
    if (validatorRes.error) { return res.status(406).json({ message: validatorRes.error }) }
    return next()
  }
}

export { validator }
