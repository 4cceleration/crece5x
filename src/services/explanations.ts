import { and, eq } from 'drizzle-orm'
import type { Db } from '@/db/client'
import { chartExplanation } from '@/db/schema'
import type { ChartKey } from '@/domain/charts'

export async function getExplanation(db: Db, consultationId: string, key: ChartKey): Promise<string | null> {
  const row = await db.query.chartExplanation.findFirst({
    where: and(eq(chartExplanation.consultationId, consultationId), eq(chartExplanation.chartKey, key)),
  })
  return row?.text ?? null
}

/**
 * La explicación se escribe una sola vez por gráfica y consulta: tocar "?" otra vez la relee,
 * no vuelve a gastar un análisis. Las cifras de una consulta terminada ya no cambian.
 */
export async function explainOnce(
  db: Db,
  consultationId: string,
  key: ChartKey,
  write: () => Promise<string>,
): Promise<string> {
  const saved = await getExplanation(db, consultationId, key)
  if (saved) return saved

  const text = (await write()).trim()
  if (!text) throw new Error('El análisis no devolvió nada')
  const [row] = await db
    .insert(chartExplanation)
    .values({ consultationId, chartKey: key, text })
    // Si dos pestañas la piden a la vez, gana la primera y la otra la lee
    .onConflictDoNothing()
    .returning({ text: chartExplanation.text })
  return row?.text ?? (await getExplanation(db, consultationId, key)) ?? text
}
