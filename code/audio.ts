export const audioCtx = new AudioContext();

export class PreloadedSoundPlayer {
    panner: PannerNode;
    source: AudioBufferSourceNode;
    ctx: AudioContext;
    buffer: AudioBuffer;
    gain: GainNode;


    constructor(buffer: AudioBuffer) {
        this.buffer = buffer;

        this.panner = null;
        this.source = null;
        this.gain = null;

        this.preload()
    }

    preload() {
        this.panner = new PannerNode(audioCtx, {
            panningModel: 'HRTF',
        });
        this.panner.connect(audioCtx.destination);
        this.gain = audioCtx.createGain();
        this.gain.connect(this.panner)
        this.source = audioCtx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gain);
    }

    start(options: { gain?: number, x?: number, y?: number, z?: number, loop?: boolean, start?: number, offset?: number, duration?: number } = {}): Promise<void> {
        const current_time = audioCtx.currentTime;
        const start = options.start || current_time;
        const {gain = 1.0, x = 0, y = 0, z = 0, loop = false, offset = 0, duration} = options;
        this.panner.positionX.value = x;
        this.panner.positionY.value = y;
        this.panner.positionZ.value = z;
        this.gain.gain.value = gain;
        this.source.loop = loop;
        this.source.start(start, offset)
        if (duration) {
            this.source.stop(start + duration)
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                this.preload()
                resolve()
            }, (start - current_time + (duration || this.buffer.duration) - offset) * 1000)
        })
    }
}