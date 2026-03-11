import { useState, useEffect } from 'react'
import '../index.css'

interface DailyEntry {
  date: string
  title: string
  content: string
  mood?: string
  tags?: string[]
  insights?: string[]
}

interface ProgressDiary {
  entries: DailyEntry[]
  lastUpdated?: string
}

export default function ProgressDiaryView() {
  const [diary, setDiary] = useState<ProgressDiary>({ entries: [] })
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: '', tags: '' })
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  // Load diary from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('progressDiary')
    if (saved) {
      try {
        setDiary(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load diary', e)
      }
    }
  }, [])

  // Save diary to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('progressDiary', JSON.stringify(diary))
  }, [diary])

  const handleAddEntry = () => {
    if (!newEntry.title || !newEntry.content) {
      alert('Titolo e contenuto sono obbligatori')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const tagArray = newEntry.tags
      .split(',')
      .map(t => t.trim())
      .filter(t => t)

    if (editingIndex !== null) {
      // Update existing entry
      const updatedEntries = [...diary.entries]
      updatedEntries[editingIndex] = {
        ...updatedEntries[editingIndex],
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood,
        tags: tagArray,
      }
      setDiary({ ...diary, entries: updatedEntries, lastUpdated: today })
      setEditingIndex(null)
    } else {
      // Add new entry
      const entry: DailyEntry = {
        date: today,
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood,
        tags: tagArray,
      }
      setDiary({
        entries: [entry, ...diary.entries],
        lastUpdated: today,
      })
    }

    setNewEntry({ title: '', content: '', mood: '', tags: '' })
    setIsEditing(false)
  }

  const handleEditEntry = (index: number) => {
    const entry = diary.entries[index]
    setNewEntry({
      title: entry.title,
      content: entry.content,
      mood: entry.mood || '',
      tags: entry.tags?.join(', ') || '',
    })
    setEditingIndex(index)
    setIsEditing(true)
  }

  const handleDeleteEntry = (index: number) => {
    const updatedEntries = diary.entries.filter((_, i) => i !== index)
    setDiary({ ...diary, entries: updatedEntries })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getMoodEmoji = (mood?: string) => {
    const moods: { [key: string]: string } = {
      energico: '⚡',
      felice: '😊',
      tranquillo: '😌',
      concentrato: '🎯',
      stressato: '😰',
      confuso: '😕',
      motivato: '🔥',
      neutro: '😐',
    }
    return moods[mood?.toLowerCase() || ''] || ''
  }

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>📔 Diario dei Progressi</h1>
        <p className="subtitle">Traccia i tuoi progressi giorno dopo giorno</p>
      </div>

      <div className="content-area">
        {/* Add/Edit Entry Form */}
        <div className="card card-accent" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>{isEditing ? 'Modifica voce' : 'Nuova voce'}</h2>
            {isEditing && (
              <button
                className="button-secondary"
                onClick={() => {
                  setIsEditing(false)
                  setEditingIndex(null)
                  setNewEntry({ title: '', content: '', mood: '', tags: '' })
                }}
              >
                Annulla
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>Titolo</label>
            <input
              type="text"
              placeholder="Es: Ho completato il refactoring della pipeline"
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.1rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--colors-neutral-border)',
                backgroundColor: 'var(--colors-neutral-surface)',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>Contenuto</label>
            <textarea
              placeholder="Descrivi i dettagli della giornata, gli ostacoli superati, i progressi fatti..."
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
              rows={5}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '1.05rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--colors-neutral-border)',
                backgroundColor: 'var(--colors-neutral-surface)',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>Stato emotivo</label>
              <select
                value={newEntry.mood}
                onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.05rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--colors-neutral-border)',
                  backgroundColor: 'var(--colors-neutral-surface)',
                }}
              >
                <option value="">Scegli uno stato</option>
                <option value="energico">⚡ Energico</option>
                <option value="felice">😊 Felice</option>
                <option value="tranquillo">😌 Tranquillo</option>
                <option value="concentrato">🎯 Concentrato</option>
                <option value="stressato">😰 Stressato</option>
                <option value="confuso">😕 Confuso</option>
                <option value="motivato">🔥 Motivato</option>
                <option value="neutro">😐 Neutro</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>Tag (separati da virgola)</label>
              <input
                type="text"
                placeholder="Es: pipeline, refactoring, testing"
                value={newEntry.tags}
                onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1.05rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--colors-neutral-border)',
                  backgroundColor: 'var(--colors-neutral-surface)',
                }}
              />
            </div>
          </div>

          <button
            className="button-primary"
            onClick={handleAddEntry}
            style={{ width: '100%' }}
          >
            {editingIndex !== null ? '✓ Aggiorna voce' : '+ Aggiungi voce'}
          </button>
        </div>

        {/* Statistics */}
        {diary.entries.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--colors-primary-text)' }}>
                {diary.entries.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--colors-neutral-muted)' }}>
                Voci totali
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--colors-primary-text)' }}>
                {diary.lastUpdated ? formatDate(diary.lastUpdated).split(' ')[0] : 'N/A'}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--colors-neutral-muted)' }}>
                Ultimo aggiornamento
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {diary.entries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
              <p style={{ fontSize: '1.1rem' }}>Inizia il tuo diario dei progressi oggi! 📝</p>
            </div>
          ) : (
            diary.entries.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{entry.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--colors-neutral-muted)' }}>
                      {formatDate(entry.date)}
                      {entry.mood && ` • ${getMoodEmoji(entry.mood)} ${entry.mood}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="button-secondary"
                      onClick={() => handleEditEntry(index)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      ✎ Modifica
                    </button>
                    <button
                      className="button-danger"
                      onClick={() => handleDeleteEntry(index)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      🗑 Elimina
                    </button>
                  </div>
                </div>

                <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', marginBottom: '1rem' }}>
                  {entry.content}
                </p>

                {entry.tags && entry.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {entry.tags.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          backgroundColor: 'var(--colors-accent-bg)',
                          color: 'var(--colors-accent-text)',
                          borderRadius: '1rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
