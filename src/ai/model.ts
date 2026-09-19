import { createGroq } from '@ai-sdk/groq'
import type { LanguageModel } from 'ai'

// AI_MODEL:
//   'groq/<modelo>'  → Groq directo con GROQ_API_KEY (p. ej. groq/openai/gpt-oss-120b)
//   '<proveedor>/<modelo>' → Vercel AI Gateway (AI_GATEWAY_API_KEY u OIDC en Vercel)
export function resolveModel(id: string): LanguageModel {
  if (id.startsWith('groq/')) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error('AI_MODEL usa Groq pero falta GROQ_API_KEY')
    return createGroq({ apiKey })(id.slice('groq/'.length))
  }
  return id
}
