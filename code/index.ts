import {pickRandom, sleep} from "./util";
import {audioCtx, PreloadedSoundPlayer} from "./audio";
import {initializeMotionSensing} from "./input";

import soundDir from "../sounds/**/*.mp3"

interface Directory extends Record<string, string | Directory> {}
interface LoadedDirectory extends Record<string, PreloadedSoundPlayer & LoadedDirectory> {}

async function loadSounds(dir: Directory): Promise<LoadedDirectory> {
    return Object.fromEntries(await Promise.all(Object.entries(dir).map(async ([name, dir]) => {
        if (typeof dir === "string") {
            const data = await fetch(dir).then(x => x.arrayBuffer()).then(x => audioCtx.decodeAudioData(x));
            return [name, new PreloadedSoundPlayer(data)]
        } else {
            return [name, await loadSounds(dir)]
        }
    })))
}

function pick(dir: LoadedDirectory | PreloadedSoundPlayer): PreloadedSoundPlayer {
    if (dir instanceof PreloadedSoundPlayer) {
        return dir
    }
    let values = Object.values(dir).filter(x => x instanceof PreloadedSoundPlayer);
    return pickRandom(values) as PreloadedSoundPlayer;
}

async function onload() {
    const sounds = await loadSounds(soundDir);
    console.log(sounds)

    async function startGame() {
        document.getElementById("start").style.display = 'none';
        document.getElementById("log").innerHTML = "";

        pick(sounds.noise).start({loop: true, gain: 0.004})


        async function play_wildlife() {
            const birds = pick(sounds.birds);

            const offset = Math.random() * birds.buffer.duration;
            const duration = Math.random() * 5 + 7;
            const current_time = audioCtx.currentTime;
            birds.start({
                start: current_time,
                offset,
                duration,
                x: (Math.random() - 0.5) * 15,
                y: (Math.random() - 0.5) * 5,
                z: (Math.random() - 0.5) * 5
            })
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
            pick(sounds.tennis.bounce_failed).start({gain: 2, z: -5, start: current_time + meh_delay});
            pick(sounds.player.negative).start({start: current_time + meh_delay + 1});
            computer_points += 1;
            document.getElementById("game_counter").innerText = `${my_points}:${computer_points}`
        }

        async function batHit(is_right, strength) {
            const tolerance = 0.3;

            let currentTime = audioCtx.currentTime;
            if (currentTime < next_allowed) {
                return
            }

            sounds.tennis.swoosh.start({gain: 1, x: is_right ? 1 : -1, y: 1})

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
            pick(sounds.tennis.bat).start({x: is_right ? 1 : -1});
            await sleep(air_time);

            if (other_player_miss) {
                // the other players bounce
                pick(sounds.tennis.ground_bounce).start({x: (is_right ? 3 : -3), z: 7, y: -2})
                await sleep(bounce_time + 0.2);
                pick(sounds.tennis.bounce_failed).start({x: is_right ? 7 : -7, z: 10, y: 5, gain: 3});
                clearTimeout(last_target.timeout);
                last_target = null;
                my_points += 1;
                document.getElementById("game_counter").innerText = `${my_points}:${computer_points}`
            } else {
                // the other players bounce
                pick(sounds.tennis.ground_bounce).start({x: (is_right ? 3 : -3) + (other_player_right ? 1 : -1), z: 7, y: -2})
                await sleep(bounce_time);
                // the other players bat
                pick(sounds.tennis.bat).start({x: other_player_right ? 7 : -7, z: 10, y: 5})

                // the ball bounces on our side
                await sleep(my_air_time)
                pick(sounds.tennis.ground_bounce).start({x: other_player_right ? 1.5 : -1.5, z: 1.5, y: -2})
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
    start.addEventListener("mousedown", startGame);
    start.innerText = "START GAME"
}

onload();
