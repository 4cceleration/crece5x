import { generateText, Output, type LanguageModel } from 'ai'
import type { Analyst } from './analyst'
import { extractedSchema, judgeSchema } from './schemas'

const EXTRACT_SYSTEM = `Eres contador público experto en NIIF para pymes en Colombia.
Extrae las cifras de los estados financieros del texto.
- Usa solo lo que aparece en el texto. Si un dato no aparece, usa null. No inventes cifras.
- Expresa los valores en unidades monetarias completas: si el documento dice "en miles de pesos", multiplica por 1000.
- Ordena los períodos del más reciente al más antiguo.
- Marca cada estado financiero como presente solo si el texto lo contiene.`

const JUDGE_SYSTEM = `Eres revisor de estados financieros bajo NIIF en Colombia.
Recibes el grupo NIIF de la empresa (1: NIIF plenas, 2: NIIF para Pymes, 3: marco simplificado de microempresas), las cifras extraídas, los hallazgos que YA detectó el sistema y el texto original.
Identifica hasta 8 hallazgos NUEVOS sobre políticas, reconocimiento, medición y revelaciones que no siguen el marco que le aplica.
- NO repitas nada de "hallazgos_ya_detectados" (estados faltantes, cuadres, comparativos): ya se reportan.
- NO comentes formato (signos, orden de filas, nombres de totales).
- Prioriza tratamientos contrarios a la norma sobre simples faltas de detalle. Ejemplo: depreciar con tasas fiscales en lugar de la vida útil es un incumplimiento (alta), no una revelación incompleta.
- Cita la sección correcta de la NIIF para Pymes en niifSection, usando este mapa:
  3 presentación general y comparativos · 4 situación financiera · 5 resultados · 6 cambios en el patrimonio · 7 flujos de efectivo · 8 notas y políticas · 10 políticas, estimaciones y errores · 11 instrumentos financieros básicos (cartera, préstamos) · 13 inventarios · 17 propiedades, planta y equipo · 20 arrendamientos · 21 provisiones · 23 ingresos · 27 deterioro · 28 beneficios a empleados · 29 impuesto a las ganancias · 32 hechos posteriores · 33 partes relacionadas.
- Severidad: "critica" solo si las cifras no son confiables; "alta" si un tratamiento contradice la norma; "media" para revelaciones incompletas; "baja" para mejoras menores.
- Escribe en español claro, para el gerente de una pyme. Frases cortas.`

// `model`: id del AI Gateway ('proveedor/modelo') o un modelo ya resuelto (p. ej. Groq)
export function gatewayAnalyst(model: LanguageModel): Analyst {
  return {
    async extract(text) {
      const { output } = await generateText({
        model,
        system: EXTRACT_SYSTEM,
        prompt: text.slice(0, 60_000),
        output: Output.object({ schema: extractedSchema }),
      })
      return output
    },
    async judge({ text, extracted, group, alreadyFound = [] }) {
      const { output } = await generateText({
        model,
        system: JUDGE_SYSTEM,
        prompt: JSON.stringify({ grupo: group, cifras: extracted, hallazgos_ya_detectados: alreadyFound, texto: text.slice(0, 30_000) }),
        output: Output.object({ schema: judgeSchema }),
      })
      return output.findings
    },
  }
}
