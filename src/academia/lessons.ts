// El tiempo de lectura se calcula del texto de cada guía (lessonMinutes en ./reading)
export type LessonMeta = { slug: string; title: string; sections: number[] }

export const LESSONS: LessonMeta[] = [
  { slug: 'presentacion', title: 'Estados financieros completos', sections: [3, 4, 5, 6] },
  { slug: 'flujo-efectivo', title: 'Estado de flujos de efectivo', sections: [7] },
  { slug: 'notas', title: 'Notas a los estados financieros', sections: [8] },
  { slug: 'politicas', title: 'Políticas, estimaciones y errores', sections: [10] },
  { slug: 'instrumentos-financieros', title: 'Cartera, préstamos e instrumentos básicos', sections: [11, 12] },
  { slug: 'inventarios', title: 'Inventarios', sections: [13] },
  { slug: 'propiedad-planta-equipo', title: 'Propiedades, planta y equipo', sections: [17] },
  { slug: 'arrendamientos', title: 'Arrendamientos', sections: [20] },
  { slug: 'provisiones', title: 'Provisiones y contingencias', sections: [21] },
  { slug: 'ingresos', title: 'Ingresos de actividades ordinarias', sections: [23] },
  { slug: 'deterioro', title: 'Deterioro del valor de los activos', sections: [27] },
  { slug: 'beneficios-empleados', title: 'Beneficios a los empleados', sections: [28] },
  { slug: 'impuesto-ganancias', title: 'Impuesto a las ganancias', sections: [29] },
  { slug: 'hechos-posteriores', title: 'Hechos posteriores al cierre', sections: [32] },
  { slug: 'partes-relacionadas', title: 'Partes relacionadas', sections: [33] },
  { slug: 'cierre-contable', title: 'Un cierre contable ordenado', sections: [] },
  { slug: 'glosario', title: 'Glosario', sections: [] },
]

export function getLesson(slug: string): LessonMeta | undefined {
  return LESSONS.find((l) => l.slug === slug)
}
