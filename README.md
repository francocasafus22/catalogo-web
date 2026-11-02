# Mariana Duran — catálogo web

El frontend de Next.js está en `frontend/` y la API NestJS está en `backend/`. La API guarda administradores en PostgreSQL, valida contraseñas con bcrypt y emite JWT. El navegador recibe el JWT en una cookie `HttpOnly` a través de rutas del frontend.

## Preparar el backend

1. Copiá `backend/.env.example` como `backend/.env` y configurá `JWT_SECRET` (32 caracteres o más), `ADMIN_EMAIL` y una `ADMIN_PASSWORD` segura de al menos 12 caracteres.
2. Iniciá PostgreSQL desde la raíz del proyecto: `docker compose up -d postgres`.
3. En `backend/`, ejecutá `npm install` y luego `npm run start:dev`.
4. En `frontend/`, ejecutá `npm run dev`.

En el primer inicio, la API crea las tablas `admins`, `categories` y `products`, agrega las categorías y productos iniciales del catálogo, y da de alta al administrador configurado. Los productos existentes se migran a variantes por color, con stock inicial en cero para cargar las cantidades reales desde el dashboard. Los datos existentes no se sobrescriben en reinicios.

La pantalla de ingreso está en `/login`; luego de autenticar, envía al dashboard protegido `/dashboard`. Desde el dashboard se administran productos (categoría, precio de venta y costo, imagen, descripción, etiquetas y variantes). Cada variante tiene un nombre y valor (por ejemplo, `Color: Negro` o `Estampa: Floral`) y sus propios talles con cantidades de stock. El catálogo público lee esos productos desde PostgreSQL.

El panel de ventas registra uno o varios productos con variante, talle y cantidad. La API valida el stock y lo descuenta en una transacción; cada venta guarda el precio de venta y costo vigentes para conservar correctamente sus ingresos, costo y ganancia históricos. Las ventas se pueden consultar o eliminar; al eliminarlas se restaura el stock en una transacción.

Cada variante admite hasta 8 fotos subidas desde el dashboard a Cloudinary. La firma de subida la genera Nest y la API secret se mantiene en `backend/.env`; completá `CLOUDINARY_URL` con la URL real del entorno antes de subir imágenes.

La API expone `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/products`, `GET /api/products/:slug` y `GET /api/categories`. Las rutas `/api/admin/products` y `/api/admin/categories` aceptan operaciones CRUD y requieren `Authorization: Bearer <JWT>`. Para desplegar, definí `BACKEND_API_URL` en el entorno de Next.js, por ejemplo `https://api.tu-dominio.com/api`.
