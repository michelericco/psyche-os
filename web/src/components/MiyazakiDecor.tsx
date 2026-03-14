/**
 * MiyazakiDecor — elementi grafici ispirati all'estetica di Studio Ghibli:
 *  · ForestBanner — illustrazione SVG con colline, alberi, alba e nebbia
 *  · KodamaRow    — spiriti Kodama che oscillano
 *  · MiyazakiBackground — foglie cadenti e lucciole in overlay fisso
 */

/* ─── Forest Banner ──────────────────────────────────────────────── */

export function ForestBanner() {
  return (
    <div
      style={{
        width: '100%',
        borderRadius: '18px',
        overflow: 'hidden',
        marginBottom: '2.25rem',
        boxShadow: '0 2px 2px rgba(0,0,0,0.04), 0 6px 24px rgba(0,0,0,0.08)',
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 800 200"
        width="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{ display: 'block', height: 'clamp(120px, 22vw, 200px)' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Sky gradient — dawn warm */}
          <linearGradient id="fb-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#b8d8f0" />
            <stop offset="55%"  stopColor="#e8cfa8" />
            <stop offset="100%" stopColor="#d4a870" />
          </linearGradient>
          {/* Sun halo */}
          <radialGradient id="fb-sun" cx="62%" cy="22%" r="35%">
            <stop offset="0%"   stopColor="rgba(255,230,110,0.65)" />
            <stop offset="50%"  stopColor="rgba(255,210,80,0.22)" />
            <stop offset="100%" stopColor="rgba(255,210,80,0)" />
          </radialGradient>
          {/* Far hill */}
          <linearGradient id="fb-hill1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#b2d884" />
            <stop offset="100%" stopColor="#8abc5c" />
          </linearGradient>
          {/* Mid hill */}
          <linearGradient id="fb-hill2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#74a840" />
            <stop offset="100%" stopColor="#4e8828" />
          </linearGradient>
          {/* Ground */}
          <linearGradient id="fb-ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#5c9030" />
            <stop offset="100%" stopColor="#3c6818" />
          </linearGradient>
        </defs>

        {/* Sky */}
        <rect width="800" height="200" fill="url(#fb-sky)" />

        {/* Sun halo */}
        <rect width="800" height="200" fill="url(#fb-sun)" />

        {/* Cloud 1 */}
        <g opacity="0.82">
          <circle cx="108" cy="38" r="16" fill="rgba(255,250,244,0.80)" />
          <circle cx="130" cy="30" r="20" fill="rgba(255,250,244,0.80)" />
          <circle cx="154" cy="38" r="16" fill="rgba(255,250,244,0.80)" />
          <rect x="108" y="33" width="62" height="21" fill="rgba(255,250,244,0.80)" />
        </g>
        {/* Cloud 2 */}
        <g opacity="0.65">
          <circle cx="490" cy="28" r="13" fill="rgba(255,250,244,0.75)" />
          <circle cx="508" cy="20" r="17" fill="rgba(255,250,244,0.75)" />
          <circle cx="528" cy="28" r="13" fill="rgba(255,250,244,0.75)" />
          <rect x="490" y="22" width="51" height="19" fill="rgba(255,250,244,0.75)" />
        </g>
        {/* Cloud 3 small */}
        <g opacity="0.55">
          <circle cx="680" cy="48" r="10" fill="rgba(255,250,244,0.7)" />
          <circle cx="695" cy="42" r="13" fill="rgba(255,250,244,0.7)" />
          <circle cx="711" cy="48" r="10" fill="rgba(255,250,244,0.7)" />
          <rect x="680" y="43" width="41" height="15" fill="rgba(255,250,244,0.7)" />
        </g>

        {/* Far hill layer */}
        <path
          d="M0,140 Q70,100 160,118 Q260,138 340,100 Q420,68 500,98 Q580,128 660,92 Q740,62 800,90 L800,200 L0,200Z"
          fill="url(#fb-hill1)"
        />

        {/* Far tree cluster — left */}
        <g fill="#2a5010" opacity="0.85">
          <circle cx="42"  cy="108" r="18" /><rect x="37"  y="116" width="10" height="30" />
          <circle cx="68"  cy="100" r="22" /><rect x="62"  y="108" width="12" height="34" />
          <circle cx="98"  cy="110" r="16" /><rect x="94"  y="118" width="8"  height="26" />
          {/* pine */}
          <path d="M130,78 L118,112 L142,112Z" />
          <path d="M130,95 L115,122 L145,122Z" />
          <rect x="127" y="120" width="6" height="18" />
        </g>
        {/* Far tree cluster — right */}
        <g fill="#2a5010" opacity="0.75">
          <circle cx="680" cy="95"  r="20" /><rect x="675" y="104" width="10" height="28" />
          <circle cx="710" cy="86"  r="24" /><rect x="704" y="96"  width="12" height="32" />
          <circle cx="742" cy="98"  r="17" /><rect x="738" y="106" width="8"  height="22" />
          {/* pine right */}
          <path d="M765,70 L752,108 L778,108Z" />
          <path d="M765,88 L750,118 L780,118Z" />
          <rect x="762" y="116" width="6" height="16" />
        </g>

        {/* Mid hill layer */}
        <path
          d="M0,168 Q120,138 220,154 Q340,172 450,138 Q570,108 680,148 Q748,168 800,148 L800,200 L0,200Z"
          fill="url(#fb-hill2)"
        />

        {/* Mist wisps */}
        <ellipse cx="220" cy="165" rx="160" ry="22" fill="rgba(255,248,238,0.22)" />
        <ellipse cx="600" cy="155" rx="190" ry="18" fill="rgba(255,248,238,0.18)" />

        {/* Near ground */}
        <path
          d="M0,188 Q200,174 400,185 Q600,196 800,178 L800,200 L0,200Z"
          fill="url(#fb-ground)"
        />

        {/* Near ground dark grass */}
        <path
          d="M0,196 Q400,188 800,192 L800,200 L0,200Z"
          fill="rgba(38,68,18,0.5)"
        />

        {/* Kodama in the scene */}
        <Kodama x={310} y={162} s={0.70} />
        <Kodama x={340} y={158} s={0.85} />
        <Kodama x={366} y={162} s={0.72} />

        {/* Bottom vignette */}
        <rect width="800" height="200"
          fill="url(#fb-sky)"
          opacity="0"
          style={{ mixBlendMode: 'multiply' }}
        />
      </svg>
    </div>
  )
}

/** Inline Kodama sprite used inside the banner SVG */
function Kodama({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {/* body */}
      <ellipse cx="0" cy="14" rx="7" ry="9" fill="rgba(242,254,238,0.90)" />
      {/* head */}
      <circle cx="0" cy="0" r="12" fill="rgba(246,255,242,0.95)" />
      {/* eyes */}
      <circle cx="-4.2" cy="-0.5" r="2"   fill="rgba(18,28,12,0.70)" />
      <circle cx=" 4.2" cy="-0.5" r="2"   fill="rgba(18,28,12,0.70)" />
      {/* eye glints */}
      <circle cx="-3.5" cy="-1.2" r="0.7" fill="white" opacity="0.7" />
      <circle cx=" 4.9" cy="-1.2" r="0.7" fill="white" opacity="0.7" />
      {/* subtle neck marks */}
      <line x1="-4" y1="10" x2="4" y2="10" stroke="rgba(100,160,80,0.25)" strokeWidth="0.7" />
      <line x1="-3" y1="13" x2="3" y2="13" stroke="rgba(100,160,80,0.20)" strokeWidth="0.6" />
    </g>
  )
}

/* ─── Kodama Row ─────────────────────────────────────────────────── */

const KODAMA_TIMINGS = [
  { delay: '0s',    dur: '2.8s' },
  { delay: '0.45s', dur: '3.1s' },
  { delay: '0.9s',  dur: '2.6s' },
  { delay: '0.2s',  dur: '3.4s' },
  { delay: '0.65s', dur: '2.9s' },
]

export function KodamaRow() {
  return (
    <div
      aria-hidden="true"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
        gap: 'clamp(1rem, 4vw, 2.5rem)',
        padding: '1.75rem 0 0.25rem',
        opacity: 0.82,
      }}
    >
      {KODAMA_TIMINGS.map((t, i) => (
        <div
          key={i}
          className="miya-kodama-bob"
          style={{
            animationDelay: t.delay,
            animationDuration: t.dur,
            transformOrigin: 'center bottom',
          }}
        >
          <KodamaSVG size={i === 2 ? 52 : i % 2 === 0 ? 44 : 48} />
        </div>
      ))}
    </div>
  )
}

