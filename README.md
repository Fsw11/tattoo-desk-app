# Tattoo Desk

SaaS de gestión para estudios de tatuajes: clientes, agenda, tatuajes, galería, inventario, finanzas, consentimiento digital y modo offline (PWA).

## Stack

- Next.js 16 + React 19
- Prisma 7 + PostgreSQL
- Auth.js (credentials)
- Tailwind CSS 4
- Dexie (IndexedDB) + Service Worker

## Arranque local

```bash
cp .env.example .env   # completa DATABASE_URL y AUTH_SECRET
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Admin de desarrollo (seed):

- Email: `admin@tattoodesk.com`
- Password: `Admin12345`

O crea un estudio nuevo en `/registro`.

## Variables útiles

Ver [`.env.example`](.env.example):

- `ALLOW_MANUAL_PLAN` / activación de plan en desarrollo
- `MP_ACCESS_TOKEN` para checkout Mercado Pago
- `STORAGE_DRIVER=s3` + credenciales para fotos en la nube
- `RECOVERY_DEV_MODE` para recuperación de contraseña en local

## Capacitor (tiendas)

Ver [`docs/capacitor.md`](docs/capacitor.md) y `capacitor.config.json`.
