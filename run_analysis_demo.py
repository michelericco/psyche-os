#!/usr/bin/env python3
"""
Demo pipeline runner per psyche-os usando OpenAI come LLM.
Simula le 5 fasi del pipeline con dati reali dalle sources di test.
"""
import json
import os
import time
from pathlib import Path
from openai import OpenAI

client = OpenAI()
SOURCES_PATH = Path("/home/ubuntu/psyche-os/sources")
OUTPUT_PATH = Path("/home/ubuntu/psyche-os/output")
OUTPUT_PATH.mkdir(exist_ok=True)

def read_sources():
    """Stage 1: Ingest sources."""
    docs = []
    for f in SOURCES_PATH.rglob("*"):
        if f.is_file() and f.suffix in [".md", ".jsonl", ".txt", ".json"]:
            content = f.read_text(encoding="utf-8")
            source_dir = f.parent.name
            docs.append({
                "id": f"{source_dir}_{f.stem}",
                "sourceDir": source_dir,
                "path": str(f),
                "content": content,
            })
    return docs

def extract_semantics(doc):
    """Stage 2: Extract semantics via LLM."""
    prompt = f"""Analyze this document from source '{doc['sourceDir']}' and return a JSON object with:
{{
  "entities": [{{ "name": "...", "kind": "Person|Concept|Tool|Place|Project", "mentions": 1 }}],
  "themes": [{{ "label": "...", "relevance": 0.8, "keywords": ["..."] }}],
  "emotionalTone": {{ "valence": 0.1, "arousal": 0.5, "dominantEmotion": "...", "secondaryEmotions": ["..."] }},
  "cognitivePatterns": [{{ "label": "...", "kind": "analytical|intuitive|systematic|divergent|convergent|metacognitive", "confidence": 0.7, "evidence": "..." }}]
}}

Document content:
{doc['content'][:4000]}

Return ONLY valid JSON, no markdown fences."""

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )
    raw = resp.choices[0].message.content.strip()
    # Strip markdown fences if present
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)

def detect_patterns(extractions):
    """Stage 3: Detect psychological patterns."""
    combined = json.dumps(extractions, indent=2)[:6000]
    prompt = f"""Given these semantic extractions from a person's digital traces, identify psychological patterns.
Return JSON:
{{
  "sabotageIndicators": [{{ "label": "...", "description": "...", "evidence": "...", "confidence": 0.6 }}],
  "projections": [{{ "label": "...", "target": "...", "evidence": "...", "confidence": 0.5 }}],
  "cycles": [{{ "label": "...", "description": "...", "phase": "...", "confidence": 0.7 }}]
}}

Extractions:
{combined}

Return ONLY valid JSON."""

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=1500,
    )
    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)

def synthesize_archetypes(extractions, patterns):
    """Stage 4: Synthesize archetypes."""
    combined = json.dumps({"extractions": extractions[:2], "patterns": patterns}, indent=2)[:5000]
    prompt = f"""Based on these psychological extractions and patterns, identify the dominant archetypes.
Return JSON:
{{
  "archetypeMappings": [
    {{
      "archetype": "...",
      "role": "dominant|secondary|emergent|shadow",
      "manifestation": "...",
      "evidence": "...",
      "confidence": 0.75
    }}
  ],
  "unifiedDimensionalScores": {{
    "Psychological": {{ "score": 0.7, "status": "active", "evidence": "..." }},
    "Creative": {{ "score": 0.6, "status": "active", "evidence": "..." }},
    "Professional": {{ "score": 0.8, "status": "active", "evidence": "..." }}
  }},
  "crossValidatedPatterns": [
    {{ "id": "CVP-001", "label": "...", "confidence": 0.7, "sources": ["..."] }}
  ]
}}

Data:
{combined}

Return ONLY valid JSON."""

    resp = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=2000,
    )
    raw = resp.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]
    return json.loads(raw)