function KodamaSVG({ size = 48 }: { size?: number }) {
  return (
    <svg
      viewBox="-14 -16 28 36"
      width={size}
      height={Math.round(size * 36 / 28)}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* shadow under */}
      <ellipse cx="0" cy="19" rx="9" ry="2.5" fill="rgba(60,90,30,0.18)" />
      {/* body */}
      <ellipse cx="0" cy="12" rx="7.5" ry="9.5" fill="rgba(240,254,234,0.92)" />
      {/* head */}
      <circle cx="0" cy="0"  r="12" fill="rgba(246,255,242,0.97)" />
      {/* neck marks */}
      <line x1="-5" y1="9"  x2="5" y2="9"  stroke="rgba(100,160,70,0.3)" strokeWidth="0.8" />
      <line x1="-4" y1="13" x2="4" y2="13" stroke="rgba(100,160,70,0.22)" strokeWidth="0.7" />
      {/* eyes */}
      <circle cx="-4.2" cy="-0.5" r="2.3"  fill="rgba(16,26,10,0.72)" />
      <circle cx=" 4.2" cy="-0.5" r="2.3"  fill="rgba(16,26,10,0.72)" />
      {/* eye glints */}
      <circle cx="-3.4" cy="-1.4" r="0.8"  fill="rgba(255,255,255,0.7)" />
      <circle cx=" 5.0" cy="-1.4" r="0.8"  fill="rgba(255,255,255,0.7)" />
    </svg>
  )
}

