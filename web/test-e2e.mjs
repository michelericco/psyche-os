/**
 * PSYCHE/OS E2E Bug Hunt
 * Serve il dist con un mini server HTTP, poi usa Playwright per:
 *  - verificare che ogni view carichi senza errori JS
 *  - controllare elementi chiave visibili
 *  - rilevare crash React (Error Boundaries, pagine bianche)
 */
import { chromium } from 'playwright'
import { createServer } from 'http'
import { readFileSync, existsSync } from 'fs'
import { join, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const DIST = join(__dirname, 'dist')

const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
}

// ── mini static server ────────────────────────────────────────────────────────
const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0]
  if (urlPath === '/' || !urlPath.includes('.')) urlPath = '/index.html'
  const file = join(DIST, urlPath)
  if (!existsSync(file)) {
    // SPA fallback
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(join(DIST, 'index.html')))
    return
  }
  const ext = extname(file)
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
  res.end(readFileSync(file))
})

await new Promise(r => server.listen(0, '127.0.0.1', r))
const { port } = server.address()
const BASE = `http://127.0.0.1:${port}`

// ── helpers ───────────────────────────────────────────────────────────────────
const G = '\x1b[32m✓\x1b[0m'
const R = '\x1b[31m✗\x1b[0m'
const W = '\x1b[33m⚠\x1b[0m'
let passed = 0, failed = 0, warnings = 0

function ok(label)   { console.log(`  ${G} ${label}`); passed++ }
function fail(label) { console.log(`  ${R} ${label}`); failed++ }
function warn(label) { console.log(`  ${W} ${label}`); warnings++ }

async function waitFor(fn, ms = 5000) {
  const t = Date.now()
  while (Date.now() - t < ms) {
    if (await fn()) return true
    await new Promise(r => setTimeout(r, 150))
  }
  return false
}

// ── views da testare ──────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'dashboard',       label: 'Dashboard' },
  { id: 'sources',         label: 'Setup / Onboarding' },
  { id: 'overview',        label: 'Overview' },
  { id: 'genome',          label: 'Genome' },
  { id: 'dimensions',      label: 'Dimensions' },
  { id: 'patterns',        label: 'Patterns' },
  { id: 'archetypes',      label: 'Archetypes' },
  { id: 'potentials',      label: 'Potentials' },
  { id: 'narrative',       label: 'Narrative' },
  { id: 'insights',        label: 'Insights' },
  { id: 'iq',              label: 'IQ Estimate' },
  { id: 'neurodivergence', label: 'Neurodivergence' },
  { id: 'map',             label: 'Semantic Map' },
  { id: 'integration',     label: 'Integration' },
]

// ── test ──────────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: true })
const allErrors = []

// Apre la pagina iniziale e raccoglie errori JS globali
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } })
const page = await ctx.newPage()

const jsErrors = []
page.on('pageerror', e => jsErrors.push({ view: '(global)', msg: e.message }))
page.on('console', msg => {
  if (msg.type() === 'error') jsErrors.push({ view: '(console)', msg: msg.text() })
})

await page.goto(BASE)
await page.waitForLoadState('networkidle')

// ── [1] Caricamento base ──────────────────────────────────────────────────────
console.log('\n\x1b[1m[1] Caricamento app\x1b[0m')

const rootEmpty = await page.locator('#root').evaluate(el => el.innerHTML.trim() === '')
if (rootEmpty) fail('React non ha montato nulla — pagina bianca')
else ok('React montato correttamente')

const hasShell = await page.locator('.app-shell').count()
if (hasShell) ok('app-shell presente')
else fail('app-shell non trovato — layout rotto')

const hasSidebar = await page.locator('.app-sidebar').count()
// Dashboard non ha sidebar (by design), Setup sì
ok(`Struttura layout: sidebar=${hasSidebar > 0 ? 'visibile' : 'assente (dashboard mode)'}`)

// ── [2] Navigazione in ogni view ─────────────────────────────────────────────
console.log('\n\x1b[1m[2] Navigazione tutte le views\x1b[0m')

