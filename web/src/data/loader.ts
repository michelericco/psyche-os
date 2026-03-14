// PSYCHE/OS Data Loader — loads from synthesis JSON, with hardcoded fallbacks for data not in synthesis
import type {
  Connection,
  CrossValidatedPattern,
  DimensionalScore,
  DirectionalVector,
  Extraction,
  NarrativeArc,
  Potential,
  Theme,
  Entity,
} from './types'
import synthesisRaw from './synthesis-unified.json'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function normalizeDirectionalVector(value: unknown): DirectionalVector | undefined {
  if (!isRecord(value)) return undefined

  const headingSource = isRecord(value.heading) ? value.heading : undefined
  const heading = {
    from: asString(headingSource?.from, 'Current operating pattern'),
    toward: asString(headingSource?.toward, 'Integrated AI workflow'),
    through: asString(headingSource?.through, 'Small repeated experiments'),
    confidence: asNumber(headingSource?.confidence, asNumber(value.momentum, 0.5)),
    justification: asString(headingSource?.justification, asString(value.summary, 'Directional estimate based on available synthesis data.')),
  }

  const axes = Array.isArray(value.axes)
    ? value.axes
        .filter(isRecord)
        .map((axis) => ({
          axis: asString(axis.axis, 'Direction'),
          leftPole: asString(axis.leftPole, 'Current'),
          rightPole: asString(axis.rightPole, 'Target'),
          current: asNumber(axis.current, 0),
          recommendedDrift: asNumber(axis.recommendedDrift, 0),
          rationale: asString(axis.rationale, ''),
          evidence: asStringArray(axis.evidence),
        }))
    : []

  const constraints = asStringArray(value.constraints)
  const legacyObstacles = asStringArray(value.obstacles)

  return {
    summary: asString(value.summary, 'Directional estimate'),
    coordinateSystem: asString(value.coordinateSystem, 'Normalized drift map'),
    axes,
    heading,
    constraints: constraints.length > 0 ? constraints : legacyObstacles,
    attractors: asStringArray(value.attractors),
    antiVectors: asStringArray(value.antiVectors),
    nextExperimentSurfaces: Array.isArray(value.nextExperimentSurfaces)
      ? value.nextExperimentSurfaces
          .filter(isRecord)
          .map((surface) => ({
            surface: asString(surface.surface, 'Experiment surface'),
            whyThisSurface: asString(surface.whyThisSurface, ''),
            successSignal: asString(surface.successSignal, ''),
            failureSignal: asString(surface.failureSignal, ''),
          }))
      : [],
  }
}

// ---------------------------------------------------------------------------
// Synthesis data (loaded from pipeline output)
// ---------------------------------------------------------------------------

const synthesis = synthesisRaw as unknown as {
  crossValidatedPatterns: CrossValidatedPattern[]
  archetypeMapping: {
    dominant: { archetype: string; manifestation: string; shadow: string; confidence: number; evidence: string }
    secondary: { archetype: string; manifestation: string; shadow: string; confidence: number; evidence: string }
    emergent: { archetype: string; manifestation: string; shadow: string; confidence: number; evidence: string }
    goldenShadow: { archetype: string; manifestation: string; shadow: string; confidence: number; evidence: string }
  }
  unifiedDimensionalScores: Record<string, DimensionalScore>
  topPotentials: Potential[]
  narrativeArc: NarrativeArc
  directionalVector?: DirectionalVector
  modelLimitations?: string[]
  simulacrumIndex?: number
  sensorData?: unknown[]
}

// Cross-validated patterns from synthesis
export const crossValidatedPatterns: CrossValidatedPattern[] = synthesis.crossValidatedPatterns

// Archetype mapping from synthesis
export const archetypeMapping = synthesis.archetypeMapping

// Dimensional scores from synthesis
export const dimensionalScores: Record<string, DimensionalScore> = synthesis.unifiedDimensionalScores

// Potentials from synthesis
export const allPotentials: Potential[] = synthesis.topPotentials

// Narrative arc from synthesis
export const narrativeArc: NarrativeArc = synthesis.narrativeArc

// New data from synthesis (not previously available)
export const directionalVector: DirectionalVector | undefined = normalizeDirectionalVector(synthesis.directionalVector)
export const modelLimitations: string[] = synthesis.modelLimitations ?? []
export const simulacrumIndex: number = synthesis.simulacrumIndex ?? 0
export const sensorData: unknown[] = synthesis.sensorData ?? []

