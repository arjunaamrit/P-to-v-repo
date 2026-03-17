import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { AnimationElement } from '../types';
import { useFade, useSlide, useBounce, useZoom, useWave, usePoint, useNod } from './animations';

export const Element: React.FC<{ 
  element: AnimationElement;
  onAction?: (action: string) => void;
}> = ({ element, onAction }) => {
  const { fps } = useVideoConfig();
  const startFrame = (element.startTime + (element.delay || 0)) * fps;
  const endFrame = element.endTime * fps;
  
  const opacity = useFade(startFrame, endFrame, (element.duration || 0.3) * fps);
  
  // Determine slide direction based on position or type if not explicitly provided
  let slideDirection = element.direction || 'left';
  if (!element.direction && element.animation === 'slide') {
    if (element.position.x < 30) slideDirection = 'left';
    else if (element.position.x > 70) slideDirection = 'right';
    else if (element.position.y > 70) slideDirection = 'bottom';
    else if (element.position.y < 30) slideDirection = 'top';
    
    // Type-based overrides
    if (element.type === 'character') slideDirection = 'bottom';
  }

  const intensity = element.intensity || 1;
  const slide = useSlide(startFrame, slideDirection, 300 * intensity, element.duration);
  
  const slideX = element.animation === 'slide' ? slide.x : 0;
  const slideY = element.animation === 'slide' ? slide.y : 0;
  
  const baseScale = element.animation === 'bounce' ? useBounce(startFrame, intensity, element.duration) : 
                    element.animation === 'zoom' ? useZoom(startFrame, intensity, element.duration) : 1;
  
  const pointScale = element.animation === 'point' ? usePoint(startFrame, (element.duration || 1) * fps, intensity) : 1;
  const scale = baseScale * pointScale;

  const rotation = element.animation === 'wave' ? useWave(startFrame, (element.duration || 1) * fps, intensity) : 0;
  const nodY = element.animation === 'nod' ? useNod(startFrame, (element.duration || 1) * fps, intensity) : 0;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.position.x}%`,
    top: `${element.position.y}%`,
    transform: `translate(-50%, -50%) translate(${slideX}px, ${slideY + nodY}px) scale(${scale}) rotate(${rotation}deg)`,
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

  if (element.type === 'character') {
    return (
      <div style={{ ...style, fontSize: 120 }}>
        {element.content}
      </div>
    );
  }

  if (element.type === 'image') {
    return (
      <img 
        src={element.content} 
        style={{ ...style, width: 400, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }} 
        referrerPolicy="no-referrer"
        alt="Animation element"
      />
    );
  }

  if (element.type === 'interactive-button') {
    return (
      <button
        onClick={() => onAction?.(element.action || 'click')}
        style={{
          ...style,
          padding: '12px 24px',
          backgroundColor: 'white',
          color: 'black',
          border: 'none',
          borderRadius: '9999px',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
          pointerEvents: 'auto'
        }}
      >
        {element.content}
      </button>
    );
  }

  return null;
};
