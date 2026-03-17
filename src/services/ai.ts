import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import { AnimationPlan } from "../types";
import { KNOWLEDGE_BASE } from "../data/knowledge";

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key not found. Please ensure GEMINI_API_KEY is set in your environment.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Simple RAG: Find relevant context from knowledge base
 */
async function getRelevantContext(query: string): Promise<string> {
  // In a real app, we'd use embeddings and a vector DB like ChromaDB.
  // Here we simulate it with simple keyword matching for the MVP.
  const relevant = KNOWLEDGE_BASE.filter(item => 
    query.toLowerCase().includes(item.topic.toLowerCase()) ||
    item.content.toLowerCase().includes(query.toLowerCase())
  );
  
  return relevant.map(r => r.content).join("\n\n");
}

/**
 * Attempts to close a truncated JSON string by balancing braces and brackets.
 */
function fixTruncatedJSON(jsonString: string): string {
  let stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    if (escaped) { escaped = false; continue; }
    if (char === '\\') { escaped = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === (char === '}' ? '}' : ']')) {
          stack.pop();
        }
      }
    }
  }

  let result = jsonString;
  
  // If we're inside a string, close it
  if (inString) result += '"';
  
  // Remove trailing comma if present
  result = result.trim().replace(/,$/, "");

  // Close all open structures
  while (stack.length > 0) {
    const closing = stack.pop();
    result += closing;
  }

  // Final attempt to parse. If it still fails, it might have a partial key/value at the end
  try {
    JSON.parse(result);
    return result;
  } catch (e) {
    // Remove the last "key": "value" or "key": or just "key" if it's broken
    // This is a bit of a hack but often works for truncated JSON
    const lastComma = result.lastIndexOf(',');
    const lastBrace = result.lastIndexOf('{');
    const lastBracket = result.lastIndexOf('[');
    const lastValidCut = Math.max(lastComma, lastBrace, lastBracket);
    
    if (lastValidCut !== -1) {
      return fixTruncatedJSON(result.substring(0, lastValidCut));
    }
    return result;
  }
}

/**
 * Utility to extract JSON from a string that might contain extra text
 * and attempt to fix common truncation issues.
 */
function extractJSON(text: string): string {
  // Remove markdown code blocks if present
  let cleaned = text.replace(/```json\s?/, "").replace(/```\s?$/, "").trim();
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace === -1) return cleaned;
  
  // Try the full segment from first { to last }
  if (lastBrace > firstBrace) {
    const candidate = cleaned.substring(firstBrace, lastBrace + 1);
    try {
      JSON.parse(candidate);
      return candidate;
    } catch (e) {
      // Fall through to repair
    }
  }
  
  const jsonCandidate = cleaned.substring(firstBrace);
  
  try {
    JSON.parse(jsonCandidate);
    return jsonCandidate;
  } catch (e) {
    console.warn("JSON parsing failed, attempting to fix truncated response...");
    return fixTruncatedJSON(jsonCandidate);
  }
}

/**
 * Step 1: Prompt Builder / Quantifier
 * Expands a simple user topic into a detailed, high-quality animation prompt.
 */
export async function buildDetailedPrompt(topic: string): Promise<string> {
  const ai = getAI();
  
  const systemInstruction = `
    You are an expert Educational Scriptwriter, Historian, and Prompt Engineer.
    Your task is to take a simple topic and "quantify" it into a highly detailed, 
    scientifically rigorous animation prompt.
    
    The expanded prompt MUST include:
    1. RIGOROUS TERMINOLOGY: Use precise scientific terms (e.g., "quantum superposition" instead of "being in two places").
    2. HISTORICAL CONTEXT: Mention key figures (pupils/scientists), places of discovery, and the timeline of development.
    3. CINEMATIC METAPHORS: Describe visual metaphors that bridge complex science with relatable visual storytelling.
    4. CONNECTIONS: Link the history to recent breakthroughs and future implications.
    5. TONE: "Cinematic, intellectual, and awe-inspiring."
    
    Output ONLY the expanded prompt text. No conversational filler.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Topic: ${topic}`,
    config: {
      systemInstruction,
      temperature: 0.7,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });

  const text = response.text?.trim();
  if (!text || text.length < 10) {
    return `Create a detailed educational animation about ${topic}. Include clear visual metaphors and a logical progression of concepts.`;
  }
  return text;
}

