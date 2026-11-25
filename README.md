# Turno — control horario y pagos

Web-app móvil para que cada empleada marque entrada y salida, con cálculo semanal de horas, pago por tarifa individual y comisión manual por ventas. El navegador obtiene la ubicación del teléfono y el servidor comprueba que esté dentro del radio configurado para el local.

## Requisitos

- Node.js 20.9 o superior.
- PostgreSQL 14 o superior, local o administrado.
- Para usar geolocalización desde teléfonos al publicar, un dominio con HTTPS.

## Preparar la base de datos

1. Iniciá una base local con `docker compose up -d`, o prepará PostgreSQL por tu cuenta.
2. Copiá `.env.example` a `.env`. Si usás la base de Docker, ya viene con los datos de conexión correctos; si usás otro PostgreSQL, editá `DATABASE_URL`.
3. En `SESSION_SECRET`, colocá una clave aleatoria larga. Por ejemplo, generala con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
4. Instalá dependencias y creá las tablas:

```bash
npm install
npm run db:migrate
```

5. Iniciá el servidor:

```bash
npm run dev
```

Abrí `http://localhost:3000`. Los roles son `administrador` y `vendedor`. Desde el panel administrador se agregan los vendedores, sus contraseñas y sus tarifas por hora.

## Publicar en Vercel

1. Importá el repositorio en Vercel y conservá los comandos de Next.js: Build Command `npm run build` y Output Directory por defecto.
2. En **Project Settings → Environment Variables**, cargá para Production (y también Preview si vas a probar ahí):
   - `DATABASE_URL`: URL directa de PostgreSQL. Prisma CLI la usa como fallback.
   - `DIRECT_URL`: URL directa de PostgreSQL para las migraciones de Prisma.
   - `DATABASE_URL_POOLED`: URL pooler para las consultas serverless de la app. Si la integración Vercel/Prisma la ofrece, la app la usa automáticamente; si no, usa `DATABASE_URL`.
   - `SESSION_SECRET`: clave aleatoria larga. Generala con `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`.
   - `ADMIN_REGISTRATION_CODE`: clave privada para autorizar altas de cuentas administradoras. Configurala en Vercel y localmente; no guardes el valor real en Git.
3. Aplicá las migraciones contra la base de producción con `npm run db:deploy`, usando las URLs de producción en el entorno de ese comando. No ejecutes `prisma migrate dev` contra producción.
4. Volvé a desplegar. La app solo encontrará cuentas que existan en la base indicada por `DATABASE_URL`; crear la cuenta en otra base local no la copia a producción.

Si el login falla con error 500, revisá los logs de la Function `POST /api/login` en Vercel: `P2021`/`P2022` suele indicar tablas o columnas sin migrar; error de conexión indica URL/SSL/acceso; `Falta configurar SESSION_SECRET` identifica la variable ausente. Si `GET /api/setup-status` indica `needed: true`, esa base todavía no tiene administrador y hay que crear la cuenta inicial desde la pantalla.

## Instalar en el celular

La aplicación es una PWA: no se descarga desde una tienda ni se instala como APK, sino que se agrega a la pantalla de inicio y se abre en una ventana propia del navegador. La instalación desde un dominio publicado requiere HTTPS y conexión a internet.

- En Android, abrí el sitio con Chrome y elegí **Instalar app** o **Agregar a pantalla principal**. El botón **Agregar al celular** de la web muestra los pasos o abre el diálogo de instalación cuando Chrome lo ofrece.
- En iPhone, abrí el sitio con Safari, tocá **Compartir** y luego **Agregar a pantalla de inicio**.

## Uso

- La administradora define el punto del local y el radio permitido en metros. Puede usar la ubicación actual del dispositivo que está configurando o ingresar coordenadas.
- Cada empleada ingresa desde el teléfono y marca entrada y salida. El servidor guarda las horas y no acepta marcas fuera del radio.
- El período de pago es de lunes a domingo. El resumen estima horas cerradas por la tarifa individual.
- Cada vendedor puede tener un sueldo fijo semanal adicional a la tarifa por hora, además de una meta semanal de prendas y una recompensa configurable que se agrega al pago al cumplirla.
- Vendedores y administración consultan fichajes con filtros semanal, quincenal o mensual. Administración puede filtrar por vendedor; cada vendedor solo ve sus propios fichajes.
- La administradora carga manualmente las prendas vendidas por empleada y día. La comisión se calcula como `$500 × max(0, prendas − 14)`.
- Las ventas y marcas históricas quedan almacenadas en PostgreSQL.

## Seguridad y límites

Las contraseñas se guardan con scrypt y las sesiones usan cookies HttpOnly firmadas. Configurá `SESSION_SECRET` antes de publicar. La ubicación GPS del navegador puede ser imprecisa o falsificarse; la geocerca sirve como control práctico de proximidad, no como prueba inviolable de presencia. Se necesita HTTPS en producción para que los navegadores permitan geolocalización.

El total es una estimación operativa según las horas y ventas cargadas. Revisá la liquidación antes de pagar; la app no aplica reglas de convenio, impuestos, descansos ni horas extra.
