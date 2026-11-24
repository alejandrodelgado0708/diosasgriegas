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

## Uso

- La administradora define el punto del local y el radio permitido en metros. Puede usar la ubicación actual del dispositivo que está configurando o ingresar coordenadas.
- Cada empleada ingresa desde el teléfono y marca entrada y salida. El servidor guarda las horas y no acepta marcas fuera del radio.
- El período de pago es de lunes a domingo. El resumen estima horas cerradas por la tarifa individual.
- La administradora carga manualmente las prendas vendidas por empleada y día. La comisión se calcula como `$500 × max(0, prendas − 14)`.
- Las ventas y marcas históricas quedan almacenadas en PostgreSQL.

## Seguridad y límites

Las contraseñas se guardan con scrypt y las sesiones usan cookies HttpOnly firmadas. Configurá `SESSION_SECRET` antes de publicar. La ubicación GPS del navegador puede ser imprecisa o falsificarse; la geocerca sirve como control práctico de proximidad, no como prueba inviolable de presencia. Se necesita HTTPS en producción para que los navegadores permitan geolocalización.

El total es una estimación operativa según las horas y ventas cargadas. Revisá la liquidación antes de pagar; la app no aplica reglas de convenio, impuestos, descansos ni horas extra.
