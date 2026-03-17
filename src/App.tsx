import React, { useState } from 'react';
import { Sparkles, Wand2, Loader2, PlayCircle, History, Info, Cpu, Layout, Image as ImageIcon } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import { AnimationPlan, Scene } from './types';
import { 
  generateAnimationPlan, 
  generateNarrationAudio, 
  buildDetailedPrompt,
  getRelevantContext,
  generateScript,
  planScenes,
  generateImage
} from './services/ai';

type ExtendedPlan = AnimationPlan & { scenes: (Scene & { audioUrl?: string })[] };

type GenerationStage = 'idle' | 'quantifying' | 'searching' | 'scripting' | 'planning' | 'animating' | 'imaging' | 'narrating' | 'finalizing';

function StageBadge({ active, icon, label }: { active: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all duration-500 flex items-center gap-1 ${active ? 'bg-emerald-500 text-black border-emerald-500 scale-110 shadow-lg shadow-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700 opacity-50'}`}>
      {icon} {label}
    </span>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [stage, setStage] = useState<GenerationStage>('idle');
  const [plan, setPlan] = useState<ExtendedPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setStage('quantifying');
    setError(null);
    setPlan(null);

    try {
      // 1. Quantify Prompt
      const detailedPrompt = await buildDetailedPrompt(prompt);
      
      // 2. Vector Search
      setStage('searching');
      const context = await getRelevantContext(detailedPrompt);
      
      // 3. Script Generation
      setStage('scripting');
      const script = await generateScript(detailedPrompt, context);
      
      // 4. Voice (Narration) - Full Script
      setStage('narrating');
      const fullAudioUrl = await generateNarrationAudio(script);

      // 5. Image Generation - Key Images
      setStage('imaging');
      const keyImages = await Promise.all([
        generateImage(`Main concept of ${prompt}`),
        generateImage(`Historical context of ${prompt}`),
        generateImage(`Scientific mechanics of ${prompt}`)
      ]);
      
      // 6. Scene Planning
      setStage('planning');
      const scenes = await planScenes(script);
      
      // 7. Animation Plan
      setStage('animating');
      const generatedPlan = await generateAnimationPlan(scenes);
      
      if (!generatedPlan.scenes || generatedPlan.scenes.length === 0) {
        throw new Error("Failed to generate animation plan.");
      }

      // Finalizing - Map pre-generated images to plan if AI didn't use them
      // (Simplified mapping for MVP)
      const finalizedScenes = generatedPlan.scenes.map((scene, idx) => {
        const elements = scene.elements.map((el, elIdx) => {
          if (el.type === 'image' && !el.content.startsWith('data:')) {
            // Use one of our key images if the AI just gave a prompt
            const img = keyImages[idx % keyImages.length];
            return { ...el, content: img || el.content };
          }
          return el;
        });
        return { ...scene, elements };
      });

      setStage('finalizing');
      setPlan({ ...generatedPlan, scenes: finalizedScenes, audioUrl: fullAudioUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setStage('idle');
    }
  };

  const isGenerating = stage !== 'idle';

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-emerald-500/30 relative">
      <div className="atmosphere" />
      
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tighter uppercase italic bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent">snubkey</h1>
          </div>
          <nav className="flex items-center gap-6 text-sm font-medium text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Gallery</a>
            <a href="#" className="hover:text-white transition-colors">Docs</a>
            <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-1.5 rounded-full border border-white/10 transition-all">
              Sign In
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 min-h-[calc(100vh-64px)] flex flex-col items-center justify-center">
        <div className="w-full space-y-12">
          {/* Input Area - Centered "Wish Box" */}
          {!plan && !isGenerating && (
            <div className="relative max-w-2xl mx-auto w-full group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 rounded-3xl blur opacity-20 group-focus-within:opacity-50 transition-all duration-500 animate-gradient-x" />
              <div className="relative glass rounded-3xl p-6 flex flex-col gap-6 shadow-2xl">
                <div className="flex-1 w-full flex items-start px-4 pt-2">
                  <Cpu size={28} className="text-emerald-500/50 mt-1 group-focus-within:text-emerald-500 transition-colors" />
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="Enter a topic to create something visually..."
                    className="flex-1 bg-transparent border-none outline-none px-6 py-1 text-2xl placeholder:text-zinc-700 font-light tracking-tight resize-none min-h-[160px]"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex justify-between items-center px-4 pb-2">
                  <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-[0.2em]">
                    Rigorous Analysis Mode Active
                  </div>
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                    className="w-full md:w-auto bg-white text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest transition-all hover:bg-emerald-500 active:scale-95 shadow-2xl"
                  >
                    Initiate Documentary
                  </button>
                </div>
              </div>
              {error && (
                <div className="absolute -bottom-12 left-0 right-0 flex justify-center">
                  <p className="text-red-400 text-sm font-medium flex items-center gap-2 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20">
                    <Info size={14} /> {error}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Video Player Area */}
          {isGenerating && (
            <div className="aspect-video w-full rounded-2xl glass flex flex-col items-center justify-center gap-8 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              
              <div className="relative flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader2 size={64} className="text-emerald-500 animate-spin" />
                  <Sparkles size={24} className="text-emerald-400 absolute -top-2 -right-2 animate-pulse" />
                </div>
                
                <div className="text-center space-y-4">
                  <div className="flex flex-wrap items-center justify-center gap-2 max-w-md">
                    <StageBadge active={stage === 'quantifying'} icon={<Cpu size={10} />} label="QUANTIFY" />
                    <StageBadge active={stage === 'searching'} icon={<History size={10} />} label="SEARCH" />
                    <StageBadge active={stage === 'scripting'} icon={<Wand2 size={10} />} label="SCRIPT" />
                    <StageBadge active={stage === 'narrating'} icon={<PlayCircle size={10} />} label="VOICE" />
                    <StageBadge active={stage === 'imaging'} icon={<ImageIcon size={10} />} label="IMAGE" />
                    <StageBadge active={stage === 'planning'} icon={<Layout size={10} />} label="SCENE" />
                    <StageBadge active={stage === 'animating'} icon={<Sparkles size={10} />} label="ANIMATE" />
                  </div>
                  
                  <p className="text-2xl font-bold tracking-tight">
                    {stage === 'quantifying' && "Quantifying topic..."}
                    {stage === 'searching' && "Searching knowledge base..."}
                    {stage === 'scripting' && "Writing script..."}
                    {stage === 'planning' && "Planning scenes..."}
                    {stage === 'animating' && "Generating animation..."}
                    {stage === 'imaging' && "Generating illustrations..."}
                    {stage === 'narrating' && "Synthesizing voice..."}
                    {stage === 'finalizing' && "Finalizing..."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {plan && !isGenerating && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <div className="flex items-center justify-between">
                <h3 className="text-4xl font-black tracking-tighter uppercase italic">{plan.title}</h3>
                <button 
                  onClick={() => setPlan(null)}
                  className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white px-4 py-2 rounded-full border border-white/10 transition-all flex items-center gap-2 text-sm"
                >
                  <History size={16} /> New Project
                </button>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                <VideoPlayer plan={plan} />
              </div>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
