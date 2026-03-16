import React from 'react';
import { registerRoot } from 'remotion';
import { MainComposition } from './Composition';
import { AnimationPlan } from '../types';

// Default mock plan for preview
const defaultPlan: AnimationPlan = {
  title: "Photosynthesis Explained",
  scenes: [
    {
      id: "1",
      duration: 3,
      background: "#1a2e1a",
      narration: "Plants use sunlight to make food.",
      elements: [
        {
          type: "text",
          content: "Photosynthesis",
          position: { x: 50, y: 50 },
          animation: "zoom",
          startTime: 0,
          endTime: 3
        }
      ]
    }
  ]
};

const RemotionRoot: React.FC = () => {
  return (
    <>
      <MainComposition plan={defaultPlan} />
    </>
  );
};

registerRoot(RemotionRoot);