// ...existing code...

// ---------------------------------------------------------------------------
// Hardcoded data (not in synthesis JSON — entities, themes, genome, etc.)
// ---------------------------------------------------------------------------

const ENTITY_LIBRARY: Record<string, Entity> = {
  'Atlas': {
    name: 'Atlas',
    kind: 'project',
    mentions: 57,
    significance: 'Fleet Intelligence Agent for railway logistics — core professional project.',
    dimensions: ['Professional'],
    relatedEntities: ['Railway logistics', 'Security Protocol', 'Claude (AI assistant)'],
    sourceMemories: ['claude-code', 'openclaw'],
  },
  'SQL': {
    name: 'SQL',
    kind: 'tool',
    mentions: 35,
    significance: 'Primary technical tool for data querying and optimization.',
    dimensions: ['Professional'],
    relatedEntities: ['Atlas', 'Query Optimization'],
    sourceMemories: ['claude-code'],
  },
  'Security Protocol': {
    name: 'Security Protocol',
    kind: 'tool',
    mentions: 27,
    significance: 'Security-first design as a core principle in Atlas architecture.',
    dimensions: ['Professional'],
    relatedEntities: ['Atlas', 'Input validation'],
    sourceMemories: ['openclaw'],
  },
  'Railway logistics': {
    name: 'Railway logistics',
    kind: 'project',
    mentions: 23,
    significance: 'Core domain expertise: intermodal rail operations, wagon management, CUU taxonomy.',
    dimensions: ['Professional', 'Anthropological'],
    relatedEntities: ['Atlas', 'Fleet Intelligence', 'Wagon maintenance'],
    sourceMemories: ['openclaw', 'claude-code'],
  },
  'Claude (AI assistant)': {
    name: 'Claude (AI assistant)',
    kind: 'tool',
    mentions: 19,
    significance: 'Primary AI tool for development assistance and problem-solving.',
    dimensions: ['Professional'],
    relatedEntities: ['Atlas', 'SQL'],
    sourceMemories: ['claude-code'],
  },
  'Fleet Intelligence': {
    name: 'Fleet Intelligence',
    kind: 'system',
    mentions: 20,
    significance: 'Intelligent coordination layer for physical rail fleet infrastructure.',
    dimensions: ['Professional'],
    relatedEntities: ['Atlas', 'Railway logistics'],
    sourceMemories: ['openclaw'],
  },
  'Michele Ricco': {
    name: 'Michele Ricco',
    kind: 'persona',
    mentions: 25,
    significance: 'Subject of analysis — professional in railway logistics building AI tools.',
    dimensions: ['Professional', 'Psychological'],
    relatedEntities: ['Atlas', 'Railway logistics'],
    sourceMemories: ['claude-code', 'codex', 'openclaw'],
  },
  'YouTube': {
    name: 'YouTube',
    kind: 'tool',
    mentions: 30,
    significance: 'Primary media consumption platform — AI/ML and music content.',
    dimensions: ['Creative'],
    relatedEntities: ['Twitter'],
    sourceMemories: ['youtube'],
  },
  'Software Design Patterns': {
    name: 'Software Design Patterns',
    kind: 'tool',
    mentions: 24,
    significance: 'Structural thinking applied to software architecture.',
    dimensions: ['Professional'],
    relatedEntities: ['Adapter Pattern', 'SQL'],
    sourceMemories: ['claude-code'],
  },
}

