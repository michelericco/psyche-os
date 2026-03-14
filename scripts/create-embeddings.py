#!/usr/bin/env python3
"""
PSYCHE/OS Vector Embedding Pipeline
Reads analysis JSON files, extracts meaningful text chunks,
creates embeddings with sentence-transformers, and stores in ChromaDB.
"""

import json
import os
import sys
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer

OUTPUT_DIR = Path(__file__).parent.parent / "output"
VECTOR_DB_DIR = OUTPUT_DIR / "vector-db"
MODEL_NAME = "all-MiniLM-L6-v2"
COLLECTION_NAME = "psyche-os"


def load_json(filepath: Path) -> dict:
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def extract_entities(data: dict, source: str) -> list[dict]:
    """Extract entity documents from extraction data."""
    docs = []
    entities = data.get("entities", [])
    for entity in entities:
        name = entity.get("name", "")
        significance = entity.get("significance", "")
        kind = entity.get("kind", "")
        mentions = entity.get("mentions", 0)
        if not significance:
            continue
        text = f"{name} ({kind}): {significance}"
        docs.append({
            "text": text,
            "metadata": {
                "type": "entity",
                "source": source,
                "entity_kind": kind,
                "entity_name": name,
                "mentions": mentions,
            },
        })
    return docs


def extract_themes(data: dict, source: str) -> list[dict]:
    """Extract theme documents from extraction data."""
    docs = []
    themes = data.get("themes", [])
    for theme in themes:
        label = theme.get("label", "")
        keywords = ", ".join(theme.get("keywords", []))
        dimension = theme.get("dimension", "")
        relevance = theme.get("relevance", 0)
        text = f"Theme: {label}. Keywords: {keywords}. Dimension: {dimension}."
        docs.append({
            "text": text,
            "metadata": {
                "type": "theme",
                "source": source,
                "dimension": dimension,
                "confidence": relevance,
            },
        })
    return docs


def extract_cognitive_patterns(data: dict, source: str) -> list[dict]:
    """Extract cognitive pattern documents."""
    docs = []
    patterns = data.get("cognitivePatterns", [])
    for pattern in patterns:
        label = pattern.get("label", "")
        evidence = pattern.get("evidence", "")
        kind = pattern.get("kind", "")
        confidence = pattern.get("confidence", 0)
        text = f"Cognitive Pattern: {label}. {evidence}"
        docs.append({
            "text": text,
            "metadata": {
                "type": "cognitive_pattern",
                "source": source,
                "pattern_kind": kind,
                "confidence": confidence,
            },
        })
    return docs


def extract_sabotage_indicators(data: dict, source: str) -> list[dict]:
    """Extract self-sabotage indicator documents."""
    docs = []
    indicators = data.get("selfSabotageIndicators", [])
    for indicator in indicators:
        pattern_name = indicator.get("pattern", "")
        trigger = indicator.get("trigger", "")
        sequence = indicator.get("sequence", "")
        outcome = indicator.get("outcome", "")
        confidence = indicator.get("confidence", 0)
        text = (
            f"Self-sabotage pattern: {pattern_name}. "
            f"Trigger: {trigger}. "
            f"Sequence: {sequence}. "
            f"Outcome: {outcome}"
        )
        docs.append({
            "text": text,
            "metadata": {
                "type": "sabotage_indicator",
                "source": source,
                "confidence": confidence,
            },
        })
    return docs


def extract_projections(data: dict, source: str) -> list[dict]:
    """Extract projection documents."""
    docs = []
    projections = data.get("projections", [])
    for proj in projections:
        target = proj.get("target", "")
        projected = proj.get("projectedQuality", "")
        shadow = proj.get("shadowAspect", "")
        confidence = proj.get("confidence", 0)
        text = (
            f"Projection onto {target}: {projected}. "
            f"Shadow aspect: {shadow}"
        )
        docs.append({
            "text": text,
            "metadata": {
                "type": "projection",
                "source": source,
                "confidence": confidence,
            },
        })
    return docs


def extract_cycles(data: dict, source: str) -> list[dict]:
    """Extract cycle documents."""
    docs = []
    cycles = data.get("cycles", [])
    for cycle in cycles:
        kind = cycle.get("kind", "")
        label = cycle.get("label", "")
        trigger = cycle.get("trigger", "")
        outcome = cycle.get("outcome", "")
        frequency = cycle.get("frequency", "")
        confidence = cycle.get("confidence", 0)
        text = (
            f"{kind} cycle: {label}. "
            f"Trigger: {trigger}. "
            f"Outcome: {outcome}. "
            f"Frequency: {frequency}"
        )
        docs.append({
            "text": text,
            "metadata": {
                "type": "cycle",
                "source": source,
                "cycle_kind": kind,
                "confidence": confidence,
            },
        })
    return docs


