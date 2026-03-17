# Contextual Status Cards — Dimensioni

## Principio di Design

Seguendo il pattern di "Applied" (dove colori immediati raccontano la storia senza leggere), **ogni dimensione in Psyche mostra uno stato visivo contestuale** attraverso un badge colorato.

Il colore comunica istantaneamente il tipo di relazione con quella dimensione:

- **Viola (#8b5cf6)**: Stato **Emergente** — la dimensione è ancora in fase di sviluppo/scoperta
- **Verde (#10b981)**: Stato **Stabile** — la dimensione è consolidata e fiduciosa (score ≥ 70%)
- **Rosso-Arancio (#f97316)**: Stato **In tensione** — ci sono blind spot o contraddizioni da risolvere

## Implementazione

### Badge nei Components

1. **Nella lista accanto al Radar Chart**  
   Accanto a ogni dimensione nel riepilogo sinistro, un piccolo badge mostra lo stato.

2. **Negli Expandable Headers**  
   Quando apri una dimensione, il badge è visibile accanto al nome nel titolo.

3. **Color Consistency**  
   I colori dei badge sono derivati dalla stessa logica di "Applied" (viola per review, arancio per reviewed).

### Logica di Calcolo dello Stato

```typescript
const getStatus = (score: number, blindSpot?: string): Status => {
  if (blindSpot) return 'In tensione'      // Conflitto/gap detected
  if (score >= 0.7) return 'Stabile'       // Consolidato
  return 'Emergente'                       // Ancora in scoperta
}
```

### Colori Associati

| Stato | Colore | Hex | Significato |
| --- | --- | --- | --- |
| Emergente | Viola | #8b5cf6 | In scoperta, potenziale |
| Stabile | Verde | #10b981 | Consolidato, fiducioso |
| In tensione | Arancio | #f97316 | Conflitto, da esplorare |

## Vantaggi

✓ **Scansione Rapida** — Il colore racconta la storia prima ancora di leggere il nome  
✓ **Coerenza Design** — Riusa il pattern di "Applied" (Figma)  
✓ **Contestualità** — Ogni dimensione comunica il suo status individuale  
✓ **Azione Guidata** — "In tensione" signala dove c'è più lavoro introspettivo da fare

## Future Extensions

- Aggiungere un'icona per dimensione (es. ✨ per Emergente, ✓ per Stabile, ⚠️ per In tensione)
- Mostrare una timeline di come gli stati evolvono nel tempo
- Permit filtering/sorting per status nella vista dimensioni
