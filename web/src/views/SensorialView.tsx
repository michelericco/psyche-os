import { sensorData } from '../data/loader'

interface SensorRow {
  timestamp: string
  source?: string
  heartRate?: number
  steps?: number
  sleepHours?: number
  hrv?: number
  oxygenSaturation?: number
  temperature?: number
  stressLevel?: number
}

export default function SensorialView() {
  const rows = Array.isArray(sensorData) ? (sensorData as SensorRow[]) : []

  if (rows.length === 0) {
    return <div className="text-center text-[color:var(--ink-faint)] py-10">Nessun dato sensoriale disponibile.</div>
  }
  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Dati Sensoriali Raccolti</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-[color:var(--panel)]">
            <th className="p-2">Timestamp</th>
            <th className="p-2">Source</th>
            <th className="p-2">HR</th>
            <th className="p-2">Steps</th>
            <th className="p-2">Sleep</th>
            <th className="p-2">HRV</th>
            <th className="p-2">O₂</th>
            <th className="p-2">Temp</th>
            <th className="p-2">Stress</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={i} className="even:bg-[color:var(--panel)]">
              <td className="p-2">{new Date(d.timestamp).toLocaleString()}</td>
              <td className="p-2">{d.source}</td>
              <td className="p-2">{d.heartRate ?? '-'}</td>
              <td className="p-2">{d.steps ?? '-'}</td>
              <td className="p-2">{d.sleepHours ?? '-'}</td>
              <td className="p-2">{d.hrv ?? '-'}</td>
              <td className="p-2">{d.oxygenSaturation ?? '-'}</td>
              <td className="p-2">{d.temperature ?? '-'}</td>
              <td className="p-2">{d.stressLevel ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