const THEME_LIBRARY: Record<string, Theme> = {
  'Transactional Infrastructure Management': {
    label: 'Transactional Infrastructure Management',
    relevance: 0.90,
    keywords: ['operations', 'infrastructure', 'management', 'logistics', 'fleet'],
    dimension: 'Professional',
    evidence: 'Dominant theme across claude-code and openclaw sessions: operational AI managing physical infrastructure.',
  },
  'Instrumental Tool Use': {
    label: 'Instrumental Tool Use',
    relevance: 0.90,
    keywords: ['tools', 'AI', 'delegation', 'automation', 'workflow'],
    dimension: 'Professional',
    evidence: 'AI tools used as direct problem-solving instruments with minimal meta-reflection.',
  },
  'Blocked Action / Friction': {
    label: 'Blocked Action / Friction',
    relevance: 0.85,
    keywords: ['friction', 'errors', 'billing', 'auth', 'blocked'],
    dimension: 'Psychological',
    evidence: 'Recurring pattern of session termination due to infrastructure barriers before tasks complete.',
  },
  'Agentic AI-driven developer workflow': {
    label: 'Agentic AI-driven developer workflow',
    relevance: 0.85,
    keywords: ['agents', 'automation', 'delegation', 'AI', 'developer'],
    dimension: 'Professional',
    evidence: 'Aspiration to use AI as an autonomous execution layer for development tasks.',
  },
  'Delegation of cognitive load to AI': {
    label: 'Delegation of cognitive load to AI',
    relevance: 0.85,
    keywords: ['delegation', 'trust', 'AI', 'cognition', 'outsourcing'],
    dimension: 'Psychological',
    evidence: 'High-trust delegation pattern with minimal personal scaffolding or documentation.',
  },
  'Operational AI in industrial logistics': {
    label: 'Operational AI in industrial logistics',
    relevance: 0.85,
    keywords: ['railway', 'fleet', 'wagons', 'operations', 'AI', 'logistics'],
    dimension: 'Professional',
    evidence: 'Atlas project: AI agent for real-time fleet intelligence in railway operations.',
  },
  'Practical AI integration': {
    label: 'Practical AI integration',
    relevance: 0.78,
    keywords: ['integration', 'workflow', 'practical', 'tools', 'daily'],
    dimension: 'Professional',
    evidence: 'Focus on making AI tools work in concrete professional contexts.',
  },
  'Aspirational Curation': {
    label: 'Aspirational Curation',
    relevance: 0.62,
    keywords: ['bookmarks', 'philosophy', 'AI', 'curation', 'aspiration'],
    dimension: 'Psychological',
    evidence: 'Twitter bookmarks show philosophical-technical aspirations not yet integrated into practice.',
  },
}

// ---------------------------------------------------------------------------
// Cognitive genome primitives (hardcoded — not in synthesis)
// ---------------------------------------------------------------------------

export const cognitiveGenomePrimitives = [
  { name: 'Security-First Design', value: 0.82, kind: 'systematic' },
  { name: 'Direct Instrumental Querying', value: 0.79, kind: 'analytical' },
  { name: 'Structured Role Decomposition', value: 0.76, kind: 'systematic' },
  { name: 'High-Trust Delegation', value: 0.72, kind: 'intuitive' },
  { name: 'Domain-Anchored Thinking', value: 0.70, kind: 'analytical' },
  { name: 'Aspirational Curation', value: 0.62, kind: 'divergent' },
  { name: 'Tool-Adoption/Abandonment Cycle', value: 0.65, kind: 'metacognitive' },
  { name: 'Operational AI Orientation', value: 0.85, kind: 'systematic' },
]

// ---------------------------------------------------------------------------
// Neurodivergence data (from neurodivergence-screening.json, hardcoded)
// ---------------------------------------------------------------------------

