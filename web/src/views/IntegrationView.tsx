import { useCallback } from 'react'
import { SectionHead, Expandable, CopyBlock, TwoCol } from '../components/shared'
import {
  extractions,
  crossValidatedPatterns,
  archetypeMapping,
  dimensionalScores,
  cognitiveGenomePrimitives,
  allPotentials,
  narrativeArc,
} from '../data/loader'

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function buildSystemPrompt(): string {
  const patternLines = crossValidatedPatterns
    .map(
      p =>
        `- ${p.label} (${Math.round(p.confidence * 100)}% confidence): ${p.psychologicalInterpretation}`
    )
    .join('\n')

  const dimensionLines = Object.entries(dimensionalScores)
    .map(([dim, s]) => {
      const score = s.depth ?? s.score ?? 0
      const findings = (s.keyFindings ?? []).join('; ')
      return `- ${dim}: ${Math.round(score * 100)}% depth${findings ? `, ${findings}` : ''}`
    })
    .join('\n')

  const genomeLines = cognitiveGenomePrimitives
    .map(g => `- ${g.name} (${g.kind}): ${Math.round(g.value * 100)}%`)
    .join('\n')

  const potentialLines = allPotentials
    .map(p => `- [${p.state}] ${p.label}: ${p.description}`)
    .join('\n')

  const archetypeBlock = [
    `- Dominant: ${archetypeMapping.dominant.archetype}, ${archetypeMapping.dominant.manifestation}`,
    `- Secondary: ${archetypeMapping.secondary.archetype}, ${archetypeMapping.secondary.manifestation}`,
    `- Emergent: ${archetypeMapping.emergent.archetype}, ${archetypeMapping.emergent.manifestation}`,
    `- Golden Shadow: ${archetypeMapping.goldenShadow.archetype}, ${archetypeMapping.goldenShadow.manifestation}`,
  ].join('\n')

  return `You are assisting a person whose cognitive profile has been analyzed by PSYCHE/OS, a digital psyche operating system that maps cognitive patterns across psychological dimensions.

=== Cross-Validated Patterns ===
${patternLines}

=== Archetypes ===
${archetypeBlock}

=== Dimensional Scores ===
${dimensionLines}

=== Cognitive Genome ===
${genomeLines}

=== Potentials ===
${potentialLines}

=== Narrative Arc ===
Current Chapter: ${narrativeArc.currentChapter}
Description: ${narrativeArc.description ?? ''}
Tension Point: ${(narrativeArc.tensionPoint as string | undefined) ?? (narrativeArc as unknown as Record<string,string>)['tension'] ?? ''}
Previous Chapters: ${(narrativeArc.previousChapters ?? []).join(' > ')}
Possible Resolutions: ${(narrativeArc.possibleResolutions ?? []).join('; ')}

=== Guidelines ===
- Reference specific patterns and their confidence levels when relevant.
- Acknowledge shadow aspects alongside strengths.
- Connect advice to the narrative arc and current chapter.
- Consider the full dimensional profile, not just dominant traits.
- Treat this analysis as a map, not the territory. The person is always more than these patterns.`
}

function buildStructuredExport(): object {
  return {
    _meta: {
      format: 'PSYCHE/OS Structured Export',
      version: '1.0',
      sources: extractions.map(e => e.source),
      documentsAnalyzed: extractions.reduce((sum, e) => sum + e.documentsAnalyzed, 0),
    },
    crossValidatedPatterns: crossValidatedPatterns.map(p => ({
      id: p.id,
      label: p.label,
      confidence: p.confidence,
      sources: p.sources,
      psychologicalInterpretation: p.psychologicalInterpretation,
      dimension: p.dimension,
      archetypeResonance: p.archetypeResonance,
    })),
    archetypeMapping: {
      dominant: { ...archetypeMapping.dominant },
      secondary: { ...archetypeMapping.secondary },
      emergent: { ...archetypeMapping.emergent },
      goldenShadow: { ...archetypeMapping.goldenShadow },
    },
    dimensionalScores: { ...dimensionalScores },
    cognitiveGenome: cognitiveGenomePrimitives.map(g => ({
      name: g.name,
      kind: g.kind,
      value: g.value,
    })),
    potentials: allPotentials.map(p => ({
      label: p.label,
      state: p.state,
      description: p.description,
      confidence: p.confidence,
    })),
    narrativeArc: { ...narrativeArc },
  }
}

