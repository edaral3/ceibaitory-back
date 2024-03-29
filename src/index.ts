const { mongoConnection } = require('./mongodb/mongoConnection')
const http = require( 'http')
const express = require( 'express')
const cors = require( 'cors')

const sale = require( './routes/sale')
const purchase = require( './routes/purchase')
const client = require( './routes/client')
const store = require( './routes/store')
const branch = require( './routes/branch')
const user = require( './routes/user')
const supplier = require( './routes/supplier')
const product = require( './routes/product')
const credit = require( './routes/credit')
const autenticacion = require( './routes/autenticacion')
const reports = require( './routes/reports')
const root = require( './routes/root')

const app = express()

const getCors = (): any => {
  const restrictedCors = {
    origin: [
      '*'
    ],
    methods: ['GET', 'POST', 'DELETE', 'UPDATE', 'PUT'],
    headers: ['*']
    // headers: ['authorization', 'Content-Type']
  }

  return restrictedCors
}

app.use(cors(getCors()))

app.use(express.json())

// Mongodb
mongoConnection()

// Endpoints
app.use('/', root)
app.use('/client', client)
app.use('/user', user)
app.use('/supplier', supplier)
app.use('/product', product)
app.use('/purchase', purchase)
app.use('/branch', branch)
app.use('/store', store)
app.use('/sale', sale)
app.use('/credit', credit)
app.use('/login', autenticacion)
app.use('/reports', reports)

const PORT = process.env.PORT ?? '3000'
app.set('port', PORT)

const server = http.createServer(app)
server.listen(PORT)
server.on('listening', onListening)

function onListening (): void {
  server.address()
  console.log('Listening on ' + PORT)
}

export default app