export { getRelevantContext };

/**
 * Step 3: Script Generation
 * Converts the quantified prompt and context into a narrative script.
 */
export async function generateScript(prompt: string, context: string): Promise<string> {
  const ai = getAI();
  
  const systemInstruction = `
    You are a Cinematic Science Documentarian.
    Your task is to write a rigorous, awe-inspiring narrative script.
    
    Context:
    ${context || "Use general knowledge."}
    
    The script MUST follow a cinematic structure:
    1. THE HOOK (0-10s): A profound scientific or historical question.
    2. THE GENESIS (10-25s): Historical context, key figures, and the "eureka" moment.
    3. THE MECHANICS (25-45s): Pure scientific explanation using rigorous terminology.
    4. THE FRONTIER (45-60s): Recent developments and future connections.
    
    Style: Intellectual, rhythmic, and cinematic. Use approximately 150-200 words.
    
    Output ONLY the script text.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Prompt: ${prompt}`,
    config: {
      systemInstruction,
      temperature: 0.3,
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
    }
  });

  return response.text || "";
}

/**
 * Step 4: Scene Planning
 * Breaks the script into a series of visual scene descriptions.
 */
export async function planScenes(script: string): Promise<string[]> {
  const ai = getAI();
  
  const systemInstruction = `
    You are a Cinematic Storyboard Artist.
    Your task is to break the script into 6 to 10 cinematic scenes.
    For each scene, describe:
    - VISUAL: Lighting mood (e.g., "Chiaroscuro", "Golden hour"), camera angle (e.g., "Low angle hero shot"), and sophisticated visual metaphors.
    - NARRATION: The corresponding script segment.
    
    Output the scenes as a JSON array of objects:
    [
      { "description": "Visual description here", "narration": "Narration text here" }
    ]
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Script: ${script}`,
    config: {
      systemInstruction,
      temperature: 0.2,
      responseMimeType: "application/json",
      thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          required: ["description", "narration"],
          properties: {
            description: { type: Type.STRING },
            narration: { type: Type.STRING }
          }
        }
      }
    }
  });

  try {
    const scenes = JSON.parse(extractJSON(response.text));
    return scenes.map((s: any) => `Visual: ${s.description}\nNarration: ${s.narration}`);
  } catch (e) {
    return [script]; // Fallback
  }
}

/**
 * Step 5: Animation Plan
 * Converts scene descriptions into a structured JSON animation plan.
 */