function buildMcpConfig(): object {
  return {
    mcpServers: {
      'psyche-os': {
        command: 'node',
        args: ['psyche-os-mcp-server/index.js'],
        env: {
          PSYCHE_DATA_DIR: './output',
        },
        tools: {
          get_patterns: {
            description:
              'Returns all cross-validated cognitive patterns with confidence scores and psychological interpretations.',
            parameters: {
              minConfidence: {
                type: 'number',
                description: 'Minimum confidence threshold, from 0 to 1. Default: 0.',
              },
              dimension: {
                type: 'string',
                description: 'Filter by dimension (Psychological, Spiritual, etc.).',
              },
            },
          },
          get_archetypes: {
            description:
              'Returns the archetype mapping: dominant, secondary, emergent, and golden shadow archetypes.',
            parameters: {},
          },
          get_dimensions: {
            description:
              'Returns unified dimensional scores across all six analysis dimensions.',
            parameters: {
              dimension: {
                type: 'string',
                description: 'Return a single dimension. Omit for all.',
              },
            },
          },
          get_potentials: {
            description:
              'Returns identified potentials with their current state (Expressed, Emerging, Latent, Sabotaged).',
            parameters: {
              state: {
                type: 'string',
                description: 'Filter by state. Omit for all.',
              },
            },
          },
          get_genome: {
            description:
              'Returns the cognitive genome primitives with strength values and cognitive kind.',
            parameters: {},
          },
          search_analysis: {
            description:
              'Full-text search across all PSYCHE/OS analysis data. Returns matching patterns, potentials, and interpretations.',
            parameters: {
              query: {
                type: 'string',
                description: 'Search query string.',
                required: true,
              },
            },
          },
        },
      },
    },
  }
}

function buildClaudeMdPlugin(): string {
  const topPatterns = crossValidatedPatterns
    .slice(0, 5)
    .map(p => `- ${p.label} (${Math.round(p.confidence * 100)}%): ${p.psychologicalInterpretation}`)
    .join('\n')

  const archSummary = [
    `Dominant: ${archetypeMapping.dominant.archetype}`,
    `Secondary: ${archetypeMapping.secondary.archetype}`,
    `Emergent: ${archetypeMapping.emergent.archetype}`,
    `Shadow: ${archetypeMapping.goldenShadow.archetype}`,
  ].join(' | ')

  const genomeSummary = cognitiveGenomePrimitives
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)
    .map(g => `${g.name} (${Math.round(g.value * 100)}%)`)
    .join(', ')

  const potentialSummary = allPotentials
    .slice(0, 5)
    .map(p => `- [${p.state}] ${p.label}`)
    .join('\n')

  return `# PSYCHE/OS Cognitive Profile

## Key Patterns
${topPatterns}

## Archetypes
${archSummary}

## Cognitive Genome (top 5)
${genomeSummary}

## Current Narrative
Chapter: ${narrativeArc.currentChapter}
Tension: ${narrativeArc.tensionPoint}

## Top Potentials
${potentialSummary}

## Usage Guidelines
- Reference these patterns when they are relevant to the conversation.
- Acknowledge shadow aspects alongside strengths.
- This is a map, not the territory.`
}

