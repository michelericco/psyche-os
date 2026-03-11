import { Expandable, CopyBlock, SectionHead } from '../components/shared'

interface PipelineStep {
  readonly id: string
  readonly phase: number
  readonly name: string
  readonly command: string
  readonly note: string
  readonly parallel?: boolean
}

const PREREQUISITES = [
  {
    tool: 'AI CLI (one of these)',
    check: 'claude --version  # or: codex --version / gemini --version',
    install: `# Claude Code (recommended)
npm install -g @anthropic-ai/claude-code

# Codex CLI (alternative)
npm install -g @openai/codex

# Gemini CLI (alternative)
npm install -g @anthropic-ai/gemini-cli`,
  },
  { tool: 'Node.js 18+', check: 'node --version', install: 'brew install node  # or: nvm install 18' },
  {
    tool: 'Git + npm (for Siftly / X/Twitter extraction)',
    check: 'git --version && npm --version',
    install: 'brew install git node',
  },
  { tool: 'Python 3 (for vector search, optional)', check: 'python3 --version', install: 'brew install python3' },
]

interface DataSource {
  readonly id: string
  readonly name: string
  readonly kind: 'automated' | 'manual'
  readonly description: string
  readonly command: string
  readonly note: string
}

const DATA_SOURCES: readonly DataSource[] = [
  {
    id: 'claude-code',
    name: 'Claude Code Sessions',
    kind: 'automated',
    description: 'Session transcripts from Claude Code CLI',
    command: 'ls ~/.claude/projects/**/*.jsonl | head -5',
    note: 'Claude Code stores session transcripts as .jsonl files in ~/.claude/projects/. The pipeline reads these automatically.',
  },
  {
    id: 'codex',
    name: 'Codex CLI Sessions',
    kind: 'automated',
    description: 'Session transcripts from Codex CLI',
    command: 'ls ~/Library/Application\\ Support/codex-cli/**/*.jsonl | head -5',
    note: 'Codex stores sessions in ~/Library/Application Support/codex-cli/. The pipeline reads these automatically.',
  },
  {
    id: 'twitter',
    name: 'X/Twitter Bookmarks',
    kind: 'automated',
    description: 'Exported bookmarks via Siftly',
    command: `# Install and run Siftly
if [ ! -d "./vendor/siftly" ]; then
  git clone https://github.com/viperrcrypto/Siftly ./vendor/siftly
  cd ./vendor/siftly && npm install && cd ../..
fi
cd ./vendor/siftly && npm run export && cd ../..
cp ./vendor/siftly/output/*.json ./sources/twitter/`,
    note: 'Requires X/Twitter login cookies. Siftly extracts bookmarks without API credentials.',
  },
  {
    id: 'youtube',
    name: 'YouTube History',
    kind: 'manual',
    description: 'Watch history, subscriptions, and search history from Google Takeout',
    command: `# 1. Go to takeout.google.com
# 2. Select: YouTube (Watch History, Subscriptions)
# 3. Export and download
# 4. Copy files:
cp Takeout/YouTube\\ and\\ YouTube\\ Music/history/*.json ./sources/youtube/`,
    note: 'Export from takeout.google.com. Select YouTube data only for faster export.',
  },
  {
    id: 'cloud-ai',
    name: 'Claude.ai / ChatGPT / Gemini',
    kind: 'manual',
    description: 'Paste the extraction prompt in any AI with your conversation history',
    command: `# Open the extraction prompt, copy it, and paste it in your AI chat:
cat web/src/prompts/extraction.txt | pbcopy
echo "Extraction prompt copied to clipboard"`,
    note: 'Works with any AI where you have significant conversation history. Save the JSON output to ./sources/<platform>/extraction.json',
  },
]

const PIPELINE_STEPS: readonly PipelineStep[] = [
  {
    id: 'run-full-pipeline',
    phase: 0,
    name: 'Run: Full Pipeline',
    command: 'bash scripts/run-full-pipeline.sh',
    note: 'Recommended default. Executes extraction + synthesis + neurodivergence in one flow.',
  },
  {
    id: 'extract-claude-sessions',
    phase: 1,
    name: 'Extract: Claude Sessions',
    command: 'bash scripts/extract-claude-sessions.sh',
    note: 'Analyzes Claude Code session transcripts. Takes 2-5 min.',
    parallel: true,
  },
  {
    id: 'extract-codex-sessions',
    phase: 1,
    name: 'Extract: Codex Sessions',
    command: 'bash scripts/extract-codex-sessions.sh',
    note: 'Analyzes Codex CLI session transcripts. Takes 2-5 min.',
    parallel: true,
  },
  {
    id: 'extract-social-traces',
    phase: 1,
    name: 'Extract: Social Traces',
    command: 'bash scripts/extract-social-traces.sh',
    note: 'Analyzes X/Twitter bookmarks + YouTube history. Takes 2-5 min.',
    parallel: true,
  },
  {
    id: 'synthesize',
    phase: 2,
    name: 'Synthesize',
    command: 'bash scripts/synthesize.sh',
    note: 'Cross-validates patterns across all 3 sources. Requires all extractions to complete first.',
  },
  {
    id: 'neurodivergence',
    phase: 2,
    name: 'Neurodivergence Screening',
    command: 'bash scripts/neurodivergence.sh',
    note: 'Evidence-based behavioral screening. Requires all extractions. NOT a clinical diagnosis.',
  },
  {
    id: 'vector-embed',
    phase: 3,
    name: 'Vector Embeddings',
    command: `pip install chromadb sentence-transformers
python3 scripts/create-embeddings.py`,
    note: 'Creates a semantic search index. Optional, only needed for the Semantic Map view.',
  },
]

