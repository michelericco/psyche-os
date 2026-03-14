#!/usr/bin/env python3
"""
PSYCHE/OS Vector Search
Searches the ChromaDB collection created by create-embeddings.py.
Usage: python3 search-embeddings.py "your query here" [--top N] [--json]
"""

import argparse
import json
import sys
from pathlib import Path

import chromadb
from sentence_transformers import SentenceTransformer

VECTOR_DB_DIR = Path(__file__).parent.parent / "output" / "vector-db"
MODEL_NAME = "all-MiniLM-L6-v2"
COLLECTION_NAME = "psyche-os"


def search(query: str, top_k: int = 5, output_json: bool = False) -> list[dict]:
    """Search the ChromaDB collection and return results."""
    if not VECTOR_DB_DIR.exists():
        print("ERROR: Vector DB not found. Run create-embeddings.py first.")
        sys.exit(1)

    model = SentenceTransformer(MODEL_NAME)
    client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))

    try:
        collection = client.get_collection(name=COLLECTION_NAME)
    except ValueError:
        print(f"ERROR: Collection '{COLLECTION_NAME}' not found. Run create-embeddings.py first.")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to access collection: {e}")
        sys.exit(1)

    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )

    formatted = []
    for i in range(len(results["ids"][0])):
        doc_id = results["ids"][0][i]
        document = results["documents"][0][i]
        metadata = results["metadatas"][0][i]
        distance = results["distances"][0][i]
        similarity = 1 - distance  # cosine distance to similarity

        formatted.append({
            "rank": i + 1,
            "id": doc_id,
            "similarity": round(similarity, 4),
            "type": metadata.get("type", "unknown"),
            "source": metadata.get("source", "unknown"),
            "confidence": metadata.get("confidence", 0),
            "text": document,
            "metadata": metadata,
        })

    if output_json:
        print(json.dumps({"query": query, "results": formatted}, indent=2, ensure_ascii=False))
    else:
        print(f"\n{'='*80}")
        print(f"  Query: \"{query}\"")
        print(f"  Top {top_k} results from {collection.count()} documents")
        print(f"{'='*80}\n")

        for r in formatted:
            print(f"  [{r['rank']}] Similarity: {r['similarity']:.4f}  |  Type: {r['type']}  |  Source: {r['source']}")
            if r["confidence"]:
                print(f"      Confidence: {r['confidence']}")
            # Truncate text for display
            text = r["text"]
            if len(text) > 300:
                text = text[:297] + "..."
            print(f"      {text}")
            print()

    return formatted


def main():
    parser = argparse.ArgumentParser(description="PSYCHE/OS Vector Search")
    parser.add_argument("query", help="Search query")
    parser.add_argument("--top", type=int, default=5, help="Number of results (default: 5, max: 50)")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    top_k = max(1, min(args.top, 50))
    search(args.query, top_k=top_k, output_json=args.json)


if __name__ == "__main__":
    main()
