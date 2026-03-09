# PSYCHE/OS

<p align="center">
  <strong>Digital Psyche Operating System</strong><br />
  A local-first system for turning digital traces into a navigable psychological map.
</p>

<p align="center">
  Experimental, typographic, privacy-aware, and evolving in public.
</p>

<p align="center">
  <a href="https://github.com/michelericco/psyche-os/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/michelericco/psyche-os/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="./LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-1f1913" /></a>
  <img alt="Status" src="https://img.shields.io/badge/status-experimental-9f4a34" />
</p>

![PSYCHE/OS overview dashboard](docs/readme/overview-dashboard.png)

PSYCHE/OS reads exported chats, bookmarks, browsing traces, notes, and similar artifacts as structured evidence. It extracts recurring signals from each source, compares them across sources, and turns what survives into a map of patterns, tensions, archetypes, narrative structure, and directional potentials.

The aim is not to romanticize personal data, but to make it readable with more care, structure, and agency than the usual profiling systems allow.

That includes some of the sources people accumulate almost by accident: X bookmarks, YouTube `Watch Later`, long threads with Claude or ChatGPT, and local session histories from tools like Claude Code and Codex. In other words, a lot of the material you keep saving for "later" and almost never revisit.

The core idea is simple:

- use data that already describes your behavior
- inspect it locally instead of handing it to opaque systems
- compute structure, not generic self-help
- move toward a directional vector, not a pile of generic advice

> It does not diagnose. It maps.

## What It Is

PSYCHE/OS is three things at once:

- a typographic dashboard for exploring analysis outputs
- a local pipeline for extraction, synthesis, and semantic search
- a research surface for improving prompts, models, and source compatibility

This repository is public on purpose before it is finished. The interface already has a clear shape. The adapter layer, synthesis depth, and evaluation rigor are still being improved in the open.

## How It Works

PSYCHE/OS follows a simple loop:

1. Collect exported or local-first source material.
2. Extract structured signals from each source separately.
3. Keep only the patterns that survive cross-source comparison.
4. Explore the resulting map through the UI and structured outputs.

In practice, that means:

- source-specific extraction JSON per adapter
- cross-source synthesis with confidence and evidence
- optional semantic embeddings for search and clustering
- a dashboard to inspect dimensions, patterns, archetypes, potentials, narrative arc, semantic map, and integration outputs

## What You Get

The goal is to produce results you can inspect, question, and refine.

Typical outputs include:

- dimensional scores across psychological, cognitive, social, creative, professional, spiritual, and anthropological axes
- cross-validated patterns that cite evidence by source
- archetypes and latent potentials
- narrative chapters and current tension
- a semantic map of entities, themes, and relationships
- integration surfaces for prompts, export, and downstream tool use

The intended end state is not a recommendation engine. It is a directional reading: a vector that summarizes where the life pattern seems to want to go when the strongest signals are compared side by side.

## Current Interface

<p>
  <img src="docs/readme/setup-overview.png" alt="Setup view" width="49%" />
  <img src="docs/readme/semantic-map.png" alt="Semantic map view" width="49%" />
</p>
<p>
  <img src="docs/readme/narrative-arc.png" alt="Narrative arc view" width="49%" />
  <img src="docs/readme/integration-export.png" alt="Integration view" width="49%" />
</p>

All README screenshots are generated from synthetic demo data, not from personal source material.

The current UI includes:

- setup and pipeline orchestration
- overview, dimensions, patterns, archetypes, and potentials
- narrative arc and tension reading
- neurodivergence screening with explicit caveats
- semantic map plus local vector search
- prompt export and integration surfaces

## Supported Sources

Supported or partially supported today:

- X/Twitter bookmarks via Siftly
- selected Google Takeout exports, including useful YouTube traces such as watch history and `Watch Later` data when available in the export flow
- long-form conversations with Claude.ai, ChatGPT, and Gemini through manual prompt handoff
- Claude Code session histories
- Codex CLI session histories
- adjacent CLI and agent-session workflows that can be normalized into the same extraction format