def extract_potentials(data: dict, source: str) -> list[dict]:
    """Extract potential documents."""
    docs = []
    potentials = data.get("potentials", [])
    for pot in potentials:
        label = pot.get("label", "")
        state = pot.get("state", "")
        description = pot.get("description", "")
        confidence = pot.get("confidence", 0)
        actionable = pot.get("actionable", "")
        text = f"Potential: {label} (state: {state}). {description}"
        if actionable:
            text += f" Actionable: {actionable}"
        docs.append({
            "text": text,
            "metadata": {
                "type": "potential",
                "source": source,
                "potential_state": state,
                "confidence": confidence,
            },
        })
    return docs


def extract_dimensional_scores(data: dict, source: str) -> list[dict]:
    """Extract dimensional score documents."""
    docs = []
    scores = data.get("dimensionalScores", {})
    for dimension, info in scores.items():
        if isinstance(info, dict):
            depth = info.get("depth", info.get("score", 0))
            findings = info.get("keyFindings", [])
            convergence = info.get("convergence", "")
            blind_spot = info.get("blindSpot", "")
            findings_text = " ".join(findings) if findings else ""
            text = f"Dimension: {dimension} (depth: {depth}). {findings_text}"
            if convergence:
                text += f" Convergence: {convergence}."
            if blind_spot:
                text += f" Blind spot: {blind_spot}."
            docs.append({
                "text": text,
                "metadata": {
                    "type": "dimensional_score",
                    "source": source,
                    "dimension": dimension,
                    "confidence": depth,
                },
            })
    return docs


def extract_cross_validated_patterns(data: dict, source: str) -> list[dict]:
    """Extract cross-validated patterns from synthesis."""
    docs = []
    patterns = data.get("crossValidatedPatterns", [])
    for pattern in patterns:
        label = pattern.get("label", "")
        confidence = pattern.get("confidence", 0)
        interpretation = pattern.get("psychologicalInterpretation", "")
        dimension = pattern.get("dimension", "")
        evidence = pattern.get("evidence", {})
        evidence_text = " ".join(
            f"[{k}] {v}" for k, v in evidence.items()
        ) if isinstance(evidence, dict) else str(evidence)
        text = (
            f"Cross-validated pattern: {label}. "
            f"Interpretation: {interpretation}. "
            f"Evidence: {evidence_text}"
        )
        docs.append({
            "text": text,
            "metadata": {
                "type": "cross_validated_pattern",
                "source": source,
                "dimension": dimension,
                "confidence": confidence,
            },
        })
    return docs


def extract_archetypes(data: dict, source: str) -> list[dict]:
    """Extract archetype mapping documents from synthesis."""
    docs = []
    mapping = data.get("archetypeMapping", {})
    for role, info in mapping.items():
        if not isinstance(info, dict):
            continue
        archetype = info.get("archetype", role)
        manifestation = info.get("manifestation", "")
        shadow = info.get("shadow", "")
        confidence = info.get("confidence", 0)
        evidence = info.get("evidence", "")
        text = (
            f"Archetype ({role}): {archetype}. "
            f"Manifestation: {manifestation}. "
            f"Shadow: {shadow}"
        )
        if evidence:
            text += f" Evidence: {evidence}"
        docs.append({
            "text": text,
            "metadata": {
                "type": "archetype",
                "source": source,
                "archetype_role": role,
                "confidence": confidence,
            },
        })
    return docs


def extract_narrative_arc(data: dict, source: str) -> list[dict]:
    """Extract narrative arc documents from synthesis."""
    docs = []
    arc = data.get("narrativeArc", {})
    if not arc:
        return docs

    current = arc.get("currentChapter", "")
    description = arc.get("description", "")
    tension = arc.get("tensionPoint", "")
    chapters = arc.get("previousChapters", [])
    resolutions = arc.get("possibleResolutions", [])

    text = (
        f"Narrative Arc - Current chapter: {current}. "
        f"{description}. "
        f"Tension: {tension}. "
        f"Previous chapters: {', '.join(chapters)}. "
        f"Possible resolutions: {'; '.join(resolutions)}"
    )
    docs.append({
        "text": text,
        "metadata": {
            "type": "narrative_arc",
            "source": source,
            "confidence": 0.85,
        },
    })
    return docs


