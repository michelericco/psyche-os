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

// ---------------------------------------------------------------------------
// Synthesis data (loaded from pipeline output)
// ---------------------------------------------------------------------------

const synthesis = synthesisRaw as {
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
export const directionalVector: DirectionalVector | undefined = synthesis.directionalVector
export const modelLimitations: string[] = synthesis.modelLimitations ?? []
export const simulacrumIndex: number = synthesis.simulacrumIndex ?? 0

// Sensorial data export
export const sensorData = (synthesis as any).sensorData ?? [];

// ---------------------------------------------------------------------------
// Hardcoded data (not in synthesis JSON — entities, themes, genome, etc.)
// ---------------------------------------------------------------------------

const ENTITY_LIBRARY: Record<string, Entity> = {
  'PSYCHE/OS': {
    name: 'PSYCHE/OS',
    kind: 'system',
    mentions: 32,
    significance: 'Self-modeling interface for cognitive cartography.',
    dimensions: ['Psychological', 'Professional', 'Creative'],
    relatedEntities: ['Loom', 'Northstar Studio', 'Civic Mesh'],
    sourceMemories: ['claude-sessions', 'codex-sessions'],
  },
  Loom: {
    name: 'Loom',
    kind: 'project',
    mentions: 24,
    significance: 'Recurring architecture substrate for tools and protocols.',
    dimensions: ['Professional', 'Psychological'],
    relatedEntities: ['PSYCHE/OS', 'Claude Code', 'Tailscale'],
    sourceMemories: ['claude-sessions'],
  },
  'Claude Code': {
    name: 'Claude Code',
    kind: 'tool',
    mentions: 18,
    significance: 'External reasoning partner and execution environment.',
    dimensions: ['Professional'],
    relatedEntities: ['Loom', 'Beacon Protocol'],
    sourceMemories: ['claude-sessions', 'social-traces'],
  },
  'Civic Mesh': {
    name: 'Civic Mesh',
    kind: 'protocol',
    mentions: 14,
    significance: 'Protocol framing applied to regulation and interoperability.',
    dimensions: ['Professional', 'Anthropological'],
    relatedEntities: ['PSYCHE/OS', 'Northstar Studio'],
    sourceMemories: ['claude-sessions'],
  },
  Tailscale: {
    name: 'Tailscale',
    kind: 'infrastructure',
    mentions: 11,
    significance: 'Pragmatic substrate for sovereignty-oriented infrastructure.',
    dimensions: ['Professional'],
    relatedEntities: ['Loom', 'PSYCHE/OS'],
    sourceMemories: ['claude-sessions'],
  },
  Lyra: {
    name: 'Lyra',
    kind: 'persona',
    mentions: 22,
    significance: 'Dialogic alter used to externalize thinking and rhythm.',
    dimensions: ['Psychological', 'Creative'],
    relatedEntities: ['Jung', 'Bateson', 'Beacon Protocol'],
    sourceMemories: ['codex-sessions'],
  },
  Jung: {
    name: 'Jung',
    kind: 'thinker',
    mentions: 13,
    significance: 'Primary symbolic frame for archetypes, shadow, and individuation.',
    dimensions: ['Psychological', 'Spiritual'],
    relatedEntities: ['Lyra', 'Bateson'],
    sourceMemories: ['codex-sessions'],
  },
  Bateson: {
    name: 'Bateson',
    kind: 'thinker',
    mentions: 10,
    significance: 'Ecology-of-mind perspective feeding the spiritual and anthropological dimensions.',
    dimensions: ['Spiritual', 'Anthropological'],
    relatedEntities: ['Jung', 'Lyra'],
    sourceMemories: ['codex-sessions'],
  },
  'Corrections Practice': {
    name: 'Corrections Practice',
    kind: 'method',
    mentions: 15,
    significance: 'Living archive of mistakes converted into future leverage.',
    dimensions: ['Psychological', 'Professional'],
    relatedEntities: ['PSYCHE/OS', 'Loom'],
    sourceMemories: ['codex-sessions', 'claude-sessions'],
  },
  Stillframe: {
    name: 'Stillframe',
    kind: 'project',
    mentions: 16,
    significance: 'Photography practice anchored in atmosphere and staging.',
    dimensions: ['Creative'],
    relatedEntities: ['Northstar Studio', 'Beacon Protocol'],
    sourceMemories: ['social-traces'],
  },
  'Northstar Studio': {
    name: 'Northstar Studio',
    kind: 'project',
    mentions: 14,
    significance: 'Convergence surface for system design and public articulation.',
    dimensions: ['Creative', 'Professional'],
    relatedEntities: ['PSYCHE/OS', 'Civic Mesh', 'Stillframe'],
    sourceMemories: ['social-traces', 'claude-sessions'],
  },
  'Beacon Protocol': {
    name: 'Beacon Protocol',
    kind: 'protocol',
    mentions: 12,
    significance: 'Naming-led framework for agent invocation and interaction.',
    dimensions: ['Creative', 'Professional'],
    relatedEntities: ['Claude Code', 'Lyra', 'Northstar Studio'],
    sourceMemories: ['social-traces'],
  },
}

const THEME_LIBRARY: Record<string, Theme> = {
  'Tool Sovereignty': {
    label: 'Tool Sovereignty',
    relevance: 0.91,
    keywords: ['self-hosting', 'control', 'stack', 'independence'],
    dimension: 'Professional',
    evidence: 'Repeated preference for owned infrastructure over opaque platforms.',
  },
  'Protocol Design': {
    label: 'Protocol Design',
    relevance: 0.84,
    keywords: ['interfaces', 'schemas', 'contracts', 'systems'],
    dimension: 'Professional',
    evidence: 'Projects are repeatedly framed as protocols rather than isolated artifacts.',
  },
  'Cross-domain Synthesis': {
    label: 'Cross-domain Synthesis',
    relevance: 0.88,
    keywords: ['bridging', 'transfer', 'unification', 'metaphor'],
    dimension: 'Creative',
    evidence: 'Concepts are moved across engineering, art, philosophy, and product design.',
  },
  'Consciousness Inquiry': {
    label: 'Consciousness Inquiry',
    relevance: 0.82,
    keywords: ['mind', 'metaphysics', 'phenomenology', 'awareness'],
    dimension: 'Spiritual',
    evidence: 'Philosophical and contemplative threads recur with increasing depth.',
  },
  'Narrative Identity': {
    label: 'Narrative Identity',
    relevance: 0.71,
    keywords: ['story', 'self-model', 'chapters', 'meaning'],
    dimension: 'Anthropological',
    evidence: 'Life phases are repeatedly understood as story chapters with evolving roles.',
  },
  'Embodied Discipline': {
    label: 'Embodied Discipline',
    relevance: 0.73,
    keywords: ['body', 'training', 'consistency', 'counter-pattern'],
    dimension: 'Psychological',
    evidence: 'Physical regularity behaves as the most stable corrective to cognitive drift.',
  },
  'Aesthetic Restraint': {
    label: 'Aesthetic Restraint',
    relevance: 0.76,
    keywords: ['editing', 'silence', 'atmosphere', 'composition'],
    dimension: 'Creative',
    evidence: 'Preference for reduced, typographic, high-control visual systems.',
  },
  'Relational Selectivity': {
    label: 'Relational Selectivity',
    relevance: 0.49,
    keywords: ['bandwidth', 'autonomy', 'depth', 'distance'],
    dimension: 'Social',
    evidence: 'Social energy is highly selective and rarely diffused across weak ties.',
  },
}

// ---------------------------------------------------------------------------
// Cognitive genome primitives (hardcoded — not in synthesis)
// ---------------------------------------------------------------------------

export const cognitiveGenomePrimitives = [
  { name: 'Abstraction Descent', value: 0.78, kind: 'systematic' },
  { name: 'Fractal Transfer', value: 0.71, kind: 'divergent' },
  { name: 'Failure-Driven Learning', value: 0.83, kind: 'metacognitive' },
  { name: 'Infrastructure-First', value: 0.74, kind: 'systematic' },
  { name: 'Naming-as-Cognition', value: 0.58, kind: 'divergent' },
  { name: 'Empirical-Mystical', value: 0.65, kind: 'intuitive' },
  { name: 'Cost-Conscious', value: 0.69, kind: 'analytical' },
  { name: 'Burst-Process-Burst', value: 0.52, kind: 'divergent' },
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
    { label: 'Infrastructure-First', kind: 'systematic', confidence: 0.85, evidence: 'Architecture and protocol layers appear before interface polish.' },
    { label: 'Build-Abstract-Restart', kind: 'systematic', confidence: 0.91, evidence: 'Projects recur as cleaner higher-order restarts.' },
  ],
  'codex-sessions': [
    { label: 'Dialogic Externalization', kind: 'metacognitive', confidence: 0.86, evidence: 'Reflection sharpens when a counterpart voice is invoked.' },
    { label: 'Empirical-Mystical Oscillation', kind: 'intuitive', confidence: 0.82, evidence: 'Spiritual and analytical modes actively alternate.' },
  ],
  'social-traces': [
    { label: 'Aesthetic Compression', kind: 'divergent', confidence: 0.73, evidence: 'Public fragments trend toward atmosphere, naming, and compressed signals.' },
    { label: 'Consumption-Production Asymmetry', kind: 'metacognitive', confidence: 0.79, evidence: 'Visible output remains lower than internal accumulation.' },
  ],
} as const

