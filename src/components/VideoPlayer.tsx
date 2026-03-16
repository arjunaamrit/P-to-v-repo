import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import { AnimationPlan, Scene, AnimationElement } from '../types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VideoPlayerProps {
  plan: AnimationPlan & { scenes: (Scene & { audioUrl?: string })[] };
}

export default function VideoPlayer({ plan }: VideoPlayerProps) {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentScene = plan.scenes[currentSceneIndex];

  if (!currentScene) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
        <p className="text-zinc-500 font-mono">No scenes available</p>
      </div>
    );
  }

  useEffect(() => {
    if (isPlaying) {
      const duration = currentScene.duration * 1000;
      const startTime = Date.now();
      
      if (currentScene.audioUrl && audioRef.current) {
        audioRef.current.src = currentScene.audioUrl;
        audioRef.current.load();
        audioRef.current.play().catch(e => {
          console.warn("Audio play failed, continuing without audio:", e);
          // Don't throw, just log and continue the visual animation
        });
      }

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        setProgress(newProgress);

        if (newProgress >= 100) {
          handleNextScene();
        }
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, currentSceneIndex]);

  const handleNextScene = () => {
    if (currentSceneIndex < plan.scenes.length - 1) {
      setCurrentSceneIndex(prev => prev + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      setProgress(100);
    }
  };

  const reset = () => {
    setCurrentSceneIndex(0);
    setProgress(0);
    setIsPlaying(false);
  };

  const getAnimationProps = (element: AnimationElement) => {
    switch (element.animation) {
      case 'fade': return { initial: { opacity: 0 }, animate: { opacity: 1 } };
      case 'slide': return { initial: { x: -50, opacity: 0 }, animate: { x: 0, opacity: 1 } };
      case 'bounce': return { initial: { scale: 0 }, animate: { scale: 1 }, transition: { type: 'spring' } };
      case 'zoom': return { initial: { scale: 2, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
      default: return {};
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
      {/* Video Stage */}
      <div 
        className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black"
        style={{ background: `radial-gradient(circle at center, ${currentScene.background || '#000000'} 0%, #000000 100%)` }}
      >
        <audio ref={audioRef} />
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentScene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {(currentScene.elements || []).map((el, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ 
                  left: `${el.position.x}%`, 
                  top: `${el.position.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
                {...getAnimationProps(el)}
              >
                {el.type === 'text' && (
                  <h2 className="text-5xl font-black text-white drop-shadow-2xl text-center whitespace-nowrap uppercase tracking-tighter">
                    {el.content}
                  </h2>
                )}
                {el.type === 'icon' && (
                  <div className="text-white text-6xl drop-shadow-lg">
                    {/* Simplified icon representation */}
                    {el.content}
                  </div>
                )}
                {el.type === 'shape' && (
                  <div 
                    className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border border-white/40"
                    style={{ backgroundColor: el.content }}
                  />
                )}
                {el.type === 'image' && (
                  <div className="relative w-64 aspect-video rounded-xl overflow-hidden border border-white/20 shadow-2xl">
                    <img 
                      src={el.content} 
                      alt="AI Generated" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Subtitles / Narration */}
        <div className="absolute bottom-12 left-0 right-0 px-16 text-center">
          <motion.p 
            key={currentScene.narration}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-2xl text-white font-serif italic leading-relaxed bg-black/60 backdrop-blur-xl py-4 px-8 rounded-2xl inline-block shadow-2xl border border-white/5"
          >
            {currentScene.narration}
          </motion.p>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
          <motion.div 
            className="h-full bg-emerald-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between glass p-6 rounded-3xl border border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white hover:bg-emerald-500 transition-all text-black shadow-xl active:scale-90"
          >
            {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          <button 
            onClick={reset}
            className="w-14 h-14 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white border border-white/10"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        <div className="flex-1 px-8">
          <div className="flex justify-between text-xs text-zinc-400 mb-2 font-mono">
            <span>SCENE {currentSceneIndex + 1} / {plan.scenes.length}</span>
            <span>{currentScene.duration}s</span>
          </div>
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/20" 
              style={{ width: `${((currentSceneIndex + 1) / plan.scenes.length) * 100}%` }} 
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <Volume2 size={18} />
          <span className="text-xs font-mono uppercase tracking-widest">Audio Active</span>
        </div>
      </div>
    </div>
  );
}