def extract_interest_evolution(data: dict, source: str) -> list[dict]:
    """Extract interest evolution periods."""
    docs = []
    periods = data.get("interestEvolution", [])
    for period in periods:
        time = period.get("period", "")
        dominant = ", ".join(period.get("dominantInterests", []))
        emerging = ", ".join(period.get("emergingInterests", []))
        fading = ", ".join(period.get("fadingInterests", []))
        text = (
            f"Interest evolution ({time}): "
            f"Dominant: {dominant}. "
            f"Emerging: {emerging}. "
            f"Fading: {fading}."
        )
        docs.append({
            "text": text,
            "metadata": {
                "type": "interest_evolution",
                "source": source,
                "period": time,
                "confidence": 0.80,
            },
        })
    return docs


def extract_emotional_tone(data: dict, source: str) -> list[dict]:
    """Extract emotional tone documents."""
    docs = []
    tone = data.get("emotionalTone", {})
    if not tone:
        return docs
    dominant = tone.get("dominantEmotion", "")
    secondary = tone.get("secondaryEmotions", [])
    valence = tone.get("valence", 0)
    arousal = tone.get("arousal", 0)
    secondary_text = ", ".join(secondary) if secondary else ""
    text = (
        f"Emotional tone: {dominant}. "
        f"Secondary emotions: {secondary_text}. "
        f"Valence: {valence}, Arousal: {arousal}."
    )
    docs.append({
        "text": text,
        "metadata": {
            "type": "emotional_tone",
            "source": source,
            "confidence": 0.75,
        },
    })
    return docs


def extract_behavioral_insights(data: dict, source: str) -> list[dict]:
    """Extract behavioral insight documents."""
    docs = []
    insights = data.get("behavioralInsights", {})
    if not insights:
        return docs

    decisions = insights.get("decisionPatterns", [])
    if decisions:
        text = "Decision patterns: " + " ".join(decisions)
        docs.append({
            "text": text,
            "metadata": {
                "type": "behavioral_insight",
                "source": source,
                "insight_kind": "decision_patterns",
                "confidence": 0.85,
            },
        })

    learning = insights.get("learningStyle", "")
    if learning:
        docs.append({
            "text": f"Learning style: {learning}",
            "metadata": {
                "type": "behavioral_insight",
                "source": source,
                "insight_kind": "learning_style",
                "confidence": 0.85,
            },
        })

    friction = insights.get("frictionPoints", [])
    if friction:
        text = "Friction points: " + "; ".join(friction)
        docs.append({
            "text": text,
            "metadata": {
                "type": "behavioral_insight",
                "source": source,
                "insight_kind": "friction_points",
                "confidence": 0.80,
            },
        })

    return docs


def extract_context_scaffold(data: dict, source: str) -> list[dict]:
    """Extract context scaffold documents from synthesis."""
    docs = []
    scaffold = data.get("contextScaffold", {})
    if not scaffold:
        return docs

    brief = scaffold.get("identityBrief", "")
    if brief:
        docs.append({
            "text": f"Identity brief: {brief}",
            "metadata": {
                "type": "context_scaffold",
                "source": source,
                "scaffold_kind": "identity_brief",
                "confidence": 0.90,
            },
        })

    guidelines = scaffold.get("guidelines", [])
    if guidelines:
        text = "Interaction guidelines: " + " ".join(guidelines)
        docs.append({
            "text": text,
            "metadata": {
                "type": "context_scaffold",
                "source": source,
                "scaffold_kind": "guidelines",
                "confidence": 0.85,
            },
        })

    growth = scaffold.get("growthVectors", [])
    if growth:
        text = "Growth vectors: " + "; ".join(growth)
        docs.append({
            "text": text,
            "metadata": {
                "type": "context_scaffold",
                "source": source,
                "scaffold_kind": "growth_vectors",
                "confidence": 0.85,
            },
        })

    contra = scaffold.get("contraindications", [])
    if contra:
        text = "Contraindications: " + " ".join(contra)
        docs.append({
            "text": text,
            "metadata": {
                "type": "context_scaffold",
                "source": source,
                "scaffold_kind": "contraindications",
                "confidence": 0.85,
            },
        })

    return docs


def extract_all_from_extraction(data: dict, source: str) -> list[dict]:
    """Extract all document types from an extraction JSON."""
    docs = []
    docs.extend(extract_entities(data, source))
    docs.extend(extract_themes(data, source))
    docs.extend(extract_cognitive_patterns(data, source))
    docs.extend(extract_sabotage_indicators(data, source))
    docs.extend(extract_projections(data, source))
    docs.extend(extract_cycles(data, source))
    docs.extend(extract_potentials(data, source))
    docs.extend(extract_dimensional_scores(data, source))
    docs.extend(extract_emotional_tone(data, source))
    docs.extend(extract_behavioral_insights(data, source))
    docs.extend(extract_interest_evolution(data, source))
    return docs


