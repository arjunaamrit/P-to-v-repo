import React from 'react';
import { TransitionSeries } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { slide } from '@remotion/transitions/slide';
import { wipe } from '@remotion/transitions/wipe';
import { flip } from '@remotion/transitions/flip';
import { AnimationPlan } from '../types';
import { Scene } from './Scene';

export const MainComposition: React.FC<{ plan: AnimationPlan }> = ({ plan }) => {
  const scenes = plan.scenes || [];
  
  return (
    <TransitionSeries>
      {scenes.map((scene, index) => {
        const durationInFrames = Math.floor(scene.duration * 30);
        const transitionDuration = 15; // 0.5 seconds at 30fps
        
        return (
          <React.Fragment key={scene.id}>
            <TransitionSeries.Sequence durationInFrames={durationInFrames}>
              <Scene scene={scene} />
            </TransitionSeries.Sequence>
            
            {index < scenes.length - 1 && (
              (() => {
                const nextScene = scenes[index + 1];
                const type = nextScene.transition || 'fade';
                
                if (type === 'none') return null;
                
                if (type === 'fade') {
                  return <TransitionSeries.Transition durationInFrames={transitionDuration} presentation={fade()} />;
                }
                if (type === 'slide-left') {
                  return <TransitionSeries.Transition durationInFrames={transitionDuration} presentation={slide({ direction: 'from-right' })} />;
                }
                if (type === 'slide-right') {
                  return <TransitionSeries.Transition durationInFrames={transitionDuration} presentation={slide({ direction: 'from-left' })} />;
                }
                if (type === 'wipe') {
                  return <TransitionSeries.Transition durationInFrames={transitionDuration} presentation={wipe({ direction: 'from-bottom' })} />;
                }
                if (type === 'flip') {
                  return <TransitionSeries.Transition durationInFrames={transitionDuration} presentation={flip()} />;
                }
                // Fallback to fade
                return <TransitionSeries.Transition durationInFrames={transitionDuration} presentation={fade()} />;
              })()
            )}
          </React.Fragment>
        );
      })}
    </TransitionSeries>
  );
};