export const neurodivergenceIndicators: import('./types').NeurodivergenceIndicator[] = [
  {
    label: 'ADHD-adjacent patterns',
    dimension: 'Attention & Executive Function',
    markers: [
      {
        marker: 'Burst-Process-Burst rhythm',
        evidence: 'All three sources confirm a multi-day oscillation between intense creation and disengagement. This resembles hyperfocus-crash cycles documented in ADHD literature.',
        strength: 0.68,
      },
      {
        marker: 'High novelty-seeking with project restarts',
        evidence: 'The Build-Abstract-Restart pattern (CVP-001, confidence 0.91) shows repeated project reinitiation. Six identifiable life phases each involve domain shifts. This overlaps with ADHD novelty preference but also with creative temperament.',
        strength: 0.62,
      },
      {
        marker: 'Last-mile completion difficulty',
        evidence: 'Consumption-Production Asymmetry (CVP-004) and the narrative tension point both describe a gap between internal richness and shipped artifacts. The Sabotaged potential (AI Studio Practice) shows high capability dispersed across prototypes.',
        strength: 0.58,
      },
      {
        marker: 'Domain-switching acceleration',
        evidence: 'Life phases show progressively faster domain transitions: engineering (6yr), digital (3yr), builder (2yr), artist (2yr), seeker (1yr), convergence (ongoing). This acceleration is consistent with novelty-seeking but also with polymath learning curves.',
        strength: 0.45,
      },
    ],
    overallStrength: 0.58,
    caveat: 'Burst-process-burst is also documented in creative professionals without ADHD (Wallas, 1926). Project restarts may reflect genuine architectural insight rather than impulsivity. Completion difficulty correlates with perfectionism and high standards, not exclusively with executive dysfunction.',
    differentialNotes: 'The profile shows HIGH consistency in physical discipline (0.90 across all sources), which is atypical for clinical ADHD where inconsistency tends to be domain-general. The selectivity of the attention pattern (strong in body domain, variable in knowledge work) suggests a more nuanced picture than standard ADHD presentation.',
    references: [
      { author: 'Barkley, R.A.', work: 'ADHD and the Nature of Self-Control', year: '1997', detail: 'Executive function model of ADHD and temporal discounting.' },
      { author: 'Brown, T.E.', work: 'A New Understanding of ADHD in Children and Adults', year: '2013', detail: 'Executive function impairments across six clusters.' },
      { author: 'Hoogman, M. et al.', work: 'Brain Imaging of the Cortex in ADHD', year: '2019', detail: 'Meta-analysis of structural brain differences in ADHD (Lancet Psychiatry).' },
      { author: 'White, H.A. & Shah, P.', work: 'Creative Style and Achievement in Adults with ADHD', year: '2011', detail: 'Divergent thinking advantages in ADHD populations.' },
    ],
  },
  {
    label: 'Autism spectrum-adjacent patterns',
    dimension: 'Systematizing & Social Processing',
    markers: [
      {
        marker: 'Infrastructure-first systematizing',
        evidence: 'The cognitive genome shows Infrastructure-First as a core primitive (0.74). Projects consistently begin with architecture, protocols, and naming systems before surface implementation. This systematic approach is consistent with Baron-Cohen\'s systematizing quotient.',
        strength: 0.65,
      },
      {
        marker: 'Deep interest accumulation with expertise depth',
        evidence: 'Each life phase shows deep immersion: mechanical engineering, AI systems, photography aesthetics, consciousness philosophy. The depth within each domain goes well beyond casual interest.',
        strength: 0.55,
      },
      {
        marker: 'Social selectivity and low weak-tie density',
        evidence: 'Social dimension scores lowest (0.47). Relational Selectivity theme confirms "social energy is highly selective and rarely diffused across weak ties." Dunbar number appears structurally low.',
        strength: 0.52,
      },
      {
        marker: 'Naming-as-Cognition: explicit systematizing of experience',
        evidence: 'The Naming-as-Cognition primitive (0.58) and protocol design theme suggest a preference for making implicit knowledge explicit through formal systems.',
        strength: 0.48,
      },
    ],
    overallStrength: 0.52,
    caveat: 'Systematizing is also characteristic of engineering training and practice. Social selectivity correlates with introversion (Big Five Extraversion: 0.35) without requiring an ASD explanation. Deep interests are common in high-openness profiles (Big Five Openness: 0.92). Many "autistic traits" in behavioral data are indistinguishable from introversion + high intelligence + engineering training.',
    differentialNotes: 'The profile shows FLEXIBLE domain-switching (6 life phases with genuine pivots), which is atypical for restrictive/repetitive behavior patterns in ASD. Social engagement, while selective, shows capacity for deep relational engagement when activated. The Dialogic Externalization pattern suggests comfort with symbolic social interaction (agents, personas) that differs from typical ASD social processing difficulties.',
    references: [
      { author: 'Baron-Cohen, S.', work: 'The Essential Difference', year: '2003', detail: 'Empathizing-systematizing theory and the extreme male brain hypothesis.' },
      { author: 'Happé, F. & Frith, U.', work: 'The Weak Coherence Account', year: '2006', detail: 'Detail-focused processing style in autism (Journal of Autism and Developmental Disorders).' },
      { author: 'Lai, M.C. et al.', work: 'Quantifying and Exploring Camouflaging in Men and Women with Autism', year: '2017', detail: 'Masking and compensation strategies in high-functioning autism.' },
      { author: 'Ruzich, E. et al.', work: 'Measuring Autistic Traits in the General Population', year: '2015', detail: 'AQ scores are continuously distributed, not bimodal (PLOS ONE).' },
    ],
  },
  {
    label: 'Giftedness indicators',
    dimension: 'Cognitive Intensity & Overexcitabilities',
    markers: [
      {
        marker: 'Intellectual overexcitability',
        evidence: 'High Openness (0.92), cross-domain synthesis as a core pattern, and the Empirical-Mystical oscillation all point to Dabrowski\'s intellectual overexcitability: an intense drive to understand, question, and seek truth across domains.',
        strength: 0.72,
      },
      {
        marker: 'Imaginational overexcitability',
        evidence: 'The photography practice (Stillframe), atmospheric aesthetics, and naming-as-cognition suggest rich inner imagery and a strong capacity for metaphorical thinking.',
        strength: 0.58,
      },
      {
        marker: 'Existential concerns and meaning-seeking',
        evidence: 'The Seeker archetype (0.79), Consciousness Inquiry theme, and Spiritual dimension depth (0.76) all show sustained existential engagement beyond what circumstance requires. This is characteristic of gifted adults.',
        strength: 0.67,
      },
      {
        marker: 'Rapid cross-domain transfer',
        evidence: 'Fractal Transfer primitive (0.71) and the Cross-domain Synthesis theme (0.88) confirm a pattern of applying insights from one domain to another, a hallmark of high general intelligence.',
        strength: 0.64,
      },
      {
        marker: 'Asynchronous development',
        evidence: 'Professional dimension (0.90) far exceeds Social dimension (0.47). Physical discipline is highly developed while project completion is inconsistent. This asymmetry is characteristic of asynchronous development in giftedness.',
        strength: 0.56,
      },
    ],
    overallStrength: 0.63,
    caveat: 'Overexcitabilities also appear in highly creative individuals who may not meet formal giftedness criteria. Existential concerns increase with education and philosophical exposure regardless of cognitive ability. Cross-domain transfer can reflect breadth of experience rather than exceptional processing speed.',
    differentialNotes: 'The IQ estimate from behavioral patterns (provided separately in the dashboard) gives additional context. Giftedness is typically defined by IQ > 130, but the behavioral markers here are observable regardless of formal testing. The combination of high abstraction + cross-domain transfer + existential engagement is suggestive but not conclusive without psychometric data.',
    references: [
      { author: 'Dabrowski, K.', work: 'Positive Disintegration', year: '1964', detail: 'Theory of overexcitabilities and developmental potential in gifted individuals.' },
      { author: 'Webb, J.T. et al.', work: 'Misdiagnosis and Dual Diagnoses of Gifted Children and Adults', year: '2005', detail: 'How giftedness mimics ADHD, ASD, and mood disorders.' },
      { author: 'Silverman, L.K.', work: 'Giftedness 101', year: '2012', detail: 'Asynchronous development and the lived experience of giftedness.' },
      { author: 'Rinn, A.N. & Bishop, J.', work: 'Gifted Adults: A Systematic Review and Analysis of the Literature', year: '2015', detail: 'Meta-review of gifted adult characteristics and outcomes.' },
    ],
  },
  {
    label: 'High Sensitivity (HSP) patterns',
    dimension: 'Sensory Processing & Depth of Processing',
    markers: [
      {
        marker: 'Deep processing of information',
        evidence: 'Consumption-Production Asymmetry (CVP-004) confirms that input is processed more deeply than it is externalized. The mind saturates before shipping. This depth-of-processing is a core HSP trait per Aron\'s model.',
        strength: 0.6,
      },
      {
        marker: 'Aesthetic sensitivity',
        evidence: 'Aesthetic Restraint theme (0.76), the photography practice emphasizing atmosphere and composition, and preference for "reduced, typographic, high-control visual systems" all suggest heightened aesthetic processing.',
        strength: 0.62,
      },
      {
        marker: 'Need for autonomy and low-stimulation environments',
        evidence: 'Sovereignty-as-Core-Value (CVP-006, 0.84) and the preference for owned infrastructure over noisy platforms suggest a need to control environmental input, consistent with HSP overstimulation management.',
        strength: 0.5,
      },
    ],
    overallStrength: 0.55,
    caveat: 'Aesthetic sensitivity and deep processing are also features of high Openness (which scores 0.92 in this profile). The preference for controlled environments may reflect introversion or engineering mindset rather than sensory sensitivity. HSP overlaps heavily with introversion and neuroticism, making it difficult to distinguish from personality traits alone.',
    differentialNotes: 'HSP (Sensory Processing Sensitivity) is a temperament trait present in ~15-20% of the population, not a clinical diagnosis. It correlates with but is distinct from introversion and neuroticism. The evidence here is moderate — the sovereignty preference and aesthetic sensitivity are suggestive, but the profile also shows tolerance for high-intensity technical work, which is less typical of high-HSP profiles.',
    references: [
      { author: 'Aron, E.N.', work: 'The Highly Sensitive Person', year: '1996', detail: 'Foundational description of sensory processing sensitivity as a temperament trait.' },
      { author: 'Aron, E.N. et al.', work: 'Sensory Processing Sensitivity: A Review in the Light of the Evolution of Biological Responsivity', year: '2012', detail: 'Updated theoretical framework connecting SPS to differential susceptibility.' },
      { author: 'Pluess, M.', work: 'Individual Differences in Environmental Sensitivity', year: '2015', detail: 'Vantage sensitivity model — sensitivity to positive environments, not just negative.' },
    ],
  },
]

