# CRECE — Consulta financiera NIIF para pymes

Fecha: 2026-09-19 · Estado: aprobado para plan

## 1. Propósito

Plataforma web que funciona como una "consulta médica financiera" para pequeñas y medianas empresas: diagnostica su nivel de aplicación de las NIIF, analiza sus estados financieros con un agente de IA, entrega un reporte (pantalla, PDF y correo), deriva a un consultor humano con agenda cuando hace falta y enseña a aplicar la norma.

Agnóstica al sector: el contenido se activa por **lo que la empresa hace** (tiene inventarios, activos fijos, arrendamientos, deuda, empleados…), nunca por su código de actividad.

País inicial: Colombia (Decreto 2420/2015 — Grupo 1 NIIF Plenas, Grupo 2 NIIF para Pymes, Grupo 3 microempresas). Los umbrales viven en configuración para poder añadir países.

Fuera de alcance: landing page, pagos, app móvil, opinión de auditoría.

## 2. Método CRECE

| Paso | Metáfora | Qué ocurre |
|---|---|---|
| **C**lasificar | Triage | Ingresos, activos, empleados y si emite valores → Grupo 1/2/3 con explicación corta |
| **R**evisar | Anamnesis | Cuestionario adaptativo en 5 dimensiones |
| **E**xaminar | Exámenes | Carga de estados financieros (PDF/Excel) y análisis por agente IA (opcional) |
| **C**omunicar | Diagnóstico | Índice de Salud NIIF 0–100, hallazgos priorizados, plan de acción, PDF y correo |
| **E**scalar / Educar | Tratamiento | Derivación a consultor con agenda + ruta personalizada en la Academia |

### 2.1 Dimensiones del diagnóstico (peso en el índice)

1. **D1 Estados financieros completos** (25) — ESF, ERI, flujo de efectivo, cambios en el patrimonio, notas, comparativos.
2. **D2 Políticas contables** (20) — manual de políticas, aprobado, aplicado, actualizado.
3. **D3 Reconocimiento y medición** (25) — preguntas condicionadas por banderas de aplicabilidad: inventarios, propiedades planta y equipo, arrendamientos, instrumentos financieros/cartera, ingresos, impuesto diferido, beneficios a empleados, provisiones.
4. **D4 Revelaciones** (15) — notas mínimas, juicios y estimaciones, hechos posteriores, partes relacionadas.
5. **D5 Procesos de cierre** (15) — conciliaciones, cortes, software contable, periodicidad del cierre.

Las banderas de aplicabilidad se preguntan al inicio del paso R ("¿Tiene inventarios?", "¿Tiene activos fijos?", "¿Tiene contratos de arriendo?", "¿Tiene créditos o cartera?", "¿Tiene empleados?"). Una pregunta con `requiresFlag` sólo aparece si la bandera es verdadera.

### 2.2 Índice de Salud NIIF

- Cada respuesta puntúa: Sí = 1, Parcial = 0.5, No = 0, No sé = 0.
- Cada pregunta tiene peso `w` (1–3) y lista de grupos a los que aplica (p. ej. flujo de efectivo, cambios en el patrimonio e impuesto diferido no aplican al Grupo 3). Puntaje de dimensión = Σ(w·s) / Σ(w aplicables) × 100.
- Índice diagnóstico = promedio ponderado de dimensiones (pesos de 2.1; se renormaliza si una dimensión queda sin preguntas aplicables).
- Si hay análisis de estados financieros: puntaje de análisis = max(0, 100 − Σ penalizaciones) con crítica 20, alta 10, media 5, baja 2. Índice final = 0.6 · diagnóstico + 0.4 · análisis. Sin análisis, índice final = diagnóstico.
- Semáforo: ≥ 80 verde, 60–79 ámbar, < 60 rojo.

### 2.3 Reglas de derivación a consultor

Se ofrece agenda (acción principal del resultado) si cualquiera se cumple:
- La empresa indica que no tiene estados financieros.
- Índice final < 60.
- Existe al menos un hallazgo de severidad crítica.

En otro caso, la acción principal es "Ver mi ruta de aprendizaje" y la agenda queda como acción secundaria.

### 2.4 Clasificación (Colombia)

Regla parametrizada en `settings` (valores por defecto a validar por un contador antes de producción):
- Grupo 1 si emite valores o es entidad de interés público, o activos > 30.000 SMMLV, o planta > 200 empleados (simplificación del Decreto 2420: los criterios reales del Grupo 1 incluyen condiciones adicionales, p. ej. matrices o subordinadas que reportan en NIIF plenas).
- Grupo 3 si planta ≤ 10 y activos < 500 SMMLV e ingresos < 6.000 SMMLV.
- Grupo 2 en otro caso.
- SMMLV configurable. La explicación indica cuál condición determinó el grupo.

## 3. Agente analista IA

Pipeline en tres capas:

