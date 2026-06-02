import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight, Cpu, BrainCircuit, Server,
  BarChart2, GraduationCap, Code, Database, Terminal, CircuitBoard, Gamepad2
} from 'lucide-react';

export default function HeroSection() {
  const heroRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      const heroHeight = rect.height;
      const progress = Math.min(Math.max(-rect.top / (heroHeight * 0.6), 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const floatingElements = [
    { icon: Cpu, color: "text-blue-500", pos: "top-[10%] left-[2%] md:left-[6%]", size: "w-16 h-16 md:w-20 md:h-20", delay: 0, animation: "animate-float-3d", depth: "opacity-100 z-10 blur-0", scatterX: -40, scatterY: -30 },
    { icon: BrainCircuit, color: "text-purple-500", pos: "top-[10%] right-[2%] md:right-[6%]", size: "w-20 h-20 md:w-24 md:h-24", delay: 0.2, animation: "animate-float-3d-reverse", depth: "opacity-100 z-10 blur-0", scatterX: 40, scatterY: -35 },
    { icon: Server, color: "text-indigo-500", pos: "top-[31%] left-[-2%] md:left-[2%]", size: "w-14 h-14 md:w-20 md:h-20", delay: 0.3, animation: "animate-float-3d", depth: "opacity-90 z-10 blur-[0.5px]", scatterX: -50, scatterY: 10 },
    { icon: Code, color: "text-amber-600", pos: "top-[31%] right-[-2%] md:right-[18%]", size: "w-12 h-12 md:w-16 md:h-16", delay: 0.7, animation: "animate-float-3d-reverse", depth: "opacity-90 z-10 blur-[0.5px]", scatterX: 50, scatterY: 15 },
    { icon: Database, color: "text-red-500", pos: "top-[30%] right-[15%] md:right-[2%]", size: "w-10 h-10 md:w-14 md:h-14", delay: 0.8, animation: "animate-float-3d", depth: "opacity-75 z-0 blur-[1px]", scatterX: 35, scatterY: -20 },
    { icon: Terminal, color: "text-emerald-500", pos: "top-[28%] left-[15%] md:left-[18%]", size: "w-10 h-10 md:w-12 md:h-12", delay: 1.0, animation: "animate-float-3d-reverse", depth: "opacity-75 z-0 blur-[1px]", scatterX: -30, scatterY: -15 },
    { icon: GraduationCap, color: "text-indigo-600", pos: "top-[6%] left-[25%] md:left-[28%]", size: "w-10 h-10 md:w-14 md:h-14", delay: 1.2, animation: "animate-float-3d", depth: "opacity-60 z-0 blur-[1.5px]", scatterX: -20, scatterY: -45 },
    { icon: CircuitBoard, color: "text-sky-400", pos: "top-[22%] left-[15%] md:left-[10%]", size: "w-8 h-8 md:w-12 md:h-12", delay: 1.1, animation: "animate-float-3d", depth: "opacity-65 z-0 blur-[1px]", scatterX: -45, scatterY: -10 },
    { icon: BarChart2, color: "text-rose-600", pos: "top-[22%] right-[16%] md:right-[15%]", size: "w-10 h-10 md:w-12 md:h-12", delay: 1.3, animation: "animate-float-3d-reverse", depth: "opacity-65 z-0 blur-[1px]", scatterX: 30, scatterY: 10 },
  ];

  return (
    <section ref={heroRef} className="relative pt-28 pb-20 overflow-hidden min-h-[95vh] flex flex-col items-center justify-center">
      {/* Background Blurs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none -z-20" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-100 rounded-full blur-[100px] pointer-events-none -z-20" />

      {/* Floating 3D IT Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-visible">
        {floatingElements.map((el, idx) => {
          const translateX = scrollProgress * el.scatterX;
          const translateY = scrollProgress * el.scatterY;
          const scale = 1 - scrollProgress * 0.6;
          const opacity = 1 - scrollProgress;

          return (
            <div
              key={idx}
              className={`absolute ${el.pos} hidden sm:flex items-center justify-center ${el.depth} transition-all duration-700 ease-in-out`}
              style={{
                transform: `translate(${translateX}vw, ${translateY}vh) scale(${Math.max(scale, 0)})`,
                opacity: Math.max(opacity, 0),
                willChange: "transform, opacity",
                backfaceVisibility: "hidden",
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: el.delay, type: "spring", bounce: 0.4 }}
                className={`${el.animation} flex items-center justify-center rounded-[2rem] glass-3d ${el.size}`}
                style={{ perspective: "1000px" }}
              >
                <el.icon className={`w-1/2 h-1/2 ${el.color} drop-shadow-xl`} strokeWidth={2} />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Hero Content */}
      <div className="container mx-auto px-6 text-center relative z-20 max-w-5xl mt-8">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white shadow-sm border border-border backdrop-blur-md border border-blue-200 text-primary text-xs md:text-sm font-bold mb-8 shadow-sm">
            <GraduationCap className="w-4 h-4" />
            LIDM 2027 — TENTH GROUP (KELOMPOK 10)
          </span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl md:text-7xl font-black leading-[1.1] mb-6 tracking-tight drop-shadow-sm text-foreground">
          Transforming Abstract Architecture into{' '}<br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-purple-500">
            Interactive Intelligence.
          </span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-lg md:text-xl text-secondary max-w-2xl mx-auto mb-10 font-medium leading-relaxed drop-shadow-sm">
          ARKON adalah <strong className="text-primary">"Adaptive Resource"</strong> yang memadukan{' '}
          <strong className="text-primary">Generative AI (RAG)</strong> dengan{' '}
          <strong className="text-indigo-600">Interactive Simulation</strong>. Mengubah materi kuliah pasif menjadi pengalaman belajar interaktif.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16 relative z-30">
          <a href="/register" className="px-8 py-4 bg-gradient-to-br from-primary to-indigo-600 text-white rounded-2xl font-black text-lg hover:scale-105 transition-all shadow-[0_10px_40px_-10px_rgba(22,93,255,0.8)] flex items-center justify-center gap-2 cursor-pointer no-underline">
            Mulai Belajar <ArrowRight className="w-5 h-5 text-white" />
          </a>
          <a href="/cpu-simulator" className="px-8 py-4 bg-white shadow-sm border border-border backdrop-blur-md border-2 border-blue-100 text-foreground rounded-2xl font-bold text-lg hover:border-primary transition-all flex items-center justify-center cursor-pointer shadow-sm group no-underline">
            Coba CPU Simulator <Cpu className="w-5 h-5 ml-2 text-secondary group-hover:text-primary transition-colors" />
          </a>
        </motion.div>

        {/* 3 Pilar Inovasi */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto border-t border-slate-200/50 pt-10"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-blue-100 text-primary rounded-xl"><BrainCircuit className="w-6 h-6" /></div>
            <h3 className="font-bold text-foreground">AI Tutor & RAG</h3>
            <p className="text-xs text-secondary">Rangkum PDF materi otomatis, buat kuis, dan tanya jawab AI 24/7.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-xl"><Gamepad2 className="w-6 h-6" /></div>
            <h3 className="font-bold text-foreground">PC Quest Map</h3>
            <p className="text-xs text-secondary">Kuis gamifikasi dengan peta level motherboard dan sistem koin.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><BarChart2 className="w-6 h-6" /></div>
            <h3 className="font-bold text-foreground">Lecturer Analytics</h3>
            <p className="text-xs text-secondary">Dashboard IRT untuk memantau pemahaman mahasiswa secara otomatis.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
