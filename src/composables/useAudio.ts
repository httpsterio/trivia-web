import { ref } from 'vue';
import clickUrl from '../assets/audio/click.wav';
import correctUrl from '../assets/audio/correct.wav';
import errorUrl from '../assets/audio/error.wav';
import hoverUrl from '../assets/audio/hover.wav';
import resetUrl from '../assets/audio/reset.wav';
import victoryUrl from '../assets/audio/victory.wav';

const sounds = {
  click: clickUrl,
  correct: correctUrl,
  error: errorUrl,
  hover: hoverUrl,
  reset: resetUrl,
  victory: victoryUrl,
};

type SoundName = keyof typeof sounds;

// Global reactive mute state persisting to localStorage
const isMuted = ref(localStorage.getItem('toxictype-muted') === 'true');

// Shared context and audio buffers to avoid reloading
let audioCtx: AudioContext | null = null;
const audioBuffers: Record<string, AudioBuffer> = {};
let loadingPromise: Promise<void> | null = null;

export function useAudio() {
  const initAudio = async () => {
    // Return existing loading process or loaded buffers
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) {
          console.warn('Web Audio API is not supported in this browser.');
          return;
        }

        audioCtx = new AudioContextClass();

        // Load and decode all WAV sound files concurrently
        await Promise.all(
          Object.entries(sounds).map(async ([name, url]) => {
            try {
              const response = await fetch(url);
              const arrayBuffer = await response.arrayBuffer();
              if (audioCtx) {
                audioBuffers[name] = await audioCtx.decodeAudioData(arrayBuffer);
              }
            } catch (err) {
              console.error(`Error loading or decoding sound file: ${name}`, err);
            }
          })
        );
      } catch (err) {
        console.error('Failed to initialize AudioContext', err);
      }
    })();

    return loadingPromise;
  };

  const playSound = async (name: SoundName) => {
    if (isMuted.value) return;

    // Trigger lazy preloading on call if context doesn't exist
    if (!audioCtx) {
      await initAudio();
    }

    if (!audioCtx || !audioBuffers[name]) return;

    // Handle browser gesture policy by resuming context if suspended
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[name];

    // Pitch shifting: randomize pitch between -10% and +10%
    // Playback rate factor from 0.9 to 1.1
    const pitchFactor = 0.9 + Math.random() * 0.2;
    source.playbackRate.value = pitchFactor;

    source.connect(audioCtx.destination);
    source.start(0);
  };

  const toggleMute = () => {
    isMuted.value = !isMuted.value;
    localStorage.setItem('toxictype-muted', String(isMuted.value));
  };

  return {
    isMuted,
    initAudio,
    playSound,
    toggleMute,
  };
}
