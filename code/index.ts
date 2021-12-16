import {interpolate, pickRandom, sleep} from "./util";
import {audioCtx, PreloadedSoundPlayer} from "./audio";
import {asyncBatHit, asyncBatHitTimeout, initializeMotionSensing, registerCallback} from "./input";

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

    async function startGame() {
        document.getElementById("start").style.display = 'none';
        document.getElementById("log").innerHTML = "";

        initializeMotionSensing()

        // create some ambience
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

        // initialize state for the main game loop
        let last_target = null as null | {
            target_time: number,
            ball_right: boolean,
        };
        let in_a_row = 0;
        let player_points = 0;
        let computer_points = 0;
        let remind_to_play = true;

        let narrator_pos = {z: 7, x: -1, y: 0};
        let story = Object.entries(sounds.dev.story).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(x => x[1]);
        let story_progress = 0;
        let narrator_player: PreloadedSoundPlayer = story[0];

        async function failed() {
            in_a_row = 0;
            last_target = null;

            await pick(sounds.tennis.bounce_failed).start({gain: 2, z: -5});
            await sleep(0.2);
            await pick(sounds.player.negative).start({gain: 0.7});
            await sleep(0.5);
            computer_points += 1;
            document.getElementById("game_counter").innerText = `${player_points}:${computer_points}`

            try {
                narrator_player.source.stop(0);
            } catch (e) {

            }
            if (computer_points > player_points + 5) {
                narrator_player = sounds.dev.intro_02;
                narrator_player.start(narrator_pos);
            } else if (computer_points > player_points + 6) {
                narrator_player = sounds.dev.intro_03;
                narrator_player.start(narrator_pos);
            } else if (computer_points > player_points + 6) {
                narrator_player = sounds.dev.intro_04;
                narrator_player.start(narrator_pos);
            } else if (player_points > 2) {
                if (Math.random() > 0.6) {
                    narrator_player = pick(sounds.dev.negative);
                    narrator_player.start(narrator_pos)
                }
            }
        }

        registerCallback((is_right, strength) => {
            sounds.tennis.swoosh.start({gain: 1, x: is_right ? 1 : -1, y: 1});
        })

        narrator_player = sounds.dev.intro_01;
        narrator_player.start(narrator_pos)

        const tolerance = 0.3;
        while (true) {
            let currentTime = audioCtx.currentTime;

            let is_right;
            let timing = 0;
            console.log("waiting for hit", last_target)
            if (last_target) {
                console.log("timing", last_target.target_time - currentTime);
                const hit = await asyncBatHitTimeout(last_target.target_time - currentTime + tolerance);
                if (hit.hit) {
                    currentTime = audioCtx.currentTime;
                    timing = currentTime - last_target.target_time
                    is_right = hit.is_right;
                    console.log("timing", timing)
                    if (is_right != last_target.ball_right || timing < -tolerance) {
                        await failed();
                        continue;
                    }
                    in_a_row += 1;
                } else {
                    await failed();
                    continue;
                }
            } else {
                const hit = await asyncBatHitTimeout(20);
                if (!hit.hit) {
                    if (remind_to_play && computer_points + player_points < 4) {
                        remind_to_play = false;
                        narrator_player = sounds.dev.wirds_bald;
                        await narrator_player.start(narrator_pos)
                    }
                    continue;
                }
                is_right = hit.is_right
            }
            console.log("hit", is_right, timing)

            const interpolate_options = {
                input_min: 0,
                input_max: 7,
                output_min: 0,
            }
            const air_time = ((0.9 / (1 + (in_a_row / 30))) - Math.random() * interpolate(in_a_row, {output_max: 0.2, ...interpolate_options})) + timing;
            const bounce_time = 0.5 / (1 + (in_a_row / 30)) - Math.random() * interpolate(in_a_row, {output_max: 0.15, ...interpolate_options});
            const my_air_time = air_time;
            const my_bounce_time = bounce_time;


            // we hit the ball
            pick(sounds.tennis.bat).start({x: is_right ? 1 : -1});

            // we move the narrator
            const other_player_right = Math.random() > (0.5 + (is_right ? 0.1 : -0.1));
            narrator_pos = {x: other_player_right ? 10 : -10, z: 10, y: 5}
            const end_time = audioCtx.currentTime + air_time + bounce_time;
            narrator_player.panner.positionX.linearRampToValueAtTime(narrator_pos.x, end_time)
            narrator_player.panner.positionY.linearRampToValueAtTime(narrator_pos.y, end_time)
            narrator_player.panner.positionZ.linearRampToValueAtTime(narrator_pos.z, end_time)
            narrator_player.gain.gain.exponentialRampToValueAtTime(2, end_time - 0.1)

            await sleep(air_time);

            const threshold = interpolate(player_points - computer_points, {
                input_min: 0,
                input_max: 12,
                output_min: 0,
                output_max: 0.2
            })
            const other_player_miss = (Math.random() + (timing / 2) <.5 - threshold) && in_a_row > 2;
            if (other_player_miss) {
                // the other players bounce
                console.log("bounce_other")
                pick(sounds.tennis.ground_bounce).start({x: (is_right ? 3 : -3), z: 7, y: -2})
                await sleep(bounce_time + 0.2);
                console.log("other_missed")
                pick(sounds.tennis.bounce_failed).start({x: is_right ? 7 : -7, z: 10, y: 5, gain: 3});
                last_target = null;
                player_points += 1;
                in_a_row = 0;
                document.getElementById("game_counter").innerText = `${player_points}:${computer_points}`
                await sleep(1)
                pick(sounds.player.positive).start({gain: 0.8})
                if (player_points > 2) {
                    await sleep(0.5)
                    narrator_player = story[story_progress];
                    story_progress += 1;
                    narrator_player.start({gain: 1.5, ...narrator_pos})
                }
                continue
            }

            currentTime = audioCtx.currentTime;
            let duration = bounce_time + my_air_time + my_bounce_time;
            const target_time = currentTime + duration;
            last_target = {
                target_time,
                ball_right: other_player_right,
            }

            // the other players bounce
            console.log("bounce_other")
            pick(sounds.tennis.ground_bounce).start({gain: 1.2, x: (is_right && other_player_right ? 2 : -2) + (other_player_right ? 1 : -1), z: 7, y: -2})
            await sleep(bounce_time);
            // the other players bat
            console.log("bat_other")
            if (Math.random() > .7) {
                pick(sounds.dev.huh).start(narrator_pos)
            }
            pick(sounds.tennis.bat).start({gain: 1.2, ...narrator_pos})
            narrator_player.gain.gain.exponentialRampToValueAtTime(1.5, end_time + 0.1)

            // the ball bounces on our side
            await sleep(my_air_time)
            console.log("bounce_me")
            pick(sounds.tennis.ground_bounce).start({gain: 1.2, x: other_player_right ? 1.5 : -1.5, z: 1.5, y: -2})
        }
    }

    const start = document.getElementById("start");
    start.addEventListener("mousedown", startGame);
    start.innerText = "START GAME"
}

onload();