function buildOpenApiSchema(): string {
  return `openapi: "3.0.3"
info:
  title: PSYCHE/OS Analysis API
  version: "1.0.0"
  description: >
    Serves cognitive profile data produced by PSYCHE/OS.
    All endpoints return JSON and require no authentication
    in local development mode.

paths:
  /api/patterns:
    get:
      summary: Cross-validated cognitive patterns
      description: >
        Returns all patterns that have been validated across
        multiple data sources, with confidence scores and
        psychological interpretations.
      parameters:
        - name: minConfidence
          in: query
          schema:
            type: number
          description: Filter patterns below this confidence threshold.
        - name: dimension
          in: query
          schema:
            type: string
          description: Filter by analysis dimension.
      responses:
        "200":
          description: Array of cross-validated patterns.

  /api/archetypes:
    get:
      summary: Archetype mapping
      description: >
        Returns the four-archetype mapping: dominant,
        secondary, emergent, and golden shadow.
      responses:
        "200":
          description: Archetype mapping object.

  /api/dimensions:
    get:
      summary: Dimensional scores
      description: >
        Returns unified scores across all six analysis
        dimensions (Psychological, Spiritual, Anthropological,
        Social, Creative, Professional).
      responses:
        "200":
          description: Dimensional scores keyed by dimension name.

  /api/potentials:
    get:
      summary: Identified potentials
      description: >
        Returns potentials categorized by state: Expressed,
        Emerging, Latent, or Sabotaged.
      parameters:
        - name: state
          in: query
          schema:
            type: string
            enum: [Expressed, Emerging, Latent, Sabotaged]
      responses:
        "200":
          description: Array of potential objects.

  /api/genome:
    get:
      summary: Cognitive genome primitives
      description: >
        Returns the set of cognitive primitives with their
        measured strength and cognitive kind classification.
      responses:
        "200":
          description: Array of genome primitive objects.

  /api/narrative:
    get:
      summary: Narrative arc
      description: >
        Returns the current narrative arc including chapter,
        tension point, and possible resolutions.
      responses:
        "200":
          description: Narrative arc object.

  /api/search:
    get:
      summary: Full-text search
      description: >
        Searches across all analysis data and returns
        matching patterns, potentials, and interpretations.
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
          description: Search query.
      responses:
        "200":
          description: Search results with relevance scores.

  /api/export:
    get:
      summary: Full structured export
      description: >
        Returns the complete analysis as a single JSON object
        suitable for ingestion by external systems.
      responses:
        "200":
          description: Complete PSYCHE/OS structured export.`
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export default function IntegrationView() {
  const systemPrompt = buildSystemPrompt()
  const structuredData = buildStructuredExport()
  const structuredJson = JSON.stringify(structuredData, null, 2)
  const mcpConfig = buildMcpConfig()
  const mcpJson = JSON.stringify(mcpConfig, null, 2)
  const claudeMdPlugin = buildClaudeMdPlugin()
  const openApiSchema = buildOpenApiSchema()

  const handleDownload = useCallback(() => {
    const blob = new Blob([structuredJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'psyche-os-export.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [structuredJson])

  return (
    <div className="space-y-8">
      <SectionHead
        title="AI Integration"
        subtitle="Make your analysis accessible to AI agents, tools, and external systems."
      />

      {/* 1. System Prompt Generator */}
      <Expandable
        title="System Prompt Generator"
        summary="A ready-to-use system prompt containing your full PSYCHE/OS profile for any AI conversation."
        defaultOpen
      >
        <div className="space-y-4">
          <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed max-w-2xl">
            Paste this into any AI chat to give it full context about your cognitive profile.
            The prompt includes cross-validated patterns, archetypes, dimensional scores,
            cognitive genome primitives, potentials, and narrative arc.
          </p>
          <CopyBlock code={systemPrompt} label="System Prompt" />
        </div>
      </Expandable>

      {/* 2. MCP Server Configuration */}
      <Expandable
        title="MCP Server Configuration"
        summary="Claude Code MCP server config that exposes PSYCHE/OS data as callable tools."
      >
        <div className="space-y-4">
          <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed max-w-2xl">
            Add this configuration to your Claude Code settings to expose PSYCHE/OS analysis
            as MCP tools. The server provides six tools: <code className="text-[color:var(--ink-soft)]">get_patterns</code>,{' '}
            <code className="text-[color:var(--ink-soft)]">get_archetypes</code>,{' '}
            <code className="text-[color:var(--ink-soft)]">get_dimensions</code>,{' '}
            <code className="text-[color:var(--ink-soft)]">get_potentials</code>,{' '}
            <code className="text-[color:var(--ink-soft)]">get_genome</code>, and{' '}
            <code className="text-[color:var(--ink-soft)]">search_analysis</code>.
          </p>
          <CopyBlock code={mcpJson} label="MCP Server Config (claude_desktop_config.json)" />
        </div>
      </Expandable>

      {/* 3. Structured Data Export */}
      <Expandable
        title="Structured Data Export"
        summary="The complete analysis as a single JSON object for programmatic consumption."
      >
        <div className="space-y-4">
          <TwoCol
            left={
              <div className="space-y-3">
                <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">
                  Full structured export of all PSYCHE/OS analysis data. Suitable for ingestion
                  by data pipelines, AI agents, or custom integrations.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 rounded text-xs font-medium text-[color:var(--ink)] bg-[color:var(--accent)] hover:bg-[color:var(--accent-strong)] transition-colors cursor-pointer"
                >
                  Download JSON
                </button>
              </div>
            }
            right={
              <div className="text-xs text-[color:var(--ink-faint)] space-y-1">
                <div>Patterns: {crossValidatedPatterns.length}</div>
                <div>Genome Primitives: {cognitiveGenomePrimitives.length}</div>
                <div>Potentials: {allPotentials.length}</div>
                <div>Dimensions: {Object.keys(dimensionalScores).length}</div>
                <div>Sources: {extractions.length}</div>
                <div>
                  Documents Analyzed:{' '}
                  {extractions.reduce((sum, e) => sum + e.documentsAnalyzed, 0)}
                </div>
              </div>
            }
          />
          <CopyBlock code={structuredJson} label="Full Analysis JSON" />
        </div>
      </Expandable>

      {/* 4. Memory Plugin Format */}
      <Expandable
        title="Memory Plugin Format"
        summary="Compact CLAUDE.md format for use as a memory plugin in Claude Code."
      >
        <div className="space-y-4">
          <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed max-w-2xl">
            Add this to your <code className="text-[color:var(--ink-soft)]">CLAUDE.md</code> file to give
            Claude Code persistent awareness of your cognitive profile. This compact version
            includes the most salient patterns, archetypes, and potentials.
          </p>
          <CopyBlock code={claudeMdPlugin} label="CLAUDE.md Memory Plugin" />
        </div>
      </Expandable>

      {/* 5. API Endpoint Schema */}
      <Expandable
        title="API Endpoint Schema"
        summary="OpenAPI schema describing how an HTTP API could serve PSYCHE/OS data."
      >
        <div className="space-y-4">
          <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed max-w-2xl">
            This OpenAPI 3.0 schema defines a RESTful API surface for serving PSYCHE/OS analysis
            data. Use it as a blueprint for building a local or hosted API server.
          </p>
          <CopyBlock code={openApiSchema} label="OpenAPI 3.0 Schema (YAML)" />
        </div>
      </Expandable>
    </div>
  )
}
