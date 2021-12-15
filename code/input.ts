import {audioCtx} from "./audio";
import {registerDeviceMotionEvent} from "./util";

export function initializeMotionSensing(callback: (is_right: boolean, strength: number) => void) {
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