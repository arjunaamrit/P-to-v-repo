import { spring, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

export const useFade = (startFrame: number, endFrame: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [startFrame, startFrame + 10, endFrame - 10, endFrame], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
};

export const useSlide = (startFrame: number, endFrame: number) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const spr = spring({
    frame: frame - startFrame,
    fps: 30,
    config: { damping: 12 },
  });
  
  return interpolate(spr, [0, 1], [-width / 4, 0]);
};

export const useBounce = (startFrame: number) => {
  const frame = useCurrentFrame();
  return spring({
    frame: frame - startFrame,
    fps: 30,
    config: { mass: 0.5, damping: 10, stiffness: 100 },
  });
};

export const useZoom = (startFrame: number) => {
  const frame = useCurrentFrame();
  return spring({
    frame: frame - startFrame,
    fps: 30,
    config: { damping: 12 },
  });
};
