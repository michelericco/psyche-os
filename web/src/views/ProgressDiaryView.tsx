import { useState, useEffect } from 'react'
import '../index.css'
import { useI18n, type LanguageCode } from '../i18n'

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
  const { t, language } = useI18n()
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
      alert(t('diary.required'))
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
    const localeByLang: Record<LanguageCode, string> = {
      en: 'en-GB',
      it: 'it-IT',
      fr: 'fr-FR',
      zh: 'zh-CN',
      ru: 'ru-RU',
      ar: 'ar-SA',
    }
    return date.toLocaleDateString(localeByLang[language], {
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

  const moodKeys = ['energico', 'felice', 'tranquillo', 'concentrato', 'stressato', 'confuso', 'motivato', 'neutro'] as const

  return (
    <div className="view-container">
      <div className="view-header">
        <h1>📔 {t('diary.title')}</h1>
        <p className="subtitle">{t('diary.subtitle')}</p>
      </div>

      <div className="content-area">
        {/* Add/Edit Entry Form */}
        <div className="card card-accent" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>{isEditing ? t('diary.editEntry') : t('diary.newEntry')}</h2>
            {isEditing && (
              <button
                className="button-secondary"
                onClick={() => {
                  setIsEditing(false)
                  setEditingIndex(null)
                  setNewEntry({ title: '', content: '', mood: '', tags: '' })
                }}
              >
                {t('diary.cancel')}
              </button>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>{t('diary.titleLabel')}</label>
            <input
              type="text"
              placeholder={t('diary.titlePlaceholder')}
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
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>{t('diary.contentLabel')}</label>
            <textarea
              placeholder={t('diary.contentPlaceholder')}
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
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>{t('diary.moodLabel')}</label>
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
                <option value="">{t('diary.moodPlaceholder')}</option>
                {moodKeys.map((key) => (
                  <option key={key} value={key}>{`${getMoodEmoji(key)} ${t(`diary.mood.${key}`)}`}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '1.05rem' }}>{t('diary.tagsLabel')}</label>
              <input
                type="text"
                placeholder={t('diary.tagsPlaceholder')}
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
            {editingIndex !== null ? `✓ ${t('diary.updateEntry')}` : `+ ${t('diary.addEntry')}`}
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
                {t('diary.totalEntries')}
              </div>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--colors-primary-text)' }}>
                {diary.lastUpdated ? formatDate(diary.lastUpdated).split(' ')[0] : t('diary.noDate')}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--colors-neutral-muted)' }}>
                {t('diary.lastUpdate')}
              </div>
            </div>
          </div>
        )}

        {/* Entries List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {diary.entries.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
              <p style={{ fontSize: '1.1rem' }}>{t('diary.emptyState')} 📝</p>
            </div>
          ) : (
            diary.entries.map((entry, index) => (
              <div key={`${entry.date}-${index}`} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{entry.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--colors-neutral-muted)' }}>
                      {formatDate(entry.date)}
                      {entry.mood && ` • ${getMoodEmoji(entry.mood)} ${t(`diary.mood.${entry.mood.toLowerCase()}`)}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="button-secondary"
                      onClick={() => handleEditEntry(index)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      ✎ {t('diary.edit')}
                    </button>
                    <button
                      className="button-danger"
                      onClick={() => handleDeleteEntry(index)}
                      style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                    >
                      🗑 {t('diary.delete')}
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
