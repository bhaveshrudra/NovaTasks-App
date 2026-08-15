class AmbientSynth {
  private ctx: AudioContext | null = null;
  private currentSource: AudioNode | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private volume: number = 0.5;
  private isPlaying: boolean = false;
  private activeSound: 'rain' | 'cyber' | 'space' | null = null;

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.volume = val;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(val * 0.15, this.ctx?.currentTime || 0);
    }
  }

  public stop() {
    this.isPlaying = false;
    this.activeSound = null;
    
    try {
      if (this.currentSource) {
        (this.currentSource as any).stop?.();
        this.currentSource.disconnect();
        this.currentSource = null;
      }
      if (this.noiseNode) {
        (this.noiseNode as any).stop?.();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      this.oscillators.forEach(osc => {
        try { osc.stop(); } catch(e){}
        osc.disconnect();
      });
      this.oscillators = [];
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    } catch (e) {
      console.error("Audio stop error", e);
    }
  }

  public play(type: 'rain' | 'cyber' | 'space') {
    this.stop();
    this.initCtx();
    
    if (!this.ctx) return;
    this.isPlaying = true;
    this.activeSound = type;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.15, this.ctx.currentTime);
    gain.connect(this.ctx.destination);
    this.gainNode = gain;

    if (type === 'rain') {
      // White noise for rain sound
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Filter to sound like rain/rustle
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 1.0;

      whiteNoise.connect(filter);
      filter.connect(gain);
      whiteNoise.start();
      this.noiseNode = whiteNoise;
    } else if (type === 'cyber') {
      // Deep space ship engine hum (low square wave + lowpass filter modulation)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      
      osc1.type = 'sawtooth';
      osc1.frequency.value = 55; // low A
      
      osc2.type = 'triangle';
      osc2.frequency.value = 55.2; // detuned detent
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 150;
      filter.Q.value = 3.0;

      // Slow LFO to sweep filter frequency for ambient wind feel
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.15; // slow sweep
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 60;

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);

      osc1.start();
      osc2.start();
      lfo.start();

      this.oscillators = [osc1, osc2, lfo];
    } else if (type === 'space') {
      // Cosmic bells / harmonic drifting oscillators
      const frequencies = [110, 220, 330, 440, 550, 660];
      frequencies.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq + (Math.random() * 3 - 1.5), this.ctx!.currentTime);
        
        // Tremolo LFO for cosmic shimmer
        const tremolo = this.ctx!.createGain();
        const lfo = this.ctx!.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.5 + idx * 0.1;
        
        const lfoGain = this.ctx!.createGain();
        lfoGain.gain.value = 0.3;
        
        lfo.connect(lfoGain);
        lfoGain.connect(tremolo.gain);
        
        osc.connect(tremolo);
        tremolo.connect(gain);
        
        osc.start();
        lfo.start();
        
        this.oscillators.push(osc, lfo);
      });
    }
  }

  public getActiveSound() {
    return this.activeSound;
  }

  public playAlarmSound() {
    this.stop();
    this.initCtx();
    if (!this.ctx) return;
    this.isPlaying = true;
    this.activeSound = 'alarm' as any;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.5, this.ctx.currentTime);
    gain.connect(this.ctx.destination);
    this.gainNode = gain;

    // Elegant high-tech 2-tone alarm sequence
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 2.5; // oscillate at 2.5 Hz

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 180; // modulate by 180 Hz

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    osc.connect(gain);
    osc.start();
    lfo.start();

    this.oscillators = [osc, lfo];
  }
}

export const ambientSynth = new AmbientSynth();
