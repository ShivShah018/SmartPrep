import { useState, useEffect, useRef } from 'react';

type SoundType = 'white' | 'brown' | 'rain' | 'cafe';

export default function FocusAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundType, setSoundType] = useState<SoundType>('brown');
  const [volume, setVolume] = useState(0.3);
  const [isMinimized, setIsMinimized] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const intervalRef = useRef<number | null>(null);

  const stopAudio = () => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (sourceNodeRef.current) {
      try {
        (sourceNodeRef.current as AudioBufferSourceNode).stop?.();
        sourceNodeRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      sourceNodeRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      try {
        audioCtxRef.current.suspend();
      } catch (e) {
        // ignore
      }
    }
  };

  const startAudio = (type: SoundType) => {
    stopAudio();

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContextClass();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.connect(ctx.destination);
    gainNodeRef.current = gainNode;

    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);

    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }
    } else if (type === 'rain') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.04 * white) / 1.04;
        output[i] = lastOut * 2.2;
      }
    } else if (type === 'cafe') {
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.015 * white) / 1.015;
        output[i] = lastOut * 2.8;
      }
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;
    whiteNoise.loop = true;

    // Filter shaping for warm ambient feel
    const filter = ctx.createBiquadFilter();
    filter.type = type === 'white' ? 'highpass' : type === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(type === 'white' ? 1000 : type === 'rain' ? 800 : 400, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    whiteNoise.start();
    sourceNodeRef.current = whiteNoise;
  };

  useEffect(() => {
    if (isPlaying) {
      startAudio(soundType);
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isPlaying, soundType]);

  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  return (
    <div className={`focus-audio-widget ${isMinimized ? 'minimized' : ''}`}>
      {isMinimized ? (
        <button
          type="button"
          className="focus-audio-pill"
          onClick={() => setIsMinimized(false)}
          title="Open Study Ambience / Focus Sound"
        >
          <span>🎧 Focus Ambience</span>
          {isPlaying && <span className="playing-pulse">●</span>}
        </button>
      ) : (
        <div className="focus-audio-card card">
          <div className="focus-audio-head">
            <span className="focus-title">🎧 Study Focus Ambience</span>
            <button
              type="button"
              className="btn-close-widget"
              onClick={() => setIsMinimized(true)}
              aria-label="Minimize focus audio player"
            >
              −
            </button>
          </div>

          <div className="focus-audio-controls">
            <button
              type="button"
              className={`btn-play-pause ${isPlaying ? 'active' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸ Pause' : '▶ Play'}
            </button>

            <select
              value={soundType}
              onChange={(e) => setSoundType(e.target.value as SoundType)}
              className="sound-select"
            >
              <option value="brown">🤎 Brown Noise (Deep Calming)</option>
              <option value="rain">🌧️ Gentle Rain</option>
              <option value="cafe">☕ Soft Café Ambience</option>
              <option value="white">⚪ White Noise</option>
            </select>
          </div>

          <div className="volume-slider-group">
            <span className="volume-icon">🔊</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              aria-label="Ambience volume"
            />
            <span className="volume-pct">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
