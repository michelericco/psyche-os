import { useEffect, useMemo, useState } from 'react'
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

type MetricKey = 'heartRate' | 'steps' | 'sleepHours' | 'hrv' | 'oxygenSaturation' | 'temperature' | 'stressLevel'

interface PlanetTooltip {
  x: number
  y: number
  metricLabel: string
  value: number
  unit: string
  timestamp: string
}

const METRICS: Array<{
  key: MetricKey
  label: string
  unit: string
  color: string
  fallbackMin: number
  fallbackMax: number
}> = [
  { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', color: '#ef4444', fallbackMin: 45, fallbackMax: 140 },
  { key: 'steps', label: 'Steps', unit: 'steps', color: '#22c55e', fallbackMin: 0, fallbackMax: 12000 },
  { key: 'sleepHours', label: 'Sleep', unit: 'h', color: '#3b82f6', fallbackMin: 3, fallbackMax: 10 },
  { key: 'hrv', label: 'HRV', unit: 'ms', color: '#f59e0b', fallbackMin: 15, fallbackMax: 120 },
  { key: 'oxygenSaturation', label: 'Oxygen', unit: '%', color: '#06b6d4', fallbackMin: 88, fallbackMax: 100 },
  { key: 'temperature', label: 'Body Temp', unit: 'C', color: '#a855f7', fallbackMin: 34, fallbackMax: 39 },
  { key: 'stressLevel', label: 'Stress', unit: '/100', color: '#f97316', fallbackMin: 0, fallbackMax: 100 },
]

const clamp01 = (value: number) => Math.max(0, Math.min(1, value))

function formatValue(value: number | undefined, unit: string) {
  if (value == null || Number.isNaN(value)) return '-'
  if (unit === 'steps') return `${Math.round(value).toLocaleString()}`
  if (unit === '%') return `${value.toFixed(1)}`
  if (unit === 'h' || unit === 'C') return value.toFixed(1)
  return `${Math.round(value)}`
}

export default function SensorialView() {
  const rows = Array.isArray(sensorData) ? (sensorData as SensorRow[]) : [];
  const [focusIndex, setFocusIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [tooltip, setTooltip] = useState<PlanetTooltip | null>(null);
  const [theme, setTheme] = useState<'normal' | 'night' | 'swift'>('normal');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  const orderedRows = useMemo(
    () => [...rows].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [rows],
  )
  const windowRows = orderedRows.slice(0, 18)
  const focusedRow = windowRows[Math.min(focusIndex, Math.max(0, windowRows.length - 1))]

  const metricRanges = useMemo(() => {
    return METRICS.map((metric) => {
      const values = windowRows
        .map((row) => row[metric.key])
        .filter((value): value is number => typeof value === 'number' && !Number.isNaN(value))
      const min = values.length ? Math.min(...values) : metric.fallbackMin
      const max = values.length ? Math.max(...values) : metric.fallbackMax
      return {
        ...metric,
        min,
        max: max === min ? min + 1 : max,
      }
    })
  }, [windowRows])

  if (rows.length === 0) {
    return (
      <div className="text-center text-[color:var(--ink-faint)] py-10 text-lg font-semibold">
        Nessun dato sensoriale disponibile.<br />
        <span className="text-sm font-normal">Collega un dispositivo o importa dati biometrici per visualizzare la mappa.</span>
      </div>
    );
  }

  return (
    <div className={`mx-auto max-w-6xl py-10 space-y-8 sensorial-theme-${theme}`}>
      <div>
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-2xl font-bold mb-2 text-[color:var(--accent)]">Mappa Sensoriale Interattiva</h2>
          <div className="ml-auto flex gap-2">
            <label htmlFor="theme-select" className="text-sm text-[color:var(--ink-soft)]">Tema:</label>
            <select
              id="theme-select"
              value={theme}
              onChange={e => setTheme(e.target.value as 'normal' | 'night' | 'swift')}
              className="rounded-md border border-[color:var(--line)] bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
              aria-label="Seleziona tema sensoriale"
            >
              <option value="normal">Normale</option>
              <option value="night">Night</option>
              <option value="swift">Swift (Apple)</option>
            </select>
          </div>
        </div>
        <p className="text-base text-[color:var(--ink-soft)] mb-2">
          Esplora i tuoi dati biometrici in modo intuitivo: ogni orbita rappresenta una metrica essenziale, i pianeti mostrano il valore attuale e la scia temporale.<br />
          <span className="text-sm text-[color:var(--ink-faint)]">Tocca, clicca o passa sopra i pianeti per dettagli.</span>
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="rounded-2xl border border-[color:var(--line)] bg-[color:var(--paper-strong)]/80 p-4 sm:p-6 w-full max-w-xl mx-auto">
          <svg viewBox="0 0 560 560" className="w-full h-auto" role="img" aria-label="Visualizzazione planetaria stratificata dei dati sensoriali">
            <defs>
              <radialGradient id="sensorCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.1" />
              </radialGradient>
            </defs>

            <circle cx="280" cy="280" r="42" fill="url(#sensorCore)" />
            <text x="280" y="272" textAnchor="middle" className="fill-slate-700" style={{ fontSize: 11, letterSpacing: '0.16em' }}>
              <tspan fontWeight="bold">CORE</tspan>
            </text>
            <text x="280" y="292" textAnchor="middle" className="fill-slate-500" style={{ fontSize: 9 }}>
              {new Date(focusedRow.timestamp).toLocaleDateString()} <tspan className="fill-slate-400">({focusedRow.source ?? 'n/a'})</tspan>
            </text>

            {metricRanges.map((metric, metricIndex) => {
              const ringRadius = 74 + metricIndex * 30
              const samples = windowRows
                .map((row, rowIndex) => {
                  const value = row[metric.key]
                  if (typeof value !== 'number' || Number.isNaN(value)) return null
                  const norm = clamp01((value - metric.min) / (metric.max - metric.min))
                  const baseAngle = (norm * 300 - 150) * (Math.PI / 180)
                  const drift = rowIndex * 0.11
                  const angle = baseAngle + drift
                  const x = 280 + Math.cos(angle) * ringRadius
                  const y = 280 + Math.sin(angle) * ringRadius
                  return { rowIndex, x, y, value }
                })
                .filter((point): point is { rowIndex: number; x: number; y: number; value: number } => point !== null)

              const focusedValue = focusedRow[metric.key]
              const focusedNorm = typeof focusedValue === 'number'
                ? clamp01((focusedValue - metric.min) / (metric.max - metric.min))
                : 0.5
              const focusedAngle = (focusedNorm * 300 - 150) * (Math.PI / 180)
              const focusedX = 280 + Math.cos(focusedAngle) * ringRadius
              const focusedY = 280 + Math.sin(focusedAngle) * ringRadius

              return (
                <g key={metric.key}>
                  <circle cx="280" cy="280" r={ringRadius} fill="none" stroke={metric.color} strokeOpacity="0.22" strokeWidth={metricIndex === focusIndex ? 2 : 1} />
                  <text
                    x={280}
                    y={280 - ringRadius + 12}
                    textAnchor="middle"
                    fill={metric.color}
                    style={{ fontSize: 9, letterSpacing: '0.14em', fontWeight: metricIndex === focusIndex ? 'bold' : 'normal' }}
                  >
                    {metric.label.toUpperCase()}
                  </text>

                  <g>
                    {!reducedMotion && (
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from={`0 280 280`}
                        to={`${metricIndex % 2 === 0 ? 360 : -360} 280 280`}
                        dur={`${32 + metricIndex * 5}s`}
                        repeatCount="indefinite"
                      />
                    )}
                    {samples.map((sample) => (
                      <circle
                        key={`${metric.key}-${sample.rowIndex}`}
                        cx={sample.x}
                        cy={sample.y}
                        r={sample.rowIndex === focusIndex ? 6 : 3.2}
                        fill={metric.color}
                        fillOpacity={sample.rowIndex === focusIndex ? 0.98 : Math.max(0.22, 0.78 - sample.rowIndex * 0.05)}
                        className="cursor-pointer transition-all duration-200"
                        stroke={sample.rowIndex === focusIndex ? '#fff' : 'none'}
                        strokeWidth={sample.rowIndex === focusIndex ? 2 : 0}
                        tabIndex={0}
                        aria-label={metric.label + ': ' + formatValue(sample.value, metric.unit)}
                        onMouseEnter={() => setTooltip({
                          x: sample.x,
                          y: sample.y,
                          metricLabel: metric.label,
                          value: sample.value,
                          unit: metric.unit,
                          timestamp: windowRows[sample.rowIndex].timestamp,
                        })}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={() => setTooltip({
                          x: sample.x,
                          y: sample.y,
                          metricLabel: metric.label,
                          value: sample.value,
                          unit: metric.unit,
                          timestamp: windowRows[sample.rowIndex].timestamp,
                        })}
                        onBlur={() => setTooltip(null)}
                      >
                        <title>{`${metric.label}: ${formatValue(sample.value, metric.unit)} ${metric.unit} · ${new Date(windowRows[sample.rowIndex].timestamp).toLocaleString()}`}</title>
                      </circle>
                    ))}
                  </g>

                  <line x1="280" y1="280" x2={focusedX} y2={focusedY} stroke={metric.color} strokeOpacity="0.22" strokeWidth="1" />
                  <circle cx={focusedX} cy={focusedY} r="6" fill={metric.color} fillOpacity="0.88" stroke="white" strokeWidth="1.5" />
                </g>
              )
            })}

            {tooltip && (
              <g transform={`translate(${Math.max(16, Math.min(390, tooltip.x + 12))} ${Math.max(24, Math.min(510, tooltip.y - 10))})`}>
                <rect x="0" y="0" width="154" height="56" rx="10" fill="#fff" stroke="#ccc" strokeWidth="1.2" />
                <text x="12" y="18" fill="#222" style={{ fontSize: 11, fontWeight: 'bold', letterSpacing: '0.08em' }}>
                  {tooltip.metricLabel.toUpperCase()}
                </text>
                <text x="12" y="34" fill="#444" style={{ fontSize: 13, fontWeight: 600 }}>
                  {formatValue(tooltip.value, tooltip.unit)} {tooltip.unit}
                </text>
                <text x="12" y="48" fill="#888" style={{ fontSize: 9 }}>
                  {new Date(tooltip.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </text>
              </g>
            )}
          </svg>
        </div>

        <div className="space-y-3 w-full max-w-md">
          <div className="rounded-2xl border border-[color:var(--accent)] bg-white/90 p-4 shadow-lg">
            <h3 className="text-lg font-bold text-[color:var(--accent)] mb-1" tabIndex={0}>Snapshot selezionato</h3>
            <p className="mt-1 text-sm text-[color:var(--ink-strong)]" tabIndex={0}>{new Date(focusedRow.timestamp).toLocaleString()} · <span className="text-[color:var(--ink-faint)]">{focusedRow.source ?? 'Source n/a'}</span></p>
          </div>
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metricRanges.map((metric) => {
              const value = focusedRow[metric.key]
              const norm = typeof value === 'number' ? clamp01((value - metric.min) / (metric.max - metric.min)) : 0
              return (
                <div key={metric.key} className="rounded-xl border border-[color:var(--line)] bg-white px-3 py-2 flex flex-col items-start group focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)] transition-shadow">
                  <span className="text-sm font-semibold" style={{ color: metric.color }}>{metric.label}</span>
                  <span className="text-sm text-[color:var(--ink-strong)]">{formatValue(value, metric.unit)} {value != null ? metric.unit : ''}</span>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[color:var(--panel)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${norm * 100}%`, backgroundColor: metric.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--accent)] bg-white/90 p-4 mt-4 shadow-lg">
        <h3 className="text-sm font-semibold mb-3 text-[color:var(--accent)]">Timeline campioni (ultimi {windowRows.length})</h3>
        <div className="flex flex-wrap gap-2">
          {windowRows.map((row, index) => (
            <button
              key={`${row.timestamp}-${index}`}
              onClick={() => setFocusIndex(index)}
              className={`rounded-md border px-2.5 py-1 text-xs transition font-semibold ${index === focusIndex ? 'border-[color:var(--accent)] bg-[color:var(--accent-tint)] text-[color:var(--ink-strong)]' : 'border-[color:var(--line)] text-[color:var(--ink-soft)] hover:border-[color:var(--accent)] hover:bg-[color:var(--accent-tint)]'}`}
              tabIndex={0}
              aria-label={`Seleziona campione del ${new Date(row.timestamp).toLocaleDateString()} ${new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
            >
              {new Date(row.timestamp).toLocaleDateString()} {new Date(row.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
