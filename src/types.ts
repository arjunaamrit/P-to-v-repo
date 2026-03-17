export interface AnimationPlan {
  title: string;
  scenes: Scene[];
  audioUrl?: string;
}

export interface Scene {
  id: string;
  duration: number; // in seconds
  background: string; // color or theme
  elements: AnimationElement[];
  narration: string;
  transition?: 'fade' | 'slide-left' | 'slide-right' | 'zoom' | 'wipe' | 'flip' | 'none';
  soundEffects?: SoundEffect[];
}

export interface SoundEffect {
  url: string;
  startTime: number; // in seconds, relative to scene start
  volume?: number;
}

export interface AnimationElement {
  type: 'text' | 'shape' | 'icon' | 'character' | 'image' | 'interactive-button';
  content: string;
  position: { x: number; y: number };
  animation: 'fade' | 'slide' | 'bounce' | 'zoom' | 'wave' | 'point' | 'nod';
  startTime: number;
  endTime: number;
  intensity?: number;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  delay?: number;
  duration?: number;
  action?: string;
}
