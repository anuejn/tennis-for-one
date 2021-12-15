import {audioCtx} from "./audio";
import {registerDeviceMotionEvent} from "./util";

type Callback = (is_right: boolean, strength: number) => void;
type Unregister = () => void;

let callbacks: Callback[] = [];

export function registerCallback(callback: Callback): Unregister {
    callbacks.push(callback);
    return () => {
        callbacks = callbacks.filter(x => x != callback)
    }
}

export function asyncBatHit(): Promise<{is_right: boolean, strength: number, hit: true}> {
    return new Promise(resolve => {
        let callback = (is_right, strength) => {
            callbacks = callbacks.filter(x => x != callback)
            resolve({is_right, strength, hit: true})
        };
        registerCallback(callback)
    })
}
export function asyncBatHitTimeout(timeout: number): Promise<{is_right: boolean, strength: number, hit: true} | {hit: false}> {
    return new Promise(resolve => {
        let callback = (is_right, strength) => {
            callbacks = callbacks.filter(x => x != callback)
            resolve({is_right, strength, hit: true})
        };
        setTimeout(() => {
            callbacks = callbacks.filter(x => x != callback)
            resolve({hit: false});
        }, timeout * 1000);

        registerCallback(callback)
    })
}

export function initializeMotionSensing(): void {
    let rate_limit = 1;
    let last_trigger = audioCtx.currentTime;
    let triggered = false;
    let last = 0;
    let max = 0;

    window.addEventListener("keydown", (e) => {
        if (e.key == "ArrowLeft") {
            callbacks.forEach(callback => callback(false, 1))
        } else if (e.key == "ArrowRight") {
            callbacks.forEach(callback => callback(true, 1))
        }
    })

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
            callbacks.forEach(callback => callback(false, 1))
            triggered = false;
            max = 0;
        }
        last = val;
    });
}