/* ─── Floating Leaves + Fireflies ───────────────────────────────── */

const LEAVES: {
  x: string; delay: string; dur: string
  drift: string; spin: string; color: string; size: number
}[] = [
  { x:'8%',  delay:'0s',    dur:'18s', drift:'-55px', spin:'260deg',  color:'rgba(100,158,50,0.62)',  size:22 },
  { x:'23%', delay:'4.5s',  dur:'22s', drift:'-40px', spin:'-300deg', color:'rgba(80,140,38,0.55)',   size:18 },
  { x:'47%', delay:'9s',    dur:'16s', drift:'-70px', spin:'340deg',  color:'rgba(188,108,32,0.58)',  size:20 },
  { x:'65%', delay:'2s',    dur:'20s', drift:'-50px', spin:'-200deg', color:'rgba(155,185,60,0.55)',  size:16 },
  { x:'82%', delay:'13s',   dur:'19s', drift:'-60px', spin:'280deg',  color:'rgba(100,158,50,0.58)',  size:24 },
  { x:'38%', delay:'7s',    dur:'24s', drift:'-45px', spin:'-320deg', color:'rgba(200,120,40,0.52)',  size:19 },
]

const FIREFLIES: { x: string; y: string; delay: string; dur: string }[] = [
  { x:'15%', y:'30%', delay:'0s',    dur:'4.2s' },
  { x:'72%', y:'20%', delay:'1.1s',  dur:'5.0s' },
  { x:'42%', y:'55%', delay:'2.3s',  dur:'3.8s' },
  { x:'88%', y:'40%', delay:'0.6s',  dur:'4.6s' },
  { x:'30%', y:'70%', delay:'3.1s',  dur:'5.2s' },
  { x:'60%', y:'65%', delay:'1.8s',  dur:'4.0s' },
  { x:'55%', y:'15%', delay:'2.8s',  dur:'3.5s' },
]

export function MiyazakiBackground() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {LEAVES.map((l, i) => (
        <div
          key={i}
          className="miya-leaf-fall"
          style={{
            position: 'absolute',
            left: l.x,
            top: '-40px',
            animationDelay: l.delay,
            animationDuration: l.dur,
            // @ts-expect-error CSS custom properties
            '--leaf-drift': l.drift,
            '--leaf-spin': l.spin,
          }}
        >
          <LeafSVG color={l.color} size={l.size} />
        </div>
      ))}

      {FIREFLIES.map((f, i) => (
        <div
          key={i}
          className="miya-firefly"
          style={{
            position: 'absolute',
            left: f.x,
            top:  f.y,
            animationDelay: f.delay,
            animationDuration: f.dur,
          }}
        />
      ))}
    </div>
  )
}

function LeafSVG({ color, size }: { color: string; size: number }) {
  const h = Math.round(size * 1.35)
  return (
    <svg viewBox="0 0 28 38" width={size} height={h} xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14,1 C21,5 26,12 25.5,20 C25,28.5 20.5,34.5 14,37 C7.5,34.5 3,28.5 2.5,20 C2,12 7,5 14,1Z"
        fill={color}
      />
      {/* center vein */}
      <line x1="14" y1="3"  x2="14" y2="35" stroke="rgba(50,90,20,0.35)" strokeWidth="1" />
      {/* lateral veins */}
      <path d="M14,11 C10,14 8,17 7,20"  stroke="rgba(50,90,20,0.25)" strokeWidth="0.7" fill="none" />
      <path d="M14,11 C18,14 20,17 21,20" stroke="rgba(50,90,20,0.25)" strokeWidth="0.7" fill="none" />
      <path d="M14,20 C11,23 9,26 9,28"  stroke="rgba(50,90,20,0.20)" strokeWidth="0.6" fill="none" />
      <path d="M14,20 C17,23 19,26 19,28" stroke="rgba(50,90,20,0.20)" strokeWidth="0.6" fill="none" />
    </svg>
  )
}
