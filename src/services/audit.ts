import type { Db } from '@/db/client'
import { auditLog } from '@/db/schema'

export async function audit(
  db: Db,
  e: { userId: string | null; action: string; entity: string; entityId: string },
): Promise<void> {
  await db.insert(auditLog).values(e)
}
