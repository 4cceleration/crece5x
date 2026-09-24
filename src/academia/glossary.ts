// Glosario de la Academia: las palabras que más se usan en la norma, agrupadas por tema,
// cada una con una definición sencilla, un ejemplo y la guía donde se explica
export type GlossaryTerm = {
  term: string
  definition: string
  example: string
  /** Guía donde se explica; se muestra como enlace */
  lesson?: string
}

export const GLOSSARY: { id: string; group: string; terms: GlossaryTerm[] }[] = [
  {
    id: 'lo-basico',
    group: 'Lo básico',
    terms: [
      {
        term: 'Activo',
        definition: 'Lo que la empresa controla y le va a traer beneficios: dinero, cartera, mercancía, máquinas.',
        example: 'El camión con el que se reparten los pedidos.',
        lesson: 'presentacion',
      },
      {
        term: 'Pasivo',
        definition: 'Lo que la empresa debe y tendrá que pagar.',
        example: 'El préstamo con el banco y lo que se les debe a los proveedores.',
        lesson: 'instrumentos-financieros',
      },
      {
        term: 'Patrimonio',
        definition: 'Lo que queda para los socios después de restarles las deudas a los activos.',
        example: 'Con activos por $500 millones y deudas por $300 millones, el patrimonio es de $200 millones.',
        lesson: 'presentacion',
      },
      {
        term: 'Ingreso',
        definition: 'Lo que la empresa gana al vender o prestar servicios en el periodo.',
        example: 'Una venta entregada en diciembre es ingreso de diciembre, aunque se cobre en enero.',
        lesson: 'ingresos',
      },
      {
        term: 'Gasto',
        definition: 'Lo que se consume para operar en el periodo, se pague o no ese mes.',
        example: 'Las vacaciones que se acumulan cada mes son gasto de ese mes.',
        lesson: 'beneficios-empleados',
      },
      {
        term: 'Estados financieros',
        definition: 'Los informes que muestran lo que la empresa tiene, lo que debe, lo que ganó y cómo se movió su dinero.',
        example: 'Balance, estado de resultados, cambios en el patrimonio, flujo de efectivo y notas.',
        lesson: 'presentacion',
      },
    ],
  },
  {
    id: 'medicion',
    group: 'Medición',
    terms: [
      {
        term: 'Costo',
        definition: 'Lo que se pagó por algo, más lo necesario para dejarlo listo para usar o para vender.',
        example: 'Un equipo de $20 millones con $1 millón de instalación cuesta $21 millones.',
        lesson: 'propiedad-planta-equipo',
      },
      {
        term: 'Costo amortizado',
        definition: 'Forma de registrar un préstamo o una cuenta por cobrar repartiendo sus intereses y comisiones a lo largo del plazo.',
        example: 'La comisión de apertura de un crédito se reparte mes a mes como mayor interés.',
        lesson: 'instrumentos-financieros',
      },
      {
        term: 'Valor razonable',
        definition: 'El precio que se recibiría al vender algo entre partes informadas e independientes.',
        example: 'Lo que pagaría hoy un comprador cualquiera por su vehículo usado.',
        lesson: 'deterioro',
      },
      {
        term: 'Valor neto realizable',
        definition: 'Lo que se obtendría al vender un inventario, menos lo que cuesta terminarlo y venderlo.',
        example: 'Zapatos que se venderían en $8,5 millones con $0,5 millones de comisiones valen $8 millones.',
        lesson: 'inventarios',
      },
      {
        term: 'Depreciación',
        definition: 'El desgaste de un activo, repartido como gasto durante los años en que se usa.',
        example: 'Un camión de $200 millones que se usará diez años se deprecia un poco cada año.',
        lesson: 'propiedad-planta-equipo',
      },
      {
        term: 'Vida útil',
        definition: 'El tiempo que la empresa espera usar un activo.',
        example: 'Un computador que se cambia cada cuatro años tiene una vida útil de cuatro años.',
        lesson: 'propiedad-planta-equipo',
      },
      {
        term: 'Valor residual',
        definition: 'Lo que se espera recuperar de un activo al final de su vida útil.',
        example: 'El camión que se venderá en $40 millones dentro de diez años.',
        lesson: 'propiedad-planta-equipo',
      },
      {
        term: 'Deterioro',
        definition: 'La pérdida de valor de un activo por debajo de lo que dice la contabilidad.',
        example: 'Una máquina obsoleta que en libros vale $60 millones, pero solo se vendería en $24 millones.',
        lesson: 'deterioro',
      },
      {
        term: 'Importe recuperable',
        definition: 'El mayor entre lo que se obtendría al vender un activo, menos los costos de venta, y lo que genera si se sigue usando.',
        example: 'Si venderla da $24 millones y usarla da $20 millones, el importe recuperable es $24 millones.',
        lesson: 'deterioro',
      },
    ],
  },
  {
    id: 'cierre-y-reportes',
    group: 'Cierre y reportes',
    terms: [
      {
        term: 'Negocio en marcha',
        definition: 'El supuesto de que la empresa seguirá funcionando en el futuro previsible.',
        example: 'Si la empresa se va a liquidar, sus estados financieros se preparan de otra forma.',
        lesson: 'presentacion',
      },
      {
        term: 'Comparativos',
        definition: 'Las cifras del año anterior al lado de las del año actual.',
        example: 'Las ventas de 2025 junto a las de 2024.',
        lesson: 'presentacion',
      },
      {
        term: 'Revelación',
        definition: 'La información que se explica en las notas.',
        example: 'Contar en notas que la empresa le prestó dinero a un socio.',
        lesson: 'notas',
      },
      {
        term: 'Reexpresión',
        definition: 'La corrección de las cifras de años anteriores cuando se descubre un error.',
        example: 'Corregir en las cifras de 2024 una depreciación que faltó ese año.',
        lesson: 'politicas',
      },
      {
        term: 'Provisión',
        definition: 'Una deuda de monto o fecha inciertos que se registra porque es probable tener que pagarla.',
        example: 'Una demanda que el abogado considera probable perder.',
        lesson: 'provisiones',
      },
      {
        term: 'Hechos posteriores',
        definition: 'Lo que ocurre entre la fecha de cierre y la aprobación de los estados financieros.',
        example: 'La quiebra, en enero, de un cliente que ya estaba en mora.',
        lesson: 'hechos-posteriores',
      },
      {
        term: 'Partes relacionadas',
        definition: 'Los socios, sus familias, la gerencia y las empresas de los mismos dueños.',
        example: 'La empresa de la hermana del gerente que le vende a la compañía.',
        lesson: 'partes-relacionadas',
      },
    ],
  },
  {
    id: 'impuestos',
    group: 'Impuestos',
    terms: [
      {
        term: 'Diferencia temporaria',
        definition: 'La diferencia entre el valor contable y el fiscal de un activo o un pasivo, que se revertirá en el futuro.',
        example: 'Un equipo que vale $100 millones en libros y $80 millones para impuestos.',
        lesson: 'impuesto-ganancias',
      },
      {
        term: 'Impuesto diferido',
        definition: 'El impuesto que se pagará o se ahorrará más adelante por las diferencias temporarias.',
        example: 'Una diferencia de $20 millones con tarifa del 35 % da $7 millones de impuesto diferido.',
        lesson: 'impuesto-ganancias',
      },
      {
        term: 'Conciliación fiscal',
        definition: 'El puente entre la utilidad de la contabilidad y la renta que se declara.',
        example: 'Sumar a la utilidad los gastos que la ley no deja deducir.',
        lesson: 'impuesto-ganancias',
      },
    ],
  },
  {
    id: 'colombia',
    group: 'Colombia',
    terms: [
      {
        term: 'SMMLV',
        definition: 'El salario mínimo mensual legal vigente. La norma lo usa para medir el tamaño de las empresas.',
        example: 'Con menos de 500 SMMLV en activos, diez empleados o menos e ingresos bajos, una empresa puede ser del Grupo 3.',
      },
      {
        term: 'Grupos 1, 2 y 3',
        definition: 'Los tres marcos contables de Colombia según el tamaño: NIIF plenas, NIIF para Pymes y microempresas.',
        example: 'Una pyme mediana suele estar en el Grupo 2.',
        lesson: 'presentacion',
      },
      {
        term: 'Decreto 2420 de 2015',
        definition: 'La norma que reúne en Colombia los marcos contables y los grupos.',
        example: 'Su Anexo 2 es la NIIF para Pymes que siguen estas guías.',
      },
    ],
  },
]
