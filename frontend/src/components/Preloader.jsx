import React, { useEffect, useState } from 'react';
import gsap from 'gsap';

const Preloader = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fast loading sequence (approx 1.2 seconds total)
    const tl = gsap.timeline({
      onComplete: () => {
        setIsLoading(false);
      }
    });

    // Animate the line expanding
    tl.to('.preloader-line', {
      scaleX: 1,
      duration: 0.6,
      ease: 'power3.inOut'
    })
    // Animate the text glowing and fading up
    .to('.preloader-text', {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, '-=0.2')
    // Hold for a tiny bit, then blast away
    .to('.preloader-container', {
      opacity: 0,
      scale: 1.05,
      filter: 'blur(10px)',
      duration: 0.4,
      ease: 'power2.inOut',
      delay: 0.2
    });

    return () => tl.kill();
  }, []);

  if (!isLoading) return null;

  return (
    <div className="preloader-container fixed inset-0 z-[9999] bg-[#060912] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Subtle Glow Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.1)_0%,rgba(0,0,0,0)_70%)] opacity-50" />

      <div className="relative flex flex-col items-center z-10 w-full max-w-sm px-6">
        {/* Title */}
        <div className="preloader-text flex items-center justify-center gap-2 mb-6 opacity-0 translate-y-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <span className="text-indigo-400 font-bold font-mono text-xl">{'{'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-widest" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            CodeVerse
          </h1>
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <span className="text-indigo-400 font-bold font-mono text-xl">{'}'}</span>
          </div>
        </div>

        {/* Loading Bar Container */}
        <div className="w-full h-[2px] bg-slate-800/80 rounded-full overflow-hidden relative shadow-[0_0_10px_rgba(0,0,0,0.5)]">
          {/* Expanding Line */}
          <div 
            className="preloader-line absolute left-0 top-0 bottom-0 w-full bg-gradient-to-r from-indigo-600 via-blue-400 to-emerald-400 origin-left"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>

        {/* Status Text */}
        <div className="mt-4 text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] animate-pulse">
          Initializing Environment...
        </div>
      </div>
    </div>
  );
};

export default Preloader;
