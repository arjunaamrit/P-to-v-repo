import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationElement } from '../types';
import { useFade, useSlide, useBounce, useZoom } from './animations';

export const Element: React.FC<{ element: AnimationElement }> = ({ element }) => {
  const { fps } = useVideoConfig();
  const startFrame = element.startTime * fps;
  const endFrame = element.endTime * fps;
  
  const opacity = useFade(startFrame, endFrame);
  const slideX = element.animation === 'slide' ? useSlide(startFrame, endFrame) : 0;
  const scale = element.animation === 'bounce' ? useBounce(startFrame) : 
                element.animation === 'zoom' ? useZoom(startFrame) : 1;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    transform: `translate(-50%, -50%) translateX(${slideX}px) scale(${scale})`,
    opacity,
  };

  if (element.type === 'text') {
    return (
      <div style={{ ...style, color: 'white', fontSize: 60, fontWeight: 'bold', textAlign: 'center', textShadow: '0 4px 10px rgba(0,0,0,0.5)' }}>
        {element.content}
      </div>
    );
  }

  if (element.type === 'shape') {
    return (
      <div style={{ ...style, width: 150, height: 150, borderRadius: '50%', backgroundColor: element.content, border: '4px solid white' }} />
    );
  }

  if (element.type === 'icon') {
    return (
      <div style={{ ...style, fontSize: 100 }}>
        {element.content}
      </div>
    );
  }

  return null;
};
