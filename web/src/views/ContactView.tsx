import { useMemo, useState } from 'react'

type ContactTopic = 'question' | 'request' | 'feedback' | 'other'

interface ContactFormState {
  name: string
  email: string
  topic: ContactTopic
  subject: string
  context: string
  message: string
}

const INITIAL_FORM: ContactFormState = {
  name: '',
  email: '',
  topic: 'question',
  subject: '',
  context: '',
  message: '',
}

const TOPIC_LABEL: Record<ContactTopic, string> = {
  question: 'Domanda',
  request: 'Richiesta',
  feedback: 'Feedback',
  other: 'Altro',
}

function sanitizeInput(value: string, maxLength = 500): string {
  return value
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // control chars
    .trim()
    .slice(0, maxLength)
}

function buildNeutralDraft(form: ContactFormState) {
  const topic = TOPIC_LABEL[form.topic] ?? 'Altro'
  const name = sanitizeInput(form.name, 100)
  const email = sanitizeInput(form.email, 200)
  const subject = sanitizeInput(form.subject, 200)
  const context = sanitizeInput(form.context)
  const message = sanitizeInput(form.message, 2000)
  const nameLine = name ? `Nome: ${name}` : 'Nome: non indicato'
  const emailLine = email ? `Email: ${email}` : 'Email: non indicata'
  const subjectLine = subject ? subject : 'Nessun oggetto specificato'
  const contextLine = context ? context : 'Nessun contesto aggiuntivo'
  const messageLine = message ? message : 'Nessun messaggio inserito'

  return [
    'Formato neutro per domande/richieste',
    `Tipo: ${topic}`,
    nameLine,
    emailLine,
    `Oggetto: ${subjectLine}`,
    `Contesto: ${contextLine}`,
    'Messaggio:',
    messageLine,
  ].join('\n')
}

export default function ContactView() {
  const [form, setForm] = useState<ContactFormState>(INITIAL_FORM)
  const [submitted, setSubmitted] = useState(false)

  const neutralDraft = useMemo(() => buildNeutralDraft(form), [form])

  const updateField = <K extends keyof ContactFormState>(key: K, value: ContactFormState[K]) => {
    setSubmitted(false)
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  const onReset = () => {
    setForm(INITIAL_FORM)
    setSubmitted(false)
  }

  return (
    <div className="min-h-screen bg-transparent px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--ink-faint)]">
            Contact
          </p>
          <h2 className="text-2xl font-medium text-[color:var(--ink)] sm:text-3xl">
            Formato neutro per domande e richieste
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--ink-soft)]">
            Compila i campi essenziali in modo chiaro e non ambiguo. Il blocco di anteprima genera un testo neutro pronto da inviare a team, supporto o collaboratori.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]/60 p-4 sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-xs text-[color:var(--ink-faint)]">Nome (opzionale)</span>
                <input
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full rounded-md border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                  placeholder="Mario Rossi"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-[color:var(--ink-faint)]">Email (opzionale)</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full rounded-md border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                  placeholder="nome@dominio.com"
                />
              </label>
            </div>

            <label className="space-y-1 block">
              <span className="text-xs text-[color:var(--ink-faint)]">Tipo</span>
              <select
                value={form.topic}
                onChange={(e) => updateField('topic', e.target.value as ContactTopic)}
                className="w-full rounded-md border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
              >
                <option value="question">Domanda</option>
                <option value="request">Richiesta</option>
                <option value="feedback">Feedback</option>
                <option value="other">Altro</option>
              </select>
            </label>

            <label className="space-y-1 block">
              <span className="text-xs text-[color:var(--ink-faint)]">Oggetto</span>
              <input
                required
                value={form.subject}
                onChange={(e) => updateField('subject', e.target.value)}
                className="w-full rounded-md border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                placeholder="Tema principale della richiesta"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs text-[color:var(--ink-faint)]">Contesto sintetico</span>
              <textarea
                rows={3}
                value={form.context}
                onChange={(e) => updateField('context', e.target.value)}
                className="w-full rounded-md border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                placeholder="Informazioni utili per inquadrare la situazione"
              />
            </label>

            <label className="space-y-1 block">
              <span className="text-xs text-[color:var(--ink-faint)]">Messaggio</span>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => updateField('message', e.target.value)}
                className="w-full rounded-md border border-[color:var(--line)] bg-transparent px-3 py-2 text-sm text-[color:var(--ink)] outline-none focus:border-[color:var(--accent)]"
                placeholder="Scrivi qui la domanda o la richiesta in modo chiaro"
              />
            </label>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="submit"
                className="rounded-md border border-[color:var(--accent)] bg-[color:var(--accent)] px-3 py-2 text-xs font-medium text-white"
              >
                Genera formato
              </button>
              <button
                type="button"
                onClick={onReset}
                className="rounded-md border border-[color:var(--line)] px-3 py-2 text-xs font-medium text-[color:var(--ink)]"
              >
                Reset
              </button>
            </div>
            {submitted && (
              <p className="text-xs text-emerald-400">Formato aggiornato nella preview a destra.</p>
            )}
          </form>

          <section className="rounded-xl border border-[color:var(--line)] bg-[color:var(--surface)]/40 p-4 sm:p-5">
            <h3 className="text-sm font-medium text-[color:var(--ink)]">Anteprima neutra</h3>
            <p className="mt-1 text-xs text-[color:var(--ink-faint)]">
              Usa questo testo come base da copiare in email o ticket.
            </p>
            <pre className="mt-4 whitespace-pre-wrap rounded-lg border border-[color:var(--line)]/60 bg-black/10 p-3 text-xs leading-relaxed text-[color:var(--ink-soft)]">
              {neutralDraft}
            </pre>
          </section>
        </div>
      </div>
    </div>
  )
}
