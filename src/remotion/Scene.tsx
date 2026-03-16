import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Scene as SceneType } from '../types';
import { Element } from './Element';

export const Scene: React.FC<{ scene: SceneType }> = ({ scene }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: scene.background }}>
      {(scene.elements || []).map((el, i) => (
        <Element key={i} element={el} />
      ))}
      
      {/* Subtitles */}
      <div style={{
        position: 'absolute',
        bottom: 100,
        left: 0,
        right: 0,
        textAlign: 'center',
        padding: '0 50px'
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
