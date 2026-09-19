import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CalendarDots,
  ChartPieSlice,
  ChatCircleText,
  CheckCircle,
  Clock,
  FilePdf,
  FileText,
  Funnel,
  Headset,
  House,
  Info,
  ListChecks,
  MagnifyingGlass,
  Plant,
  SignOut,
  SlidersHorizontal,
  UploadSimple,
  UsersThree,
  WarningCircle,
} from '@phosphor-icons/react/ssr'

// Iconos de la app: Phosphor en peso "duotone" (trazo + relleno suave). Usar siempre <Icon name="..." />
const ICONS = {
  inicio: House,
  academia: BookOpenText,
  agenda: CalendarDots,
  consultor: Headset,
  disponibilidad: Clock,
  resumen: ChartPieSlice,
  preguntas: ListChecks,
  ajustes: SlidersHorizontal,
  usuarios: UsersThree,
  salir: SignOut,
  subir: UploadSimple,
  documento: FileText,
  pdf: FilePdf,
  check: CheckCircle,
  alerta: WarningCircle,
  info: Info,
  siguiente: ArrowRight,
  atras: ArrowLeft,
  // Pasos del método CRECE
  clasificar: Funnel,
  revisar: ListChecks,
  examinar: MagnifyingGlass,
  comunicar: ChatCircleText,
  escalar: Plant,
} as const

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 20,
  weight = 'duotone',
  className,
  title,
}: {
  name: IconName
  size?: number
  weight?: 'regular' | 'duotone' | 'fill' | 'bold' | 'light' | 'thin'
  className?: string
  title?: string
}) {
  const Component = ICONS[name]
  return (
    <Component
      size={size}
      weight={weight}
      className={`shrink-0 ${className ?? ''}`}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      role={title ? 'img' : undefined}
    />
  )
}