export const neurodivergenceOverlapAnalysis = 'The four dimensions analyzed here overlap substantially. ADHD and giftedness share novelty-seeking, rapid ideation, and intensity. ASD and giftedness share systematizing, deep interests, and social selectivity. HSP overlaps with all three through deep processing and sensitivity. This is why differential diagnosis requires professional assessment: the same behavioral pattern (e.g., project restarts) can have entirely different underlying mechanisms (impulsivity vs. perfectionism vs. boredom from mastery). In this profile, the strongest convergent signal is across the giftedness and ADHD-adjacent dimensions, which is consistent with the "twice-exceptional" (2e) literature where high cognitive ability coexists with executive function variability'

export const neurodivergenceSummary = 'The behavioral profile shows moderate-to-strong indicators of intellectual giftedness (overexcitabilities, cross-domain transfer, existential depth) and moderate ADHD-adjacent patterns (burst rhythms, novelty-seeking, completion difficulty). Autism spectrum and HSP indicators are present but weaker and largely explainable by introversion, engineering training, and high Openness. The overall picture is more consistent with a gifted/2e profile than with any single clinical neurodivergent condition, but formal assessment would be needed to confirm or refute this'

// ---------------------------------------------------------------------------
// Extraction-level data (hardcoded — per-source detail not in synthesis)
// ---------------------------------------------------------------------------

