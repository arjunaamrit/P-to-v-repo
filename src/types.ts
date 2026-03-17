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
  transition?: 'fade' | 'slide-left' | 'slide-right' | 'zoom';
}

export interface AnimationElement {
  type: 'text' | 'shape' | 'icon' | 'character' | 'image';
  content: string;
  position: { x: number; y: number };
  animation: 'fade' | 'slide' | 'bounce' | 'zoom';
  startTime: number;
  endTime: number;
}