const CYCLE_LIBRARY = {
  'claude-sessions': [
    { kind: 'project', label: 'Build-Abstract-Restart', trigger: 'Architectural insight', outcome: 'Cleaner but delayed public artifact', frequency: 'High', confidence: 0.88 },
  ],
  'codex-sessions': [
    { kind: 'reflection', label: 'Burst-Process-Burst', trigger: 'Intense creation phase', outcome: 'Pause, integration, then renewed synthesis', frequency: 'High', confidence: 0.81 },
  ],
  'social-traces': [
    { kind: 'public-output', label: 'Fragment-to-System', trigger: 'Shareable prototype or phrase', outcome: 'Reframed into broader operating language', frequency: 'Moderate', confidence: 0.7 },
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
  documentsAnalyzed: 41,
  entityNames: ['PSYCHE/OS', 'Loom', 'Claude Code', 'Civic Mesh', 'Tailscale'],
  themeLabels: ['Tool Sovereignty', 'Protocol Design', 'Cross-domain Synthesis'],
})

export const codexSessions = createExtraction({
  source: 'codex-sessions',
  documentsAnalyzed: 33,
  entityNames: ['Lyra', 'Jung', 'Bateson', 'Corrections Practice'],
  themeLabels: ['Consciousness Inquiry', 'Narrative Identity', 'Embodied Discipline'],
})

