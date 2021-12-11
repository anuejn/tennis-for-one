import sounds from "../sounds/*.mp3"
import {pickRandom, registerDeviceMotionEvent, sleep} from "./util";
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
        this.panner.connect(audioCtx.destination);
        this.gain = audioCtx.createGain();
        this.gain.connect(this.panner)
        this.source = audioCtx.createBufferSource();
        this.source.buffer = this.buffer;
        this.source.connect(this.gain);
    }

    start(options: { gain?: number, x?: number, y?: number, z?: number, loop?: boolean, time?: number, offset?: number, duration?: number } = {}) {
        const time = options.time || audioCtx.currentTime;
        const {gain = 1.0, x = 0, y = 0, z = 0, loop = false, offset = 0, duration} = options;
        this.panner.positionX.value = x;
        this.panner.positionY.value = y;
        this.panner.positionZ.value = z;
        this.gain.gain.value = gain;
        this.source.loop = loop;
        this.source.start(time, offset)
        if (duration) {
            this.source.stop(time + duration)
        }
        setTimeout(() => {
            this.preload()
        }, duration * 1000)
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
            callback(last > 0, max);
            triggered = false;
            max = 0;
        }
        last = val;
    });
}

async function onload() {
    const {
        tennis_01,
        tennis_02,
        tennis_03,
        tennis_04,
        tennis_05,
        tennis_bat_01,
        tennis_bat_02,
        meh_01,
        bounce,
        swoosh,
        noise,
        birds
    } = Object.fromEntries(await Promise.all(Object.entries(sounds).map(async ([name, path]) => {
        const data = await fetch(path).then(x => x.arrayBuffer()).then(x => audioCtx.decodeAudioData(x));
        const player = new PreloadedSoundPlayer(data);
        return [name, player]
    })))

    const tennis_sounds = [tennis_01, tennis_02, tennis_03, tennis_04, tennis_05]
    const tennis_bat_sounds = [tennis_bat_01, tennis_bat_02]

    async function startAudio() {
        document.getElementById("start").style.display = 'none';
        document.getElementById("log").innerHTML = "";

        noise.start({loop: true, gain: 0.004})

        async function play_wildlife() {
            const offset = Math.random() * birds.buffer.duration;
            const duration = Math.random() * 5 + 7;
            const current_time = audioCtx.currentTime;
            birds.start({start: current_time, offset, duration, x: (Math.random() -0.5) * 15, y: (Math.random() -0.5) * 5, z: (Math.random() -0.5) * 5})
            birds.gain.gain.value = 0.001;
            birds.gain.gain.linearRampToValueAtTime(0.6, current_time + (duration / 2))
            await sleep(duration / 2)
            birds.gain.gain.linearRampToValueAtTime(0.001, current_time + duration)
            await sleep(duration / 2)

            setTimeout(play_wildlife, Math.random() * 5000)
        }
        play_wildlife()

        let in_a_row = 0;
        let next_allowed = audioCtx.currentTime;
        let last_target = null as null | {
            target_time: number,
            ball_right: boolean,
            timeout: NodeJS.Timeout,
        };

        let my_points = 0;
        let computer_points = 0;

        async function failed(meh_delay = 0) {
            in_a_row = 0;
            last_target = null;
            next_allowed = audioCtx.currentTime + 2;

            const current_time = audioCtx.currentTime;
            bounce.start({gain: 2, z: -5, time: current_time + meh_delay});
            meh_01.start({time: current_time + meh_delay + 1});
            computer_points += 1;
            document.getElementById("game_counter").innerText = `${my_points}:${computer_points}`
        }

        async function batHit(is_right, strength) {
            const tolerance = 0.3;

            let currentTime = audioCtx.currentTime;
            if (currentTime < next_allowed) {
                return
            }

            swoosh.start({gain: 1, x: is_right ? 1 : -1, y: 1})

            let timing = 0;
            // our initial hit
            if (last_target) {
                if (currentTime < last_target.target_time - tolerance) {
                    return;
                } else if (currentTime > last_target.target_time - tolerance && currentTime < last_target.target_time + tolerance) {
                    timing = currentTime - last_target.target_time
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

            document.getElementById("log").innerHTML += `${is_right ? "right" : "left"} ${strength} ${timing}<br/>`;

            const air_time = ((0.9 / (1 + (in_a_row / 30))) - Math.random() / 5) + timing * 2;
            const bounce_time = 0.5 / (1 + (in_a_row / 30)) - Math.random() / 7;
            const my_air_time = ((0.9 / (1 + (in_a_row / 30))) - Math.random() / 2);
            const my_bounce_time = 0.5 / (1 + (in_a_row / 30));

            const other_player_miss = Math.random() - timing < .2 && in_a_row > 2;

            const other_player_right = Math.random() > (0.5 + (is_right ? 0.1 : -0.1));
            let duration = air_time + bounce_time + my_air_time + my_bounce_time;
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
            pickRandom(tennis_bat_sounds).start({x: is_right ? 1 : -1});
            await sleep(air_time);

            if (other_player_miss) {
                // the other players bounce
                pickRandom(tennis_sounds).start({x: (is_right ? 3 : -3), z: 7, y: -2})
                await sleep(bounce_time + 0.2);
                bounce.start({x: is_right ? 7 : -7, z: 10, y: 5, gain: 3});
                clearTimeout(last_target.timeout);
                last_target = null;
                my_points += 1;
                document.getElementById("game_counter").innerText = `${my_points}:${computer_points}`
            } else {
                // the other players bounce
                pickRandom(tennis_sounds).start({x: (is_right ? 3 : -3) + (other_player_right ? 1 : -1), z: 7, y: -2})
                await sleep(bounce_time);
                // the other players bat
                pickRandom(tennis_bat_sounds).start({x: other_player_right ? 7 : -7, z: 10, y: 5})

                // the ball bounces on our side
                await sleep(my_air_time)
                pickRandom(tennis_sounds).start({x: other_player_right ? 1.5 : -1.5, z: 1.5, y: -2})
            }
        }

        initializeMotionSensing(batHit)
        window.addEventListener("keydown", (e) => {
            if (e.key == "ArrowLeft") {
                batHit(false, 1)
            } else if (e.key == "ArrowRight") {
                batHit(true, 1)
            }
        })
    }

    const start = document.getElementById("start");
    start.addEventListener("mousedown", startAudio);
    start.innerText = "START GAME"
}

onload();
