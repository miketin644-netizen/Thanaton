const { useEffect, useRef, useState } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "colorMode": "dark",
  "headlineVariant": "A"
} /*EDITMODE-END*/;

function BrandMark() {
  return (
    <svg width="26" height="32" viewBox="0 0 100 115" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Central stem */}
      <polygon points="42,6 58,6 58,90 50,110 42,90" fill="currentColor"/>
      {/* Left wing */}
      <polygon points="42,6 4,16 14,44 42,42" fill="currentColor" opacity="0.78"/>
      {/* Right wing */}
      <polygon points="58,6 96,16 86,44 58,42" fill="currentColor" opacity="0.78"/>
    </svg>
  );
}

function Radar() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let raf;
    const tick = () => {
      setAngle((a) => (a + 0.012) % (Math.PI * 2));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const size = 440, cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const sx = cx + Math.cos(angle - Math.PI / 2) * r;
  const sy = cy + Math.sin(angle - Math.PI / 2) * r;

  const blips = [
    { id: 'A1', th: 0.6,  rr: 0.42, hot: false },
    { id: 'A2', th: 2.1,  rr: 0.68, hot: true  },
    { id: 'A3', th: 3.7,  rr: 0.78, hot: false },
    { id: 'A4', th: 5.6,  rr: 0.32, hot: false },
  ];

  return (
    <div className="radar-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%">
        <defs>
          <linearGradient id="sweep" x1={cx} y1={cy} x2={sx} y2={sy} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="rgba(168,162,151,0.32)" />
            <stop offset="100%" stopColor="rgba(168,162,151,0)" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="#0c0c0c" stroke="var(--line-2)" />
        {[0.25, 0.5, 0.75, 1].map((f, i) =>
          <circle key={i} cx={cx} cy={cy} r={r * f} fill="none" stroke="var(--line)" />
        )}
        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--line)" />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke="var(--line)" />
        <path
          d={`M ${cx} ${cy} L ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + Math.cos(angle - Math.PI / 2 + 0.01) * r} ${cy + Math.sin(angle - Math.PI / 2 + 0.01) * r} Z`}
          transform={`rotate(${angle * 180 / Math.PI} ${cx} ${cy})`}
          fill="url(#sweep)"
        />
        <line x1={cx} y1={cy} x2={sx} y2={sy} stroke="rgba(168,162,151,0.5)" />
        {blips.map((b) => {
          const x = cx + Math.cos(b.th - Math.PI / 2) * b.rr * r;
          const y = cy + Math.sin(b.th - Math.PI / 2) * b.rr * r;
          const delta = (b.th - angle + Math.PI * 2) % (Math.PI * 2);
          const op = Math.max(0.3, 1 - delta / (Math.PI * 0.7));
          const col = b.hot ? 'var(--hot)' : 'var(--accent)';
          return (
            <g key={b.id} opacity={op}>
              <circle cx={x} cy={y} r="3" fill={col} />
              <text x={x + 8} y={y - 6} fill={col} fontSize="9" fontFamily="Share Tech Mono, monospace" letterSpacing="1">{b.id}</text>
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r="3" fill="var(--fg)" />
      </svg>
    </div>
  );
}

function useRoute() {
  const getHash = () => { const h = window.location.hash.slice(1); return h.startsWith('/') ? h : '/'; };
  const [route, setRoute] = useState(getHash);
  useEffect(() => {
    const handler = () => setRoute(getHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

function App() {
  const [tweaks, setTweak] = window.useTweaks
    ? window.useTweaks(TWEAK_DEFAULTS)
    : [TWEAK_DEFAULTS, () => {}];

  const [submitted, setSubmitted]   = useState(false);
  const [data, setData]             = useState({ name: '', org: '', email: '', role: '', otherRole: '', message: '' });
  const route                       = useRoute();
  const [cardHovered, setCardHovered]   = useState(false);
  const [protoHovered, setProtoHovered] = useState(false);
  const [wwuHovered, setWwuHovered]   = useState(null);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [openPanel, setOpenPanel]   = useState(null);

  useEffect(() => {
    document.body.classList.toggle('light', tweaks.colorMode === 'light');
  }, [tweaks.colorMode]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setCompanyOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => { setCompanyOpen(false); }, [route]);

  useEffect(() => {
    const el = document.querySelector('.timeline-wrap');
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('tl-visible'); obs.disconnect(); } },
      { threshold: 0.2 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [route]);

  useEffect(() => {
    if (route !== '/company/mission') return;
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    if (!gsap || !ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);

    let ctx;
    const tid = setTimeout(() => {
      const outer = document.getElementById('tl-outer');
      const pin   = document.getElementById('tl-pin');
      const path  = document.getElementById('tl-path');
      if (!outer || !pin || !path) return;

      const W = pin.clientWidth;
      const H = pin.clientHeight;
      const len = Math.sqrt(W * W + H * H);
      path.setAttribute('d', `M 0 0 L ${W} ${H}`);
      path.setAttribute('stroke-dasharray', len);
      path.setAttribute('stroke-dashoffset', len);

      ctx = gsap.context(() => {
        gsap.to('#tl-path', {
          strokeDashoffset: 0, ease: 'none',
          scrollTrigger: { trigger: '#tl-outer', start: 'top top', end: 'bottom bottom', scrub: 0.5 },
        });
        gsap.to(['#tl-m1', '#tl-r1a', '#tl-r1b'], {
          opacity: 1, ease: 'none',
          scrollTrigger: { trigger: '#tl-outer', start: '20% top', end: '32% top', scrub: 0.5 },
        });
        gsap.to(['#tl-m2', '#tl-r2a'], {
          opacity: 0.4, ease: 'none',
          scrollTrigger: { trigger: '#tl-outer', start: '55% top', end: '67% top', scrub: 0.5 },
        });
        gsap.to(['#tl-m3', '#tl-r3a'], {
          opacity: 0.2, ease: 'none',
          scrollTrigger: { trigger: '#tl-outer', start: '80% top', end: '90% top', scrub: 0.5 },
        });
      });
    }, 120);

    return () => {
      clearTimeout(tid);
      if (ctx) ctx.revert();
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [route]);

  const TweaksPanel = window.TweaksPanel;
  const TweakSection = window.TweakSection;
  const TweakRadio   = window.TweakRadio;
  const TweakSelect  = window.TweakSelect;

  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav">
        <div className="container nav-inner" style={{ paddingLeft: 0 }}>
          <a href="#" className="brand"><img src="logo.png" alt="Thanaton logo" style={{ height: 26, width: 'auto', display: 'block', filter: 'drop-shadow(0.5px 0 0 #fff) drop-shadow(-0.5px 0 0 #fff) drop-shadow(0 0.5px 0 #fff) drop-shadow(0 -0.5px 0 #fff)' }} /><span>THANATHON</span></a>
          <div className="nav-links">
            <a href="#/portfolio" style={{ opacity: route.startsWith('/portfolio') ? 1 : 0.7 }}>Portfolio</a>
            <span
              onClick={() => setCompanyOpen(o => !o)}
              style={{ opacity: route.startsWith('/company') || companyOpen ? 1 : 0.7, cursor: 'pointer', userSelect: 'none' }}
            >Company</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href="store.html" className="nav-cta" style={{ background: 'rgba(168,162,151,0.12)' }}>STORE</a>
            <a
              href="#demo"
              className="nav-cta"
              onClick={e => {
                if (route !== '/') {
                  e.preventDefault();
                  window.location.hash = '/';
                  setTimeout(() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' }), 80);
                }
              }}
            >Contact</a>
          </div>
        </div>
      </nav>

      {/* ── COMPANY HUD OVERLAY ── */}
      <div className={`hud-overlay${companyOpen ? ' open' : ''}`} onClick={() => setCompanyOpen(false)}>
        <div className="hud-corner tl" /><div className="hud-corner tr" />
        <div className="hud-corner bl" /><div className="hud-corner br" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, padding: '0 32px', borderBottom: '1px solid #111', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.18em', color: '#333', textTransform: 'uppercase' }}>// COMPANY</span>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: '#333', cursor: 'pointer' }}>ESC TO CLOSE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 32px', maxWidth: 900, width: '100%', margin: '0 auto' }} onClick={e => e.stopPropagation()}>
          <a href="#/company/mission" className="hud-item">
            <span className="hud-item-num">01</span>
            <span className="hud-item-title">About Us</span>
            <span className="hud-item-desc">Who we are · Why we build</span>
            <span className="hud-item-arrow">→</span>
          </a>
          <a href="#/company/work-with-us" className="hud-item">
            <span className="hud-item-num">02</span>
            <span className="hud-item-title">Work with us</span>
            <span className="hud-item-desc">Careers · Partnerships</span>
            <span className="hud-item-arrow">→</span>
          </a>
        </div>
        <div style={{ padding: '20px 32px', borderTop: '1px solid #111', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: '#2a2a2a', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Defense Systems · Proprietary IP · Modern Conflict</span>
        </div>
      </div>

      {/* ── ROUTES ── */}
      <div key={route} className="route-view">

        {/* HOME */}
        {route === '/' && (
          <section className="hero" data-screen-label="01 Hero">
            <div className="container">

              {/* ── Main heading ── */}
              <h1 style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: 'clamp(52px, 9vw, 108px)',
                fontWeight: 700, lineHeight: 0.93,
                letterSpacing: '0.015em', textTransform: 'uppercase',
                color: 'var(--fg)',
              }}>
                Defense for<br/>Asymmetric Warfare
              </h1>

              {/* ── Body paragraph — left aligned ── */}
              <p style={{
                fontFamily: "'Chakra Petch', sans-serif",
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 400, lineHeight: 1.6,
                color: 'var(--muted-2)',
                textAlign: 'left',
                maxWidth: 760,
                marginTop: 40,
              }}>
                Governments acquire scalable, low-cost platforms built modular by design. Operators configure, swap, and scale each component to meet the exact demands of the conflict — maintaining full sovereign control at every stage.
              </p>
            </div>
          </section>
        )}

        {/* PORTFOLIO */}
        {route === '/portfolio' && (
          <>
            <section className="section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
              <div className="container" style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: 20 }}>
                  Weapons tailored for asymmetric threats.
                </p>
                <p style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(16px, 2vw, 22px)', color: 'var(--muted-2)', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
                  Modular, scalable and customizable defense products
                </p>
              </div>
            </section>

            <section className="section" id="portfolio" data-screen-label="02 Portfolio">
              <div className="container">
                <div style={{ borderTop: '2px solid var(--fg)', marginBottom: 40, opacity: 0.25 }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
                  <div
                    onMouseEnter={() => setCardHovered(true)}
                    onMouseLeave={() => setCardHovered(false)}
                    style={{
                      border: '2px solid',
                      borderImage: 'linear-gradient(135deg, #a8bc74, #a0a0a0) 1',
                      background: cardHovered ? '#0a0a0a' : 'var(--bg-1)',
                      padding: 28,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, height: '100%',
                      textAlign: 'center',
                      transition: 'background 0.18s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: cardHovered ? '#666' : 'var(--muted)', textTransform: 'uppercase' }}>01</div>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: cardHovered ? '#6abf74' : 'var(--ok)', border: `1px solid ${cardHovered ? '#6abf74' : 'var(--ok)'}`, padding: '2px 7px' }}>V2026-1.0</span>
                    </div>
                    <img
                      src="meerkats_concept.png"
                      alt="Meerkats concept"
                      style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        filter: cardHovered ? 'brightness(1.15)' : 'brightness(0.9)',
                        transition: 'filter 0.18s',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: cardHovered ? '#fafafa' : 'var(--fg)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Meercat</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: cardHovered ? '#c0c0c0' : 'var(--muted-2)', fontWeight: 600 }}>Sensor platform family.</div>
                    </div>
                  </div>

                  {/* PROTO card */}
                  <div
                    onMouseEnter={() => setProtoHovered(true)}
                    onMouseLeave={() => setProtoHovered(false)}
                    style={{
                      cursor: 'pointer',
                      border: '2px solid',
                      borderImage: 'linear-gradient(135deg, #a8bc74, #a0a0a0) 1',
                      background: protoHovered ? '#0a0a0a' : 'var(--bg-1)',
                      padding: 28,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, height: '100%',
                      textAlign: 'center',
                      transition: 'background 0.18s',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: protoHovered ? '#666' : 'var(--muted)', textTransform: 'uppercase' }}>02</div>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.12em', color: protoHovered ? '#6abf74' : 'var(--ok)', border: `1px solid ${protoHovered ? '#6abf74' : 'var(--ok)'}`, padding: '2px 7px' }}>PROTO</span>
                    </div>
                    <img
                      src="laser_prototype.png"
                      alt="Laser prototype"
                      style={{
                        width: '100%',
                        maxHeight: 200,
                        objectFit: 'contain',
                        filter: protoHovered ? 'brightness(1.15)' : 'brightness(0.9)',
                        transition: 'filter 0.18s',
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: protoHovered ? '#fafafa' : 'var(--fg)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Proto</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: protoHovered ? '#c0c0c0' : 'var(--muted-2)', fontWeight: 600 }}>Directed energy prototype.</div>
                    </div>
                    <div style={{ marginTop: 'auto', fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: protoHovered ? '#fafafa' : 'var(--accent)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      VIEW DETAILS <span>→</span>
                    </div>
                  </div>

                  {[3].map(n => (
                    <div key={n} style={{ border: '1px dashed var(--line)', padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 180, opacity: 0.3 }}>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase' }}>// FUTURE SYSTEM {String(n).padStart(2, '0')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* MEERCAT */}
        {route === '/portfolio/meerkats' && (
          <section data-screen-label="Meercat" style={{ paddingBottom: 0, borderBottom: '1px solid var(--line)' }}>

            {/* Contained header */}
            <div className="container" style={{ paddingTop: 100, paddingBottom: 48 }}>

              {/* Back */}
              <div style={{ marginBottom: 36 }}>
                <a href="#/portfolio"
                  style={{ background: 'none', border: '1px solid var(--fg)', color: 'var(--muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.12em', padding: '5px 14px', textDecoration: 'none', textTransform: 'uppercase', display: 'inline-block', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--fg)'}
                >← Portfolio</a>
              </div>

              {/* Badges */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: 'var(--ok)', border: '1px solid var(--ok)', padding: '3px 10px', textTransform: 'uppercase' }}>V2026-1.0</span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: 'var(--muted-2)', border: '1px solid var(--fg)', padding: '3px 10px', textTransform: 'uppercase' }}>Sensor Family</span>
              </div>

              {/* Title */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 1, letterSpacing: '0.02em' }}>Meercat</h2>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 'clamp(13px, 2vw, 24px)', letterSpacing: '0.18em', color: 'var(--fg)', opacity: 0.35, textTransform: 'uppercase', paddingBottom: 8 }}>
                  [ DETECT. CLASSIFY. PROTECT. ]
                </span>
              </div>

              {/* Description block */}
              <div style={{ marginTop: 28, borderTop: '2px solid var(--fg)', paddingTop: 24 }}>
                <p className="kicker" style={{ marginTop: 0, maxWidth: '60ch' }}>
                  Meercat is Thanaton's bare-bones sensor platform family — designed to detect, classify, and alert on airborne threats across its supported domain interactions. Each Meercat platform carries a number of interchangeable radar-based sensor modules determined by its slot capacity: the higher the slot count, the broader the detection envelope. Modules are independently swappable and scalable as mission requirements evolve.
                </p>
              </div>
            </div>

            {/* Full-bleed image */}
            <div style={{ position: 'relative', aspectRatio: '21/9', background: 'var(--bg-1)', overflow: 'hidden', width: '100%' }}>
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h]) => (
                <div key={v+h} style={{ position: 'absolute', [v]: 14, [h]: 14, width: 20, height: 20, [`border${v.charAt(0).toUpperCase()+v.slice(1)}`]: '2px solid var(--accent)', [`border${h.charAt(0).toUpperCase()+h.slice(1)}`]: '2px solid var(--accent)' }} />
              ))}
              <img src="" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0 }} onLoad={e => { e.target.style.opacity = 1; }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, pointerEvents: 'none' }}>
                <div style={{ width: 48, height: 48, border: '1px solid var(--line-2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                </div>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase' }}>System image</span>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(20,24,21,0.82)', padding: '10px 24px', borderTop: '1px solid var(--line)' }}>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--accent)', textTransform: 'uppercase' }}>Meercat A2A-1 · V2026-1 · Sensor Platform</div>
              </div>
            </div>

          </section>
        )}

        {/* REQUEST A DEMO */}
        {/* NEWS + MANIFESTO */}
        {route === '/' && (
          <section className="dual-panel" style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: '#000', border: '1px solid rgba(255,255,255,0.12)', padding: '14px 40px' }}>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 13, letterSpacing: '0.32em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Coming Soon</span>
              </div>
            </div>

            {/* ── LEFT: NEWS — Land theme ── */}
            <div className="dual-panel-item" style={{ background: '#2e2e1c' }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: '#a8bc74', textTransform: 'uppercase', marginBottom: 14, opacity: 0.8 }}>// NEWS</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <h3 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(20px, 2.2vw, 30px)', fontWeight: 700, color: '#f0ede8', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>Latest Dispatch</h3>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: '#a8bc74', textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, opacity: 0.8 }}>Read More ↗</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(168,188,116,0.2)', margin: '18px 0 28px' }} />
              <div className="dual-panel-img" style={{ background: '#232319' }}>
                <img src="" alt="" onLoad={e => e.target.classList.add('loaded')} />
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(240,237,232,0.14)', textTransform: 'uppercase' }}>// imagen</span>
                <div style={{ position: 'absolute', bottom: '1rem', right: '1.5rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(1.4rem, 2.5vw, 2.5rem)', fontWeight: 700, color: '#f0ede8', opacity: 0.85, lineHeight: 1, letterSpacing: '0.02em', pointerEvents: 'none' }}>PT — 01/02</div>
              </div>
            </div>

            {/* ── RIGHT: MANIFESTO — Air gray theme ── */}
            <div className="dual-panel-item" style={{ background: '#2e2e2e' }}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: '#a0a0a0', textTransform: 'uppercase', marginBottom: 14, opacity: 0.8 }}>// MANIFESTO</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
                <h3 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(20px, 2.2vw, 30px)', fontWeight: 700, color: '#f0ede8', textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>Manifesto</h3>
                <a
                  href="#/company/mission"
                  onClick={e => { e.preventDefault(); window.location.hash = '/company/mission'; setTimeout(() => document.getElementById('manifesto')?.scrollIntoView({ behavior: 'smooth' }), 80); }}
                  style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: '#a0a0a0', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none', opacity: 0.8 }}
                >Read More ↗</a>
              </div>
              <div style={{ borderTop: '1px solid rgba(160,160,160,0.2)', margin: '18px 0 28px' }} />
              <div className="dual-panel-img" style={{ background: '#242424' }}>
                <img src="" alt="" onLoad={e => e.target.classList.add('loaded')} />
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(240,237,232,0.14)', textTransform: 'uppercase' }}>// imagen</span>
                <div style={{ position: 'absolute', bottom: '1rem', right: '1.5rem', fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(1.4rem, 2.5vw, 2.5rem)', fontWeight: 700, color: '#f0ede8', opacity: 0.85, lineHeight: 1, letterSpacing: '0.02em', pointerEvents: 'none' }}>PT — 02/02</div>
              </div>
            </div>

          </section>
        )}

        {route === '/' && (
          <section className="demo" id="demo" data-screen-label="Contact">
            <div className="container">
              <h2>Contact Us</h2>
              <div style={{ marginTop: 28, marginBottom: 44, borderTop: '2px solid var(--fg)' }} />
              <div style={{ maxWidth: 560, margin: '0 auto' }}>
                {submitted ? (
                  <div className="form-success">
                    <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ok)', marginBottom: 8 }}>// MESSAGE RECEIVED</div>
                    Thank you{data.name ? `, ${data.name}` : ''}. Our team will be in touch within 48 hours.
                  </div>
                ) : (
                  <form className="form" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
                    <div className="row2">
                      <div className="field">
                        <label>Name</label>
                        <input required value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} />
                      </div>
                      <div className="field">
                        <label>Organization</label>
                        <input required value={data.org} onChange={(e) => setData({ ...data, org: e.target.value })} />
                      </div>
                    </div>
                    <div className="row2">
                      <div className="field">
                        <label>Email</label>
                        <input type="email" required value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} />
                      </div>
                      <div className="field">
                        <label>Role</label>
                        <select required value={data.role} onChange={(e) => setData({ ...data, role: e.target.value, otherRole: '' })}>
                          <option value="">Select —</option>
                          <option>DoD program office</option>
                          <option>SOF / end user</option>
                          <option>Strategic investor</option>
                          <option>Other</option>
                        </select>
                      </div>
                    </div>
                    {data.role === 'Other' && (
                      <div className="field">
                        <label>Please specify your role</label>
                        <input required value={data.otherRole} onChange={(e) => setData({ ...data, otherRole: e.target.value })} placeholder="Your role or organization type" />
                      </div>
                    )}
                    <div className="field">
                      <label>Purpose or interest</label>
                      <textarea rows={4} value={data.message} onChange={(e) => setData({ ...data, message: e.target.value })} placeholder="Briefly describe your interest or reason for contact..." style={{ resize: 'none', width: '100%' }} />
                    </div>
                    <button type="submit">Send message →</button>
                  </form>
                )}
              </div>
            </div>
          </section>
        )}

        {/* MISSION */}
        {route === '/company/mission' && (
          <section className="section" data-screen-label="Mission" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            <div className="container">
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.18em', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: 24 }}>01 / Company · About Us</div>
              <p style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(24px, 3.5vw, 44px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', color: 'var(--fg)', marginBottom: 24 }}>
                Expanding Defense capabilities against Asymmetric threat that challenge freedom and social mechanisms.
              </p>
              <p style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 'clamp(16px, 2vw, 22px)', lineHeight: 1.8, color: 'var(--muted-2)', letterSpacing: '0.04em', maxWidth: 680, marginBottom: 40 }}>
                Actors that threaten the social, political and economic stability of our region.{' '}
                <span style={{ color: 'var(--fg)', fontWeight: 600 }}>Narco-terrorist groups, terrorists, cartels and guerrillas.</span>
              </p>
            </div>

            <div style={{ width: '100%', aspectRatio: '21/9', background: '#111', overflow: 'hidden', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', margin: '0 0 56px' }}>
              <img
                src="narco_terrorist_picture.jpg"
                alt="Mission"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', filter: 'brightness(0.75) contrast(1.1)' }}
              />
            </div>

            <div id="tl-outer" style={{ height: '400vh', position: 'relative' }}>
              <div id="tl-pin" style={{ position: 'sticky', top: 0, height: '100vh', background: 'linear-gradient(135deg, #0b0c10 0%, #10111a 60%, #0d0a0c 100%)', overflow: 'hidden' }}>
                {['tl','tr','bl','br'].map(c => (
                  <div key={c} style={{
                    position: 'absolute', width: 20, height: 20,
                    borderColor: 'rgba(180,190,220,0.2)', borderStyle: 'solid', borderWidth: 0,
                    ...(c === 'tl' ? { top: 20, left: 20, borderTopWidth: 1, borderLeftWidth: 1 }
                      : c === 'tr' ? { top: 20, right: 20, borderTopWidth: 1, borderRightWidth: 1 }
                      : c === 'bl' ? { bottom: 20, left: 20, borderBottomWidth: 1, borderLeftWidth: 1 }
                      :              { bottom: 20, right: 20, borderBottomWidth: 1, borderRightWidth: 1 })
                  }} />
                ))}
                <div style={{ position: 'absolute', top: 28, left: 48, fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(180,190,220,0.3)', textTransform: 'uppercase' }}>// COMPANY MILESTONE</div>
                <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'default' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Scroll to discover</div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.4))', animation: 'tlPulse 1.8s ease-in-out infinite' }} />
                    <div style={{ width: 5, height: 5, borderRight: '1px solid rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.5)', transform: 'rotate(45deg)', marginTop: -4 }} />
                  </div>
                </div>
                <svg id="tl-svg" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                  <path id="tl-path" stroke="rgba(180,190,210,0.35)" strokeWidth="1" fill="none" />
                </svg>
                <div id="tl-r1a" style={{ position: 'absolute', left: '25%', top: '25%', width: 110, height: 110, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.25)', opacity: 0, pointerEvents: 'none' }} />
                <div id="tl-r1b" style={{ position: 'absolute', left: '25%', top: '25%', width: 10, height: 10, transform: 'translate(-50%, -50%)', opacity: 0 }}>
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'white' }} />
                  <div style={{ position: 'absolute', top: '50%', left: -18, width: 46, height: 1, background: 'rgba(255,255,255,0.35)', transform: 'translateY(-50%)' }} />
                  <div style={{ position: 'absolute', left: '50%', top: -18, width: 1, height: 46, background: 'rgba(255,255,255,0.35)', transform: 'translateX(-50%)' }} />
                </div>
                <div id="tl-m1" style={{ position: 'absolute', left: 'calc(25% + 22px)', top: '28%', opacity: 0, color: 'white' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' }}>2026</div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 13, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase', marginTop: 10, fontWeight: 600 }}>Early Stage</div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 8, lineHeight: 1.8, maxWidth: 220 }}>Founded. Vision defined.<br/>Type solutions needed for asymmetric warfare.</div>
                </div>
                <div id="tl-r2a" style={{ position: 'absolute', left: '52%', top: '52%', width: 90, height: 90, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1.5px dashed rgba(255,220,100,0.55)', boxShadow: '0 0 18px rgba(255,200,60,0.12)', opacity: 0, pointerEvents: 'none' }} />
                <div id="tl-m2" style={{ position: 'absolute', left: 'calc(52% + 16px)', top: '55%', opacity: 0, color: 'white' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 'clamp(28px, 4vw, 52px)', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em', color: 'rgba(255,220,100,0.6)' }}>——</div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 13, letterSpacing: '0.2em', color: 'rgba(255,220,100,0.75)', textTransform: 'uppercase', marginTop: 8, fontWeight: 600 }}>Future Milestone</div>
                  <div style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(14px, 1.8vw, 20px)', fontWeight: 700, color: 'rgba(255,255,255,0.95)', marginTop: 10, lineHeight: 1.35, maxWidth: 280 }}>This is your call. Build what the world fears to build.</div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 8, lineHeight: 1.7, maxWidth: 260 }}>The next milestone doesn't wait.<br/>Neither should you.</div>
                </div>
                <div id="tl-r3a" style={{ position: 'absolute', left: '78%', top: '78%', width: 48, height: 48, transform: 'translate(-50%, -50%)', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.07)', opacity: 0, pointerEvents: 'none' }} />
                <div id="tl-m3" style={{ position: 'absolute', left: 'calc(78% + 12px)', top: '80%', opacity: 0, color: 'white' }}>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 'clamp(14px, 2vw, 26px)', fontWeight: 700, lineHeight: 1, color: 'rgba(255,255,255,0.12)' }}>——</div>
                  <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.08)', textTransform: 'uppercase', marginTop: 6 }}>Milestone 03</div>
                </div>
              </div>
            </div>

            <div className="container">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {[
                  { num: '01', title: 'Our Technology', desc: '', content: 'Designed and based on 3 principles: Modular, Scalable and Customizable.' },
                  { num: '02', title: 'Our Business',   desc: '', content: 'Focused efforts to strengthen the kill chain across the western hemisphere.' },
                  { num: '03', title: 'Our Team',       desc: '', content: 'Highly skilled individuals who build and shape the future with strong convictions — people who choose work that truly matters.' },
                ].map(({ num, title, desc, content }) => {
                  const isOpen = openPanel === num;
                  return (
                    <div key={num}>
                      <div
                        onClick={() => setOpenPanel(isOpen ? null : num)}
                        style={{ display: 'flex', alignItems: 'center', gap: 28, padding: '28px 0', borderTop: '1px solid var(--line)', cursor: 'pointer', transition: 'padding-left 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.paddingLeft = '10px'}
                        onMouseLeave={e => e.currentTarget.style.paddingLeft = '0px'}
                      >
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.14em', minWidth: 32 }}>{num}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 'clamp(22px, 3vw, 36px)', fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.01em', lineHeight: 1 }}>{title}</div>
                          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase', marginTop: 8 }}>{desc}</div>
                        </div>
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 18, color: 'var(--muted)', paddingRight: 8, transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>→</span>
                      </div>
                      {isOpen && (
                        <div style={{ margin: '0 0 24px 60px', padding: '24px', border: '1px solid var(--line)', background: 'var(--bg-1)' }}>
                          <p style={{ fontSize: 14, color: 'var(--muted-2)', lineHeight: 1.8 }}>{content || `Coming soon — content for ${title} will appear here.`}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ borderTop: '1px solid var(--line)' }} />
              </div>
            </div>

            {/* ── MANIFESTO ── */}
            <div id="manifesto" style={{ borderTop: '2px solid var(--fg)', marginTop: 80 }}>
              <div className="container" style={{ paddingTop: 80, paddingBottom: 100 }}>

                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
                  <h2 style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(48px, 7vw, 88px)', fontWeight: 700, lineHeight: 0.95, letterSpacing: '0.01em', textTransform: 'uppercase', color: 'var(--fg)' }}>
                    Manifesto
                  </h2>
                  <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.22em', color: 'var(--muted)', textTransform: 'uppercase' }}>// THANATHON · 2026</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--hot)', padding: '6px 14px', marginBottom: 40 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--hot)', display: 'inline-block' }}></span>
                  <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: 'var(--hot)', textTransform: 'uppercase' }}>Coming Soon</span>
                </div>


              </div>
            </div>

          </section>
        )}

        {/* WORK WITH US */}
        {route === '/company/work-with-us' && (
          <section data-screen-label="Work with us" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            <div style={{ background: 'linear-gradient(160deg, #EAE4D9, #D5CCBC, #BEB5A6, #9E9488)', padding: '80px 0 56px', borderBottom: '1px solid rgba(26,24,21,0.14)' }}>
              <div className="container">
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.18em', color: 'rgba(26, 24, 21, 0.38)', textTransform: 'uppercase', marginBottom: 24 }}>02 / Company · Work with us</div>
                <h2 style={{ fontSize: 'clamp(36px, 6vw, 72px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.02em', color: '#1A1815' }}>
                  Build what<br/>the world needs<br/>in a modular way.
                </h2>
                <p style={{ fontFamily: "'Chakra Petch', sans-serif", fontSize: 'clamp(16px, 2vw, 22px)', color: 'rgba(26, 24, 21, 0.75)', marginTop: 28, maxWidth: 560, lineHeight: 1.7 }}>
                  From early careers to strategic partnerships — every role here carries weight. We operate across every contested theater. Pick yours.
                </p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[
                { domain: 'Air',   num: '01', bg: '#2e2e2e', accent: '#a0a0a0', tags: 'Counter-UAS · Unmanned Systems · Airspace Awareness', line: 'Eyes above every conflict zone.', list: ['Restricted zones', 'Asymmetric non-stated actors'] },
                { domain: 'Land',  num: '02', bg: '#2e2e1c', accent: '#a8bc74', tags: 'Dismounted Ops · Wearable Tech · Ground Force', line: 'Alongside every operator on foot.', list: ['Modular for jungle operations'] },
                { domain: 'Waterborne', num: '03', bg: '#1a2c36', accent: '#5a9eae', tags: 'Maritime ISR · Littoral Ops · Blue-Water', line: 'From shoreline to complex geography.', list: ['Coastlines', 'Rivers', 'Whitewater'] },
                { domain: 'Space', num: '04', bg: '#0d0d18', accent: '#f0f0f0', tags: 'Satellite ISR · Orbital Systems · Space Domain Awareness', line: 'From orbit to every theater below.' },
              ].map(({ domain, bg, accent, line, list }, i) => (
                <div key={i} style={{ background: bg, padding: '52px 36px', minHeight: 300, borderRight: i < 3 ? '1px solid rgba(196,180,154,0.08)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 20 }}>
                  <div style={{ fontSize: 'clamp(36px, 4vw, 52px)', fontWeight: 800, color: '#f0ede8', lineHeight: 1, letterSpacing: '-0.01em' }}>{domain.toUpperCase()}</div>
                  <div style={{ fontSize: 13, color: accent, fontStyle: 'italic', opacity: 0.9 }}>{line}</div>
                  {list && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {list.map((item, j) => (
                        <li key={j} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, letterSpacing: '0.14em', color: 'rgba(240,237,232,0.55)', textTransform: 'uppercase' }}>— {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
            <div style={{ background: 'linear-gradient(145deg, #131410, #0E0F0B, #0B0C09)', padding: '64px 0 80px', borderTop: '1px solid rgba(242, 239, 233, 0.08)' }}>
              <div className="container">
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 14, letterSpacing: '0.22em', color: 'rgba(242, 239, 233, 0.62)', textTransform: 'uppercase', marginBottom: 40, textAlign: 'center' }}>How to join</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, maxWidth: 860, margin: '0 auto' }}>
                  {[
                    { num: '01', label: 'Partnerships', accent: '#7aabca', desc: "Strategic alliances, government or civilian contracts, supporting brands. If you want to partner something at scale — let's talk.", cta: 'Reach out →' },
                    { num: '02', label: 'Careers',      accent: '#a8bc74', desc: 'High-performance Engineers, Scientists, Operators, Analysts and High-skilled Technicians. People who build for real-world consequence.', cta: 'See openings →' },
                    { num: '03', label: 'Early Careers',accent: '#5a9eae', desc: 'Students and new grads who want a project to actually matter. Internships or volunteers who believe in shaping the future against threats.', cta: 'Apply →' },
                  ].map(({ num, label, accent, desc, cta }) => {
                    const hov = wwuHovered === num;
                    return (
                      <div key={num} onMouseEnter={() => setWwuHovered(num)} onMouseLeave={() => setWwuHovered(null)}
                        style={{ border: `1px solid ${hov ? '#f0f0f0' : '#1e1e1e'}`, background: hov ? '#f5f5f5' : 'transparent', padding: '36px 28px', display: 'flex', flexDirection: 'column', gap: 16, cursor: 'default', transition: 'background 0.18s, border-color 0.18s' }}>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, letterSpacing: '0.18em', color: hov ? '#888' : '#2e2e2e', textTransform: 'uppercase' }}>{num}</div>
                        <div style={{ fontSize: 'clamp(18px, 2vw, 24px)', fontWeight: 700, color: hov ? '#0a0a0a' : '#e8e8e8', letterSpacing: '-0.01em', lineHeight: 1.1 }}>{label}</div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 12, color: hov ? '#444' : '#565656', lineHeight: 1.9, flex: 1 }}>{desc}</div>
                        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: hov ? '#1a1a1a' : accent, letterSpacing: '0.1em', marginTop: 4, fontWeight: hov ? 700 : 400 }}>{cta}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── FOOTER ── */}
      <footer className="footer">
        <div className="container footer-row">
          <span>© 2026 THANATHON INDUSTRIES</span>
        </div>
      </footer>

      {TweaksPanel && (
        <TweaksPanel title="Tweaks">
          <TweakSection title="Theme">
            <TweakRadio
              label="Color mode"
              value={tweaks.colorMode}
              onChange={(v) => setTweak('colorMode', v)}
              options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Paper' }]}
            />
          </TweakSection>
          <TweakSection title="Headline">
            <TweakSelect
              label="Variant"
              value={tweaks.headlineVariant}
              onChange={(v) => setTweak('headlineVariant', v)}
              options={[
                { value: 'A', label: 'A — already overhead' },
                { value: 'B', label: 'B — worn on the body' },
                { value: 'C', label: 'C — eyes on target' },
              ]}
            />
          </TweakSection>
        </TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