export async function generateAnimationPlan(sceneDescriptions: string[], retryCount = 0): Promise<AnimationPlan> {
  const ai = getAI();
  
  const systemInstruction = `
    You are a precise educational content generator. 
    Task: Convert the scene descriptions into a structured JSON animation plan.
    
    EXAMPLE STRUCTURE:
    {
      "title": "Topic Name",
      "scenes": [
        {
          "id": "scene-1",
          "duration": 5,
          "background": "#1a1a1a",
          "narration": "Narration text here...",
          "elements": [
            {
              "type": "text",
              "content": "Key Concept",
              "position": { "x": 50, "y": 50 },
              "animation": "fade",
              "startTime": 0,
              "endTime": 5
            }
          ]
        }
      ]
    }

    STRICT RULES:
    1. Output ONLY the JSON object.
    2. Elements: text, shape, icon, character, image, interactive-button.
    3. Animations: fade, slide, bounce, zoom, wave, point, nod.
    4. Transitions: fade, slide-left, slide-right, zoom, wipe, flip, none.
    5. Coordinates: 0-100. (0,0 is top-left, 100,100 is bottom-right).
    6. SPATIAL LAYOUT & COMPOSITION: 
       - Avoid overlapping elements unless intentional.
       - Keep important content within the "Safe Zone" (10-90 on both axes).
       - COMPOSITION GUIDE:
         - CENTERED: x=50, y=50.
         - TOP-THIRD: y=30.
         - BOTTOM-THIRD: y=70.
         - LEFT-SIDE: x=25.
         - RIGHT-SIDE: x=75.
       - COLLISION AVOIDANCE:
         - SUBTITLE AREA: Avoid placing critical elements below y=80, as subtitles appear there.
         - If an image is at (25, 50), place text at (75, 50).
         - If a character is at (80, 80), place titles at (50, 20).
         - Elements with overlapping time windows MUST have distinct positions.
         - Images are large (approx 40% of screen), so give them space.
    7. For "image" elements, use provided image URLs if available, otherwise describe a prompt.
    8. Use "intensity" (0.5 to 2.0) to control animation speed/scale.
    9. Use "direction" for "slide" animations to control entry point.
    10. Use "delay" (seconds) to offset the animation start within its scene window.
    11. Use "duration" (seconds) to control how long the animation takes to complete.
    12. Add "soundEffects" to scenes for impactful moments (e.g., "whoosh", "ding", "sparkle"). Use descriptive names for URLs (e.g., "https://assets.mixkit.co/sfx/preview/mixkit-fast-whoosh-1182.mp3").
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Scenes:\n${sceneDescriptions.join("\n---\n")}`,
      config: {
        systemInstruction,
        temperature: 0.2 + (retryCount * 0.2),
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "scenes"],
          properties: {
            title: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["id", "duration", "background", "narration", "elements"],
                properties: {
                  id: { type: Type.STRING },
                  duration: { type: Type.NUMBER },
                  background: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  transition: { type: Type.STRING, enum: ["fade", "slide-left", "slide-right", "zoom", "wipe", "flip", "none"] },
                  soundEffects: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["url", "startTime"],
                      properties: {
                        url: { type: Type.STRING },
                        startTime: { type: Type.NUMBER },
                        volume: { type: Type.NUMBER }
                      }
                    }
                  },
                  elements: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      required: ["type", "content", "position", "animation", "startTime", "endTime"],
                      properties: {
                        type: { type: Type.STRING, enum: ["text", "shape", "icon", "character", "image", "interactive-button"] },
                        content: { type: Type.STRING },
                        position: {
                          type: Type.OBJECT,
                          required: ["x", "y"],
                          properties: {
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER }
                          }
                        },
                        animation: { type: Type.STRING, enum: ["fade", "slide", "bounce", "zoom", "wave", "point", "nod"] },
                        startTime: { type: Type.NUMBER },
                        endTime: { type: Type.NUMBER },
                        intensity: { type: Type.NUMBER },
                        direction: { type: Type.STRING, enum: ["left", "right", "top", "bottom"] },
                        delay: { type: Type.NUMBER },
                        duration: { type: Type.NUMBER },
                        action: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const cleanedText = extractJSON(response.text);
    return JSON.parse(cleanedText) as AnimationPlan;
  } catch (err) {
    if (retryCount < 2) return generateAnimationPlan(sceneDescriptions, retryCount + 1);
    throw err;
  }
}

/**
 * Generate an image using Gemini
 */
export async function generateImage(prompt: string): Promise<string> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: `Cinematic educational masterpiece: ${prompt}. High-end documentary style, dramatic lighting, professional composition, 8k resolution, scientifically accurate details.` }],
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  } catch (err) {
    console.error("Image generation failed:", err);
  }
  return "";
}

/**
 * Helper to wrap raw PCM data in a WAV header (Browser compatible)
 */
function pcmToWav(pcmBase64: string, sampleRate: number = 24000): string {
  const binaryString = window.atob(pcmBase64);
  const len = binaryString.length;
  const pcmBuffer = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    pcmBuffer[i] = binaryString.charCodeAt(i);
  }

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = pcmBuffer.length;
  const chunkSize = 36 + dataSize;

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, chunkSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const wavBuffer = new Uint8Array(44 + dataSize);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(pcmBuffer, 44);

  // Convert back to base64
  let wavBinary = '';
  for (let i = 0; i < wavBuffer.length; i++) {
    wavBinary += String.fromCharCode(wavBuffer[i]);
  }
  return window.btoa(wavBinary);
}

/**
 * Generate Audio for a narration string
 */
export async function generateNarrationAudio(text: string): Promise<string> {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    let mimeType = part?.inlineData?.mimeType || "audio/wav";
    
    if (!base64Audio) return "";

    // If it's PCM, we need to wrap it in a WAV header for the <audio> tag
    if (mimeType.includes('pcm')) {
      const wavBase64 = pcmToWav(base64Audio, 24000);
      return `data:audio/wav;base64,${wavBase64}`;
    }

    return `data:${mimeType};base64,${base64Audio}`;
  } catch (err) {
    console.error("Audio generation failed:", err);
    return "";
  }
}
