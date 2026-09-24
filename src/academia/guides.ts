// Guías basadas en la NIIF para Pymes vigente en Colombia (Anexo 2 del Decreto 2420 de 2015 y modificatorios).
// Todas tienen la misma estructura, escrita para el empresario; el detalle técnico va en "Para su contador".
// **negrita** marca los términos clave.

export type Guide = {
  /** En pocas palabras: la idea de la guía en una frase */
  lead: string
  /** Por qué le importa a la empresa */
  why: string
  /** Lo que pide la norma, en viñetas cortas */
  rules: string[]
  /** Un caso con cifras: el caso, sus cifras (concepto y valor) y la conclusión */
  example: { case: string; rows: [string, string][]; result: string }
  steps: string[]
  /** Error frecuente y cómo evitarlo */
  mistake: { text: string; avoid: string }
  /** Revise antes del cierre */
  checklist: string[]
  /** Para su contador: secciones y detalle técnico */
  technical: string[]
}

export const GUIDES: Record<string, Guide> = {
  presentacion: {
    lead: 'Un juego completo son cinco informes que, juntos, muestran lo que la empresa tiene, lo que debe, lo que ganó y cómo se movió su dinero.',
    why: 'Son lo primero que piden los bancos, los socios y la DIAN. Si falta alguno o las cifras no se comparan con el año anterior, la empresa no cumple la norma y pierde credibilidad cuando pide un crédito.',
    rules: [
      'Un juego completo tiene cinco piezas: **estado de situación financiera** (balance), **estado de resultados**, **estado de cambios en el patrimonio**, **estado de flujos de efectivo** y **notas**.',
      'Las microempresas del **Grupo 3** presentan un juego más corto: balance, estado de resultados y notas.',
      'Cada cifra va al lado de la del **año anterior**, para poder comparar.',
      'En el balance, lo que se cobra o se paga en los próximos 12 meses es **corriente**; lo demás, **no corriente**.',
      'Se preparan al menos **una vez al año**, suponiendo que la empresa seguirá funcionando (**negocio en marcha**).',
    ],
    example: {
      case: 'Una panadería cierra el año y su software le entrega el balance y el estado de resultados. ¿Ya tiene sus estados financieros?',
      rows: [
        ['Balance y estado de resultados', 'Los entrega el software'],
        ['Columna del año anterior', 'Falta'],
        ['Cambios en el patrimonio y flujo de efectivo', 'Faltan'],
        ['Notas', 'Faltan'],
      ],
      result: 'Tiene 2 de las 5 piezas y sin comparativos: todavía no son estados financieros completos.',
    },
    steps: [
      'Parta del balance de prueba cerrado y conciliado.',
      'Agrupe las cuentas en las líneas del balance y del estado de resultados.',
      'Agregue la columna del año anterior.',
      'Con esas cifras, prepare el estado de cambios en el patrimonio y el flujo de efectivo.',
      'Redacte las notas y llévelos a la asamblea o junta de socios para su aprobación.',
    ],
    mistake: {
      text: 'Entregar solo los dos informes que genera el software, sin comparativos ni notas.',
      avoid: 'Use una lista con las cinco piezas y no dé por cerrado el año hasta tenerlas todas.',
    },
    checklist: [
      'Están las cinco piezas (o las tres del Grupo 3).',
      'Cada estado trae la columna del año anterior.',
      'El balance cuadra: activos = pasivos + patrimonio.',
      'La utilidad del estado de resultados es la misma que entra al patrimonio.',
    ],
    technical: [
      'Secciones 3 a 6 de la NIIF para Pymes.',
      'Sección 3: declaración explícita de cumplimiento, hipótesis de negocio en marcha, información comparativa y materialidad.',
      'Sección 4: clasificación corriente y no corriente. Sección 5: resultado integral en uno o dos estados. Sección 6: cambios en el patrimonio.',
    ],
  },

  'flujo-efectivo': {
    lead: 'El estado de flujos de efectivo explica de dónde entró el dinero y en qué se fue durante el año.',
    why: 'Una empresa puede ganar y aun así quedarse sin dinero. Este informe muestra por qué y ayuda a anticipar si alcanzará para pagar deudas, nómina e impuestos.',
    rules: [
      'Los movimientos de dinero se separan en tres grupos: **operación**, **inversión** y **financiación**.',
      '**Operación**: cobros a clientes y pagos a proveedores, empleados e impuestos.',
      '**Inversión**: compra y venta de maquinaria, vehículos, inmuebles e inversiones.',
      '**Financiación**: préstamos recibidos y pagados, aportes de los socios y dividendos.',
      'El efectivo final del informe debe ser igual al del balance. Lo preparan las empresas de los **Grupos 1 y 2**.',
    ],
    example: {
      case: 'Un taller ganó $50.000.000 en el año, pero su dinero en el banco subió mucho menos.',
      rows: [
        ['Utilidad del año', '$50.000.000'],
        ['+ Depreciación (se registró como gasto, pero no salió dinero)', '$20.000.000'],
        ['− Aumento de la cartera (ventas sin cobrar)', '−$15.000.000'],
        ['+ Aumento de lo que se debe a proveedores', '$5.000.000'],
        ['= Dinero que generó la operación', '$60.000.000'],
        ['− Compra de una máquina (inversión)', '−$40.000.000'],
        ['− Abono a un préstamo (financiación)', '−$12.000.000'],
        ['= Aumento del efectivo', '$8.000.000'],
      ],
      result: 'Ganó $50.000.000, pero el efectivo solo aumentó $8.000.000: la máquina y el préstamo se llevaron el resto.',
    },
    steps: [
      'Empiece con la utilidad del año.',
      'Sume lo que se registró como gasto pero no sacó dinero: depreciación, deterioros y provisiones.',
      'Ajuste los cambios en cartera, inventarios y proveedores.',
      'Agregue las compras y ventas de activos (inversión) y los préstamos y aportes (financiación).',
      'Compruebe: efectivo inicial + aumento del año = efectivo final del balance.',
    ],
    mistake: {
      text: 'Que el efectivo final del informe no coincida con el del balance.',
      avoid: 'Haga la comprobación del último paso antes de entregar los estados.',
    },
    checklist: [
      'Los tres grupos están separados.',
      'El efectivo final coincide con el del balance.',
      'Los intereses y dividendos van en el mismo grupo que el año anterior.',
    ],
    technical: [
      'Sección 7. Actividades de operación por el método indirecto (el más usado en pymes) o el directo.',
      'Las transacciones que no mueven efectivo, como un leasing financiero nuevo, no van en el estado: se revelan.',
      'Intereses y dividendos pagados o recibidos se clasifican de forma uniforme entre operación, inversión o financiación.',
    ],
  },

  notas: {
    lead: 'Las notas son las páginas que explican las cifras. Sin ellas, los estados financieros están incompletos.',
    why: 'Un número solo dice poco: las notas cuentan cómo se calculó, qué incluye y qué riesgos hay. Es lo que lee un banco o un inversionista antes de confiar en las cifras.',
    rules: [
      'Una declaración de que los estados cumplen con la **NIIF para Pymes**.',
      'Las **políticas contables**: cómo se mide cada partida importante.',
      'Los **juicios y estimaciones** que más afectan las cifras, como vidas útiles o deterioros.',
      'El **detalle** de las partidas importantes: cartera, inventarios, activos fijos, deudas y patrimonio.',
    ],
    example: {
      case: 'Nota 6, Inventarios, de una ferretería.',
      rows: [
        ['Mercancía para la venta', '$180.000.000'],
        ['Mercancía en tránsito', '$20.000.000'],
        ['Menos: deterioro por productos dañados', '−$6.000.000'],
        ['Total de inventarios', '$194.000.000'],
      ],
      result: 'La nota muestra de qué se compone la cifra del balance y aclara que la mercancía se mide al costo promedio.',
    },
    steps: [
      'Arme una plantilla con una nota por cada partida importante.',
      'Numere las notas y ponga ese número al lado de la cifra en cada estado.',
      'Actualícelas en cada cierre con las cifras y los hechos del año.',
    ],
    mistake: {
      text: 'Copiar notas genéricas de otra empresa que no describen lo que su empresa hace.',
      avoid: 'Escríbalas a partir de sus propias cifras y operaciones; si una nota no dice nada de su empresa, sobra.',
    },
    checklist: [
      'Hay una nota de políticas contables.',
      'Cada cifra importante del balance tiene su nota.',
      'Los números de las notas coinciden con los de los estados.',
    ],
    technical: [
      'Sección 8: declaración de cumplimiento, resumen de las políticas significativas, juicios y fuentes clave de incertidumbre.',
      'Orden sugerido: cumplimiento, políticas, información de apoyo de cada partida en el orden de los estados y otras revelaciones.',
      'Cada sección de la norma trae además sus propios requerimientos de revelación.',
    ],
  },

  politicas: {
    lead: 'Las políticas contables son las reglas con las que la empresa registra sus operaciones: se escriben y se aplican igual todos los años.',
    why: 'Si cada año se registra distinto, las cifras no se pueden comparar y cualquier revisor encontrará inconsistencias. Un manual claro además evita depender de una sola persona.',
    rules: [
      'Aplicar las mismas políticas de forma **uniforme**, año tras año.',
      '**Cambio de política**: se aplica hacia atrás, ajustando las cifras del año anterior.',
      '**Cambio de estimación** (por ejemplo, la vida útil de un equipo): se aplica desde el año del cambio en adelante.',
      '**Error de un año anterior**: se corrige en las cifras de ese año y se explica en notas.',
    ],
    example: {
      case: 'En 2025 se descubre que en 2024 no se registró la depreciación de un camión.',
      rows: [
        ['Depreciación que faltó en 2024', '$12.000.000'],
        ['Dónde no se corrige', 'En la utilidad de 2025'],
        ['Dónde se corrige', 'En las cifras de 2024'],
      ],
      result: 'Se reexpresan las cifras de 2024, se explica en notas y la utilidad de 2025 queda limpia.',
    },
    steps: [
      'Escriba un manual con una política por cada partida que maneja su empresa.',
      'Hágalo aprobar por la gerencia o la junta.',
      'Revíselo cada año o cuando cambie el negocio.',
      'Cuando aparezca un error de años anteriores, corríjalo en esos años y explíquelo en notas.',
    ],
    mistake: {
      text: 'Corregir un error de años anteriores contra la utilidad del año actual.',
      avoid: 'Pregúntese de qué año es el error: si es de un año ya cerrado, se corrige en ese año.',
    },
    checklist: [
      'El manual está escrito y aprobado.',
      'Las políticas del manual son las que realmente se aplican.',
      'Los cambios de estimación del año están documentados.',
    ],
    technical: [
      'Sección 10. Cambios de política: aplicación retroactiva, salvo que sea impracticable. Cambios de estimación: prospectivos.',
      'Errores materiales de periodos anteriores: reexpresión retroactiva de la información comparativa.',
      'Revelar la naturaleza del cambio o del error y su efecto en cada partida afectada.',
    ],
  },

  'instrumentos-financieros': {
    lead: 'La cartera, los préstamos y las cuentas por pagar se registran por lo que de verdad se va a cobrar o pagar, con sus intereses bien repartidos.',
    why: 'Una cartera inflada con clientes que no van a pagar hace ver a la empresa más sana de lo que está, y un préstamo mal registrado esconde su costo real.',
    rules: [
      'La **cartera**, los **préstamos**, las **cuentas por pagar** y las inversiones simples son instrumentos financieros básicos.',
      'Los que tienen financiación se miden al **costo amortizado**: los intereses y comisiones se reparten a lo largo del plazo.',
      'Las cuentas de corto plazo sin intereses se registran por su valor, sin descontar.',
      'En cada cierre se revisa qué clientes probablemente no pagarán y se registra el **deterioro**.',
    ],
    example: {
      case: 'Una distribuidora tiene $50.000.000 en cartera. Un cliente que le debe $8.000.000 lleva diez meses sin pagar y entró en reorganización.',
      rows: [
        ['Cartera total', '$50.000.000'],
        ['Deuda del cliente en problemas', '$8.000.000'],
        ['Lo que se espera recuperar', '$2.000.000'],
        ['Deterioro a registrar', '$6.000.000'],
      ],
      result: 'La cartera queda en $44.000.000, que es lo que razonablemente va a entrar.',
    },
    steps: [
      'Haga un análisis de vencimientos de la cartera al cierre.',
      'Estime, cliente por cliente, lo que probablemente no se recuperará y regístrelo como deterioro.',
      'Para cada préstamo, calcule la tasa efectiva incluyendo las comisiones y registre los intereses con ella.',
    ],
    mistake: {
      text: 'Aplicar solo el porcentaje fiscal de provisión de cartera, sin mirar a cada cliente.',
      avoid: 'Parta del listado de vencimientos y de lo que sabe de cada cliente; el porcentaje fiscal va en la conciliación fiscal.',
    },
    checklist: [
      'La cartera está conciliada con el auxiliar por cliente.',
      'Los clientes vencidos tienen su análisis de deterioro.',
      'Cada préstamo tiene su tabla de amortización con la tasa efectiva.',
    ],
    technical: [
      'Sección 11: instrumentos financieros básicos al costo amortizado con el método del interés efectivo; los de corto plazo sin interés, al importe no descontado.',
      'Deterioro con evidencia objetiva (mora, dificultades financieras del deudor, reestructuración), evaluado de forma individual o por grupos de riesgo similar.',
      'Sección 12: otros instrumentos, como los derivados, a valor razonable con cambios en resultados.',
    ],
  },

  inventarios: {
    lead: 'La mercancía se registra por lo que costó, pero si ya vale menos, se le baja el valor.',
    why: 'El inventario suele ser uno de los activos más grandes de una pyme. Si incluye productos dañados o que ya no se venden a ese precio, la utilidad y el balance quedan inflados.',
    rules: [
      'Se mide al **costo**: compra, transporte, transformación y lo necesario para dejarlo listo para la venta.',
      'El costo de lo vendido se calcula con **promedio ponderado** o **PEPS** (primeras en entrar, primeras en salir). **UEPS no está permitido**.',
      'Al cierre se compara el costo con el **precio de venta estimado menos los costos para venderlo**; si es menor, se reduce el valor.',
      'Los productos dañados, vencidos o de baja rotación se revisan uno por uno.',
    ],
    example: {
      case: 'Una zapatería tiene una línea de zapatos pasada de moda.',
      rows: [
        ['Costo de la línea', '$10.000.000'],
        ['Precio al que hoy se vendería', '$8.500.000'],
        ['Costo de venderla (comisiones y transporte)', '−$500.000'],
        ['Lo que realmente vale', '$8.000.000'],
      ],
      result: 'Se registra una pérdida de $2.000.000 y el inventario de esa línea queda en $8.000.000.',
    },
    steps: [
      'Haga un conteo físico y ajuste las diferencias.',
      'Identifique los productos dañados, vencidos o de baja rotación.',
      'Por línea, compare el costo con el precio de venta menos los costos de venta y registre la diferencia.',
    ],
    mistake: {
      text: 'Mantener al costo mercancía que ya se vende por debajo de lo que costó.',
      avoid: 'Revise en cada cierre los precios de venta de las líneas que rotan más lento.',
    },
    checklist: [
      'El conteo físico está hecho y conciliado.',
      'El método de costo (promedio o PEPS) está definido y se aplica siempre igual.',
      'Lo dañado o lo que se vende por debajo del costo tiene su deterioro registrado.',
    ],
    technical: [
      'Sección 13: medición al menor entre el costo y el precio de venta estimado menos los costos de terminación y venta.',
      'Fórmulas de costo: PEPS (FIFO) o costo promedio ponderado; UEPS (LIFO) no se permite. Identificación específica para partidas que no son intercambiables.',
      'El deterioro se reconoce según la Sección 27 y se revierte si cambian las circunstancias.',
    ],
  },

  'propiedad-planta-equipo': {
    lead: 'Las máquinas, los vehículos, los equipos y los inmuebles se registran por lo que costaron y se deprecian según los años que de verdad se van a usar.',
    why: 'Si se deprecian solo con las tablas de impuestos, activos que siguen trabajando quedan en cero y el balance no muestra lo que la empresa realmente tiene.',
    rules: [
      'Se registran al **costo**: precio de compra más lo necesario para ponerlos a funcionar, como transporte e instalación.',
      'Se **deprecian** durante su **vida útil** real, descontando el **valor residual**, que es lo que se recuperará al final.',
      'La vida útil, el valor residual y el método se revisan si hay indicios de cambio.',
      'Las partes importantes que duran distinto se deprecian por separado.',
    ],
    example: {
      case: 'Un transportador compra un camión que espera usar diez años.',
      rows: [
        ['Costo del camión', '$200.000.000'],
        ['Valor residual al final', '$40.000.000'],
        ['Vida útil real', '10 años'],
        ['Depreciación anual', '$16.000.000'],
      ],
      result: 'Cada año se deprecian $16.000.000, es decir ($200.000.000 − $40.000.000) ÷ 10, aunque la tabla de impuestos permita otro ritmo.',
    },
    steps: [
      'Levante un inventario de activos fijos con fecha, costo y ubicación.',
      'Defina vidas útiles y valores residuales por grupo, según el uso real.',
      'Calcule la depreciación mensual y concilie el auxiliar con la contabilidad.',
    ],
    mistake: {
      text: 'Depreciar con tasas fiscales y dejar en cero activos que se siguen usando por años.',
      avoid: 'Use la vida útil real en la contabilidad y lleve la depreciación fiscal en la conciliación fiscal.',
    },
    checklist: [
      'El inventario de activos está al día y verificado físicamente.',
      'Cada grupo tiene definidos su vida útil y su valor residual.',
      'La depreciación del auxiliar coincide con la contabilidad.',
    ],
    technical: [
      'Sección 17: medición inicial al costo y posterior con el modelo del costo o, desde las modificaciones de 2015, el modelo de revaluación.',
      'Depreciación por componentes significativos; la revisión de vida útil, valor residual y método es un cambio de estimación (Sección 10).',
      'Deterioro según la Sección 27.',
    ],
  },

  arrendamientos: {
    lead: 'Cada arriendo o leasing se revisa para saber si es un simple alquiler o, en el fondo, una compra a plazos.',
    why: 'Un leasing con el que al final la empresa se queda con el bien es una deuda. Si se registra solo como gasto mensual, el balance esconde esa deuda y el activo que se está usando.',
    rules: [
      'Un arrendamiento es **financiero** si transfiere casi todos los riesgos y ventajas del bien: por ejemplo, con una opción de compra muy favorable o con un plazo que cubre casi toda su vida útil.',
      'En el financiero se registran **un activo y una deuda**.',
      'Los demás son **operativos**: el pago se registra como gasto, repartido en partes iguales durante el plazo.',
    ],
    example: {
      case: 'Una empresa toma un vehículo en leasing a cinco años, con opción de compra del 1 % al final.',
      rows: [
        ['Plazo del contrato', '5 años'],
        ['Opción de compra', '1 % del valor'],
        ['Clasificación', 'Financiero'],
        ['Registro', 'El vehículo como activo y la deuda con el banco'],
      ],
      result: 'Aunque se pague cada mes, no es un gasto de arriendo: la empresa tiene un vehículo y una deuda.',
    },
    steps: [
      'Liste los contratos de arriendo y leasing vigentes.',
      'Evalúe cada uno con los indicadores de la Sección 20.',
      'Para los financieros, registre el activo y la deuda por el menor entre el valor del bien y el valor presente de los pagos.',
    ],
    mistake: {
      text: 'Registrar un leasing con opción de compra solo como gasto mensual.',
      avoid: 'Lea la opción de compra y el plazo de cada contrato antes de registrarlo.',
    },
    checklist: [
      'Todos los contratos están listados y clasificados.',
      'Los financieros aparecen como activo y deuda.',
      'Los pagos futuros están explicados en notas.',
    ],
    technical: [
      'Sección 20: clasificación al inicio del arrendamiento, según la transferencia sustancial de riesgos y ventajas.',
      'Financiero: activo y pasivo al menor entre el valor razonable y el valor presente de los pagos mínimos; luego, el pasivo al costo amortizado.',
      'La guía sigue la edición de la NIIF para Pymes vigente en Colombia; se revisará cuando se adopte una nueva.',
    ],
  },

  provisiones: {
    lead: 'Si es probable que la empresa tenga que pagar algo por un hecho que ya ocurrió, se registra desde ya.',
    why: 'Una demanda perdida o una garantía por cumplir pueden costar mucho. Registrarlas a tiempo evita sorpresas y muestra la situación real a socios y bancos.',
    rules: [
      'Se registra una **provisión** cuando se cumplen tres condiciones: hay una **obligación presente** por un hecho pasado, es **probable** que haya que pagar y el monto se puede **estimar** con fiabilidad.',
      'Si el pago es solo **posible**, no se registra: se explica en notas como **pasivo contingente**.',
      'Los gastos futuros que hoy no son obligación, como un mantenimiento planeado, **no** son provisiones.',
    ],
    example: {
      case: 'Un exempleado demanda a la empresa. El abogado considera probable perder y estima un pago de $30.000.000.',
      rows: [
        ['¿Obligación por un hecho pasado?', 'Sí: el despido'],
        ['¿Es probable pagar?', 'Sí, según el abogado'],
        ['¿Se puede estimar el monto?', 'Sí: $30.000.000'],
        ['Registro', 'Provisión de $30.000.000'],
      ],
      result: 'Si el abogado dijera que perder es solo posible, no se registraría: se explicaría en notas.',
    },
    steps: [
      'Pida al abogado el estado de las demandas y reclamaciones.',
      'Revise las garantías otorgadas y los compromisos de los contratos.',
      'Estime el monto más probable, regístrelo y revíselo en cada cierre.',
    ],
    mistake: {
      text: 'Crear provisiones para gastos futuros que no son obligaciones presentes.',
      avoid: 'Antes de registrar una provisión, compruebe que cumple las tres condiciones.',
    },
    checklist: [
      'Hay un informe del abogado con fecha de cierre.',
      'Cada provisión cumple las tres condiciones.',
      'Los pasivos contingentes están explicados en notas.',
    ],
    technical: [
      'Sección 21: reconocimiento con obligación presente (legal o implícita), probabilidad de salida de recursos y estimación fiable.',
      'Medición a la mejor estimación del importe para liquidar la obligación, descontada si el valor del dinero en el tiempo es material.',
      'Activos y pasivos contingentes: no se reconocen; se revelan.',
    ],
  },

  ingresos: {
    lead: 'Las ventas se registran cuando se entrega el producto o se presta el servicio, no cuando llega el pago.',
    why: 'Si se registran al cobrar, las ventas de un año se mezclan con las de otro y la utilidad no refleja lo que realmente se hizo en el periodo.',
    rules: [
      '**Venta de bienes**: el ingreso se registra cuando pasan al comprador los riesgos y ventajas del producto.',
      '**Servicios**: se registran según el **avance** del servicio.',
      'Se miden por el valor acordado, descontando **rebajas y descuentos**.',
      'Los **anticipos** de clientes son una deuda hasta que se entrega.',
    ],
    example: {
      case: 'En diciembre un cliente paga un anticipo de $10.000.000 por un trabajo que se entregará en febrero.',
      rows: [
        ['Anticipo recibido en diciembre', '$10.000.000'],
        ['Ingreso de diciembre', '$0'],
        ['Cómo se registra al recibirlo', 'Como deuda con el cliente'],
        ['Ingreso de febrero, al entregar', '$10.000.000'],
      ],
      result: 'El dinero entró en diciembre, pero la venta es de febrero.',
    },
    steps: [
      'Identifique en qué momento entrega cada tipo de producto o servicio.',
      'Revise los cortes: facturas de fin de año con entregas en enero y anticipos recibidos.',
      'Registre los anticipos como deuda hasta que entregue.',
    ],
    mistake: {
      text: 'Registrar como ingreso el anticipo de un cliente por un trabajo que aún no se hace.',
      avoid: 'Al cierre, compare los anticipos recibidos con lo que falta por entregar.',
    },
    checklist: [
      'Las ventas de fin de año corresponden a entregas del año.',
      'Los anticipos están registrados como deuda.',
      'Los descuentos y rebajas están restados.',
    ],
    technical: [
      'Sección 23: venta de bienes con transferencia de los riesgos y ventajas significativos; servicios por el método del porcentaje de terminación.',
      'Medición al valor razonable de la contraprestación recibida o por recibir, neta de descuentos y rebajas.',
      'La tercera edición de la NIIF para Pymes adopta un modelo de cinco pasos; la guía se actualizará cuando se aplique en Colombia.',
    ],
  },

  deterioro: {
    lead: 'Si un activo ya vale menos de lo que dice la contabilidad, se registra la pérdida.',
    why: 'Un balance con máquinas obsoletas o mercancía dañada a su valor original muestra una empresa más fuerte de lo que es, y engaña a quien decide con esas cifras.',
    rules: [
      'En cada cierre se revisa si hay **indicios** de pérdida de valor: daño, obsolescencia, caída de ventas o cambios del mercado.',
      'Si los hay, se calcula el **importe recuperable**: el mayor entre lo que se obtendría al venderlo (menos los costos de venta) y lo que genera si se sigue usando.',
      'Si el importe recuperable es menor que el valor en libros, la diferencia es una **pérdida por deterioro**.',
    ],
    example: {
      case: 'Una imprenta tiene una máquina que quedó obsoleta.',
      rows: [
        ['Valor en libros', '$60.000.000'],
        ['Si la vende, menos los costos de venta', '$24.000.000'],
        ['Si la sigue usando (valor de uso)', '$20.000.000'],
        ['Importe recuperable (el mayor)', '$24.000.000'],
        ['Pérdida por deterioro', '$36.000.000'],
      ],
      result: 'La máquina queda en $24.000.000 y se registra una pérdida de $36.000.000.',
    },
    steps: [
      'Use una lista de indicios en cada cierre.',
      'Documente la conclusión, aunque no haya deterioro.',
      'Si lo hay, registre la pérdida y explíquela en notas.',
    ],
    mistake: {
      text: 'No revisar nunca y dejar los activos sobrevalorados.',
      avoid: 'Incluya la revisión de indicios en la lista del cierre anual.',
    },
    checklist: [
      'La revisión de indicios está hecha y documentada.',
      'Los activos con indicios tienen su importe recuperable calculado.',
      'Las pérdidas registradas están explicadas en notas.',
    ],
    technical: [
      'Sección 27: importe recuperable igual al mayor entre el valor razonable menos los costos de venta y el valor en uso.',
      'Para inventarios, se compara el importe en libros con el precio de venta menos los costos de terminación y venta.',
      'Las pérdidas pueden revertirse si cambian las estimaciones, salvo las de la plusvalía.',
    ],
  },

  'beneficios-empleados': {
    lead: 'Las prestaciones de los empleados se registran mes a mes, a medida que trabajan, y no solo cuando se pagan.',
    why: 'Cesantías, prima y vacaciones son una deuda real que crece cada mes. Si se registran solo al pagarlas, la utilidad del año queda inflada y la deuda escondida.',
    rules: [
      'Los beneficios de corto plazo (**salario**, **cesantías**, **intereses sobre cesantías**, **prima** y **vacaciones**) se registran como gasto y como deuda a medida que el empleado trabaja.',
      'Al cierre, la deuda laboral debe coincidir con lo que se le debe a cada empleado.',
    ],
    example: {
      case: 'Una empresa tiene un empleado con un salario de $4.000.000.',
      rows: [
        ['Cesantías del mes (8,33 %)', '$333.333'],
        ['Prima del mes (8,33 %)', '$333.333'],
        ['Vacaciones del mes (4,17 %)', '$166.667'],
        ['Total del mes', '$833.333'],
      ],
      result: 'Cada mes se registran $833.333 como gasto y deuda, más los intereses sobre cesantías (12 % al año sobre el saldo), aunque se paguen después.',
    },
    steps: [
      'Cause cada mes las prestaciones y las vacaciones.',
      'Al cierre, concilie la deuda laboral con la nómina y los saldos por empleado.',
      'Explique en notas el gasto por beneficios.',
    ],
    mistake: {
      text: 'Registrar las vacaciones solo cuando el empleado las disfruta.',
      avoid: 'Cause las vacaciones cada mes y descuéntelas de la deuda cuando se toman.',
    },
    checklist: [
      'Las prestaciones están causadas hasta el último mes del año.',
      'El saldo por empleado cuadra con la contabilidad.',
      'Los intereses sobre cesantías del año están registrados.',
    ],
    technical: [
      'Sección 28: los beneficios de corto plazo se reconocen como gasto y pasivo por el importe no descontado, cuando el empleado presta el servicio.',
      'Las ausencias remuneradas acumulables, como las vacaciones, se reconocen a medida que se generan.',
      'Los beneficios post-empleo o por terminación, si existen, tienen su propio tratamiento en la misma sección.',
    ],
  },

  'impuesto-ganancias': {
    lead: 'Además del impuesto que se paga este año, se registra el efecto futuro de las diferencias entre la contabilidad y la declaración de renta.',
    why: 'La contabilidad y los impuestos miden algunas cosas distinto. El impuesto diferido evita que esas diferencias distorsionen la utilidad y muestra impuestos que se pagarán o ahorrarán más adelante.',
    rules: [
      '**Impuesto corriente**: el que se paga por la renta del año.',
      '**Impuesto diferido**: el efecto futuro de las **diferencias temporarias** entre el valor contable y el valor fiscal de activos y pasivos.',
      'Aplica a las empresas de los **Grupos 1 y 2**.',
      'La conciliación fiscal se lleva aparte: la contabilidad no se ajusta a las cifras fiscales.',
    ],
    example: {
      case: 'Un equipo vale $100.000.000 en la contabilidad y $80.000.000 para impuestos, porque fiscalmente se ha depreciado más rápido.',
      rows: [
        ['Valor contable', '$100.000.000'],
        ['Valor fiscal', '$80.000.000'],
        ['Diferencia temporaria', '$20.000.000'],
        ['Tarifa de renta', '35 %'],
        ['Impuesto diferido (deuda)', '$7.000.000'],
      ],
      result: 'Se registra una deuda de $7.000.000: en los próximos años la declaración tendrá menos depreciación que deducir y se pagará más impuesto.',
    },
    steps: [
      'Liste los activos y pasivos con su valor contable y su valor fiscal.',
      'Calcule las diferencias temporarias.',
      'Multiplíquelas por la tarifa que se espera aplicar y registre el activo o el pasivo diferido.',
      'Mantenga la conciliación fiscal separada de la contabilidad.',
    ],
    mistake: {
      text: 'Ajustar la contabilidad a las cifras fiscales en lugar de conciliarlas.',
      avoid: 'Lleve la contabilidad con la norma y haga aparte la conciliación fiscal.',
    },
    checklist: [
      'La conciliación fiscal está hecha.',
      'Las diferencias temporarias están identificadas.',
      'El impuesto diferido está calculado con la tarifa que se espera aplicar.',
    ],
    technical: [
      'Sección 29: método del pasivo basado en el balance, con diferencias temporarias imponibles y deducibles.',
      'El activo por impuesto diferido se reconoce en la medida en que sea probable tener ganancias fiscales futuras.',
      'Tarifa general de renta para personas jurídicas en Colombia: 35 %. Verifique si aplican tarifas especiales o sobretasas.',
    ],
  },

  'hechos-posteriores': {
    lead: 'Lo que pasa después del cierre, y antes de aprobar los estados, puede cambiar las cifras o tener que explicarse en notas.',
    why: 'Los estados financieros deben reflejar lo que se sabía al aprobarlos. Si un cliente grande quiebra en enero, aprobar en marzo con esa cartera intacta es mostrar una realidad que ya no existe.',
    rules: [
      'Son los hechos ocurridos entre la **fecha de cierre** y la fecha en que se **autoriza** la publicación de los estados.',
      '**Implican ajuste**: confirman algo que ya existía al cierre, como un cliente que ya estaba en dificultades y quiebra en enero. Se ajustan las cifras.',
      '**No implican ajuste**: surgen después del cierre, como un incendio en febrero. Se explican en notas si son importantes.',
    ],
    example: {
      case: 'La empresa cierra el 31 de diciembre y aprueba sus estados en marzo.',
      rows: [
        ['Enero: quiebra un cliente que ya estaba en mora', 'Se ajusta el deterioro de la cartera'],
        ['Febrero: un incendio daña la bodega', 'Se explica en notas'],
        ['Abril: se firma un contrato grande', 'No se incluye: pasó después de aprobar'],
      ],
      result: 'Lo que confirma una situación del cierre se ajusta; lo nuevo se explica en notas.',
    },
    steps: [
      'Antes de aprobar los estados, revise actas, comunicaciones con abogados, cobros de cartera y ventas de inicio de año.',
      'Clasifique cada hecho: ¿ya existía al cierre o es nuevo?',
      'Ajuste las cifras o redacte la nota, según corresponda.',
    ],
    mistake: {
      text: 'Aprobar los estados sin preguntar qué pasó después del cierre.',
      avoid: 'Deje la revisión de hechos posteriores como la última tarea antes de la aprobación.',
    },
    checklist: [
      'La revisión llega hasta la fecha de aprobación.',
      'Los hechos que implican ajuste están registrados.',
      'La nota dice la fecha de autorización y quién la dio.',
    ],
    technical: [
      'Sección 32: hechos que implican ajuste (condiciones que existían al cierre) y que no implican ajuste (condiciones posteriores).',
      'Revelar la fecha de autorización para la publicación y quién la dio.',
      'Los dividendos declarados después del cierre no son pasivo al cierre.',
    ],
  },

  'partes-relacionadas': {
    lead: 'Los negocios con los socios, sus familias, la gerencia y las empresas de los mismos dueños se explican en notas.',
    why: 'Un préstamo a un socio o una compra a la empresa de un familiar pueden hacerse en condiciones distintas a las del mercado. Revelarlo da transparencia a bancos, socios minoritarios y autoridades.',
    rules: [
      'Son **partes relacionadas**: los socios con influencia, sus familiares cercanos, la gerencia clave y las empresas controladas por ellos.',
      'Se revela la **relación** con cada parte.',
      'Se revelan las **transacciones** del año y los **saldos** al cierre: préstamos, compras, ventas y arriendos.',
      'Se revela la **remuneración** total de la gerencia clave.',
    ],
    example: {
      case: 'La empresa le prestó dinero a un socio sin intereses y le arrienda la bodega a la esposa del gerente.',
      rows: [
        ['Préstamo al socio (saldo al cierre)', '$80.000.000'],
        ['Intereses cobrados al socio', '$0'],
        ['Arriendo pagado a la esposa del gerente', '$36.000.000 al año'],
      ],
      result: 'Las dos operaciones se revelan en notas, con sus condiciones, aunque sean "de la casa".',
    },
    steps: [
      'Mantenga una lista actualizada de las partes relacionadas.',
      'Márquelas en el software contable para extraer sus movimientos.',
      'Prepare la nota en cada cierre.',
    ],
    mistake: {
      text: 'No revelar los préstamos a socios porque son "de la casa".',
      avoid: 'Antes de cerrar las notas, revise los movimientos de cada parte de la lista.',
    },
    checklist: [
      'La lista de partes relacionadas está al día.',
      'Los saldos y transacciones del año están en la nota.',
      'La remuneración de la gerencia está revelada.',
    ],
    technical: [
      'Sección 33: parte relacionada por control, control conjunto, influencia significativa, personal clave de la gerencia y sus familiares cercanos.',
      'Revelar la naturaleza de la relación, el importe de las transacciones, los saldos pendientes, sus condiciones y garantías.',
      'Remuneración total del personal clave de la gerencia.',
    ],
  },

  'cierre-contable': {
    lead: 'Un buen cierre cada mes hace que los estados financieros del año sean confiables y rápidos de preparar.',
    why: 'Los errores se encuentran mejor cada mes que en diciembre. Un cierre ordenado da cifras confiables para decidir y evita correr al final del año.',
    rules: [
      'La norma pide cifras **fiables** y **comparables**; el cierre mensual es la forma práctica de lograrlo.',
      'Las **conciliaciones** comprueban que la contabilidad coincide con el banco, los clientes y los proveedores.',
      'Cada ajuste tiene su **soporte**: factura, extracto, contrato o acta.',
    ],
    example: {
      case: 'Una tienda concilia el banco al final del mes.',
      rows: [
        ['Saldo en la contabilidad', '$25.400.000'],
        ['Saldo en el extracto', '$26.100.000'],
        ['Diferencia', '$700.000'],
        ['Causa', 'Una consignación de un cliente sin registrar'],
      ],
      result: 'Se registra la consignación, la cartera del cliente baja $700.000 y en diciembre no hay sorpresas.',
    },
    steps: [
      'Concilie los bancos.',
      'Concilie la cartera y los proveedores con sus auxiliares.',
      'Cause la nómina, las prestaciones, los servicios y los intereses.',
      'Registre las depreciaciones y amortizaciones.',
      'Revise los inventarios contra el kárdex.',
      'Deje en cero las cuentas transitorias y guarde el soporte de cada ajuste.',
    ],
    mistake: {
      text: 'Dejar todo para diciembre, cuando los errores del año ya se acumularon.',
      avoid: 'Fije una fecha de cierre cada mes, con responsables, y no la mueva.',
    },
    checklist: [
      'Conteo físico de inventarios y activos fijos.',
      'Deterioro de cartera, inventarios y activos.',
      'Impuesto corriente y diferido.',
      'Revisión de hechos posteriores.',
    ],
    technical: [
      'Base: Sección 2 (características cualitativas: fiabilidad, comparabilidad y oportunidad) y control interno.',
      'Conciliaciones mensuales de bancos, cartera, proveedores, inventarios (kárdex) y activos fijos contra sus auxiliares.',
      'Al cierre anual, además: deterioros (Sección 27), impuestos (Sección 29) y hechos posteriores (Sección 32).',
    ],
  },
}
