import { FIGURE_FIELDS, type Figures } from '@/domain/figures'
import { MoneyField } from '@/ui/money-field'
import { SubmitButton } from '@/ui/submit-button'
import { Icon } from '@/ui/icons'

// Cifras que tiene a la mano: las tres primeras son obligatorias, el resto se deja en blanco si no aplica
export function FiguresForm({ action, defaults }: { action: (fd: FormData) => Promise<void>; defaults?: Figures | null }) {
  return (
    <form action={action} className="space-y-6 text-left">
      <div className="space-y-5">
        {FIGURE_FIELDS.map((f) => (
          <MoneyField
            key={f.key}
            label={f.label}
            hint={f.hint}
            suffix="COP"
            name={f.key}
            required={f.required}
            defaultValue={defaults?.[f.key] || undefined}
          />
        ))}
      </div>
      <SubmitButton className="w-full gap-2" pendingLabel="Calculando…">
        <Icon name="examinar" size={20} />
        Analizar mis cifras
      </SubmitButton>
    </form>
  )
}