def compute_temporal_layer(extractions):
    """Compute a simple temporal stratification from extractions."""
    windows = {}
    for ext in extractions:
        ts = ext.get("timestamp", "2026-01-01T00:00:00Z")
        month = ts[:7]  # YYYY-MM
        if month not in windows:
            windows[month] = {"documentCount": 0, "themes": [], "patterns": []}
        windows[month]["documentCount"] += 1
        windows[month]["themes"].extend([t["label"] for t in ext.get("themes", [])])
        windows[month]["patterns"].extend([p["label"] for p in ext.get("cognitivePatterns", [])])

    return {
        "granularity": "month",
        "windows": [
            {
                "windowKey": k,
                "documentCount": v["documentCount"],
                "dominantThemes": list(set(v["themes"]))[:5],
                "dominantCognitivePatterns": list(set(v["patterns"]))[:3],
            }
            for k, v in sorted(windows.items())
        ],
        "temporalPatterns": [],
    }

def main():
    print("=" * 60)
    print("PSYCHE/OS — Demo Pipeline (OpenAI backend)")
    print("=" * 60)

    # Stage 1
    print("\n[Stage 1] Ingesting sources...")
    docs = read_sources()
    print(f"  → {len(docs)} document(s) found")
    for d in docs:
        print(f"    - {d['id']} ({d['sourceDir']})")

    # Stage 2
    print("\n[Stage 2] Extracting semantics via LLM...")
    extractions = []
    for doc in docs:
        print(f"  → Extracting from {doc['id']}...")
        try:
            ext = extract_semantics(doc)
            ext["sourceId"] = doc["id"]
            ext["sourceDir"] = doc["sourceDir"]
            ext["timestamp"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            extractions.append(ext)
            print(f"    ✓ {len(ext.get('entities', []))} entities, {len(ext.get('themes', []))} themes, {len(ext.get('cognitivePatterns', []))} patterns")
        except Exception as e:
            print(f"    ✗ Failed: {e}")

    # Stage 3
    print("\n[Stage 3] Detecting psychological patterns...")
    try:
        patterns = detect_patterns(extractions)
        print(f"  → {len(patterns.get('sabotageIndicators', []))} sabotage indicators")
        print(f"  → {len(patterns.get('projections', []))} projections")
        print(f"  → {len(patterns.get('cycles', []))} cycles")
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        patterns = {"sabotageIndicators": [], "projections": [], "cycles": []}

    # Stage 4
    print("\n[Stage 4] Synthesizing archetypes...")
    try:
        synthesis = synthesize_archetypes(extractions, patterns)
        print(f"  → {len(synthesis.get('archetypeMappings', []))} archetypes")
        print(f"  → {len(synthesis.get('crossValidatedPatterns', []))} cross-validated patterns")
        for a in synthesis.get("archetypeMappings", []):
            print(f"    - [{a.get('role','?')}] {a.get('archetype','?')} (conf: {a.get('confidence',0):.2f})")
    except Exception as e:
        print(f"  ✗ Failed: {e}")
        synthesis = {"archetypeMappings": [], "unifiedDimensionalScores": {}, "crossValidatedPatterns": []}

    # Stage 5: Temporal stratification
    print("\n[Stage 5] Computing temporal stratification...")
    temporal_layer = compute_temporal_layer(extractions)
    print(f"  → {len(temporal_layer['windows'])} temporal window(s)")
    for w in temporal_layer["windows"]:
        print(f"    - {w['windowKey']}: {w['documentCount']} doc(s), themes: {w['dominantThemes'][:2]}")

    # Output
    result = {
        "documentsIngested": len(docs),
        "extractionResults": extractions,
        "patterns": patterns,
        "synthesis": synthesis,
        "temporalLayer": temporal_layer,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }

    output_file = OUTPUT_PATH / f"analysis_demo_{int(time.time())}.json"
    output_file.write_text(json.dumps(result, indent=2, ensure_ascii=False))

    print(f"\n[✓] Pipeline complete. Output: {output_file}")
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Documents ingested:        {len(docs)}")
    print(f"Extractions completed:     {len(extractions)}")
    print(f"Sabotage indicators:       {len(patterns.get('sabotageIndicators', []))}")
    print(f"Projections detected:      {len(patterns.get('projections', []))}")
    print(f"Cycles detected:           {len(patterns.get('cycles', []))}")
    print(f"Archetypes mapped:         {len(synthesis.get('archetypeMappings', []))}")
    print(f"Cross-validated patterns:  {len(synthesis.get('crossValidatedPatterns', []))}")
    print(f"Temporal windows:          {len(temporal_layer['windows'])}")
    print(f"Output file:               {output_file.name}")

    return result

if __name__ == "__main__":
    main()
