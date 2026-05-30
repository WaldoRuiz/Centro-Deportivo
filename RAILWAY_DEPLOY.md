# Despliegue del Frontend en Railway

El frontend es una app React + Vite. Railway puede construirla con `npm run build` y servir el resultado con `npm run start`.

## 1. Crear servicio

Dentro del mismo proyecto de Railway:

1. Agregar nuevo servicio desde GitHub.
2. Seleccionar el repositorio del frontend.
3. Railway detectara Node.js.

## 2. Configuracion

Si Railway pide comandos manuales:

```text
Build Command: npm install && npm run build
Start Command: npm run start
```

El script `start` ya esta preparado para escuchar en `0.0.0.0` y en el puerto `PORT` que Railway asigna.

## 3. Variable del frontend

En el servicio del frontend, agregar:

```text
VITE_API_BASE_URL=https://URL-DEL-BACKEND.up.railway.app/api
```

Ejemplo:

```text
VITE_API_BASE_URL=https://sistema-deportivo-backend-production.up.railway.app/api
```

Importante: esta variable se usa durante el build de Vite. Si la cambias, haz redeploy del frontend.

## 4. Dominio publico

En el servicio del frontend:

```text
Settings > Networking > Generate Domain
```

La URL quedara parecida a:

```text
https://sistema-deportivo-frontend-production.up.railway.app
```

## 5. Conectar CORS con backend

Copiar la URL publica del frontend y ponerla en el backend:

```text
Cors__AllowedOrigins=https://TU-FRONTEND.up.railway.app
```

Luego redeploy del backend.

## 6. Usuario administrador

Entrar al frontend con el administrador creado por el backend:

```text
Correo: admin@centrodeportivo.com
Password: Admin123
```
