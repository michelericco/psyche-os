import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

export type LanguageCode = 'en' | 'it' | 'fr' | 'zh' | 'ru' | 'ar'

const STORAGE_KEY = 'psyche-lang'

const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  en: 'English',
  it: 'Italiano',
  fr: 'Français',
  zh: '中文',
  ru: 'Русский',
  ar: 'العربية',
}

const RTL_LANGS = new Set<LanguageCode>(['ar'])

type Dictionary = Record<string, string>

const enDict: Dictionary = {
  'app.kicker': 'Digital psyche operating system',
  'app.currentView': 'Current view',
  'app.loading': 'Loading section',
  'app.quote': 'Until you make the unconscious conscious, it will direct your life and you will call it fate.',
  'app.nav.dashboard.label': 'Dashboard',
  'app.nav.dashboard.note': 'Command center',
  'app.nav.sources.label': 'Setup',
  'app.nav.sources.note': 'Data sources',
  'app.nav.overview.label': 'Overview',
  'app.nav.overview.note': 'System map',
  'app.nav.genome.label': 'Genome',
  'app.nav.genome.note': 'Core traits',
  'app.nav.dimensions.label': 'Dimensions',
  'app.nav.dimensions.note': 'Six-axis profile',
  'app.nav.patterns.label': 'Patterns',
  'app.nav.patterns.note': 'Behavioral signals',
  'app.nav.archetypes.label': 'Archetypes',
  'app.nav.archetypes.note': 'Psychic figures',
  'app.nav.potentials.label': 'Potentials',
  'app.nav.potentials.note': 'Growth areas',
  'app.nav.narrative.label': 'Narrative',
  'app.nav.narrative.note': 'Story phase',
  'app.nav.insights.label': 'Insights',
  'app.nav.insights.note': 'Actionable vectors',
  'app.nav.iq.label': 'IQ Estimate',
  'app.nav.iq.note': 'Behavioral estimate',
  'app.nav.neurodivergence.label': 'Neurodivergence',
  'app.nav.neurodivergence.note': 'Screening signals',
  'app.nav.map.label': 'Semantic Map',
  'app.nav.map.note': 'Graph + vectors',
  'app.nav.integration.label': 'Integration',
  'app.nav.integration.note': 'Export + bridge',
  'app.nav.diary.label': 'Progress Diary',
  'app.nav.diary.note': 'Daily track',
  'app.nav.timeline.label': 'Timeline',
  'app.nav.timeline.note': 'Drift across runs',
  'dashboard.title': 'Dashboard',
  'dashboard.subtitle': 'One place to set context, act quickly, and monitor direction.',
  'dashboard.stat.profile': 'Profile',
  'dashboard.stat.completion': 'completion',
  'dashboard.stat.phase': 'Phase',
  'dashboard.stat.narrative': 'narrative',
  'dashboard.stat.active': 'Active',
  'dashboard.stat.dimensions': 'dimensions',
  'dashboard.stat.signals': 'Signals',
  'dashboard.stat.topPatterns': 'top patterns',
  'dashboard.profileSetup': 'Profile setup',
  'dashboard.profileHint': 'Short inputs, better guidance.',
  'dashboard.name': 'Name',
  'dashboard.goal': 'Goal',
  'dashboard.namePlaceholder': 'Your name',
  'dashboard.goalPlaceholder': 'Your current goal',
  'dashboard.quickActions': 'Quick actions',
  'dashboard.quickHint': 'Tap once. Move fast.',
  'dashboard.action.connect': 'Connect',
  'dashboard.action.connectSub': 'Data sources',
  'dashboard.action.run': 'Run',
  'dashboard.action.runSub': 'Pipeline',
  'dashboard.action.overview': 'Overview',
  'dashboard.action.overviewSub': 'System map',
  'dashboard.action.patterns': 'Patterns',
  'dashboard.action.patternsSub': 'Signals',
  'dashboard.activeDimensions': 'Active dimensions',
  'dashboard.exploringDimensions': 'Exploring dimensions',
  'dashboard.recentSignals': 'Recent signals',
}