const COGNITIVE_PATTERN_LIBRARY = {
  'claude-sessions': [
    { label: 'Direct Instrumental Querying', kind: 'analytical', confidence: 0.79, evidence: 'Terse, direct technical questions without preamble or context — optimized for execution.' },
    { label: 'High-Trust Delegation', kind: 'intuitive', confidence: 0.72, evidence: 'Complex tasks assigned to AI with minimal specification and passive monitoring.' },
  ],
  'codex-sessions': [
    { label: 'Structured Role Decomposition', kind: 'systematic', confidence: 0.76, evidence: 'Agent architecture separates Name, Class, Role, Domain into distinct fields.' },
    { label: 'Security-First Design Thinking', kind: 'systematic', confidence: 0.82, evidence: 'Security protocol appears as first named subsection in Atlas configuration.' },
  ],
  'social-traces': [
    { label: 'Aspirational Curation', kind: 'divergent', confidence: 0.62, evidence: 'Bookmarks reflect philosophical-technical interests not yet integrated into practice.' },
    { label: 'Categorical Media Organization', kind: 'systematic', confidence: 0.68, evidence: 'YouTube content organized into named buckets: AI, Music — systematic consumption.' },
  ],
} as const

const CYCLE_LIBRARY = {
  'claude-sessions': [
    { kind: 'sabotage', label: 'Tool Adoption and Abandonment', trigger: 'Infrastructure friction (billing, auth errors)', outcome: 'Session abort without resolution, re-initiation with same barriers', frequency: 'Episodic', confidence: 0.65 },
  ],
  'codex-sessions': [
    { kind: 'avoidance', label: 'Delegation-Dependency Oscillation', trigger: 'Complex or configuration-level task', outcome: 'Capability gap discovered after delegation — re-delegation follows', frequency: 'Episodic', confidence: 0.47 },
  ],
  'social-traces': [
    { kind: 'avoidance', label: 'Aspiration-Accumulation Without Integration', trigger: 'Encounter high-quality AI/philosophy content', outcome: 'Bookmarked but not revisited or applied to active projects', frequency: 'Monthly', confidence: 0.51 },
  ],
} as const

