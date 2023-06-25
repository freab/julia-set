// Sound class
export default class Sound {
  constructor(src, bpm, offset, onReady, loop = false) {
    this.audio = new Audio(src);
    this.audio.loop = loop;
    this.isPlaying = false;
    this.duration = 0;
    this.time = 0;
    this.onReady = onReady;

    // Calculate duration based on BPM and offset
    if (bpm && offset) {
      const secondsPerBeat = 60 / bpm;
      this.duration = this.audio.duration;
      this.time = offset * secondsPerBeat;
    }

    this.audio.addEventListener("loadeddata", () => {
      this.duration = this.audio.duration;
      this.onReady();
    });
  }

  play() {
    this.audio.play();
    this.isPlaying = true;
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
  }

  set volume(value) {
    this.audio.volume = value;
  }

  get volume() {
    return this.audio.volume;
  }

  createKick(options) {
    return new Kick(this.audio, options);
  }

  createBeat(options) {
    return new Beat(this.audio, options);
  }
}

// Kick class
class Kick {
  constructor(audio, options) {
    this.audio = audio;
    this.context = new AudioContext();
    this.source = this.context.createMediaElementSource(this.audio);
    this.analyser = this.context.createAnalyser();
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.frequency = options.frequency || 20;
    this.threshold = options.threshold || 0.3;
    this.decay = options.decay || 0.02;
    this.onKick = options.onKick || (() => {});
    this.offKick = options.offKick || (() => {});

    this.kickDetected = false;

    this.analyser.fftSize = 64;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  on() {
    this.kickDetected = false;
    this.checkKick();
  }

  off() {
    this.kickDetected = false;
  }

  checkKick() {
    requestAnimationFrame(() => {
      this.analyser.getByteFrequencyData(this.dataArray);

      const average = this.getAverageAmplitude();

      if (average > this.threshold && !this.kickDetected) {
        this.kickDetected = true;
        this.onKick(average);
      }

      if (average <= this.threshold && this.kickDetected) {
        this.kickDetected = false;
        this.offKick(average);
      }

      this.checkKick();
    });
  }

  getAverageAmplitude() {
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.bufferLength;
  }
}

// Beat class
class Beat {
  constructor(audio, options) {
    this.audio = audio;
    this.context = new AudioContext();
    this.source = this.context.createMediaElementSource(this.audio);
    this.analyser = this.context.createAnalyser();
    this.source.connect(this.analyser);
    this.analyser.connect(this.context.destination);

    this.factor = options.factor || 2;
    this.onBeat = options.onBeat || (() => {});

    this.beatDetected = false;

    this.analyser.fftSize = 64;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);
  }

  on() {
    this.beatDetected = false;
    this.checkBeat();
  }

  off() {
    this.beatDetected = false;
  }

  checkBeat() {
    requestAnimationFrame(() => {
      this.analyser.getByteFrequencyData(this.dataArray);

      const average = this.getAverageAmplitude();

      if (average > this.factor && !this.beatDetected) {
        this.beatDetected = true;
        this.onBeat();
      }

      if (average <= this.factor && this.beatDetected) {
        this.beatDetected = false;
      }

      this.checkBeat();
    });
  }

  getAverageAmplitude() {
    let sum = 0;
    for (let i = 0; i < this.bufferLength; i++) {
      sum += this.dataArray[i];
    }
    return sum / this.bufferLength;
  }
}
