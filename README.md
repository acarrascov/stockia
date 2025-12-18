# Stockia – Backend API

Backend REST para Stockia.
Gestión de productos con roles, auditoría, paginación y hardening básico.

## Stack
- Node.js + Express
- Firebase (Auth + Firestore)
- Helmet + Rate Limit
- Jest + Supertest

## Requisitos
- Node >= 18
- Firebase project
- Archivo `serviceAccountKey.json` (NO versionado)

## Instalación
```bash
cd api
npm install

Variables de entorno

Desarrollo

.env.development

NODE_ENV=development
PORT=3001
FIREBASE_PROJECT_ID=xxxx

Producción

.env.production
NODE_ENV=production
PORT=3001

npm run dev      # desarrollo
npm start        # producción

Endpoints principales

Productos (admin)
	•	POST   /api/products
	•	GET    /api/products?limit=20&cursor=&all=true
	•	GET    /api/products/:id
	•	PUT    /api/products/:id
	•	DELETE /api/products/:id (soft delete)

Auditoría
	•	GET /api/audit-logs

Seguridad
	•	Firebase Auth
	•	Roles (admin)
	•	Helmet
	•	Rate limit (100 req / 15 min)

Tests
npm test

Notas
	•	Precios en CLP (enteros)
	•	Eliminación es soft delete

---

## Estado final ✅

- **B10** Hardening → ✅  
- **B11** Envs por entorno → ✅  
- **B12** README técnico → ✅  

### 🎯 **Backend Core: COMPLETO**

Siguiente paso profesional recomendado:
👉 **Frontend (Next.js / React) consumiendo esta API**

Cuando quieras, dime:
**“Partimos frontend”** 🚀