1. **Extracción** — Excel → tablas con SheetJS; PDF → texto con `unpdf`. El texto se envía al modelo con `generateObject` y un esquema Zod: estados detectados, partidas principales por período (activo corriente/no corriente, pasivo corriente/no corriente, patrimonio, ingresos, costos, gastos, utilidad neta, efectivo inicial/final, flujos por actividad), notas presentes.
2. **Chequeos determinísticos (código, sin IA)** — activo = pasivo + patrimonio (tolerancia 0.5%), subtotales corriente + no corriente = total en activo y pasivo, efectivo final del flujo = efectivo del ESF, efectivo inicial + flujos = efectivo final, presencia de los estados obligatorios según grupo (Grupo 1–2: ESF, ERI, flujo, cambios en el patrimonio, notas; Grupo 3: ESF, ERI, notas), existencia de comparativo. Cada falla es un hallazgo con severidad fija.
3. **Criterio IA** — con los datos extraídos y el grupo, el modelo devuelve hallazgos `{titulo, detalle, seccionNiif, severidad, recomendacion}` sobre presentación, revelaciones y señales de tratamientos no NIIF.

Además se calculan indicadores en código: razón corriente, prueba ácida (si hay inventarios), endeudamiento, margen neto, ROA.

**Proveedor agnóstico**: Vercel AI SDK con AI Gateway. El modelo se define en `AI_MODEL` (formato `proveedor/modelo`). Si `AI_MODEL` está vacío, se usa un analista simulado que devuelve un resultado de ejemplo, para desarrollo y pruebas.

Todo reporte incluye: "Este reporte es orientativo y no constituye una opinión de auditoría".

## 4. Módulos

| # | Módulo | Responsabilidad |
|---|---|---|
| 1 | Identidad | Registro, sesión, roles (empresa, consultor, admin), empresa y miembros, consentimiento Ley 1581 |
| 2 | Clasificador | Función pura `classify(input, settings)` + pantalla paso C |
| 3 | Diagnóstico | Banco de preguntas, banderas, respuestas con guardado automático, pantalla paso R |
| 4 | Índice | Funciones puras `scoreDiagnostic`, `scoreAnalysis`, `finalIndex`, `trafficLight` |
| 5 | Carga | Subida PDF/XLSX (máx. 4 MB por archivo, límite de cuerpo de Vercel) a almacenamiento privado vía interfaz `Storage`; una sola zona de carga, la IA detecta qué estados contiene |
| 6 | Analista IA | Pipeline extracción → chequeos → criterio, indicadores |
| 7 | Reportes | Vista de resultado, PDF con `@react-pdf/renderer`, historial |
| 8 | Agenda | Disponibilidad semanal del consultor, reserva en 3 pasos (día → hora → confirmar) con consultor asignado automáticamente (el de menor carga), cancelación, `.ics`, recordatorio diario por Vercel Cron |
| 9 | Notificaciones | Interfaz `Mailer`: reporte, confirmación y recordatorio de cita, aviso al consultor |
| 10 | Academia | Guías MDX por sección NIIF Pymes, glosario, ruta según brechas, progreso |
| 11 | Portal empresa | Inicio con índice actual y una acción principal |
| 12 | Panel consultor | Citas, casos, reporte del cliente, notas |
| 13 | Administración | Resumen (métricas simples), preguntas y pesos, ajustes (umbrales, reglas), usuarios (roles, crear consultor). El contenido de la Academia vive en el código |

Transversales: `audit_log` (subidas, vistas de reportes, cambios admin), autorización por empresa en cada consulta a datos, aviso legal.

## 5. Arquitectura

- **Next.js 16** App Router, TypeScript, Server Components + Server Actions. Un solo proyecto.
- **Base de datos**: Drizzle ORM + `@libsql/client`. Local: `DATABASE_URL=file:local.db` (SQLite). Vercel: Turso (`libsql://…` + `DATABASE_AUTH_TOKEN`). Mismo esquema y migraciones.
- **Auth**: Better Auth con adaptador Drizzle, email + contraseña. Rol en la tabla de usuario.
- **Archivos**: interfaz `Storage` → local `./.data/uploads` en desarrollo, Vercel Blob (privado) en producción, según `BLOB_READ_WRITE_TOKEN`.
- **Correo**: interfaz `Mailer` → en desarrollo imprime en consola y guarda en `./.data/emails/*.html`; en producción Resend si existe `RESEND_API_KEY`.
- **IA**: AI SDK + Gateway (ver §3).
- **UI**: Tailwind CSS v4, componentes propios mínimos (sin librería pesada de UI).
- **Pruebas**: Vitest para lógica pura (clasificador, índice, chequeos, derivación, disponibilidad), Playwright para un recorrido completo.

### 5.1 Modelo de datos

