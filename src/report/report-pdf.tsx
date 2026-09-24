import { Document, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer'
import type { ResultData } from '@/services/report'
import { LIGHT_LABEL } from '@/domain/scoring'
import { SEVERITY_LABEL } from '@/domain/types'
import { RATIO_LABELS } from '@/domain/ratios'
import { formatDateTime } from '@/domain/dates'
import { BASIS_NOTE } from '@/domain/eeff'

const INK = '#1E2422'
const MUTED = '#52605A'
const LIGHT_COLOR = { verde: '#2F8A5B', ambar: '#E8A33D', rojo: '#B03A30' } as const

const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, color: INK, fontFamily: 'Helvetica', lineHeight: 1.4 },
  brand: { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 28 },
  muted: { color: MUTED },
  score: { fontSize: 54, fontFamily: 'Helvetica-Bold', marginTop: 18 },
  h2: { fontSize: 12, fontFamily: 'Helvetica-Bold', marginTop: 26, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  finding: { marginBottom: 10 },
  bold: { fontFamily: 'Helvetica-Bold' },
  footer: { position: 'absolute', bottom: 32, left: 48, right: 48, fontSize: 8.5, color: MUTED },
})

function fmtRatio(v: number, percent: boolean) {
  return percent ? `${Math.round(v * 100)} %` : v.toFixed(2)
}

export function ReportPdf({ data }: { data: ResultData }) {
  return (
    <Document title={`crece5x · ${data.companyName}`}>
      <Page size="LETTER" style={s.page}>
        <Text style={s.brand}>crece5x</Text>
        <Text style={s.muted}>{data.companyName} · Grupo {data.group} · {data.groupName}</Text>
        <Text style={s.muted}>{formatDateTime(data.completedAt)}</Text>
        <Text style={s.score}>{data.finalScore}/100</Text>
        <Text style={{ color: LIGHT_COLOR[data.light] }}>{LIGHT_LABEL[data.light]}</Text>
        {data.basis && data.basis !== 'estados' && <Text style={s.muted}>{BASIS_NOTE[data.basis]}</Text>}

        <Text style={s.h2}>Por dimensión</Text>
        {data.dimensions.map((d) => (
          <View key={d.key} style={s.row}>
            <Text>{d.name}</Text>
            <Text>{d.score === null ? 'No aplica' : Math.round(d.score)}</Text>
          </View>
        ))}

        <Text style={s.h2}>Hallazgos y plan de acción</Text>
        {data.findings.length === 0 && <Text style={s.muted}>Sin hallazgos relevantes.</Text>}
        {data.findings.map((f) => (
          <View key={f.id} style={s.finding} wrap={false}>
            <Text>
              <Text style={s.bold}>{SEVERITY_LABEL[f.severity]} · </Text>
              {f.title}
            </Text>
            <Text style={s.muted}>{f.recommendation} ({f.niifSection})</Text>
          </View>
        ))}

        {data.ratios && (
          <>
            <Text style={s.h2}>Indicadores</Text>
            {RATIO_LABELS.map((r) => {
              const v = data.ratios![r.key]
              return v === null ? null : (
                <View key={r.key} style={s.row}>
                  <Text>{r.label}</Text>
                  <Text>{fmtRatio(v, r.percent)}</Text>
                </View>
              )
            })}
          </>
        )}

        <Text style={s.footer} fixed>
          Este reporte es orientativo y no constituye una opinión de auditoría.
        </Text>
      </Page>
    </Document>
  )
}

export function renderReportPdf(data: ResultData): Promise<Buffer> {
  return renderToBuffer(<ReportPdf data={data} />)
}
