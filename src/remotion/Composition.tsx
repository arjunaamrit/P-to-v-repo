import React from 'react';
import { Series } from 'remotion';
import { AnimationPlan } from '../types';
import { Scene } from './Scene';

export const MainComposition: React.FC<{ plan: AnimationPlan }> = ({ plan }) => {
  const scenes = plan.scenes || [];
  
  return (
    <Series>
      {scenes.map((scene) => (
        <Series.Sequence 
          key={scene.id} 
          durationInFrames={Math.floor(scene.duration * 30)}
        >
          <Scene scene={scene} />
        </Series.Sequence>
      ))}
    </Series>
  );
};
