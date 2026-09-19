import { generateText, Output } from 'ai'
import type { Analyst } from './analyst'
import { extractedSchema, judgeSchema } from './schemas'

const EXTRACT_SYSTEM = `Eres contador público experto en NIIF para pymes en Colombia.
Extrae las cifras de los estados financieros del texto.
- Usa solo lo que aparece en el texto. Si un dato no aparece, usa null. No inventes cifras.
- Expresa los valores en unidades monetarias completas: si el documento dice "en miles de pesos", multiplica por 1000.
- Ordena los períodos del más reciente al más antiguo.
- Marca cada estado financiero como presente solo si el texto lo contiene.`

const JUDGE_SYSTEM = `Eres revisor de estados financieros bajo NIIF en Colombia.
Recibes el grupo NIIF de la empresa (1: NIIF plenas, 2: NIIF para Pymes, 3: marco simplificado de microempresas), las cifras extraídas y el texto original.
Identifica hasta 8 hallazgos sobre presentación, revelaciones y señales de tratamientos contables que no siguen el marco que le aplica.
- No repitas errores aritméticos ni estados faltantes: se revisan aparte.
- Cita la sección de la NIIF para Pymes en niifSection, por ejemplo "Sección 13".
- Severidad: "critica" solo si las cifras no son confiables; "alta" si incumple un requerimiento importante; "media" para revelaciones incompletas; "baja" para mejoras de forma.
- Escribe en español claro, para el gerente de una pyme. Frases cortas.`

export function gatewayAnalyst(model: string): Analyst {
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
    async judge({ text, extracted, group }) {
      const { output } = await generateText({
        model,
        system: JUDGE_SYSTEM,
        prompt: JSON.stringify({ grupo: group, cifras: extracted, texto: text.slice(0, 30_000) }),
        output: Output.object({ schema: judgeSchema }),
      })
      return output.findings
    },
  }
}
