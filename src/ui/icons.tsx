import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Buildings,
  CalendarDots,
  ChartPieSlice,
  ChatCircleText,
  ChartBar,
  CheckCircle,
  CircleHalf,
  Clock,
  Envelope,
  Eye,
  EyeSlash,
  FilePdf,
  FileText,
  Funnel,
  Headset,
  House,
  IdentificationCard,
  Info,
  ListChecks,
  Lock,
  MagnifyingGlass,
  Moon,
  Plant,
  Question,
  SignIn,
  SignOut,
  SlidersHorizontal,
  Sun,
  UploadSimple,
  User,
  UserPlus,
  UsersThree,
  WarningCircle,
  XCircle,
} from '@phosphor-icons/react/ssr'

// Iconos de la app: Phosphor en peso "duotone" (trazo + relleno suave). Usar siempre <Icon name="..." />
const ICONS = {
  inicio: House,
  academia: BookOpenText,
  agenda: CalendarDots,
  consultor: Headset,
  disponibilidad: Clock,
  resumen: ChartPieSlice,
  analitica: ChartBar,
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
  ver: Eye,
  ocultar: EyeSlash,
  claro: Sun,
  oscuro: Moon,
  siguiente: ArrowRight,
  atras: ArrowLeft,
  // Acceso y formularios
  correo: Envelope,
  contrasena: Lock,
  persona: User,
  empresa: Buildings,
  nit: IdentificationCard,
  ingresar: SignIn,
  registrarse: UserPlus,
  // Respuestas del diagnóstico
  si: CheckCircle,
  parcial: CircleHalf,
  no: XCircle,
  nose: Question,
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