const dictionaries: Record<LanguageCode, Dictionary> = {
  en: enDict,
  it: {
    ...enDict,
    'app.kicker': 'Sistema operativo della psiche digitale',
    'app.currentView': 'Vista corrente',
    'app.loading': 'Caricamento sezione',
    'app.quote': 'Finché non renderai cosciente l’inconscio, esso guiderà la tua vita e tu lo chiamerai destino.',
    'app.nav.sources.note': 'Sorgenti dati',
    'app.nav.overview.note': 'Mappa sistema',
    'app.nav.genome.note': 'Tratti centrali',
    'app.nav.patterns.note': 'Segnali comportamentali',
    'app.nav.archetypes.note': 'Figure psichiche',
    'app.nav.potentials.note': 'Aree di crescita',
    'app.nav.narrative.note': 'Fase narrativa',
    'app.nav.insights.note': 'Direzioni attuabili',
    'app.nav.iq.note': 'Stima comportamentale',
    'app.nav.neurodivergence.note': 'Segnali di screening',
    'app.nav.map.note': 'Grafo + vettori',
    'app.nav.integration.note': 'Export + bridge',
    'app.nav.diary.note': 'Traccia giornaliera',
    'app.nav.timeline.note': 'Deriva tra esecuzioni',
    'dashboard.subtitle': 'Un unico spazio per impostare contesto, agire rapidamente e monitorare la direzione.',
    'dashboard.stat.profile': 'Profilo',
    'dashboard.stat.completion': 'completamento',
    'dashboard.stat.phase': 'Fase',
    'dashboard.stat.narrative': 'narrativa',
    'dashboard.stat.active': 'Attive',
    'dashboard.stat.dimensions': 'dimensioni',
    'dashboard.stat.signals': 'Segnali',
    'dashboard.stat.topPatterns': 'pattern principali',
    'dashboard.profileSetup': 'Impostazione profilo',
    'dashboard.profileHint': 'Pochi input, guida migliore.',
    'dashboard.name': 'Nome',
    'dashboard.goal': 'Obiettivo',
    'dashboard.namePlaceholder': 'Il tuo nome',
    'dashboard.goalPlaceholder': 'Il tuo obiettivo attuale',
    'dashboard.quickActions': 'Azioni rapide',
    'dashboard.quickHint': 'Un tocco. Massima velocità.',
    'dashboard.action.connect': 'Connetti',
    'dashboard.action.connectSub': 'Sorgenti dati',
    'dashboard.action.run': 'Esegui',
    'dashboard.action.runSub': 'Pipeline',
    'dashboard.action.overview': 'Panoramica',
    'dashboard.action.overviewSub': 'Mappa sistema',
    'dashboard.action.patterns': 'Pattern',
    'dashboard.action.patternsSub': 'Segnali',
    'dashboard.activeDimensions': 'Dimensioni attive',
    'dashboard.exploringDimensions': 'Dimensioni in esplorazione',
    'dashboard.recentSignals': 'Segnali recenti',
  },
  fr: {
    ...enDict,
    'app.kicker': 'Système d’exploitation psychique numérique',
    'app.currentView': 'Vue actuelle',
    'app.loading': 'Chargement de la section',
    'app.quote': 'Tant que vous ne rendrez pas l’inconscient conscient, il dirigera votre vie et vous appellerez cela le destin.',
    'app.nav.sources.note': 'Sources de données',
    'app.nav.overview.note': 'Carte du système',
    'app.nav.genome.note': 'Traits centraux',
    'app.nav.patterns.note': 'Signaux comportementaux',
    'app.nav.potentials.note': 'Zones de croissance',
    'dashboard.title': 'Tableau de bord',
    'dashboard.subtitle': 'Un espace unique pour cadrer, agir vite et suivre votre direction.',
    'dashboard.stat.profile': 'Profil',
    'dashboard.stat.phase': 'Phase',
    'dashboard.quickActions': 'Actions rapides',
    'dashboard.profileSetup': 'Configuration du profil',
    'dashboard.name': 'Nom',
    'dashboard.goal': 'Objectif',
    'dashboard.namePlaceholder': 'Votre nom',
    'dashboard.goalPlaceholder': 'Votre objectif actuel',
    'dashboard.recentSignals': 'Signaux récents',
  },
  zh: {
    ...enDict,
    'app.kicker': '数字心智操作系统',
    'app.currentView': '当前视图',
    'app.loading': '正在加载模块',
    'app.quote': '在你让无意识变得有意识之前，它会主导你的人生，而你会称之为命运。',
    'app.nav.dashboard.note': '控制中心',
    'app.nav.sources.note': '数据源',
    'app.nav.overview.note': '系统地图',
    'dashboard.title': '仪表盘',
    'dashboard.subtitle': '在一个地方设定上下文、快速行动并追踪方向。',
    'dashboard.stat.profile': '档案',
    'dashboard.stat.phase': '阶段',
    'dashboard.quickActions': '快捷操作',
    'dashboard.profileSetup': '档案设置',
    'dashboard.name': '姓名',
    'dashboard.goal': '目标',
    'dashboard.namePlaceholder': '你的名字',
    'dashboard.goalPlaceholder': '你当前的目标',
    'dashboard.recentSignals': '近期信号',
  },
  ru: {
    ...enDict,
    'app.kicker': 'Цифровая операционная система психики',
    'app.currentView': 'Текущий раздел',
    'app.loading': 'Загрузка раздела',
    'app.quote': 'Пока вы не сделаете бессознательное осознанным, оно будет управлять вашей жизнью, и вы назовёте это судьбой.',
    'app.nav.dashboard.note': 'Центр управления',
    'app.nav.sources.note': 'Источники данных',
    'app.nav.overview.note': 'Карта системы',
    'dashboard.title': 'Панель',
    'dashboard.subtitle': 'Единое место, чтобы задать контекст, быстро действовать и отслеживать направление.',
    'dashboard.stat.profile': 'Профиль',
    'dashboard.stat.phase': 'Фаза',
    'dashboard.quickActions': 'Быстрые действия',
    'dashboard.profileSetup': 'Настройка профиля',
    'dashboard.name': 'Имя',
    'dashboard.goal': 'Цель',
    'dashboard.namePlaceholder': 'Ваше имя',
    'dashboard.goalPlaceholder': 'Ваша текущая цель',
    'dashboard.recentSignals': 'Последние сигналы',
  },
  ar: {
    ...enDict,
    'app.kicker': 'نظام تشغيل النفس الرقمي',
    'app.currentView': 'العرض الحالي',
    'app.loading': 'جارٍ تحميل القسم',
    'app.quote': 'حتى تجعل اللاوعي واعيًا، سيقود حياتك وستسمي ذلك قدرًا.',
    'app.nav.dashboard.note': 'مركز التحكم',
    'app.nav.sources.note': 'مصادر البيانات',
    'app.nav.overview.note': 'خريطة النظام',
    'dashboard.title': 'لوحة التحكم',
    'dashboard.subtitle': 'مكان واحد لضبط السياق، التحرك بسرعة، ومتابعة الاتجاه.',
    'dashboard.stat.profile': 'الملف',
    'dashboard.stat.phase': 'المرحلة',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.profileSetup': 'إعداد الملف',
    'dashboard.name': 'الاسم',
    'dashboard.goal': 'الهدف',
    'dashboard.namePlaceholder': 'اسمك',
    'dashboard.goalPlaceholder': 'هدفك الحالي',
    'dashboard.recentSignals': 'إشارات حديثة',
  },
}

type I18nContextValue = {
  language: LanguageCode
  setLanguage: (lang: LanguageCode) => void
  languages: Array<{ code: LanguageCode; label: string }>
  t: (key: string) => string
  isRTL: boolean
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null
    if (saved && saved in LANGUAGE_LABELS) return saved
    return 'en'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, language)
    document.documentElement.lang = language
    document.documentElement.dir = RTL_LANGS.has(language) ? 'rtl' : 'ltr'
  }, [language])

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string) => dictionaries[language][key] ?? dictionaries.en[key] ?? key
    return {
      language,
      setLanguage,
      languages: (Object.keys(LANGUAGE_LABELS) as LanguageCode[]).map(code => ({
        code,
        label: LANGUAGE_LABELS[code],
      })),
      t,
      isRTL: RTL_LANGS.has(language),
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
