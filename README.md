# CRECE · Consulta NIIF para pymes

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
- Base de datos: `local.db` (SQLite)
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
npm run admin -- auditoria --limite 50
```

Contra producción, anteponga las variables de Turso: `DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run admin -- resumen`.

## Diseño

Paleta verde (`brand` `#3F9B6E`, botón `#2E7D5B`) con tinta `#14213D`, títulos en Bricolage Grotesque y texto en Inter, superficies de vidrio (`glass`) sobre un fondo con manchas verdes, esquinas de 6 px y una acción principal por pantalla; los tokens viven en `src/app/globals.css`.

## Pruebas

```bash
npm test        # unitarias e integración (Vitest)
npm run e2e     # recorrido completo (Playwright)
```

El E2E usa Chromium sin interfaz (la primera vez: `npx playwright install chromium`). Levanta su propio entorno con `next build && next start` en el puerto 3100 y con base de datos, correos y archivos aparte (`.data/e2e*`), así que puede correr con `npm run dev` activo (Next no permite dos `next dev` en la misma carpeta) y no toca sus datos.

## Desplegar en Vercel

1. **Base de datos (Turso, compatible con SQLite)**
   ```bash
   turso db create crece
   turso db show crece --url          # → DATABASE_URL (libsql://…)
   turso db tokens create crece       # → DATABASE_AUTH_TOKEN
   ```
2. **Migrar y sembrar Turso** desde su máquina:
   ```bash
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:migrate
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… \
   SEED_DEMO_CONSULTANT=false npm run db:seed
   ```
3. **Proyecto en Vercel**: `vercel link`, luego crear un Blob store **privado** y conectarlo al proyecto (agrega `BLOB_READ_WRITE_TOKEN`).
4. **Variables de entorno** (Production y Preview):

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | de Turso |
   | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
   | `BETTER_AUTH_URL` | `https://su-dominio` |
   | `RESEND_API_KEY`, `MAIL_FROM` | de Resend, con dominio verificado |
   | `CRON_SECRET` | texto aleatorio |
   | `AI_MODEL` | vacío hasta elegir proveedor; luego `proveedor/modelo` del AI Gateway |
   | `AI_GATEWAY_API_KEY` | opcional en Vercel (usa OIDC); necesaria en local |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | opcionales; URI de redirección `https://su-dominio/api/auth/callback/google` |

   `vercel.json` programa el recordatorio de citas todos los días a las 13:00 UTC (8:00 en Bogotá). Vercel envía `Authorization: Bearer $CRON_SECRET` al cron; sin `CRON_SECRET` el endpoint responde 401.

5. `vercel deploy --prod`

## Elegir el proveedor de IA

El análisis usa el Vercel AI SDK con AI Gateway: basta con poner `AI_MODEL` (por ejemplo, un modelo de OpenAI o de Google) y redeplegar. No hay que cambiar código.

## Aviso

Los umbrales de clasificación (SMMLV y límites por grupo) son configurables con `npm run admin -- ajustes cambiar` y deben validarse con un contador. Los reportes son orientativos y no constituyen una opinión de auditoría.