def extract_all_from_synthesis(data: dict, source: str) -> list[dict]:
    """Extract all document types from the synthesis JSON."""
    docs = []
    docs.extend(extract_cross_validated_patterns(data, source))
    docs.extend(extract_archetypes(data, source))
    docs.extend(extract_potentials(data, source))
    docs.extend(extract_dimensional_scores(data, source))
    docs.extend(extract_narrative_arc(data, source))
    docs.extend(extract_context_scaffold(data, source))

    # Top potentials have a slightly different structure
    top_potentials = data.get("topPotentials", [])
    for pot in top_potentials:
        label = pot.get("label", "")
        state = pot.get("state", "")
        confidence = pot.get("confidence", 0)
        validation = pot.get("crossSourceValidation", "")
        actionable = pot.get("actionable", "")
        text = (
            f"Top potential (rank {pot.get('rank', '?')}): {label} "
            f"(state: {state}). "
            f"Validation: {validation}. "
            f"Actionable: {actionable}"
        )
        docs.append({
            "text": text,
            "metadata": {
                "type": "top_potential",
                "source": source,
                "potential_state": state,
                "confidence": confidence,
            },
        })

    return docs


def main():
    print(f"PSYCHE/OS Vector Embedding Pipeline")
    print(f"Model: {MODEL_NAME}")
    print(f"Output dir: {OUTPUT_DIR}")
    print(f"Vector DB dir: {VECTOR_DB_DIR}")
    print()

    # Load extraction files
    extraction_files = {
        "claude-sessions": OUTPUT_DIR / "extraction-claude-sessions.json",
        "codex-sessions": OUTPUT_DIR / "extraction-codex-sessions.json",
        "social-traces": OUTPUT_DIR / "extraction-social-traces.json",
    }
    synthesis_file = OUTPUT_DIR / "synthesis-unified.json"

    all_docs = []

    for source_name, filepath in extraction_files.items():
        if not filepath.exists():
            print(f"WARNING: {filepath} not found, skipping.")
            continue
        print(f"Loading {filepath.name}...")
        data = load_json(filepath)
        docs = extract_all_from_extraction(data, source_name)
        print(f"  Extracted {len(docs)} documents from {source_name}")
        all_docs.extend(docs)

    if synthesis_file.exists():
        print(f"Loading {synthesis_file.name}...")
        data = load_json(synthesis_file)
        docs = extract_all_from_synthesis(data, "synthesis")
        print(f"  Extracted {len(docs)} documents from synthesis")
        all_docs.extend(docs)

    if not all_docs:
        print("ERROR: No documents extracted. Check input files.")
        sys.exit(1)

    print(f"\nTotal documents to embed: {len(all_docs)}")

    # Load embedding model
    print(f"\nLoading embedding model: {MODEL_NAME}...")
    model = SentenceTransformer(MODEL_NAME)

    # Create embeddings
    texts = [doc["text"] for doc in all_docs]
    print(f"Creating embeddings for {len(texts)} documents...")
    embeddings = model.encode(texts, show_progress_bar=True)
    print(f"Embeddings shape: {embeddings.shape}")

    # Store in ChromaDB
    print(f"\nInitializing ChromaDB at {VECTOR_DB_DIR}...")
    VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)

    client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))

    # Delete existing collection if present (catch broadly: API varies across versions)
    try:
        client.delete_collection(COLLECTION_NAME)
        print(f"  Deleted existing collection '{COLLECTION_NAME}'")
    except Exception:
        pass  # Collection does not exist yet — expected on first run

    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    # Add documents in batches
    batch_size = 100
    for i in range(0, len(all_docs), batch_size):
        batch_end = min(i + batch_size, len(all_docs))
        batch_docs = all_docs[i:batch_end]
        batch_embeddings = embeddings[i:batch_end].tolist()
        batch_ids = [f"doc_{j}" for j in range(i, batch_end)]
        batch_texts = [doc["text"] for doc in batch_docs]
        batch_metadata = [doc["metadata"] for doc in batch_docs]

        collection.add(
            ids=batch_ids,
            embeddings=batch_embeddings,
            documents=batch_texts,
            metadatas=batch_metadata,
        )

    print(f"\nDone! Indexed {collection.count()} documents in collection '{COLLECTION_NAME}'.")

    # Print summary by type
    type_counts = {}
    source_counts = {}
    for doc in all_docs:
        doc_type = doc["metadata"]["type"]
        doc_source = doc["metadata"]["source"]
        type_counts[doc_type] = type_counts.get(doc_type, 0) + 1
        source_counts[doc_source] = source_counts.get(doc_source, 0) + 1

    print("\nDocuments by type:")
    for dtype, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {dtype}: {count}")

    print("\nDocuments by source:")
    for dsource, count in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"  {dsource}: {count}")


if __name__ == "__main__":
    main()