- `user`, `session`, `account`, `verification` (Better Auth) — `user.role ∈ {empresa, consultor, admin}`.
- `company` (id, nit, name, country, createdAt) · `company_member` (companyId, userId).
- `consultation` (id, companyId, status ∈ {clasificar, revisar, examinar, resultado}, group, classificationInput JSON, flags JSON, diagnosticScore, analysisScore, finalScore, needsConsultant, createdAt, completedAt).
- `question` (id, dimension, text, help, gap, fix, weight, requiresFlag nullable, groups JSON, niifSection, lesson, order, active) · `answer` (consultationId, questionId, value ∈ {si, parcial, no, nose}).
- `upload` (id, consultationId, fileName, storageKey, mime, size) · `analysis` (id, consultationId, status ∈ {pendiente, procesando, listo, error}, extracted JSON, ratios JSON, error).
- `finding` (id, consultationId, source ∈ {diagnostico, chequeo, ia}, title, detail, niifSection, severity ∈ {critica, alta, media, baja}, recommendation).
- `availability` (consultantId, weekday, startMinute, endMinute) · `appointment` (id, consultantId, companyId, consultationId, startsAt, endsAt, status ∈ {reservada, cancelada, realizada}, notes, remindedAt).
- `lesson_progress` (userId, lessonSlug, completedAt).
- `setting` (key, value JSON) · `audit_log` (id, userId, action, entity, entityId, at).

Los hallazgos de diagnóstico se generan a partir de respuestas "No"/"No sé" en preguntas de peso 3 (alta) o 2 (media).

## 6. Diseño de interfaz

Principios:
- **Ley de Hick**: una sola acción principal por pantalla; como máximo 3 opciones visibles a la vez; el diagnóstico muestra **una pregunta por pantalla** con 4 respuestas fijas (Sí / Parcial / No / No sé).
- **Minimal**: sin bordes decorativos ni tarjetas anidadas. Jerarquía con tipografía y espacio en blanco. Divisores sólo donde separan contenido de verdad. Textos cortos; ayudas sólo bajo demanda ("¿Qué significa?").
- Sin landing: `/` redirige a `/entrar` o a `/inicio` según sesión.

Paleta:
- Naranja acento (índice, progreso, foco): `#F26B1D`; naranja de botón `#C2490F` con texto blanco (contraste 4.9:1), hover `#A93E0C`; fondo suave `#FFF4EC`.
- Azul tinta (texto/estructura): `#14213D`, secundario `#5B6477`.
- Fondo `#FFFFFF`, superficie `#F7F7F5`.
- Semáforo: verde `#2F9E6B`, ámbar `#E0A100`, rojo `#D64545` (sólo en índice y severidades).
- Tipografía: Inter (Google Fonts vía `next/font`).

Navegación empresa (3 ítems): **Inicio · Academia · Agenda**. Consultor: **Agenda · Disponibilidad** (los casos se abren desde cada cita). Admin: **Resumen · Preguntas · Ajustes · Usuarios**.

### 6.1 Rutas

- `/entrar`, `/registro`
- `/inicio` — índice actual (número grande + semáforo) y un botón: "Iniciar consulta" / "Continuar consulta"
- `/consulta/[id]/clasificar` → `/revisar` → `/examinar` → `/resultado` (barra de progreso de 5 pasos C-R-E-C-E, texto mínimo)
- `/academia`, `/academia/[slug]`
- `/agenda` (empresa: reservar/ver cita) — elegir día → elegir hora → confirmar
- `/consultor`, `/consultor/disponibilidad`, `/consultor/casos/[appointmentId]`
- `/admin`, `/admin/preguntas`, `/admin/ajustes`, `/admin/usuarios`

## 7. Manejo de errores

- Archivo inválido o > 4 MB: mensaje en línea, sin subir.
- Fallo del modelo o de extracción: `analysis.status = error`, el resultado se muestra sólo con el diagnóstico e indica "No pudimos leer tus estados financieros" + reintentar.
- Correo fallido: se registra y el reporte sigue disponible en pantalla.
- Reserva en horario ya tomado: se valida en servidor dentro de una transacción; se pide elegir otro horario.

## 8. Pruebas

- Unitarias (Vitest): `classify`, `scoreDiagnostic`, `scoreAnalysis`, `finalIndex`, `needsConsultant`, chequeos determinísticos, indicadores, generación de hallazgos de diagnóstico, cálculo de franjas disponibles.
- Integración: acciones de servidor con base SQLite en memoria.
- E2E (Playwright): registro → consulta completa con proveedor IA simulado → resultado → reserva de cita → correo guardado en `.data/emails`.

## 9. Despliegue

- Local: `npm run db:migrate && npm run db:seed && npm run dev` (seed crea preguntas, settings, un consultor y un admin de prueba).
- Vercel: variables `DATABASE_URL`, `DATABASE_AUTH_TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `AI_GATEWAY_API_KEY`, `AI_MODEL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `MAIL_FROM`, `CRON_SECRET`. Migraciones contra Turso con `drizzle-kit migrate`.

## 10. Fases

1. Base: proyecto, diseño base, BD, auth, roles.
2. Clasificar + Revisar + Índice.
3. Examinar: carga + analista IA.
4. Comunicar: resultado, PDF, correo.
5. Escalar: agenda + derivación.
6. Academia.
7. Paneles consultor y admin.
8. Despliegue Vercel + E2E.
