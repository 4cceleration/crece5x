# crece5x · Consulta NIIF para pymes

Diagnóstico, análisis de estados financieros con IA, agenda con consultores y academia NIIF.
Método **CRECE**: Clasificar → Revisar → Examinar → Comunicar → Escalar/Educar.

## Correr en local

```bash
cp .env.example .env          # y poner BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

- App: http://localhost:3000
- Consultor demo: `consultor@crece.local` / `Consultor123!`
- Base de datos: PostgreSQL. En local, PGlite en `.data/pglite` (sin servidor; detenga `npm run dev` antes de usar la CLI o migrar contra la base local). En Vercel, Neon
- Correos: se guardan en `.data/emails/` (abra el `.html`)
- Archivos subidos: `.data/uploads/`
- IA: con `AI_MODEL` vacío se usa un analista simulado
- Opcional: `MAIL_DIR` y `UPLOAD_DIR` cambian esas carpetas; `MAIL_DIR` guarda los correos en archivos incluso en producción (lo usa la prueba E2E)

**Si el puerto 3000 está ocupado**, corra `npm run dev -- --port 3001` y ponga `BETTER_AUTH_URL=http://localhost:3001` en `.env`. Esa URL se usa en los enlaces de los correos y en el retorno de Google, así que debe coincidir con el puerto real.

## Acceso

- **Correo y contraseña**: el registro pide la empresa, el NIT y el consentimiento de datos (Ley 1581 de 2012).
- **Recuperar contraseña**: en `/entrar`, «¿Olvidaste tu contraseña?» lleva a `/recuperar`. Llega un correo con un enlace válido por una hora que abre `/restablecer`. En local el correo queda en `.data/emails/`; en producción se envía con Resend (`RESEND_API_KEY` y `MAIL_FROM`).
- **Google (opcional)**: cree un ID de cliente OAuth de tipo «Aplicación web» en Google Cloud Console y agregue como URI de redirección autorizada `<BETTER_AUTH_URL>/api/auth/callback/google` (por ejemplo `http://localhost:3000/api/auth/callback/google` en local y `https://su-dominio/api/auth/callback/google` en producción). Luego ponga `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`. Sin ellas el botón «Continuar con Google» no aparece. Quien entra por primera vez con Google completa su empresa, el NIT y el consentimiento en `/empresa`.

## Roles

| Rol | Pantallas |
|---|---|
| Empresa | Inicio, consulta (Clasificar → Revisar → Examinar → Resultado), Academia, Agenda |
| Consultor | Agenda, casos con el reporte del cliente y notas, Disponibilidad |

No hay panel web de administración: la administración se hace con la CLI (ver abajo).

## Consulta: contador o empresario

La consulta empieza preguntando quién va a responder y después cómo lleva la contabilidad (formal o empírica). El **contador** ve las preguntas técnicas; el **empresario**, las mismas en palabras sencillas (`simpleText` y `simpleHelp` en `src/db/questions.ts`). El puntaje, los hallazgos y el reporte son los mismos para los dos, y la elección se puede cambiar en Clasificar sin perder respuestas.

Revisar es un solo recorrido con una sola barra de progreso: cada pregunta de Sí/No («¿Maneja inventarios?») va justo antes de las preguntas que abre. Si se cambian los textos del banco, `npm run db:seed` los actualiza en la base.

## Administración (CLI)

Por seguridad no hay pantallas de administración en la web. Quien administra necesita acceso a la base de datos (`DATABASE_URL` y `DATABASE_AUTH_TOKEN`); cada cambio queda en `audit_log` con el usuario del sistema que lo hizo.

```bash
npm run admin -- ayuda
npm run admin -- resumen
npm run admin -- preguntas listar [--dimension D1..D5]
npm run admin -- preguntas editar d5-software --peso 3 --activa no
npm run admin -- ajustes ver
npm run admin -- ajustes cambiar smmlv 1.750.905
npm run admin -- usuarios listar
npm run admin -- usuarios rol correo@empresa.com consultor
npm run admin -- usuarios crear-consultor --nombre "Laura Pérez" --correo laura@empresa.com
npm run admin -- usuarios clave laura@empresa.com
npm run admin -- auditoria --limite 50
```

Contra producción, use la conexión de Neon: `DATABASE_URL=<DATABASE_URL_UNPOOLED> npm run admin -- resumen`.

## Diseño

Paleta de marca: `brand` `#0F6B5C` (acciones primarias y enlaces), `brand-strong` `#0B4F44` (hover y presionado), `accent` `#E8A33D` (énfasis puntual, nunca fondos grandes), `success` `#2F8A5B`, `danger` `#B03A30`, `ink` `#1E2422`, `muted` `#52605A`, `surface-100` `#FAF8F4` (fondo), `surface-200` `#FFFFFF` (tarjetas) y `border` `#DFDACF`. El modo oscuro deriva de los mismos tonos. Todo en Inter, con la jerarquía por peso: negrita en títulos, seminegrita en secciones, media en etiquetas y regular en el texto. Superficies de vidrio (`glass`) con brillos en el verde de la marca, esquinas de 6 px y una acción principal por pantalla. Los tokens viven en `src/app/globals.css`, con su nombre en la guía anotado al lado.

## Pruebas

```bash
npm test        # unitarias e integración (Vitest)
npm run e2e     # recorrido completo (Playwright)
```

El E2E usa Chromium sin interfaz (la primera vez: `npx playwright install chromium`). Levanta su propio entorno con `next build && next start` en el puerto 3100 y con base de datos, correos y archivos aparte (`.data/e2e*`), así que puede correr con `npm run dev` activo (Next no permite dos `next dev` en la misma carpeta) y no toca sus datos.

## Desplegar en Vercel

Producción: **https://crece5x.vercel.app** (proyecto `crece5x`).

- **Base de datos**: Neon (Marketplace de Vercel), conectada al proyecto; crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
  Migrar y sembrar desde su máquina con la conexión directa:
  ```bash
  vercel env pull .data/vercel-prod.env --environment=production
  DATABASE_URL=<DATABASE_URL_UNPOOLED> npm run db:migrate
  DATABASE_URL=<DATABASE_URL_UNPOOLED> SEED_DEMO_CONSULTANT=false npm run db:seed
  ```
- **Archivos**: Vercel Blob privado `crece5x-archivos` (`BLOB_READ_WRITE_TOKEN`).
- **IA**: `AI_MODEL=groq/openai/gpt-oss-120b` con `GROQ_API_KEY`.
- **Correo**: Resend (`RESEND_API_KEY`, `MAIL_FROM` con dominio verificado).
- **Otras**: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=https://crece5x.vercel.app`, `CRON_SECRET`. En despliegues de vista previa la URL sale de `VERCEL_URL`.
- Desplegar: `vercel deploy --prod`.

## Elegir el proveedor de IA

El análisis usa el Vercel AI SDK con AI Gateway: basta con poner `AI_MODEL` (por ejemplo, un modelo de OpenAI o de Google) y redeplegar. No hay que cambiar código.

## Aviso

Los umbrales de clasificación (SMMLV y límites por grupo) son configurables con `npm run admin -- ajustes cambiar` y deben validarse con un contador. Los reportes son orientativos y no constituyen una opinión de auditoría.