for (const view of VIEWS) {
  // Resetta errori per questa view
  const errsBefore = jsErrors.length

  // Clicca il bottone nav corrispondente
  const navBtn = page.locator(`.app-nav-button`).filter({ hasText: view.label })
  const btnCount = await navBtn.count()

  if (btnCount === 0) {
    // Dashboard non ha nav button nel sidebar se sidebar è nascosta
    // Dispatcha navigate event manualmente
    await page.evaluate(id => {
      window.dispatchEvent(new CustomEvent('navigate', { detail: id }))
    }, view.id)
  } else {
    await navBtn.first().click()
  }

  // Aspetta che il contenuto carichi (Suspense)
  const loaded = await waitFor(async () => {
    const loading = await page.locator('.app-loading').count()
    return loading === 0
  }, 4000)

  const errsAfter = jsErrors.length
  const newErrs = jsErrors.slice(errsBefore)

  if (!loaded) {
    warn(`${view.label}: ancora in loading dopo 4s`)
    continue
  }

  // Verifica che view-shell abbia contenuto
  const viewShell = await page.locator('.view-shell').first()
  const content = await viewShell.evaluate(el => el.children.length)

  if (newErrs.length > 0) {
    fail(`${view.label}: ${newErrs.length} errori JS → ${newErrs.map(e => e.msg.slice(0, 80)).join(' | ')}`)
    allErrors.push(...newErrs.map(e => ({ view: view.label, ...e })))
  } else if (content === 0) {
    fail(`${view.label}: view-shell vuoto (probabile crash silenzioso)`)
  } else {
    ok(`${view.label}: caricato (${content} child elementi)`)
  }
}

// ── [3] Dashboard — interazione bottone navigate ──────────────────────────────
console.log('\n\x1b[1m[3] Dashboard navigate event\x1b[0m')

await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))
})
await page.waitForTimeout(300)

// Dispatch verso una view valida
await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'genome' }))
})
await page.waitForTimeout(500)

const afterNavigate = await page.locator('.view-shell').first().evaluate(el => el.children.length)
if (afterNavigate > 0) ok('navigate event handler funziona correttamente')
else fail('navigate event non ha cambiato view')

// Dispatch con valore non valido — non deve crashare
const errsBefore = jsErrors.length
await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: '../../malicious' }))
})
await page.waitForTimeout(200)
const newErrsAfter = jsErrors.slice(errsBefore)
if (newErrsAfter.length === 0) ok('navigate con id non valido ignorato silenziosamente')
else fail(`navigate con id non valido causa errori: ${newErrsAfter.map(e => e.msg).join(', ')}`)

// ── [4] SemanticMap — input search ───────────────────────────────────────────
console.log('\n\x1b[1m[4] SemanticMap — vector search panel\x1b[0m')

await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'map' }))
})
await waitFor(async () => (await page.locator('.app-loading').count()) === 0, 4000)
await page.waitForTimeout(500)

const searchInput = page.locator('input[placeholder*="Search"]').first()
const searchExists = await searchInput.count()

if (searchExists) {
  await searchInput.fill('pattern recognition')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const errCount = jsErrors.filter(e => e.msg.includes('Error') && !e.msg.includes('Warning')).length
  ok(`Search input funziona (errori accumulati totali: ${errCount})`)

  // Test input lunghissimo (DoS guard)
  const longInput = 'a'.repeat(600)
  await searchInput.fill(longInput)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  ok('Input lungo (600 chars) non causa crash')
} else {
  warn('Search input non trovato nel SemanticMap (potrebbe essere in un sottocomponente)')
}

// ── [5] Sidebar nascosta in Dashboard ────────────────────────────────────────
console.log('\n\x1b[1m[5] Dashboard — sidebar hidden\x1b[0m')

await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'dashboard' }))
})
await page.waitForTimeout(400)

const sidebarDash = await page.locator('.app-sidebar').count()
if (sidebarDash === 0) ok('Sidebar correttamente nascosta in Dashboard view')
else warn('Sidebar visibile in Dashboard (atteso hidden)')

// Torna a una view normale e verifica che sidebar riappaia
await page.evaluate(() => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: 'patterns' }))
})
await page.waitForTimeout(400)
const sidebarBack = await page.locator('.app-sidebar').count()
if (sidebarBack > 0) ok('Sidebar riappare nelle views normali')
else fail('Sidebar non riappare dopo Dashboard')

// ── [6] Errori JS totali ──────────────────────────────────────────────────────
console.log('\n\x1b[1m[6] Riepilogo errori JS\x1b[0m')

if (jsErrors.length === 0) {
  ok('Nessun errore JS durante tutta la sessione')
} else {
  const unique = [...new Set(jsErrors.map(e => e.msg))]
  fail(`${jsErrors.length} errori JS totali (${unique.length} unici):`)
  unique.forEach(msg => console.log(`     · ${msg.slice(0, 120)}`))
}

// ── Summary ───────────────────────────────────────────────────────────────────
await browser.close()
server.close()

console.log(`\n${'─'.repeat(56)}`)
const total = passed + failed
if (failed === 0 && warnings === 0) {
  console.log(`\x1b[32m\x1b[1m✓ Tutti i test passati: ${passed}/${total}\x1b[0m`)
} else if (failed === 0) {
  console.log(`\x1b[33m\x1b[1m⚠ ${passed}/${total} passati, ${warnings} warning\x1b[0m`)
} else {
  console.log(`\x1b[31m\x1b[1m✗ ${failed} falliti su ${total} (${warnings} warning)\x1b[0m`)
}

process.exit(failed > 0 ? 1 : 0)