export const socialTraces = createExtraction({
  source: 'social-traces',
  documentsAnalyzed: 29,
  entityNames: ['Stillframe', 'Northstar Studio', 'Beacon Protocol'],
  themeLabels: ['Aesthetic Restraint', 'Relational Selectivity'],
})

export const extractions: Extraction[] = [claudeSessions, codexSessions, socialTraces]

export const allEntities = extractions.flatMap(e => e.entities)
export const allThemes = extractions.flatMap(e => e.themes)
export const allPatterns = extractions.flatMap(e => e.cognitivePatterns)
export const allCycles = extractions.flatMap(e => e.cycles)

export const allConnections: Connection[] = [
  { from: 'PSYCHE/OS', to: 'Build-Abstract-Restart', relationship: 'embodies' },
  { from: 'PSYCHE/OS', to: 'Cross-domain Synthesis', relationship: 'organizes' },
  { from: 'Loom', to: 'Tool Sovereignty', relationship: 'supports' },
  { from: 'Loom', to: archetypeMapping.dominant.archetype, relationship: 'resonates' },
  { from: 'Claude Code', to: 'Dialogic Externalization', relationship: 'amplifies' },
  { from: 'Civic Mesh', to: 'Protocol Entrepreneurship', relationship: 'points toward' },
  { from: 'Lyra', to: 'Dialogic Externalization', relationship: 'instantiates' },
  { from: 'Jung', to: 'Narrative Identity', relationship: 'frames' },
  { from: 'Bateson', to: 'Empirical-Mystical Oscillation', relationship: 'feeds' },
  { from: 'Corrections Practice', to: 'Failure-Driven Learning', relationship: 'substantiates' },
  { from: 'Stillframe', to: 'Aesthetic Restraint', relationship: 'expresses' },
  { from: 'Northstar Studio', to: 'Cross-domain Synthesis', relationship: 'compresses' },
  { from: 'Beacon Protocol', to: 'Dialogic Externalization', relationship: 'formalizes' },
  { from: 'Protocol Design', to: 'Protocol Entrepreneurship', relationship: 'enables' },
  { from: 'Consciousness Inquiry', to: 'Consciousness Research Practice', relationship: 'matures into' },
  { from: 'Embodied Discipline', to: 'Sovereignty-Body Bridge', relationship: 'grounds' },
  { from: 'Aesthetic Restraint', to: 'Photography Worldbuilding', relationship: 'shapes' },
  { from: 'Relational Selectivity', to: 'Sovereignty-as-Core-Value', relationship: 'echoes' },
  { from: 'Cross-domain Synthesis', to: 'AI Studio Practice', relationship: 'wants expression through' },
  { from: 'Narrative Identity', to: archetypeMapping.goldenShadow.archetype, relationship: 'calls forth' },
  { from: 'Consciousness Inquiry', to: archetypeMapping.secondary.archetype, relationship: 'animates' },
  { from: 'Cross-domain Synthesis', to: archetypeMapping.emergent.archetype, relationship: 'strengthens' },
]

export const DIMENSION_COLORS: Record<string, string> = {
  Psychological: '#9f4a34',
  Spiritual: '#82654b',
  Anthropological: '#a77c58',
  Social: '#8c8272',
  Creative: '#5f6e58',
  Professional: '#4e5f63',
}
