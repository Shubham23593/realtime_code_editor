import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FaLaptopCode, FaUsers, FaChalkboardTeacher, FaArrowRight, FaDesktop, FaCodeBranch, FaCogs } from 'react-icons/fa';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const storyRef = useRef(null);
  const featureRefs = useRef([]);

  useEffect(() => {
    // Hero Animation
    gsap.fromTo(
      heroRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: "power3.out" }
    );

    // Story Section Fade-in
    gsap.fromTo(
      storyRef.current,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: storyRef.current,
          start: "top 80%",
        }
      }
    );

    // Feature Cards Staggered Animation
    featureRefs.current.forEach((card, index) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: index * 0.1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          }
        }
      );
    });

  }, []);

  return (
    <div className="bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold tracking-tight">
            <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
              <FaDesktop className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-slate-900 dark:text-white">CodeVerse</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-medium hidden sm:inline">Classroom</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button 
              onClick={() => navigate('/login')} 
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate('/signup')} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-semibold transition shadow-sm flex items-center gap-2"
            >
              Get Started <FaArrowRight className="hidden sm:inline text-xs" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 px-4 sm:px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 blur-3xl"></div>
          <div className="absolute top-1/2 -left-40 w-96 h-96 rounded-full bg-blue-500/10 dark:bg-blue-500/20 blur-3xl"></div>
        </div>
        
        <div ref={heroRef} className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs sm:text-sm font-semibold uppercase tracking-wider mb-8">
            <FaCodeBranch /> Welcome to the Future of Learning
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-6">
            Empower Your Code, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500 dark:from-indigo-400 dark:to-blue-400">
              Together in Real-Time.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The professional collaborative environment for educators and teams. 
            Streamlined live editing, instant code execution, and enterprise-grade role management.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <button 
              onClick={() => navigate('/signup')} 
              className="w-full sm:w-auto group flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-xl font-bold text-base transition duration-200 shadow-md hover:shadow-lg"
            >
              Start Free Trial <FaArrowRight className="group-hover:translate-x-1 duration-200" />
            </button>
            <button 
              onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} 
              className="w-full sm:w-auto flex justify-center items-center gap-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-8 py-3.5 rounded-xl font-bold text-base transition shadow-sm"
            >
              Explore Features
            </button>
          </div>
        </div>
      </section>

      {/* Story / Context Section */}
      <section ref={storyRef} className="py-24 px-4 sm:px-6 bg-white dark:bg-slate-900 border-t border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Our Philosophy</h2>
          <div className="w-20 h-1 bg-indigo-500 mx-auto rounded-full"></div>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed pt-6">
            We believe that technical education thrives on interaction. 
            CodeVerse was built to eliminate the barriers between instruction and execution. 
            By combining a high-performance code editor with granular role permissions and direct problem mapping, 
            we maintain order while fostering an environment where students can actively learn by doing.
          </p>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">Enterprise-grade Features</h2>
          <p className="text-slate-600 dark:text-slate-400">Everything you need to orchestrate a perfect coding session.</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Feature 1 */}
          <div 
            ref={el => featureRefs.current[0] = el}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="bg-amber-100 dark:bg-amber-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <FaChalkboardTeacher className="text-2xl text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Instructor Controls</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Maintain absolute authority over the session. Organize rooms, monitor live student progress, and seamlessly control editor permissions at the click of a button.
            </p>
          </div>

          {/* Feature 2 */}
          <div 
            ref={el => featureRefs.current[1] = el}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <FaCogs className="text-2xl text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Native Execution</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Forget setting up environments. CodeVerse compiles and executes C, C++, Python, Java, and JavaScript completely within the browser in milliseconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div 
            ref={el => featureRefs.current[2] = el}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="bg-green-100 dark:bg-green-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <FaUsers className="text-2xl text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Structured Collaboration</h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Utilize specific operation formats like "Raise Hand" mode for 1-on-1 focus, "Group Mode" for limited pairing, or "Free Mode" for open hackathons.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 bg-indigo-600 dark:bg-indigo-900 text-white text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to transform your classroom?</h2>
        <p className="text-indigo-100 max-w-2xl mx-auto mb-8 text-lg">
          Join thousands of tech educators and organizations streamlining their coding education process today.
        </p>
        <button 
          onClick={() => navigate('/signup')} 
          className="bg-white text-indigo-600 hover:bg-slate-50 px-8 py-3.5 rounded-xl font-bold text-base transition shadow-md hover:shadow-lg"
        >
          Create Free Account
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
            <FaDesktop className="text-indigo-600 dark:text-indigo-400" /> CodeVerse
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} CodeVerse Classroom Edition. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
