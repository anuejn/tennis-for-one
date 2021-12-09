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
        alert("DeviceMotionEvent is not defined");
    }
}