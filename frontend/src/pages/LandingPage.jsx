import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { FaLaptopCode, FaUsers, FaChalkboardTeacher, FaArrowRight, FaDesktop, FaCodeBranch, FaCogs, FaTerminal, FaPlay, FaLock } from 'react-icons/fa';
import AnimatedBackground from '../components/AnimatedBackground';

gsap.registerPlugin(ScrollTrigger, TextPlugin);

/* ─────────────────────────────────────────────
   Floating particle component
───────────────────────────────────────────── */
const Particle = ({ style }) => (
  <div
    className="absolute rounded-full pointer-events-none"
    style={style}
  />
);



/* ─────────────────────────────────────────────
   Code snippet that types itself
───────────────────────────────────────────── */
const LiveCodeBlock = () => {
  const codeRef = useRef(null);
  const lines = [
    { indent: 0, token: 'keyword', text: 'class ', rest: [{ token: 'class', text: 'CodeSession' }, { token: 'punct', text: ':' }] },
    { indent: 1, token: 'keyword', text: 'def ', rest: [{ token: 'fn', text: 'start' }, { token: 'punct', text: '(self, students):' }] },
    { indent: 2, token: 'keyword', text: 'for ', rest: [{ token: 'var', text: 's' }, { token: 'keyword', text: ' in ' }, { token: 'var', text: 'students' }, { token: 'punct', text: ':' }] },
    { indent: 3, token: 'fn', text: 's.unlock_editor', rest: [{ token: 'punct', text: '()' }] },
    { indent: 3, token: 'fn', text: 's.run_code', rest: [{ token: 'punct', text: '()' }] },
    { indent: 2, token: 'keyword', text: 'return ', rest: [{ token: 'string', text: '"Session live 🚀"' }] },
  ];
  return (
    <div ref={codeRef} className="relative font-mono text-xs sm:text-sm rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl bg-[#0d1117]">
      {/* Window bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#161b22] border-b border-slate-700/60">
        <span className="w-3 h-3 rounded-full bg-red-500/80" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
        <span className="w-3 h-3 rounded-full bg-green-500/80" />
        <span className="ml-3 text-slate-500 text-xs">session.py</span>
      </div>
      <div className="p-5 space-y-1">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3 opacity-0 code-line">
            <span className="text-slate-600 select-none w-4 text-right shrink-0">{i + 1}</span>
            <span style={{ paddingLeft: line.indent * 16 }}>
              <span className={
                line.token === 'keyword' ? 'text-pink-400' :
                line.token === 'fn' ? 'text-blue-400' :
                line.token === 'class' ? 'text-yellow-300' : 'text-slate-300'
              }>{line.text}</span>
              {line.rest.map((r, j) => (
                <span key={j} className={
                  r.token === 'keyword' ? 'text-pink-400' :
                  r.token === 'fn' ? 'text-blue-400' :
                  r.token === 'class' ? 'text-yellow-300' :
                  r.token === 'string' ? 'text-green-400' :
                  r.token === 'var' ? 'text-orange-300' :
                  'text-slate-400'
                }>{r.text}</span>
              ))}
            </span>
          </div>
        ))}
        {/* Blinking cursor */}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-slate-600 select-none w-4 text-right">›</span>
          <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse rounded-sm" />
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Main Landing Page
───────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const featureRefs = useRef([]);

  // Extra refs for new sections
  const canvasRef = useRef(null);
  const heroTitleRef = useRef(null);
  const heroBadgeRef = useRef(null);
  const heroSubRef = useRef(null);
  const heroCTARef = useRef(null);
  const heroVisualRef = useRef(null);
  const storyChaptersRef = useRef([]);
  const orbRef = useRef(null);
  const [activeChapter, setActiveChapter] = useState(0);

  /* ── Particles and Canvas logic moved to AnimatedBackground Component ── */

  /* ── GSAP master timeline ── */
  useEffect(() => {
    const ctx = gsap.context(() => {

      /* — Hero entrance — */
      const heroTl = gsap.timeline({ delay: 0.2 });
      heroTl
        .fromTo(heroBadgeRef.current,
          { y: 20, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)' }
        )
        .fromTo('.hero-word',
          { y: 80, opacity: 0, rotateX: -40 },
          { y: 0, opacity: 1, rotateX: 0, duration: 0.8, stagger: 0.06, ease: 'power4.out' },
          '-=0.3'
        )
        .fromTo(heroSubRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
          '-=0.3'
        )
        .fromTo(heroCTARef.current.children,
          { y: 20, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.7)' },
          '-=0.2'
        )
        .fromTo(heroVisualRef.current,
          { x: 60, opacity: 0, rotateY: 10 },
          { x: 0, opacity: 1, rotateY: 0, duration: 1, ease: 'power3.out' },
          '-=0.8'
        );

      /* — Code lines staggered reveal — */
      gsap.fromTo('.code-line',
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, stagger: 0.12, ease: 'power2.out', delay: 1.2 }
      );

      /* — Floating orb parallax — (Orb logic is now handled internally or natively animate based in AnimatedBackground) */


      /* — Story section: chapter-by-chapter reveal — */
      storyChaptersRef.current.forEach((el, i) => {
        if (!el) return;
        gsap.fromTo(el,
          { opacity: 0, x: i % 2 === 0 ? -60 : 60, scale: 0.95 },
          {
            opacity: 1, x: 0, scale: 1, duration: 0.9, ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 75%',
              onEnter: () => setActiveChapter(i),
            }
          }
        );
      });

      /* — Feature cards: cinematic stagger — */
      featureRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(card,
          { opacity: 0, y: 60, rotateX: -15, scale: 0.95 },
          {
            opacity: 1, y: 0, rotateX: 0, scale: 1,
            duration: 0.7, delay: i * 0.08, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 85%' }
          }
        );
      });

      /* — CTA section parallax text — */
      gsap.fromTo('.cta-headline',
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: '.cta-section', start: 'top 80%' }
        }
      );

      /* — Scroll progress bar — */
      gsap.to('.scroll-bar', {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: document.body,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        }
      });

    });
    return () => ctx.revert();
  }, []);

  /* ── Magnetic button effect ── */
  const handleMagnet = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    gsap.to(btn, { x: dx * 0.25, y: dy * 0.25, duration: 0.3, ease: 'power2.out' });
  };
  const handleMagnetLeave = (e) => {
    gsap.to(e.currentTarget, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' });
  };

  const chapters = [
    {
      icon: '📖',
      tag: 'Chapter 01',
      title: 'The Problem',
      text: 'Every coding class ends the same way — confusion, broken environments, and half the students lost. The barrier between "teaching" and "doing" has never been wider.',
      accent: 'from-red-500/20 to-orange-500/10',
      border: 'border-red-500/20',
    },
    {
      icon: '💡',
      tag: 'Chapter 02',
      title: 'The Spark',
      text: 'What if execution lived beside explanation? What if a student could write, run, and share code in the same breath — without ever leaving the lesson?',
      accent: 'from-yellow-500/20 to-amber-500/10',
      border: 'border-yellow-500/20',
    },
    {
      icon: '🚀',
      tag: 'Chapter 03',
      title: 'The Solution',
      text: 'CodeVerse was born — a unified space where instructors orchestrate, students collaborate, and code runs live. No setup, no friction, no limits.',
      accent: 'from-indigo-500/20 to-blue-500/10',
      border: 'border-indigo-500/20',
    },
  ];

  return (
    <div className="bg-[#060912] min-h-screen text-slate-100 overflow-x-hidden relative"
      style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Google Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,700;0,9..40,900;1,9..40,300&family=Space+Grotesk:wght@700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        .hero-display { font-family: 'Space Grotesk', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        .perspective { perspective: 800px; }
        .scroll-bar { transform-origin: left; }
      `}</style>

      {/* ── Scroll progress bar ── */}
      <div className="fixed top-0 left-0 w-full h-[2px] z-[100] bg-slate-800">
        <div className="scroll-bar h-full bg-gradient-to-r from-indigo-500 to-blue-400 scale-x-0 origin-left" />
      </div>

      <AnimatedBackground />

      {/* ═══════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════ */}
      <nav className="fixed w-full top-2 z-50 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl px-5 py-3.5 flex justify-between items-center shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2.5 font-bold tracking-tight">
            <div className="bg-indigo-500/20 border border-indigo-500/30 p-2 rounded-lg">
              <FaDesktop className="text-indigo-400 text-sm" />
            </div>
            <span className="hero-display text-white text-lg">CodeVerse</span>
            <span className="text-indigo-400 font-normal text-sm hidden sm:inline mono">/ classroom</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/signup')}
              onMouseMove={handleMagnet}
              onMouseLeave={handleMagnetLeave}
              className="relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-5 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/20 flex items-center gap-2 group"
            >
              <span>Get Started</span>
              <FaArrowRight className="text-xs group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-28 pb-16 px-4 sm:px-6 z-10">
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text */}
          <div className="space-y-8">
            <div ref={heroBadgeRef} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 text-xs mono font-medium tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
              Live Sessions · Real-Time Execution
            </div>

            <div ref={heroTitleRef} className="perspective">
              <h1 className="hero-display text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight overflow-hidden">
                {['Empower', 'Your Code,'].map((line, li) => (
                  <div key={li} className="overflow-hidden">
                    {line.split('').map((ch, ci) => (
                      <span key={ci} className={`hero-word inline-block ${ch === ' ' ? 'w-4' : ''} ${li === 1 ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400' : 'text-white'}`}>
                        {ch === ' ' ? '\u00A0' : ch}
                      </span>
                    ))}
                  </div>
                ))}
                <div className="overflow-hidden">
                  {'Together.'.split('').map((ch, ci) => (
                    <span key={ci} className="hero-word inline-block text-slate-500">
                      {ch}
                    </span>
                  ))}
                </div>
              </h1>
            </div>

            <p ref={heroSubRef} className="text-base sm:text-lg text-slate-400 max-w-lg leading-relaxed">
              The professional collaborative environment for educators and teams. Live editing,
              instant multi-language execution, and enterprise-grade role management — in one place.
            </p>

            <div ref={heroCTARef} className="flex flex-col sm:flex-row gap-3">
              {/* <button
                onClick={() => navigate('/signup')}
                onMouseMove={handleMagnet}
                onMouseLeave={handleMagnetLeave}
                className="group flex items-center justify-center gap-2.5 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-bold text-base transition-all duration-200 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                Start Free Trial
                <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
              </button> */}
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 hover:border-slate-600 text-slate-200 px-8 py-4 rounded-2xl font-semibold text-base transition-all duration-200"
              >
                <FaPlay className="text-indigo-400 text-xs" /> Explore Features
              </button>
            </div>

            {/* Trust badges */}  
            {/* <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['#6366f1','#22d3ee','#f59e0b','#10b981'].map((c, i) => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-[#060912]" style={{ background: c }} />
                ))}
              </div>
              <span className="text-slate-400 text-sm">
                Trusted by <span className="text-white font-semibold">12,000+</span> developers &amp; educators
              </span>
            </div> */}
          </div>

          {/* Right: Visual */}
          <div ref={heroVisualRef} className="relative">
            {/* Glow behind code block */}
            <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-3xl scale-90" />
            <div className="relative">
              <LiveCodeBlock />
              {/* Floating badges */}
              <div className="absolute -top-4 -right-4 bg-green-500/20 border border-green-500/30 backdrop-blur-sm text-green-400 text-xs mono px-3 py-1.5 rounded-xl shadow-lg animate-bounce">
                ● Running...
              </div>
              <div className="absolute -bottom-4 -left-4 bg-indigo-500/20 border border-indigo-500/30 backdrop-blur-sm text-indigo-300 text-xs mono px-3 py-1.5 rounded-xl shadow-lg">
                <FaUsers className="inline mr-1.5" />14 students live
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══════════════════════════════════════
          STORY SECTION (Chapters)
      ═══════════════════════════════════════ */}
      <section ref={storyRef} className="relative z-10 py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="mono text-indigo-400 text-sm uppercase tracking-[4px] mb-4">Origin Story</p>
            <h2 className="hero-display text-4xl sm:text-5xl font-black text-white">Why We Built This</h2>
          </div>

          <div className="space-y-6">
            {chapters.map((ch, i) => (
              <div
                key={i}
                ref={el => storyChaptersRef.current[i] = el}
                className={`relative p-8 sm:p-10 rounded-3xl border ${ch.border} bg-gradient-to-br ${ch.accent} backdrop-blur-sm overflow-hidden group hover:scale-[1.01] transition-transform duration-300`}
              >
                {/* Chapter number watermark */}
                <div className="absolute right-6 top-4 hero-display text-[80px] font-black text-white/3 select-none leading-none">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="flex items-start gap-5">
                  <div className="text-3xl shrink-0">{ch.icon}</div>
                  <div>
                    <p className="mono text-xs text-slate-500 uppercase tracking-widest mb-2">{ch.tag}</p>
                    <h3 className="hero-display text-xl sm:text-2xl font-bold text-white mb-3">{ch.title}</h3>
                    <p className="text-slate-400 text-base sm:text-lg leading-relaxed max-w-2xl">{ch.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES
      ═══════════════════════════════════════ */}
      <section id="features" className="relative z-10 py-28 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <p className="mono text-indigo-400 text-sm uppercase tracking-[4px] mb-4">What's Inside</p>
            <h2 className="hero-display text-4xl sm:text-5xl font-black text-white mb-4">
              Enterprise-grade Features
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">Everything you need to orchestrate a perfect coding session.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <FaChalkboardTeacher />,
                color: 'from-amber-500/20 to-orange-500/10',
                border: 'border-amber-500/20',
                iconBg: 'bg-amber-500/15 text-amber-400',
                title: 'Instructor Controls',
                desc: 'Maintain absolute authority over the session. Organize rooms, monitor live student progress, and seamlessly control editor permissions at the click of a button.',
                tag: '01'
              },
              {
                icon: <FaCogs />,
                color: 'from-blue-500/20 to-cyan-500/10',
                border: 'border-blue-500/20',
                iconBg: 'bg-blue-500/15 text-blue-400',
                title: 'Native Execution',
                desc: 'Forget setting up environments. CodeVerse compiles and executes C, C++, Python, Java, and JavaScript completely within the browser in milliseconds.',
                tag: '02'
              },
              {
                icon: <FaUsers />,
                color: 'from-green-500/20 to-emerald-500/10',
                border: 'border-green-500/20',
                iconBg: 'bg-green-500/15 text-green-400',
                title: 'Structured Collaboration',
                desc: 'Utilize specific operation formats like "Raise Hand" mode for 1-on-1 focus, "Group Mode" for limited pairing, or "Free Mode" for open hackathons.',
                tag: '03'
              },
              {
                icon: <FaLock />,
                color: 'from-violet-500/20 to-purple-500/10',
                border: 'border-violet-500/20',
                iconBg: 'bg-violet-500/15 text-violet-400',
                title: 'Role Management',
                desc: 'Granular permission tiers for admins, instructors, TAs, and students. Control who reads, writes, or executes at any time during the session.',
                tag: '04'
              },
              {
                icon: <FaTerminal />,
                color: 'from-rose-500/20 to-pink-500/10',
                border: 'border-rose-500/20',
                iconBg: 'bg-rose-500/15 text-rose-400',
                title: 'Live Terminal',
                desc: 'Each room gets a shared or private terminal. Watch output stream in real-time. Debug collaboratively without screen shares or third-party tools.',
                tag: '05'
              },
              {
                icon: <FaCodeBranch />,
                color: 'from-indigo-500/20 to-blue-500/10',
                border: 'border-indigo-500/20',
                iconBg: 'bg-indigo-500/15 text-indigo-400',
                title: 'Problem Mapping',
                desc: 'Link rooms directly to structured exercises. Students progress through challenges while you track completion, errors, and time-on-task live.',
                tag: '06'
              },
            ].map((f, i) => (
              <div
                key={i}
                ref={el => featureRefs.current[i] = el}
                className={`relative group p-7 rounded-2xl border ${f.border} bg-gradient-to-br ${f.color} hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 cursor-default`}
              >
                <div className="absolute top-5 right-6 hero-display text-5xl font-black text-white/5 select-none">
                  {f.tag}
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg mb-5 ${f.iconBg}`}>
                  {f.icon}
                </div>
                <h3 className="hero-display text-lg font-bold text-white mb-3">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HORIZONTAL MARQUEE
      ═══════════════════════════════════════ */}
      <div className="relative z-10 py-8 border-t border-b border-slate-800/60 overflow-hidden">
        <div className="flex animate-[marquee_25s_linear_infinite] whitespace-nowrap gap-10">
          {Array(3).fill(['Python', 'JavaScript', 'C++', 'Java', 'React', 'TypeScript', 'Go', 'Rust', 'WebAssembly']).flat().map((lang, i) => (
            <span key={i} className="mono text-slate-600 text-sm uppercase tracking-widest shrink-0">
              {lang} <span className="text-indigo-600 mx-3">·</span>
            </span>
          ))}
        </div>
        <style>{`
          @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.333%) } }
        `}</style>
      </div>

      {/* ═══════════════════════════════════════
          CTA SECTION
      ═══════════════════════════════════════ */}
      <section className="cta-section relative z-10 py-32 px-4 sm:px-6 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/15 via-transparent to-blue-600/10 pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

        <div className="max-w-3xl mx-auto text-center space-y-8">
          <p className="cta-headline mono text-indigo-400 text-sm uppercase tracking-[4px]">Join the Movement</p>
          <h2 className="cta-headline hero-display text-5xl sm:text-6xl font-black text-white leading-tight">
            Ready to transform<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">
              your classroom?
            </span>
          </h2>
          <p className="cta-headline text-slate-400 text-lg max-w-xl mx-auto">
            Join thousands of tech educators and organizations streamlining their coding education process today.
          </p>
          <div className="cta-headline flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/signup')}
              onMouseMove={handleMagnet}
              onMouseLeave={handleMagnetLeave}
              className="group flex items-center justify-center gap-2.5 bg-white text-indigo-700 hover:bg-slate-100 px-10 py-4 rounded-2xl font-black text-base transition-all duration-200 shadow-2xl shadow-white/10 hover:shadow-white/20"
            >
              Create Free Account
              <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-200" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center px-10 py-4 rounded-2xl font-semibold text-base border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all duration-200"
            >
              Sign In
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer className="relative z-10 border-t border-slate-800/60 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2.5 font-bold">
            <div className="bg-indigo-500/20 border border-indigo-500/30 p-1.5 rounded-lg">
              <FaDesktop className="text-indigo-400 text-xs" />
            </div>
            <span className="hero-display text-white">CodeVerse</span>
          </div>
          <p className="text-slate-600 text-sm mono">
            © {new Date().getFullYear()} CodeVerse Classroom Edition. All rights reserved.
          </p>
          <div className="flex gap-6 text-slate-500 text-sm">
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <a key={l} href="#" className="hover:text-slate-300 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;