const DISCOVERIES: readonly string[] = [
  'Cognitive patterns and thinking styles',
  'Recurring psychological cycles',
  'Archetypal resonances (Jungian framework)',
  'Self-sabotage indicators and blind spots',
  'Latent potentials and directional vectors',
  'Neurodivergence screening (evidence-based, not diagnosis)',
  'Your narrative arc, where you are in your story',
]

function KindBadge({ kind }: { readonly kind: 'automated' | 'manual' }) {
  const styles =
    kind === 'automated'
      ? 'border-[#5f6e58]/25 bg-[#5f6e58]/8 text-[#5f6e58]'
      : 'border-[#a77c58]/25 bg-[#a77c58]/8 text-[#a77c58]'

  return (
    <span
      className={`border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em] ${styles}`}
    >
      {kind}
    </span>
  )
}

function PhaseBadge({ phase, parallel }: { phase: number; parallel?: boolean }) {
  const labels = ['Setup', 'Phase 1', 'Phase 2', 'Phase 3']
  const colors = [
    'border-slate-500/25 bg-slate-500/8 text-slate-500',
    'border-[#5f6e58]/25 bg-[#5f6e58]/8 text-[#5f6e58]',
    'border-[#a77c58]/25 bg-[#a77c58]/8 text-[#a77c58]',
    'border-[#4e5f63]/25 bg-[#4e5f63]/8 text-[#4e5f63]',
  ]
  return (
    <span className="flex items-center gap-1.5">
      <span className={`border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em] ${colors[phase]}`}>
        {labels[phase]}
      </span>
      {parallel && (
        <span className="border border-slate-500/25 bg-slate-500/8 px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em] text-slate-500">
          parallel
        </span>
      )}
    </span>
  )
}

export default function OnboardingView() {
  return (
    <div className="mx-auto max-w-2xl space-y-14 py-12">
      {/* Hero */}
      <header className="space-y-3">
        <SectionHead
          title="Map your digital psyche"
          subtitle="PSYCHE/OS analyzes digital traces across AI conversations, bookmarks, and search history to build a multidimensional profile, then compute a clearer directional vector from the evidence."
        />
        <p className="text-xs text-[color:var(--ink-faint)]">
          Connect your data sources, then run the extraction and synthesis phases. Prompt compatibility is expanding; the current adapters are only the first layer.
        </p>
      </header>

      {/* Prerequisites */}
      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[color:var(--ink-faint)]">
          Prerequisites
        </h2>
        <div className="space-y-0">
          {PREREQUISITES.map(p => (
            <Expandable key={p.tool} title={p.tool} summary={<code className="text-xs text-[color:var(--ink-faint)]">{p.check}</code>}>
              <div className="space-y-3">
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--ink-faint)]">Check</span>
                  <CopyBlock code={p.check} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--ink-faint)]">Install</span>
                  <CopyBlock code={p.install} />
                </div>
              </div>
            </Expandable>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="space-y-5">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[color:var(--ink-faint)]">
          Data Sources
        </h2>

        <div className="space-y-0">
          {DATA_SOURCES.map((source) => (
            <Expandable
              key={source.id}
              title={source.name}
              summary={
                <span className="flex items-center gap-2">
                  <KindBadge kind={source.kind} />
                  <span>{source.description}</span>
                </span>
              }
            >
              <div className="space-y-3">
                <CopyBlock code={source.command} />
                <p className="text-xs text-[color:var(--ink-faint)]">{source.note}</p>
              </div>
            </Expandable>
          ))}
        </div>
      </section>

      {/* Pipeline */}
      <section className="space-y-5">
        <SectionHead
          title="Analysis Pipeline"
          subtitle="Run step by step, or all at once. Phase 1 scripts can run in parallel."
        />

        {/* Full pipeline command */}
        <Expandable
          title="Run everything"
          summary="Full pipeline: all extractions, synthesis, and neurodivergence screening"
        >
          <div className="space-y-3">
            <CopyBlock code="cd psyche-os && bash scripts/run-full-pipeline.sh" />
            <p className="text-xs text-[color:var(--ink-faint)]">
              Runs all 3 extractions in parallel, then synthesis and neurodivergence screening sequentially.
            </p>
          </div>
        </Expandable>

        <div className="space-y-0">
          {PIPELINE_STEPS.map((step) => (
            <Expandable
              key={step.id}
              title={step.name}
              summary={<PhaseBadge phase={step.phase} parallel={step.parallel} />}
            >
              <div className="space-y-3">
                <CopyBlock code={`cd psyche-os && ${step.command}`} />
                <p className="text-xs text-[color:var(--ink-faint)]">{step.note}</p>
              </div>
            </Expandable>
          ))}
        </div>
      </section>

      {/* What You'll Discover */}
      <section className="space-y-4">
        <h2 className="text-xs font-medium uppercase tracking-widest text-[color:var(--ink-faint)]">
          What You'll Discover
        </h2>

        <ul className="space-y-2">
          {DISCOVERIES.map((item) => (
            <li key={item} className="text-sm text-[color:var(--ink-soft)]">
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