Compatibility is still under active development. The long-term shape of the project assumes many more sources than the repo supports today, including notes, documents, tasks, repositories, quantified-self data, and additional chat/export formats.

If a source can be exported, it can probably become a PSYCHE/OS adapter. Expanding that surface carefully is one of the highest-value areas for community contribution.

More concretely, if any of these sound familiar, this repo is probably meant for you:

- a deep archive of Claude or ChatGPT conversations you suspect says more about you than you remember
- Claude Code or Codex sessions that capture how you think while building, debugging, and deciding
- hundreds of X bookmarks that felt important enough to save, but not important enough to ever open again
- a YouTube `Watch Later` queue that quietly became an accidental map of interests, aspirations, and unfinished lines of inquiry

## Quick Start

Requirements:

- Node.js 20+
- npm
- Python 3.10+ for vector search helpers

Clone and install:

```bash
git clone https://github.com/michelericco/psyche-os.git
cd psyche-os
npm install
npm --prefix web install
```

Run the interface:

```bash
npm --prefix web run dev
```

Open `http://localhost:5173`.

Run the repository checks:

```bash
npm run validate
```

## Running The Pipeline

The public repo ships with a demo UI, and the pipeline scripts are already usable if you want to try the local workflow end to end.

Run the full local flow:

```bash
bash scripts/run-full-pipeline.sh
```

Or run the stages individually:

```bash
bash scripts/extract-claude-sessions.sh
bash scripts/extract-codex-sessions.sh
bash scripts/extract-social-traces.sh
bash scripts/synthesize.sh
bash scripts/neurodivergence.sh
```

Optional semantic search:

```bash
pip install chromadb sentence-transformers
python3 scripts/create-embeddings.py
python3 scripts/search-embeddings.py "shadow integration" --top 5
```

## Repository Structure

High-signal directories:

- `web/`: React dashboard
- `scripts/`: extraction, synthesis, and embedding helpers
- `src/`: TypeScript core pipeline scaffolding
- `docs/`: methodology, foundations, and deployment notes
- `output/`: generated analysis artifacts, gitignored except for `.gitkeep`

## Method And Direction

The methodology is intentionally becoming stricter:

- extraction should maximize signal without inflating interpretation
- synthesis should keep only what survives cross-source comparison
- outputs should remain inspectable and evidence-linked
- the final reading should move toward a coherent directional vector

Project docs for that layer:

- [Pipeline methodology](docs/pipeline-methodology.md)
- [Analytic foundations](docs/analytic-foundations.md)
- [Prompt evaluation rubric](docs/evaluation-rubric.md)

## Privacy And Safety

This project can touch intensely personal material. Please treat it with care.

- Never commit `sources/`, `output/`, extraction dumps, chat logs, or generated profiles.
- Never attach real personal datasets to GitHub issues or pull requests.
- Use sanitized fixtures and synthetic screenshots in public discussion.
- Do not treat outputs as diagnosis, therapy, or clinical assessment.
- Treat interpretations as hypotheses that need scrutiny, not identity statements.

The default `.gitignore` already protects the most sensitive paths.

## Contributing

Contributions are welcome, especially in:

- source adapters and importers
- prompt design and extraction normalization
- synthesis logic and evidence calibration
- evaluation, regression fixtures, and quality gates
- scientific grounding across psychology, sociology, anthropology, philosophy, and cognition
- accessibility, performance, and UI refinement

If you want to help, start with [CONTRIBUTING.md](CONTRIBUTING.md).
Security reporting guidance lives in [SECURITY.md](SECURITY.md).
Community expectations live in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Project Status

What is already solid:

- the interface and visual language
- the local-first repo baseline
- the extraction and synthesis surfaces
- the demo data and public documentation hygiene

What is still evolving:

- adapter breadth and normalization quality
- synthesis depth and calibration
- evaluation rigor
- directional-vector quality
- broader compatibility across exported personal data

That is why the project is open now: it already has a clear direction, and it will improve through careful use, critique, and contribution.
