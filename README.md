# ceibaitory-back

Backend Express + TypeScript con módulo de delivery (MongoDB) listo para consumo desde Next.js.

**Features**
- REST API `/api` con respuestas consistentes
- MongoDB (Mongoose)
- Validación con Joi
- JWT Bearer (middleware existente)
- Upload de foto con `multipart/form-data` hacia S3
- Swagger/OpenAPI en `/api/docs`
- Logs estructurados con `requestId`

**Requisitos**
- Node.js 18+
- MongoDB

**Variables de entorno**
- `DB_MONGO_HOST` (obligatorio)
- `SECRET` (obligatorio, JWT)
- `CORS_ORIGIN` (opcional, lista separada por comas)
- `S3_BUCKET` (obligatorio)
- `S3_REGION` (obligatorio)
- `S3_ACCESS_KEY_ID` (opcional si usas IAM Role)
- `S3_SECRET_ACCESS_KEY` (opcional si usas IAM Role)
- `S3_PUBLIC_URL` (opcional, por ejemplo CloudFront)
- `SEED_COMPANY_NAME` (obligatorio para seed)

Ejemplo `.env`:
```bash
DB_MONGO_HOST=mongodb://localhost:27017/ceibaitory
SECRET=supersecret
CORS_ORIGIN=http://localhost:3000
S3_BUCKET=mi-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=xxx
S3_SECRET_ACCESS_KEY=yyy
S3_PUBLIC_URL=https://mi-cdn.example.com
SEED_COMPANY_NAME=Mi Empresa
```

**Instalación**
```bash
npm install
```

**Seed**
```bash
npm run seed:delivery
```

**Run local**
```bash
npm run dev
```

**Swagger**
- `GET /api/docs`

**Auth**
- Se usa el middleware `validateToken` (JWT). Requiere `Authorization: Bearer <JWT>` y `branch: <BRANCH_ID>`.

**Endpoints principales**
- `POST /api/clients`
- `GET /api/clients`
- `GET /api/clients/:id`
- `PATCH /api/clients/:id`
- `DELETE /api/clients/:id`
- `POST /api/clients/:id/photo`

- `POST /api/sales`
- `GET /api/sales`
- `GET /api/sales/:id`
- `GET /api/sales/:id/receipt`
- `PUT /api/sales/:id`
- `DELETE /api/sales/:id`

- `GET /api/delivery/visits?date=YYYY-MM-DD`
- `POST /api/delivery/visits/toggle`

**Ejemplos curl**
```bash
curl -X POST http://localhost:3000/api/clients \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Cliente 1","addressText":"Av 1","phone":"+595981000111","mapUrl":"https://maps.google.com/?q=-25.2637,-57.5759"}'
```

```bash
curl "http://localhost:3000/api/clients?page=1&pageSize=10" \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>"
```

```bash
curl -X POST http://localhost:3000/api/clients/<CLIENT_ID>/photo \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>" \
  -F "photo=@/path/to/file.jpg"
```

```bash
curl -X POST http://localhost:3000/api/sales \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<CLIENT_ID>","items":[{"eggType":"caja","eggSize":"Grande","quantity":12,"unitPrice":120}]}'
```

```bash
curl "http://localhost:3000/api/sales?from=2024-01-01&to=2024-12-31&page=1&pageSize=20" \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>"
```

```bash
curl -X PUT http://localhost:3000/api/sales/<SALE_ID> \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>" \
  -H "Content-Type: application/json" \
  -d '{"payment":{"amount":50,"note":"Abono 1"}}'
```

```bash
curl -X GET http://localhost:3000/api/sales/<SALE_ID>/receipt \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>"
```

```bash
curl "http://localhost:3000/api/delivery/visits?date=2026-02-10" \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>"
```

```bash
curl -X POST http://localhost:3000/api/delivery/visits/toggle \
  -H "Authorization: Bearer <JWT>" \
  -H "branch: <BRANCH_ID>" \
  -H "Content-Type: application/json" \
  -d '{"clientId":"<CLIENT_ID>","date":"2026-02-10","visited":true}'
```

Notas ventas:
- `total` es obligatorio al crear una venta.
- Para ventas pagadas al momento puedes enviar `paid: true` o `payments` con un abono por el total.
- Cada `PATCH` con `payment` agrega un abono y recalcula `status` (`pending`/`paid`).

**Tests**
```bash
npm test
```

Notas:
- Las pruebas requieren `DB_MONGO_HOST` válido.
- El upload de fotos guarda en S3 y responde con `photoUrl`.
