// Guías basadas en la NIIF para Pymes vigente en Colombia (Decreto 2420 de 2015 y modificatorios).
export const LESSON_CONTENT: Record<string, string> = {
  presentacion: `Un juego completo de estados financieros bajo NIIF para Pymes tiene cinco piezas: estado de situación financiera, estado de resultados, estado de cambios en el patrimonio, estado de flujos de efectivo y notas. Las microempresas del Grupo 3 presentan un juego simplificado: situación financiera, resultados y notas.

## Qué exige

- Cifras comparativas del año anterior.
- Activos y pasivos separados en corrientes y no corrientes: lo que se realiza o paga en los próximos 12 meses es corriente.
- Preparación bajo la hipótesis de negocio en marcha.
- Presentación al menos una vez al año.

## Cómo aplicarlo

1. Parta del balance de prueba cerrado y conciliado.
2. Agrupe las cuentas en las partidas del estado de situación financiera y del estado de resultados.
3. Agregue la columna del año anterior.
4. Con esas cifras, prepare el estado de cambios en el patrimonio y el flujo de efectivo.
5. Redacte las notas.

## Error frecuente

Entregar solo el balance y el estado de resultados que genera el software, sin comparativos ni notas.`,

  'flujo-efectivo': `El estado de flujos de efectivo explica por qué cambió el efectivo entre el inicio y el cierre del año.

## Qué exige

Clasificar los movimientos en tres actividades:

- **Operación**: cobros a clientes, pagos a proveedores y empleados, impuestos.
- **Inversión**: compra y venta de activos fijos e inversiones.
- **Financiación**: préstamos recibidos y pagados, aportes y dividendos.

## Cómo aplicarlo (método indirecto)

1. Empiece con la utilidad del año.
2. Sume los gastos que no movieron efectivo: depreciación, deterioros, provisiones.
3. Ajuste los cambios en cartera, inventarios y proveedores.
4. Agregue las actividades de inversión y financiación.
5. Verifique: efectivo inicial más flujo neto igual a efectivo final del balance.

## Error frecuente

Que el efectivo final del flujo no coincida con el del estado de situación financiera.`,

  notas: `Las notas explican las cifras. Sin ellas, los estados financieros están incompletos.

## Qué exige

- Una declaración de que los estados cumplen con la NIIF para Pymes.
- Las bases de medición y las políticas contables significativas.
- Los juicios de la gerencia y las fuentes clave de incertidumbre en las estimaciones.
- El detalle de las partidas importantes: cartera, inventarios, activos fijos, deudas y patrimonio.

## Cómo aplicarlo

1. Arme una plantilla con una nota por cada partida relevante.
2. Numere las notas y referencie cada número desde los estados.
3. Actualícelas cada cierre con las cifras y los hechos del año.

## Error frecuente

Copiar notas genéricas de otra empresa que no describen lo que su empresa hace.`,

  politicas: `Las políticas contables son las reglas que la empresa usa para registrar y medir sus operaciones.

## Qué exige

- Aplicar las mismas políticas de forma uniforme año tras año.
- **Cambio de política**: se aplica hacia atrás, ajustando los comparativos.
- **Cambio de estimación** (vida útil, deterioro de cartera): se aplica hacia adelante, desde el período del cambio.
- **Error de un período anterior**: se corrige hacia atrás, reexpresando las cifras comparativas.

## Cómo aplicarlo

1. Escriba un manual con una política por cada partida que aplica a su empresa.
2. Hágalo aprobar por la gerencia o la junta.
3. Revíselo cada año o cuando cambie el negocio.

## Error frecuente

Corregir un error de años anteriores contra la utilidad del año actual.`,

  'instrumentos-financieros': `La cartera de clientes, los préstamos bancarios, las cuentas por pagar y las inversiones simples son instrumentos financieros básicos.

## Qué exige

- Medirlos al costo amortizado con el método del interés efectivo cuando incluyen financiación.
- Las cuentas por cobrar y por pagar de corto plazo sin intereses se miden por su valor sin descontar.
- Al cierre, evaluar si hay evidencia objetiva de deterioro de la cartera (mora, dificultades del cliente) y reconocer la pérdida.

## Cómo aplicarlo

1. Haga un análisis de vencimientos de la cartera al cierre.
2. Estime lo que probablemente no se recuperará y regístrelo como deterioro.
3. Para cada préstamo, calcule la tasa efectiva incluyendo comisiones y registre los intereses con ella.

## Error frecuente

Aplicar solo el porcentaje fiscal de provisión de cartera, sin analizar a cada cliente.`,

  inventarios: `## Qué exige

- Medir al costo: compra, transporte, transformación y demás costos para dejarlos listos para la venta.
- Usar promedio ponderado o PEPS (primeras en entrar, primeras en salir). UEPS no está permitido.
- Al cierre, si el precio de venta estimado menos los costos para terminar y vender es menor que el costo, reducir el valor.

## Cómo aplicarlo

1. Haga un conteo físico y ajuste las diferencias.
2. Identifique productos dañados, vencidos o de baja rotación.
3. Compare, por línea, el costo con el precio de venta menos los costos de venta, y registre la diferencia.

## Error frecuente

Mantener al costo mercancía que ya se vende por debajo de lo que costó.`,

  'propiedad-planta-equipo': `## Qué exige

- Reconocer al costo: precio de compra más los costos para ponerlo a funcionar.
- Depreciar a lo largo de la vida útil que la empresa espera usarlo, descontando el valor residual.
- Revisar vida útil, valor residual y método si hay indicios de cambio.
- Depreciar por separado las partes importantes con vidas útiles distintas.

## Cómo aplicarlo

1. Levante un inventario de activos fijos con fecha, costo y ubicación.
2. Defina vidas útiles por grupo según el uso real, no solo según la tabla fiscal.
3. Calcule la depreciación mensual y concilie el auxiliar con la contabilidad.

## Error frecuente

Depreciar con tasas fiscales y dejar en cero activos que se siguen usando por años.`,

  arrendamientos: `La Sección 20 de la NIIF para Pymes vigente en Colombia clasifica cada contrato de arriendo o leasing.

## Qué exige

- **Financiero**: transfiere sustancialmente los riesgos y ventajas del activo, por ejemplo con una opción de compra muy favorable o un plazo que cubre casi toda su vida útil. Se reconoce un activo y una deuda.
- **Operativo**: todos los demás. El gasto se reconoce en línea recta durante el plazo.

## Cómo aplicarlo

1. Liste los contratos de arriendo y leasing vigentes.
2. Evalúe cada uno con los indicadores de la Sección 20.
3. Para los financieros, registre el activo y la deuda por el menor entre el valor razonable y el valor presente de los pagos.

## Error frecuente

Registrar un leasing con opción de compra solo como gasto mensual.

La tercera edición de la NIIF para Pymes cambia este modelo; esta guía se actualizará cuando se adopte en Colombia.`,

  provisiones: `## Qué exige

Reconocer una provisión cuando se cumplen las tres condiciones:

1. Hay una obligación presente por un hecho pasado.
2. Es probable que haya que pagar.
3. El monto se puede estimar de forma fiable.

Si el pago solo es posible, no se registra: se revela en notas como pasivo contingente.

## Cómo aplicarlo

1. Pida al área legal el estado de demandas y reclamaciones.
2. Revise garantías otorgadas y compromisos contractuales.
3. Estime el monto más probable, regístrelo y revíselo en cada cierre.

## Error frecuente

Crear provisiones para gastos futuros que no son obligaciones presentes.`,

  ingresos: `## Qué exige

- **Venta de bienes**: el ingreso se reconoce cuando se transfieren al comprador los riesgos y ventajas.
- **Servicios**: se reconoce según el grado de avance del servicio.
- Se mide por el valor de la contraprestación, descontando rebajas y descuentos.

## Cómo aplicarlo

1. Identifique en qué momento entrega cada tipo de bien o servicio.
2. Revise los cortes: facturas de fin de año con entregas en enero, anticipos recibidos.
3. Registre los anticipos como pasivo hasta que entregue.

## Error frecuente

Registrar como ingreso el anticipo de un cliente por un trabajo que aún no se hace.

La tercera edición de la NIIF para Pymes cambia a un modelo de cinco pasos; esta guía se actualizará cuando aplique.`,

  deterioro: `El deterioro ocurre cuando un activo vale menos de lo que dice la contabilidad.

## Qué exige

- En cada cierre, revisar si hay indicios: daño físico, obsolescencia, caída de ventas o cambios del mercado.
- Si los hay, estimar el importe recuperable (el mayor entre venderlo o seguir usándolo) y registrar la pérdida si es menor que el valor en libros.

## Cómo aplicarlo

1. Use una lista de verificación de indicios en cada cierre.
2. Documente la conclusión, aunque no haya deterioro.
3. Si lo hay, registre la pérdida y revélela en notas.

## Error frecuente

No revisar nunca, y dejar los activos sobrevalorados.`,

  'beneficios-empleados': `## Qué exige

Los beneficios de corto plazo (salarios, cesantías, intereses sobre cesantías, prima y vacaciones) se reconocen como gasto y pasivo a medida que el empleado trabaja, no cuando se pagan.

## Cómo aplicarlo

1. Cause cada mes las prestaciones y vacaciones.
2. Al cierre, concilie el pasivo laboral con la nómina y los saldos por empleado.
3. Revele el gasto por beneficios en notas.

## Error frecuente

Registrar las vacaciones solo cuando el empleado las disfruta.`,

  'impuesto-ganancias': `## Qué exige

- **Impuesto corriente**: el que se paga por la renta del año.
- **Impuesto diferido**: el efecto futuro de las diferencias entre el valor contable y el valor fiscal de activos y pasivos (diferencias temporarias).

Aplica a las empresas de los Grupos 1 y 2.

## Cómo aplicarlo

1. Liste activos y pasivos con su valor contable y su valor fiscal.
2. Calcule las diferencias temporarias.
3. Multiplíquelas por la tarifa que se espera aplicar y registre el activo o pasivo diferido.
4. Mantenga la conciliación fiscal separada de la contabilidad.

## Error frecuente

Ajustar la contabilidad a las cifras fiscales en lugar de conciliarlas.`,

  'hechos-posteriores': `Son los hechos ocurridos entre la fecha de cierre y la fecha en que se autoriza la publicación de los estados.

## Qué exige

- **Implican ajuste**: dan evidencia de condiciones que ya existían al cierre, como un cliente que ya estaba en dificultades y quiebra en enero. Se ajustan las cifras.
- **No implican ajuste**: surgen después del cierre, como un incendio en febrero. Se revelan en notas si son importantes.

## Cómo aplicarlo

Antes de aprobar los estados, revise actas, comunicaciones con abogados, cobros de cartera y ventas de inicio de año.

## Error frecuente

Aprobar los estados sin preguntar qué pasó después del cierre.`,

  'partes-relacionadas': `Son personas o empresas con capacidad de influir en la empresa: socios, sus familiares cercanos, la gerencia y empresas de los mismos dueños.

## Qué exige

Revelar en notas:

- La relación con cada parte.
- Las transacciones del año y los saldos al cierre: préstamos, compras, ventas, arriendos.
- La remuneración total del personal clave de la gerencia.

## Cómo aplicarlo

1. Mantenga una lista actualizada de partes relacionadas.
2. Márquelas en el software contable para extraer sus movimientos.
3. Prepare la nota en cada cierre.

## Error frecuente

No revelar préstamos a socios porque son "de la casa".`,

  'cierre-contable': `Un buen cierre hace que los estados financieros sean confiables y rápidos de preparar.

## Cierre mensual

1. Conciliar bancos.
2. Conciliar cartera y proveedores con sus auxiliares.
3. Causar nómina, prestaciones, servicios e intereses.
4. Registrar depreciaciones y amortizaciones.
5. Revisar inventarios contra el kárdex.
6. Dejar en cero las cuentas transitorias.
7. Guardar el soporte de cada ajuste.

## Además, al cierre anual

- Conteo físico de inventarios y activos fijos.
- Deterioro de cartera, inventarios y activos.
- Impuesto corriente y diferido.
- Revisión de hechos posteriores.

## Error frecuente

Dejar todo para diciembre, cuando los errores del año ya se acumularon.`,

  glosario: `**Activo**: recurso que controla la empresa y del que espera beneficios futuros.

**Pasivo**: obligación presente que la empresa deberá pagar.

**Patrimonio**: lo que queda de los activos después de restar los pasivos.

**Costo amortizado**: valor de un préstamo o una cuenta por cobrar que reparte los intereses a lo largo del plazo.

**Deterioro**: pérdida de valor de un activo por debajo de su valor en libros.

**Valor razonable**: precio que se recibiría al vender un activo entre partes informadas e independientes.

**Importe recuperable**: el mayor entre el valor razonable menos los costos de venta y el valor de uso de un activo.

**Negocio en marcha**: supuesto de que la empresa seguirá operando en el futuro previsible.

**Diferencia temporaria**: diferencia entre el valor contable y el fiscal que se revertirá en el futuro.

**Revelación**: información que se presenta en las notas.

**Reexpresión**: corrección de las cifras de períodos anteriores.

**SMMLV**: salario mínimo mensual legal vigente en Colombia.`,
}
