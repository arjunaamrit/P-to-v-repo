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
  const playedSfxRef = useRef<Set<string>>(new Set());

  const currentScene = plan.scenes[currentSceneIndex];

  if (!currentScene) {
    return (
      <div className="aspect-video w-full rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
        <p className="text-zinc-500 font-mono">No scenes available</p>
      </div>
    );
  }

  const playSfx = (url: string, volume: number = 0.5) => {
    const audio = new Audio(url);
    audio.volume = volume;
    audio.play().catch(e => console.warn("SFX play failed:", e));
  };

  useEffect(() => {
    if (isPlaying) {
      if (plan.audioUrl && audioRef.current) {
        if (audioRef.current.src !== plan.audioUrl) {
          audioRef.current.src = plan.audioUrl;
          audioRef.current.load();
        }
        audioRef.current.play().catch(e => {
          console.warn("Audio play failed, continuing without audio:", e);
        });
      }

      timerRef.current = setInterval(() => {
        if (audioRef.current && plan.audioUrl) {
          const currentTime = audioRef.current.currentTime;
          const totalDuration = plan.scenes.reduce((acc, s) => acc + s.duration, 0);
          
          // Find current scene based on cumulative duration
          let cumulative = 0;
          let foundIndex = 0;
          for (let i = 0; i < plan.scenes.length; i++) {
            if (currentTime >= cumulative && currentTime < cumulative + plan.scenes[i].duration) {
              foundIndex = i;
              break;
            }
            cumulative += plan.scenes[i].duration;
          }
          
          if (foundIndex !== currentSceneIndex) {
            playedSfxRef.current.clear();
            setCurrentSceneIndex(foundIndex);
          }

          // Check for sound effects in the current scene
          const sceneElapsed = currentTime - cumulative;
          const scene = plan.scenes[foundIndex];
          if (scene.soundEffects) {
            scene.soundEffects.forEach((sfx, idx) => {
              const sfxId = `${foundIndex}-${idx}`;
              if (sceneElapsed >= sfx.startTime && !playedSfxRef.current.has(sfxId)) {
                playSfx(sfx.url, sfx.volume);
                playedSfxRef.current.add(sfxId);
              }
            });
          }

          if (currentTime >= totalDuration) {
            setIsPlaying(false);
            setCurrentSceneIndex(plan.scenes.length - 1);
            setProgress(100);
          } else {
            const sceneProgress = (sceneElapsed / plan.scenes[foundIndex].duration) * 100;
            setProgress(sceneProgress);
          }
        }
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, plan.audioUrl, currentSceneIndex]);

  const handleNextScene = () => {
    if (currentSceneIndex < plan.scenes.length - 1) {
      const nextSceneStartTime = plan.scenes.slice(0, currentSceneIndex + 1).reduce((acc, s) => acc + s.duration, 0);
      if (audioRef.current) audioRef.current.currentTime = nextSceneStartTime;
      setCurrentSceneIndex(prev => prev + 1);
      setProgress(0);
    } else {
      setIsPlaying(false);
      setProgress(100);
    }
  };

  const reset = () => {
    if (audioRef.current) audioRef.current.currentTime = 0;
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
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
        <audio ref={audioRef} />
        
        <AnimatePresence mode="popLayout">
          <motion.div 
            key={currentScene.id}
            initial={
              currentScene.transition === 'slide-left' ? { x: '100%', opacity: 0 } :
              currentScene.transition === 'slide-right' ? { x: '-100%', opacity: 0 } :
              currentScene.transition === 'zoom' ? { scale: 1.2, opacity: 0 } :
              { opacity: 0 }
            }
            animate={{ x: 0, scale: 1, opacity: 1 }}
            exit={
              currentScene.transition === 'slide-left' ? { x: '-100%', opacity: 0 } :
              currentScene.transition === 'slide-right' ? { x: '100%', opacity: 0 } :
              currentScene.transition === 'zoom' ? { scale: 0.8, opacity: 0 } :
              { opacity: 0 }
            }
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: `radial-gradient(circle at center, ${currentScene.background || '#000000'} 0%, #000000 100%)` }}
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
                {el.type === 'interactive-button' && (
                  <button
                    onClick={() => {
                      if (el.action === 'pause') setIsPlaying(false);
                      else if (el.action === 'play') setIsPlaying(true);
                      else if (el.action === 'reset') reset();
                      else console.log(`Action triggered: ${el.action}`);
                    }}
                    className="px-6 py-3 bg-white text-black rounded-full font-bold shadow-xl hover:scale-105 transition-transform active:scale-95 whitespace-nowrap"
                  >
                    {el.content}
                  </button>
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

        {/* Progress Bar - Overall Visual Timeline */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-md border-t border-white/10 flex gap-0.5 p-0.5">
          {plan.scenes.map((scene, idx) => (
            <button
              key={scene.id}
              onClick={() => {
                setCurrentSceneIndex(idx);
                setProgress(0);
                setIsPlaying(true);
              }}
              className={cn(
                "relative flex-1 group transition-all overflow-hidden",
                currentSceneIndex === idx ? "opacity-100" : "opacity-40 hover:opacity-70"
              )}
            >
              {/* Background Color */}
              <div 
                className="absolute inset-0" 
                style={{ background: `radial-gradient(circle at center, ${scene.background || '#111'} 0%, #000 100%)` }} 
              />
              
              {/* Preview Content */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {scene.elements.find(e => e.type === 'image') ? (
                  <img 
                    src={scene.elements.find(e => e.type === 'image')?.content} 
                    className="w-full h-full object-cover opacity-50"
                    referrerPolicy="no-referrer"
                  />
                ) : scene.elements.find(e => e.type === 'text') ? (
                  <span className="text-[6px] font-black text-white/40 uppercase tracking-tighter truncate px-1">
                    {scene.elements.find(e => e.type === 'text')?.content}
                  </span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/10" />
                )}
              </div>

              {/* Progress Overlay */}
              {currentSceneIndex === idx && (
                <motion.div 
                  className="absolute bottom-0 left-0 h-1 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  style={{ width: `${progress}%` }}
                />
              )}
              {currentSceneIndex > idx && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500/40" />
              )}

              {/* Hover Label */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/60">
                <span className="text-[8px] font-mono text-white uppercase tracking-widest">Jump to {idx + 1}</span>
              </div>
            </button>
          ))}
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
