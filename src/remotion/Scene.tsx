import React from 'react';
import { AbsoluteFill, Audio, useVideoConfig } from 'remotion';
import { Scene as SceneType } from '../types';
import { Element } from './Element';

export const Scene: React.FC<{ scene: SceneType }> = ({ scene }) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: scene.background }}>
      {(scene.elements || []).map((el, i) => (
        <Element key={i} element={el} />
      ))}

      {/* Sound Effects */}
      {(scene.soundEffects || []).map((sfx, i) => (
        <Audio
          key={i}
          src={sfx.url}
          startFrom={0}
          startInScene={Math.floor(sfx.startTime * fps)}
          volume={sfx.volume || 0.5}
        />
      ))}
      
      {/* Subtitles */}
      <div style={{
        position: 'absolute',
        bottom: 60,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 50px',
        zIndex: 100
      }}>
        <div style={{
          display: 'inline-block',
          backgroundColor: 'rgba(0,0,0,0.6)',
          color: 'white',
          padding: '15px 30px',
          borderRadius: 20,
          fontSize: 32,
          fontWeight: 500,
          backdropFilter: 'blur(10px)'
        }}>
          {scene.narration}
        </div>
      </div>
    </AbsoluteFill>
  );
};
