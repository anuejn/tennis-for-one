import sounds from "../sounds/*.ogg"
import {registerDeviceMotionEvent, sleep} from "./util";

const audioCtx = new AudioContext();

class PreloadedSoundPlayer {
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
        this.panner.connect(audioCtx.destination)
        this.gain = audioCtx.createGain();
        this.gain.connect(this.panner)
        this.source = audioCtx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gain);

    }

    start(time?: number, options: { gain?: number, x?: number, y?: number, z?: number } = {}) {
        const {gain = 1.0, x = 0, y = 0, z = 0} = options;
        this.panner.positionX.value = x;
        this.panner.positionY.value = y;
        this.panner.positionZ.value = z;
        this.gain.gain.value = gain;
        this.source.start(time)
        setTimeout(() => {
            this.preload()
        }, this.buffer.duration * 1000)
    }
}

function initializeMotionSensing(callback: (is_right: boolean, strength: number) => void) {
    let rate_limit = 1;
    let last_trigger = audioCtx.currentTime;
    let triggered = false;
    let last = 0;
    let max = 0;
    registerDeviceMotionEvent(function (e) {
        let current_time = audioCtx.currentTime;
        let val = e.acceleration.x;
        if (Math.abs(val) > 15 && (last_trigger + rate_limit < current_time)) {
            triggered = true;
            last_trigger = current_time;
        }

        const grow = Math.sign(last) * last < Math.sign(last) * val;
        if (triggered && grow) {
            max = Math.abs(val);
        }
        if (triggered && !grow) {
            callback(last < 0, max);
            triggered = false;
            max = 0;
        }
        last = val;
    });
}

async function onload() {
    const {
        tennis_02,
        tennis_03,
        tennis_04,
        tennis_05,
        meh_01,
        bounce,
        swoosh,
    } = Object.fromEntries(await Promise.all(Object.entries(sounds).map(async ([name, path]) => {
        const data = await fetch(path).then(x => x.arrayBuffer()).then(x => audioCtx.decodeAudioData(x));
        const player = new PreloadedSoundPlayer(data);
        return [name, player]
    })))

    async function startAudio() {
        document.getElementById("start").style.display = 'none';
        document.getElementById("log").innerHTML = "";


        let in_a_row = 0;
        let next_allowed = audioCtx.currentTime;
        let last_target = null as null | {
            target_time: number,
            ball_right: boolean,
            timeout: number,
        };


        async function failed(meh_delay = 0) {
            in_a_row = 0;
            last_target = null;
            next_allowed = audioCtx.currentTime + 5;

            const current_time = audioCtx.currentTime;
            bounce.start(current_time + meh_delay, {gain: 2, z: -5});
            meh_01.start(current_time + meh_delay + 1);
        }

        async function batHit(is_right, strength) {
            document.getElementById("log").innerHTML += `${is_right ? "right" : "left"} ${strength}<br/>`;

            const air_time = (0.9 / (1 + (in_a_row / 30))) - Math.random() / 10;
            const bounce_time = 0.5 / (1 + (in_a_row / 30)) - Math.random() / 20;
            const tolerance = 0.3;

            let currentTime = audioCtx.currentTime;
            if (currentTime < next_allowed) {
                return
            }

            swoosh.start(0, {gain: 0.05, x: is_right ? 1 : -1, y: 1})

            // our initial hit
            if (last_target) {
                if (currentTime < last_target.target_time - tolerance) {
                    return;
                } else if (currentTime > last_target.target_time - tolerance && currentTime < last_target.target_time + tolerance) {
                    clearTimeout(last_target.timeout);
                    const ball_right = last_target.ball_right;
                    last_target = null;
                    if (ball_right != is_right) {
                        failed(0.5)
                        return
                    } else {
                        in_a_row += 1;
                    }
                }
            }

            const other_player_right = Math.random() > 0.4;
            let duration = air_time + bounce_time + air_time + bounce_time;
            const target_time = currentTime + duration;
            let timeout = setTimeout(() => {
                failed()
            }, (duration + tolerance) * 1000);
            last_target = {
                target_time,
                ball_right: other_player_right,
                timeout
            }

            // we hit the ball
            tennis_05.start(0, {x: is_right ? 1 : -1});
            await sleep(air_time);

            // the other player
            tennis_02.start(0, {x: (is_right ? 3 : -3) + (other_player_right ? 4 : -4), z: 7, y: -2})
            await sleep(bounce_time);
            // bounce on the other players side
            tennis_03.panner.positionZ.value = 10;
            tennis_03.start(0, {x: other_player_right ? 5 : -5, z: 10, y: 5})

            // the ball bounces on our side
            await sleep(air_time)
            tennis_04.start(0, {x: other_player_right ? 1 : -1, z: 2, y: -2})
        }

        initializeMotionSensing(batHit)
        window.addEventListener("keydown", (e) => {
            if (e.key == "ArrowLeft") {
                batHit(false, 0)
            } else if (e.key == "ArrowRight") {
                batHit(true, 0)
            }
        })
    }

    document.getElementById("start").addEventListener("mousedown", startAudio);
}

onload();