function pickEntities(names: string[]): Entity[] {
  return names.map(name => {
    const e = ENTITY_LIBRARY[name]
    if (!e) console.warn(`[loader] Missing entity: "${name}"`)
    return e
  }).filter(Boolean) as Entity[]
}

function pickThemes(labels: string[]): Theme[] {
  return labels.map(label => {
    const t = THEME_LIBRARY[label]
    if (!t) console.warn(`[loader] Missing theme: "${label}"`)
    return t
  }).filter(Boolean) as Theme[]
}

function createExtraction(config: {
  source: 'claude-sessions' | 'codex-sessions' | 'social-traces'
  documentsAnalyzed: number
  entityNames: string[]
  themeLabels: string[]
}): Extraction {
  return {
    source: config.source,
    documentsAnalyzed: config.documentsAnalyzed,
    entities: pickEntities(config.entityNames),
    themes: pickThemes(config.themeLabels),
    emotionalTone: {
      valence: 0.12,
      arousal: 0.58,
      dominantEmotion: 'Curiosity',
      secondaryEmotions: ['Resolve', 'Restlessness'],
    },
    cognitivePatterns: [...COGNITIVE_PATTERN_LIBRARY[config.source]],
    selfSabotageIndicators: [],
    projections: [],
    cycles: [...CYCLE_LIBRARY[config.source]],
    potentials: [],
    dimensionalScores,
    connections: [],
    cognitiveGenomeEvidence: {},
  }
}

export const claudeSessions = createExtraction({
  source: 'claude-sessions',
  documentsAnalyzed: 40,
  entityNames: ['Atlas', 'SQL', 'Claude (AI assistant)', 'Software Design Patterns'],
  themeLabels: ['Transactional Infrastructure Management', 'Instrumental Tool Use', 'Blocked Action / Friction'],
})

export const codexSessions = createExtraction({
  source: 'codex-sessions',
  documentsAnalyzed: 20,
  entityNames: ['Atlas', 'Security Protocol', 'Fleet Intelligence'],
  themeLabels: ['Agentic AI-driven developer workflow', 'Operational AI in industrial logistics'],
})

export const socialTraces = createExtraction({
  source: 'social-traces',
  documentsAnalyzed: 40,
  entityNames: ['YouTube', 'Michele Ricco'],
  themeLabels: ['Aspirational Curation', 'Practical AI integration'],
})

export const extractions: Extraction[] = [claudeSessions, codexSessions, socialTraces]

export const allEntities = extractions.flatMap(e => e.entities)
export const allThemes = extractions.flatMap(e => e.themes)
export const allPatterns = extractions.flatMap(e => e.cognitivePatterns)
export const allCycles = extractions.flatMap(e => e.cycles)

export const allConnections: Connection[] = [
  { from: 'Atlas', to: 'Operational AI in industrial logistics', relationship: 'embodies' },
  { from: 'Atlas', to: archetypeMapping.dominant.archetype, relationship: 'resonates' },
  { from: 'SQL', to: 'Transactional Infrastructure Management', relationship: 'supports' },
  { from: 'Security Protocol', to: 'Security-First Design', relationship: 'instantiates' },
  { from: 'Claude (AI assistant)', to: 'High-Trust Delegation', relationship: 'amplifies' },
  { from: 'Fleet Intelligence', to: archetypeMapping.goldenShadow.archetype, relationship: 'calls forth' },
  { from: 'Railway logistics', to: 'Domain-Anchored Thinking', relationship: 'grounds' },
  { from: 'Aspirational Curation', to: archetypeMapping.emergent.archetype, relationship: 'points toward' },
  { from: 'Instrumental Tool Use', to: 'Tool Adoption and Abandonment', relationship: 'feeds' },
  { from: 'Delegation of cognitive load to AI', to: 'Delegation-Dependency Oscillation', relationship: 'produces' },
  { from: 'Blocked Action / Friction', to: 'Infrastructure Friction Loop', relationship: 'triggers' },
  { from: 'YouTube', to: 'Aspirational Curation', relationship: 'expresses' },
]

export const DIMENSION_COLORS: Record<string, string> = {
  Psychological: '#ea4335',
  Spiritual: '#a142f4',
  Anthropological: '#fbbc05',
  Social: '#34a853',
  Creative: '#d81b60',
  Professional: '#4285f4',
}
