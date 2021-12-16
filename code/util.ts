export function sleep(seconds: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve(), seconds * 1000)
    })
}

export function registerDeviceMotionEvent(listener: (e: DeviceMotionEvent) => void) {
    if (typeof (DeviceMotionEvent) !== "undefined" && typeof ((DeviceMotionEvent as any).requestPermission) === "function") {
        (DeviceMotionEvent as any).requestPermission()
            .then(response => {
                if (response == "granted") {
                    window.addEventListener("devicemotion", listener)
                }
            })
            .catch(console.error)
    } else if (typeof (DeviceMotionEvent) !== "undefined") {
        window.addEventListener("devicemotion", listener)
    } else {
        console.warn("DeviceMotionEvent is not defined");
    }
}

export function pickRandom<T>(list: T[]): T {
    return list[Math.round(Math.random() * (list.length - 1))]
}


export function isIos(): boolean {
    return [
        'iPad Simulator',
        'iPhone Simulator',
        'iPod Simulator',
        'iPad',
        'iPhone',
        'iPod'
    ].includes(navigator.platform)
}

export function clamp(min: number, max: number, val: number): number {
    console.log("clamp imput", val)
    return Math.max(min, Math.min(max, val))
}

export function interpolate(input: number, options: { input_min: number, input_max: number, output_min: number, output_max: number }): number {
    return clamp(
        options.output_min,
        options.output_max,
        ((input - options.input_min) / (options.input_max - options.input_min))
        * (options.output_max - options.output_min) + options.output_min
    )
}
