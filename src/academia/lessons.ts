export type LessonMeta = { slug: string; title: string; sections: number[]; minutes: number }

export const LESSONS: LessonMeta[] = [
  { slug: 'presentacion', title: 'Estados financieros completos', sections: [3, 4, 5, 6], minutes: 5 },
  { slug: 'flujo-efectivo', title: 'Estado de flujos de efectivo', sections: [7], minutes: 4 },
  { slug: 'notas', title: 'Notas a los estados financieros', sections: [8], minutes: 4 },
  { slug: 'politicas', title: 'Políticas, estimaciones y errores', sections: [10], minutes: 4 },
  { slug: 'instrumentos-financieros', title: 'Cartera, préstamos e instrumentos básicos', sections: [11, 12], minutes: 5 },
  { slug: 'inventarios', title: 'Inventarios', sections: [13], minutes: 4 },
  { slug: 'propiedad-planta-equipo', title: 'Propiedades, planta y equipo', sections: [17], minutes: 5 },
  { slug: 'arrendamientos', title: 'Arrendamientos', sections: [20], minutes: 4 },
  { slug: 'provisiones', title: 'Provisiones y contingencias', sections: [21], minutes: 4 },
  { slug: 'ingresos', title: 'Ingresos de actividades ordinarias', sections: [23], minutes: 4 },
  { slug: 'deterioro', title: 'Deterioro del valor de los activos', sections: [27], minutes: 4 },
  { slug: 'beneficios-empleados', title: 'Beneficios a los empleados', sections: [28], minutes: 3 },
  { slug: 'impuesto-ganancias', title: 'Impuesto a las ganancias', sections: [29], minutes: 5 },
  { slug: 'hechos-posteriores', title: 'Hechos posteriores al cierre', sections: [32], minutes: 3 },
  { slug: 'partes-relacionadas', title: 'Partes relacionadas', sections: [33], minutes: 3 },
  { slug: 'cierre-contable', title: 'Un cierre contable ordenado', sections: [], minutes: 4 },
  { slug: 'glosario', title: 'Glosario', sections: [], minutes: 3 },
]

export function getLesson(slug: string): LessonMeta | undefined {
  return LESSONS.find((l) => l.slug === slug)
}
