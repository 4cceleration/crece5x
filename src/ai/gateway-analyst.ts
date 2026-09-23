import { generateText, Output, type LanguageModel } from 'ai'
import type { Analyst } from './analyst'
import { extractedSchema, judgeSchema } from './schemas'

const EXTRACT_SYSTEM = `Eres contador público experto en NIIF para pymes en Colombia.
Extrae las cifras de los estados financieros del texto.
- Usa solo lo que aparece en el texto. Si un dato no aparece, usa null. No inventes cifras.
- Expresa los valores en unidades monetarias completas: si el documento dice "en miles de pesos", multiplica por 1000.
- Ordena los períodos del más reciente al más antiguo.
- Marca cada estado financiero como presente solo si el texto lo contiene.`

// La empresa no tiene estados financieros: sube su declaración de renta, un balance de prueba o reportes del software
const EXTRACT_PARTIAL = `
Estos archivos NO son estados financieros: son la declaración de renta (formulario 110), un balance de prueba o reportes del software contable.
- Reconstruye las cifras del estado de situación financiera y del estado de resultados a partir de ellos. En el balance de prueba, suma las cuentas del PUC por clase: 1 activo (11 disponible = efectivo; 14 inventarios), 2 pasivo, 3 patrimonio, 4 ingresos. En el formulario 110 usa los renglones de patrimonio bruto, deudas, patrimonio líquido, ingresos brutos y renta líquida.
- Marca todos los estados en statements como false: no hay estados financieros formales.
- cashFlow es null.`

const JUDGE_SYSTEM = `Eres revisor de estados financieros bajo NIIF en Colombia.
Recibes el grupo NIIF de la empresa (1: NIIF plenas, 2: NIIF para Pymes, 3: marco simplificado de microempresas), las cifras extraídas, los hallazgos que YA detectó el sistema y el texto original.
Identifica hasta 8 hallazgos NUEVOS sobre políticas, reconocimiento, medición y revelaciones que no siguen el marco que le aplica.
- NO repitas nada de "hallazgos_ya_detectados" (estados faltantes, cuadres, comparativos): ya se reportan.
- NO comentes formato (signos, orden de filas, nombres de totales).
- Prioriza tratamientos contrarios a la norma sobre simples faltas de detalle. Ejemplo: depreciar con tasas fiscales en lugar de la vida útil es un incumplimiento (alta), no una revelación incompleta.
- Cita la sección correcta de la NIIF para Pymes en niifSection, usando este mapa:
  3 presentación general y comparativos · 4 situación financiera · 5 resultados · 6 cambios en el patrimonio · 7 flujos de efectivo · 8 notas y políticas · 10 políticas, estimaciones y errores · 11 instrumentos financieros básicos (cartera, préstamos) · 13 inventarios · 17 propiedades, planta y equipo · 20 arrendamientos · 21 provisiones · 23 ingresos · 27 deterioro · 28 beneficios a empleados · 29 impuesto a las ganancias · 32 hechos posteriores · 33 partes relacionadas.
- Severidad: "critica" solo si las cifras no son confiables; "alta" si un tratamiento contradice la norma; "media" para revelaciones incompletas; "baja" para mejoras menores.
- Escribe en español claro, para el gerente de una pyme. Frases cortas.
- Si "preliminar" es true, el texto es una declaración de renta, un balance de prueba o reportes del software, no estados financieros: no reportes que faltan estados, notas o revelaciones (ya se reporta). Enfócate en lo que las cifras sugieren sobre reconocimiento y medición, y en las diferencias típicas entre lo fiscal y las NIIF.`

const EXPLAIN_SYSTEM = `Le explicas una gráfica al gerente de una pyme colombiana. No es contador.
Recibes el título de la gráfica y exactamente los datos que la empresa está viendo, con las cifras ya escritas como aparecen en pantalla.
Escribe tres párrafos cortos, en este orden y sin títulos:
1. Analista: qué muestra la gráfica y qué cambió. Cita dos o tres cifras, copiadas tal cual te llegan ("$ 3,2 billones"); nunca escribas el número completo ni inventes cálculos.
2. Estratega: qué significa para el negocio y qué lo explica. Nombra el riesgo o la oportunidad principal.
3. Coach: uno o dos pasos concretos para este trimestre, en tono cercano y directo. Alienta sin adular y sin regañar.
Reglas: trato de usted, frases cortas, español claro, sin tecnicismos sin explicar, sin listas, sin markdown y máximo 130 palabras en total. Usa solo los datos recibidos: si algo no está, dilo en una frase en vez de suponerlo.`

// `model`: id del AI Gateway ('proveedor/modelo') o un modelo ya resuelto (p. ej. Groq)
export function gatewayAnalyst(model: LanguageModel): Analyst {
  return {
    async extract(text, { preliminary = false } = {}) {
      const { output } = await generateText({
        model,
        system: preliminary ? EXTRACT_SYSTEM + EXTRACT_PARTIAL : EXTRACT_SYSTEM,
        prompt: text.slice(0, 60_000),
        output: Output.object({ schema: extractedSchema }),
      })
      return output
    },
    async judge({ text, extracted, group, alreadyFound = [], preliminary = false }) {
      const { output } = await generateText({
        model,
        system: JUDGE_SYSTEM,
        prompt: JSON.stringify({ grupo: group, preliminar: preliminary, cifras: extracted, hallazgos_ya_detectados: alreadyFound, texto: text.slice(0, 30_000) }),
        output: Output.object({ schema: judgeSchema }),
      })
      return output.findings
    },
    async explain({ title, facts, group, companyName }) {
      const { text } = await generateText({
        model,
        system: EXPLAIN_SYSTEM,
        prompt: JSON.stringify({ grafica: title, empresa: companyName, grupo_niif: group, datos: facts }),
      })
      return text.trim()
    },
  }
}
