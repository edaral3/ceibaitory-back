# ceibaitory-back

Backend migrado a NestJS ejecutándose sobre Fastify usando TypeScript.

## Scripts principales

- `npm run start:dev` inicia la aplicación en modo watch mediante Nest CLI.
- `npm run build` transpila el proyecto a `dist/`.
- `npm start` ejecuta la versión compilada (`dist/main.js`).

## Requerimientos

- Node.js 18 o superior.
- Variables de entorno:
  - `PORT`
  - `DB_MONGO_HOST`
  - `SECRET`
  - `DEEPSEEK_API_KEY` (para el módulo de chat).

## Arquitectura

- NestJS modular (ver `src/modules`).
- Fastify como HTTP adapter (`src/main.ts`).
- Mongoose multi-tenant con factorías de colecciones dinámicas (`src/core/context`).
- Middleware/guards personalizados para autenticación JWT, carga de colecciones y validaciones con Joi.
