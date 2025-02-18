"use client";
import React, { useEffect, useRef, useState } from 'react';
import freqToNoteName from '../utils/frequencyToNote';
import Button from '../../components/Button';

const Tuner = () => {
  const [note, setNote] = useState('Waiting for input...');
  const [started, setStarted] = useState(false);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const frameIdRef = useRef(null);
  const streamRef = useRef(null);
  const gainNodeRef = useRef(null);

  const startTuner = async () => {
    console.log('Starting tuner...');
    setStarted(true);
    try {
      // Handle different AudioContext implementations
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      console.log('Creating AudioContext...');
      audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });
      console.log('AudioContext state:', audioContextRef.current.state);
      
      // Ensure the context is running
      if (audioContextRef.current.state !== 'running') {
        console.log('Resuming AudioContext...');
        await audioContextRef.current.resume();
        console.log('AudioContext resumed, new state:', audioContextRef.current.state);
      }

      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      console.log('Microphone access granted, creating audio nodes...');
      
      streamRef.current = stream;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Add gain node for volume control
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 1.0;
      
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const bufferLength = analyserRef.current.fftSize;
      dataArrayRef.current = new Float32Array(bufferLength);
      
      // Connect the audio graph
      source
        .connect(gainNodeRef.current)
        .connect(analyserRef.current);
      
      console.log('Audio pipeline setup complete, starting pitch detection...');
      updatePitch();
    } catch (e) {
      console.error('Error in startTuner:', e);
      setNote("Audio initialization error");
    }
  };

  const stopTuner = () => {
    console.log('Stopping tuner...');
    setStarted(false);
    cancelAnimationFrame(frameIdRef.current);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    setNote('Waiting for input...');
  };

  // Continuously update pitch detection
  const updatePitch = () => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getFloatTimeDomainData(dataArrayRef.current);
      const buffer = dataArrayRef.current;
      
      // Log first few samples periodically to verify data
      if (Math.random() < 0.01) { // Log ~1% of frames
        console.log('Audio samples:', buffer.slice(0, 5));
      }
      
      const frequency = autoCorrelate(buffer, audioContextRef.current.sampleRate);
      console.log('Detected frequency:', frequency);
      
      if (frequency !== -1) {
        const detected = freqToNoteName(frequency);
        setNote(detected);
      } else {
        setNote('No signal');
      }
    } else {
      console.warn('Missing analyzer or data array');
    }
    frameIdRef.current = requestAnimationFrame(updatePitch);
  };

  // Simple auto-correlation algorithm for pitch detection
  const autoCorrelate = (buffer, sampleRate) => {
    const SIZE = buffer.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / SIZE);
    console.log("RMS:", rms); // Debugging: Log RMS value
    if (rms < 0.01) return -1; // Signal too weak

    let r1 = 0, r2 = SIZE - 1, threshold = 0.5; // Increased threshold
    for (let i = 0; i < SIZE / 2; i++) {
      if (Math.abs(buffer[i]) < threshold) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < SIZE / 2; i++) {
      if (Math.abs(buffer[SIZE - i]) < threshold) {
        r2 = SIZE - i;
        break;
      }
    }
    const trimmed = buffer.slice(r1, r2);
    const trimmedSize = trimmed.length;
    const correlations = new Array(trimmedSize).fill(0);
    for (let lag = 0; lag < trimmedSize; lag++) {
      for (let i = 0; i < trimmedSize - lag; i++) {
        correlations[lag] += trimmed[i] * trimmed[i + lag];
      }
    }
    let d = 0;
    while (d < correlations.length - 1 && correlations[d] > correlations[d + 1]) d++;
    let maxCorr = -1, bestLag = -1;
    for (let lag = d; lag < correlations.length; lag++) {
      if (correlations[lag] > maxCorr) {
        maxCorr = correlations[lag];
        bestLag = lag;
      }
    }
    if (bestLag === 0) return -1;
    return sampleRate / bestLag;
  };

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div id="tuner-component" className="bg-white p-8 rounded shadow-md max-w-md mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4">Tuner</h1>
      <div id="tuner-controls" className="space-y-4">
        <p className="text-xl">
          {note}
        </p>
        <div className="flex justify-center gap-4">
          {!started ? (
            <Button onClick={startTuner} variant="primary">
              Start Tuner
            </Button>
          ) : (
            <Button onClick={stopTuner} variant="danger">
              Stop Tuner
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tuner;
