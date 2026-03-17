import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const useFade = (startFrame: number, endFrame: number, duration: number = 10) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + duration, endFrame - duration, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const useSlide = (startFrame: number, direction: 'left' | 'right' | 'top' | 'bottom' = 'left', distance: number = 200, duration?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spr = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12 },
    durationInFrames: duration ? Math.floor(duration * fps) : undefined,
  });
  
  const offset = interpolate(spr, [0, 1], [-distance, 0]);
  
  return {
    x: direction === 'left' ? offset : direction === 'right' ? -offset : 0,
    y: direction === 'top' ? offset : direction === 'bottom' ? -offset : 0,
  };
};

export const useBounce = (startFrame: number, intensity: number = 1, duration?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({
    frame: frame - startFrame,
    fps,
    config: { mass: 0.5 / intensity, damping: 10 * intensity, stiffness: 100 * intensity },
    durationInFrames: duration ? Math.floor(duration * fps) : undefined,
  });
};

export const useZoom = (startFrame: number, intensity: number = 1, duration?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spr = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 12 },
    durationInFrames: duration ? Math.floor(duration * fps) : undefined,
  });
  const startScale = Math.max(0, 1 - 0.5 * intensity);
  return interpolate(spr, [0, 1], [startScale, 1]);
};

export const useWave = (startFrame: number, duration: number = 30, intensity: number = 1) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;
  if (relativeFrame < 0) return 0;
  
  // Wave back and forth
  return Math.sin(relativeFrame / (duration / 4)) * 15 * intensity;
};

export const usePoint = (startFrame: number, duration: number = 20, intensity: number = 1) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;
  if (relativeFrame < 0) return 1;
  
  // Pulse scale
  const val = Math.sin(relativeFrame / (duration / 4));
  return 1 + (val > 0 ? val * 0.2 * intensity : 0);
};

export const useNod = (startFrame: number, duration: number = 20, intensity: number = 1) => {
  const frame = useCurrentFrame();
  const relativeFrame = frame - startFrame;
  if (relativeFrame < 0) return 0;
  
  // Vertical nod
  return Math.sin(relativeFrame / (duration / 4)) * 10 * intensity;
};
