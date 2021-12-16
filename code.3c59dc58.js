// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"BHXf":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clamp = clamp;
exports.interpolate = interpolate;
exports.isIos = isIos;
exports.pickRandom = pickRandom;
exports.registerDeviceMotionEvent = registerDeviceMotionEvent;
exports.sleep = sleep;

function sleep(seconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), seconds * 1000);
  });
}

function registerDeviceMotionEvent(listener) {
  if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
    DeviceMotionEvent.requestPermission().then(response => {
      if (response == "granted") {
        window.addEventListener("devicemotion", listener);
      }
    }).catch(console.error);
  } else if (typeof DeviceMotionEvent !== "undefined") {
    window.addEventListener("devicemotion", listener);
  } else {
    console.warn("DeviceMotionEvent is not defined");
  }
}

function pickRandom(list) {
  return list[Math.round(Math.random() * (list.length - 1))];
}

function isIos() {
  return ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform);
}

function clamp(min, max, val) {
  console.log("clamp imput", val);
  return Math.max(min, Math.min(max, val));
}

function interpolate(input, options) {
  return clamp(options.output_min, options.output_max, (input - options.input_min) / (options.input_max - options.input_min) * (options.output_max - options.output_min) + options.output_min);
}
},{}],"omPi":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.audioCtx = exports.PreloadedSoundPlayer = void 0;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const audioCtx = new AudioContext();
exports.audioCtx = audioCtx;

class PreloadedSoundPlayer {
  constructor(buffer) {
    _defineProperty(this, "panner", void 0);

    _defineProperty(this, "source", void 0);

    _defineProperty(this, "ctx", void 0);

    _defineProperty(this, "buffer", void 0);

    _defineProperty(this, "gain", void 0);

    this.buffer = buffer;
    this.panner = null;
    this.source = null;
    this.gain = null;
    this.preload();
  }

  preload() {
    this.panner = new PannerNode(audioCtx, {
      panningModel: 'HRTF'
    });
    this.panner.connect(audioCtx.destination);
    this.gain = audioCtx.createGain();
    this.gain.connect(this.panner);
    this.source = audioCtx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.gain);
  }

  start(options = {}) {
    const current_time = audioCtx.currentTime;
    const start = options.start || current_time;
    const {
      gain = 1.0,
      x = 0,
      y = 0,
      z = 0,
      loop = false,
      offset = 0,
      duration
    } = options;
    this.panner.positionX.value = x;
    this.panner.positionY.value = y;
    this.panner.positionZ.value = z;
    this.gain.gain.value = gain;
    this.source.loop = loop;
    this.source.start(start, offset);

    if (duration) {
      this.source.stop(start + duration);
    }

    return new Promise(resolve => {
      setTimeout(() => {
        this.preload();
        resolve();
      }, (start - current_time + (duration || this.buffer.duration) - offset) * 1000);
    });
  }

}

exports.PreloadedSoundPlayer = PreloadedSoundPlayer;
},{}],"QnDB":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.asyncBatHit = asyncBatHit;
exports.asyncBatHitTimeout = asyncBatHitTimeout;
exports.initializeMotionSensing = initializeMotionSensing;
exports.registerCallback = registerCallback;

var _audio = require("./audio");

var _util = require("./util");

let callbacks = [];

function registerCallback(callback) {
  callbacks.push(callback);
  return () => {
    callbacks = callbacks.filter(x => x != callback);
  };
}

function asyncBatHit() {
  return new Promise(resolve => {
    let callback = (is_right, strength) => {
      callbacks = callbacks.filter(x => x != callback);
      resolve({
        is_right,
        strength,
        hit: true
      });
    };

    registerCallback(callback);
  });
}

function asyncBatHitTimeout(timeout) {
  return new Promise(resolve => {
    let callback = (is_right, strength) => {
      callbacks = callbacks.filter(x => x != callback);
      resolve({
        is_right,
        strength,
        hit: true
      });
    };

    setTimeout(() => {
      callbacks = callbacks.filter(x => x != callback);
      resolve({
        hit: false
      });
    }, timeout * 1000);
    registerCallback(callback);
  });
}

function initializeMotionSensing() {
  let rate_limit = 1;
  let last_trigger = _audio.audioCtx.currentTime;
  let triggered = false;
  let last = 0;
  let max = 0;
  window.addEventListener("keydown", e => {
    if (e.key == "ArrowLeft") {
      callbacks.forEach(callback => callback(false, 1));
    } else if (e.key == "ArrowRight") {
      callbacks.forEach(callback => callback(true, 1));
    }
  });
  (0, _util.registerDeviceMotionEvent)(function (e) {
    let current_time = _audio.audioCtx.currentTime;
    let val = e.acceleration.x - e.acceleration.z;

    if (Math.abs(val) > 20 && last_trigger + rate_limit < current_time) {
      triggered = true;
      last_trigger = current_time;
    }

    const grow = Math.sign(last) * last < Math.sign(last) * val;

    if (triggered && grow) {
      max = Math.abs(val);
    }

    if (triggered && !grow) {
      document.getElementById("log").innerHTML += `${e.acceleration.z} ${e.acceleration.x} ${val}<br>`;
      callbacks.forEach(callback => callback(val * ((0, _util.isIos)() ? 1 : -1) > 0, 1));
      triggered = false;
      max = 0;
    }

    last = val;
  });
}
},{"./audio":"omPi","./util":"BHXf"}],"iYCt":[function(require,module,exports) {
module.exports = "birds.ebb650ab.mp3";
},{}],"NSaf":[function(require,module,exports) {
module.exports = "noise.eefa9fd6.mp3";
},{}],"YCqJ":[function(require,module,exports) {
module.exports = "intro_01.04cf6cb2.mp3";
},{}],"kqvr":[function(require,module,exports) {
module.exports = "intro_02.3fc5ce82.mp3";
},{}],"Rcgb":[function(require,module,exports) {
module.exports = "intro_03.d07dadbe.mp3";
},{}],"CtPF":[function(require,module,exports) {
module.exports = "intro_04.f4e187ef.mp3";
},{}],"tSbo":[function(require,module,exports) {
module.exports = "meh_01.a62d4497.mp3";
},{}],"lj8J":[function(require,module,exports) {
module.exports = "meh_02.69e2260a.mp3";
},{}],"Anjc":[function(require,module,exports) {
module.exports = "wirds_bald.c989ecdd.mp3";
},{}],"OH6U":[function(require,module,exports) {
module.exports = "dududududu.8a427179.mp3";
},{}],"wB39":[function(require,module,exports) {
module.exports = "hep.23e9ce25.mp3";
},{}],"tSMc":[function(require,module,exports) {
module.exports = "hep_02.20d25ac3.mp3";
},{}],"LZwr":[function(require,module,exports) {
module.exports = "hihi.b868ef2c.mp3";
},{}],"sg76":[function(require,module,exports) {
module.exports = "nice_try.24c345c2.mp3";
},{}],"TheV":[function(require,module,exports) {
module.exports = "zack.3db210fa.mp3";
},{}],"ztQ7":[function(require,module,exports) {
module.exports = "bounce_failed.29878e09.mp3";
},{}],"mgaI":[function(require,module,exports) {
module.exports = "swoosh.53d2c7da.mp3";
},{}],"DaMF":[function(require,module,exports) {
module.exports = "hep_01.69e2260a.mp3";
},{}],"pRFH":[function(require,module,exports) {
module.exports = "hep_02.4ff4214b.mp3";
},{}],"TNVY":[function(require,module,exports) {
module.exports = "hep_03.2aabc274.mp3";
},{}],"Clh6":[function(require,module,exports) {
module.exports = "hep_04.f56adadc.mp3";
},{}],"vlLP":[function(require,module,exports) {
module.exports = "hep_05.c0006e24.mp3";
},{}],"vHfI":[function(require,module,exports) {
module.exports = "huh_01.70a3db90.mp3";
},{}],"Aa6l":[function(require,module,exports) {
module.exports = "huh_02.374ce1c1.mp3";
},{}],"umVX":[function(require,module,exports) {
module.exports = "huh_03.a4fe2246.mp3";
},{}],"uwm2":[function(require,module,exports) {
module.exports = "huh_05.61f204a6.mp3";
},{}],"HzcU":[function(require,module,exports) {
module.exports = "huh_06.7ad5b3a4.mp3";
},{}],"siti":[function(require,module,exports) {
module.exports = "huh_08.75ba35ef.mp3";
},{}],"DnQ4":[function(require,module,exports) {
module.exports = "01.df38323f.mp3";
},{}],"m1Qf":[function(require,module,exports) {
module.exports = "02.69fa32a2.mp3";
},{}],"T6AT":[function(require,module,exports) {
module.exports = "03.e843104d.mp3";
},{}],"nDOK":[function(require,module,exports) {
module.exports = "04.bcdedb1b.mp3";
},{}],"eDLg":[function(require,module,exports) {
module.exports = "05.46950371.mp3";
},{}],"dzpF":[function(require,module,exports) {
module.exports = "01.23b67faf.mp3";
},{}],"atmj":[function(require,module,exports) {
module.exports = "02.26c0c3bb.mp3";
},{}],"BCXP":[function(require,module,exports) {
module.exports = "03.95896952.mp3";
},{}],"vIfm":[function(require,module,exports) {
module.exports = "04.080310e3.mp3";
},{}],"t8EY":[function(require,module,exports) {
module.exports = "05.97e97543.mp3";
},{}],"rdXJ":[function(require,module,exports) {
module.exports = "06.b24aaff1.mp3";
},{}],"ppPY":[function(require,module,exports) {
module.exports = "07.02392202.mp3";
},{}],"tR6o":[function(require,module,exports) {
module.exports = "08.354a7129.mp3";
},{}],"TzGC":[function(require,module,exports) {
module.exports = "09.e9ded285.mp3";
},{}],"GbEW":[function(require,module,exports) {
module.exports = "10.2a265f10.mp3";
},{}],"D7dt":[function(require,module,exports) {
module.exports = "11.4e6f2a31.mp3";
},{}],"DBPW":[function(require,module,exports) {
module.exports = "12.e1f75b0e.mp3";
},{}],"K2oI":[function(require,module,exports) {
module.exports = "13.6f218505.mp3";
},{}],"RH37":[function(require,module,exports) {
module.exports = "14.ad5f8485.mp3";
},{}],"hVob":[function(require,module,exports) {
module.exports = "15.973dbab6.mp3";
},{}],"t7Vw":[function(require,module,exports) {
module.exports = "16.7910ad6c.mp3";
},{}],"fmvI":[function(require,module,exports) {
module.exports = "mmh.8322d17a.mp3";
},{}],"kGaA":[function(require,module,exports) {
module.exports = "mmpf.956bfb6f.mp3";
},{}],"W6xc":[function(require,module,exports) {
module.exports = "mpf.1ed8953b.mp3";
},{}],"KzRq":[function(require,module,exports) {
module.exports = "noah.c7e43e28.mp3";
},{}],"wg4A":[function(require,module,exports) {
module.exports = "och_noe.4436b5c0.mp3";
},{}],"JVKJ":[function(require,module,exports) {
module.exports = "pff.258d0c47.mp3";
},{}],"oSUV":[function(require,module,exports) {
module.exports = "uff.ed30495e.mp3";
},{}],"bxcE":[function(require,module,exports) {
module.exports = "aujeah.fc46bc2d.mp3";
},{}],"v4ab":[function(require,module,exports) {
module.exports = "hihi.ab923349.mp3";
},{}],"XIZ9":[function(require,module,exports) {
module.exports = "jawollja.013e1a9f.mp3";
},{}],"dz9J":[function(require,module,exports) {
module.exports = "yes.c07ca607.mp3";
},{}],"fBN3":[function(require,module,exports) {
module.exports = "tennis_bat_01.80edbb2f.mp3";
},{}],"gX5f":[function(require,module,exports) {
module.exports = "tennis_bat_02.cc986086.mp3";
},{}],"mZe5":[function(require,module,exports) {
module.exports = "tennis_02.5506db16.mp3";
},{}],"v9PN":[function(require,module,exports) {
module.exports = "tennis_01.32082197.mp3";
},{}],"fg7d":[function(require,module,exports) {
module.exports = "tennis_03.1897bd63.mp3";
},{}],"ksP7":[function(require,module,exports) {
module.exports = "tennis_04.57d0561f.mp3";
},{}],"UOuO":[function(require,module,exports) {
module.exports = "tennis_05.a72ce846.mp3";
},{}],"MhuC":[function(require,module,exports) {
module.exports = {
  "birds": require("./../birds.mp3"),
  "noise": require("./../noise.mp3"),
  "dev": {
    "intro_01": require("./../dev/intro_01.mp3"),
    "intro_02": require("./../dev/intro_02.mp3"),
    "intro_03": require("./../dev/intro_03.mp3"),
    "intro_04": require("./../dev/intro_04.mp3"),
    "meh_01": require("./../dev/meh_01.mp3"),
    "meh_02": require("./../dev/meh_02.mp3"),
    "wirds_bald": require("./../dev/wirds_bald.mp3"),
    "hep": {
      "hep_01": require("./../dev/hep/hep_01.mp3"),
      "hep_02": require("./../dev/hep/hep_02.mp3"),
      "hep_03": require("./../dev/hep/hep_03.mp3"),
      "hep_04": require("./../dev/hep/hep_04.mp3"),
      "hep_05": require("./../dev/hep/hep_05.mp3")
    },
    "huh": {
      "huh_01": require("./../dev/huh/huh_01.mp3"),
      "huh_02": require("./../dev/huh/huh_02.mp3"),
      "huh_03": require("./../dev/huh/huh_03.mp3"),
      "huh_05": require("./../dev/huh/huh_05.mp3"),
      "huh_06": require("./../dev/huh/huh_06.mp3"),
      "huh_08": require("./../dev/huh/huh_08.mp3")
    },
    "negative": {
      "01": require("./../dev/negative/01.mp3"),
      "02": require("./../dev/negative/02.mp3"),
      "03": require("./../dev/negative/03.mp3"),
      "04": require("./../dev/negative/04.mp3"),
      "05": require("./../dev/negative/05.mp3")
    },
    "story": {
      "10": require("./../dev/story/10.mp3"),
      "11": require("./../dev/story/11.mp3"),
      "12": require("./../dev/story/12.mp3"),
      "13": require("./../dev/story/13.mp3"),
      "14": require("./../dev/story/14.mp3"),
      "15": require("./../dev/story/15.mp3"),
      "16": require("./../dev/story/16.mp3"),
      "01": require("./../dev/story/01.mp3"),
      "02": require("./../dev/story/02.mp3"),
      "03": require("./../dev/story/03.mp3"),
      "04": require("./../dev/story/04.mp3"),
      "05": require("./../dev/story/05.mp3"),
      "06": require("./../dev/story/06.mp3"),
      "07": require("./../dev/story/07.mp3"),
      "08": require("./../dev/story/08.mp3"),
      "09": require("./../dev/story/09.mp3")
    }
  },
  "player": {
    "dududududu": require("./../player/dududududu.mp3"),
    "hep": require("./../player/hep.mp3"),
    "hep_02": require("./../player/hep_02.mp3"),
    "hihi": require("./../player/hihi.mp3"),
    "nice_try": require("./../player/nice_try.mp3"),
    "zack": require("./../player/zack.mp3"),
    "negative": {
      "mmh": require("./../player/negative/mmh.mp3"),
      "mmpf": require("./../player/negative/mmpf.mp3"),
      "mpf": require("./../player/negative/mpf.mp3"),
      "noah": require("./../player/negative/noah.mp3"),
      "och_noe": require("./../player/negative/och_noe.mp3"),
      "pff": require("./../player/negative/pff.mp3"),
      "uff": require("./../player/negative/uff.mp3")
    },
    "positive": {
      "aujeah": require("./../player/positive/aujeah.mp3"),
      "hihi": require("./../player/positive/hihi.mp3"),
      "jawollja": require("./../player/positive/jawollja.mp3"),
      "yes": require("./../player/positive/yes.mp3")
    }
  },
  "tennis": {
    "bounce_failed": require("./../tennis/bounce_failed.mp3"),
    "swoosh": require("./../tennis/swoosh.mp3"),
    "bat": {
      "tennis_bat_01": require("./../tennis/bat/tennis_bat_01.mp3"),
      "tennis_bat_02": require("./../tennis/bat/tennis_bat_02.mp3")
    },
    "ground_bounce": {
      "tennis_02": require("./../tennis/ground_bounce/tennis_02.mp3"),
      "tennis_01": require("./../tennis/ground_bounce/tennis_01.mp3"),
      "tennis_03": require("./../tennis/ground_bounce/tennis_03.mp3"),
      "tennis_04": require("./../tennis/ground_bounce/tennis_04.mp3"),
      "tennis_05": require("./../tennis/ground_bounce/tennis_05.mp3")
    }
  }
};
},{"./../birds.mp3":"iYCt","./../noise.mp3":"NSaf","./../dev/intro_01.mp3":"YCqJ","./../dev/intro_02.mp3":"kqvr","./../dev/intro_03.mp3":"Rcgb","./../dev/intro_04.mp3":"CtPF","./../dev/meh_01.mp3":"tSbo","./../dev/meh_02.mp3":"lj8J","./../dev/wirds_bald.mp3":"Anjc","./../player/dududududu.mp3":"OH6U","./../player/hep.mp3":"wB39","./../player/hep_02.mp3":"tSMc","./../player/hihi.mp3":"LZwr","./../player/nice_try.mp3":"sg76","./../player/zack.mp3":"TheV","./../tennis/bounce_failed.mp3":"ztQ7","./../tennis/swoosh.mp3":"mgaI","./../dev/hep/hep_01.mp3":"DaMF","./../dev/hep/hep_02.mp3":"pRFH","./../dev/hep/hep_03.mp3":"TNVY","./../dev/hep/hep_04.mp3":"Clh6","./../dev/hep/hep_05.mp3":"vlLP","./../dev/huh/huh_01.mp3":"vHfI","./../dev/huh/huh_02.mp3":"Aa6l","./../dev/huh/huh_03.mp3":"umVX","./../dev/huh/huh_05.mp3":"uwm2","./../dev/huh/huh_06.mp3":"HzcU","./../dev/huh/huh_08.mp3":"siti","./../dev/negative/01.mp3":"DnQ4","./../dev/negative/02.mp3":"m1Qf","./../dev/negative/03.mp3":"T6AT","./../dev/negative/04.mp3":"nDOK","./../dev/negative/05.mp3":"eDLg","./../dev/story/01.mp3":"dzpF","./../dev/story/02.mp3":"atmj","./../dev/story/03.mp3":"BCXP","./../dev/story/04.mp3":"vIfm","./../dev/story/05.mp3":"t8EY","./../dev/story/06.mp3":"rdXJ","./../dev/story/07.mp3":"ppPY","./../dev/story/08.mp3":"tR6o","./../dev/story/09.mp3":"TzGC","./../dev/story/10.mp3":"GbEW","./../dev/story/11.mp3":"D7dt","./../dev/story/12.mp3":"DBPW","./../dev/story/13.mp3":"K2oI","./../dev/story/14.mp3":"RH37","./../dev/story/15.mp3":"hVob","./../dev/story/16.mp3":"t7Vw","./../player/negative/mmh.mp3":"fmvI","./../player/negative/mmpf.mp3":"kGaA","./../player/negative/mpf.mp3":"W6xc","./../player/negative/noah.mp3":"KzRq","./../player/negative/och_noe.mp3":"wg4A","./../player/negative/pff.mp3":"JVKJ","./../player/negative/uff.mp3":"oSUV","./../player/positive/aujeah.mp3":"bxcE","./../player/positive/hihi.mp3":"v4ab","./../player/positive/jawollja.mp3":"XIZ9","./../player/positive/yes.mp3":"dz9J","./../tennis/bat/tennis_bat_01.mp3":"fBN3","./../tennis/bat/tennis_bat_02.mp3":"gX5f","./../tennis/ground_bounce/tennis_02.mp3":"mZe5","./../tennis/ground_bounce/tennis_01.mp3":"v9PN","./../tennis/ground_bounce/tennis_03.mp3":"fg7d","./../tennis/ground_bounce/tennis_04.mp3":"ksP7","./../tennis/ground_bounce/tennis_05.mp3":"UOuO"}],"QCba":[function(require,module,exports) {
"use strict";

var _util = require("./util");

var _audio = require("./audio");

var _input = require("./input");

var _ = _interopRequireDefault(require("../sounds/**/*.mp3"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

async function loadSounds(dir) {
  return Object.fromEntries(await Promise.all(Object.entries(dir).map(async ([name, dir]) => {
    if (typeof dir === "string") {
      const data = await fetch(dir).then(x => x.arrayBuffer()).then(x => _audio.audioCtx.decodeAudioData(x));
      return [name, new _audio.PreloadedSoundPlayer(data)];
    } else {
      return [name, await loadSounds(dir)];
    }
  })));
}

function pick(dir) {
  if (dir instanceof _audio.PreloadedSoundPlayer) {
    return dir;
  }

  let values = Object.values(dir).filter(x => x instanceof _audio.PreloadedSoundPlayer);
  return (0, _util.pickRandom)(values);
}

async function onload() {
  const sounds = await loadSounds(_.default);

  async function startGame() {
    document.getElementById("start").style.display = 'none';
    document.getElementById("log").innerHTML = "";
    (0, _input.initializeMotionSensing)(); // create some ambience

    pick(sounds.noise).start({
      loop: true,
      gain: 0.004
    });

    async function play_wildlife() {
      const birds = pick(sounds.birds);
      const offset = Math.random() * birds.buffer.duration;
      const duration = Math.random() * 5 + 7;
      const current_time = _audio.audioCtx.currentTime;
      birds.start({
        start: current_time,
        offset,
        duration,
        x: (Math.random() - 0.5) * 15,
        y: (Math.random() - 0.5) * 5,
        z: (Math.random() - 0.5) * 5
      });
      birds.gain.gain.value = 0.001;
      birds.gain.gain.linearRampToValueAtTime(0.6, current_time + duration / 2);
      await (0, _util.sleep)(duration / 2);
      birds.gain.gain.linearRampToValueAtTime(0.001, current_time + duration);
      await (0, _util.sleep)(duration / 2);
      setTimeout(play_wildlife, Math.random() * 5000);
    }

    play_wildlife(); // initialize state for the main game loop

    let last_target = null;
    let in_a_row = 0;
    let player_points = 0;
    let computer_points = 0;
    let remind_to_play = true;
    let narrator_pos = {
      z: 7,
      x: -1,
      y: 0
    };
    let story = Object.entries(sounds.dev.story).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).map(x => x[1]);
    let story_progress = 0;
    let narrator_player = story[0];

    async function failed() {
      in_a_row = 0;
      last_target = null;
      await pick(sounds.tennis.bounce_failed).start({
        gain: 2,
        z: -5
      });
      await (0, _util.sleep)(0.2);
      await pick(sounds.player.negative).start({
        gain: 0.7
      });
      await (0, _util.sleep)(0.5);
      computer_points += 1;
      document.getElementById("game_counter").innerText = `${player_points}:${computer_points}`;

      try {
        narrator_player.source.stop(0);
      } catch (e) {}

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
          narrator_player.start(narrator_pos);
        }
      }
    }

    (0, _input.registerCallback)((is_right, strength) => {
      sounds.tennis.swoosh.start({
        gain: 1,
        x: is_right ? 1 : -1,
        y: 1
      });
    });
    narrator_player = sounds.dev.intro_01;
    narrator_player.start(narrator_pos);
    const tolerance = 0.3;

    while (true) {
      let currentTime = _audio.audioCtx.currentTime;
      let is_right;
      let timing = 0;
      console.log("waiting for hit", last_target);

      if (last_target) {
        console.log("timing", last_target.target_time - currentTime);
        const hit = await (0, _input.asyncBatHitTimeout)(last_target.target_time - currentTime + tolerance);

        if (hit.hit) {
          currentTime = _audio.audioCtx.currentTime;
          timing = currentTime - last_target.target_time;
          is_right = hit.is_right;
          console.log("timing", timing);

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
        const hit = await (0, _input.asyncBatHitTimeout)(20);

        if (!hit.hit) {
          if (remind_to_play && computer_points + player_points < 4) {
            remind_to_play = false;
            narrator_player = sounds.dev.wirds_bald;
            await narrator_player.start(narrator_pos);
          }

          continue;
        }

        is_right = hit.is_right;
      }

      console.log("hit", is_right, timing);
      const interpolate_options = {
        input_min: 0,
        input_max: 7,
        output_min: 0
      };
      const air_time = 0.9 / (1 + in_a_row / 30) - Math.random() * (0, _util.interpolate)(in_a_row, {
        output_max: 0.2,
        ...interpolate_options
      }) + timing;
      const bounce_time = 0.5 / (1 + in_a_row / 30) - Math.random() * (0, _util.interpolate)(in_a_row, {
        output_max: 0.15,
        ...interpolate_options
      });
      const my_air_time = air_time;
      const my_bounce_time = bounce_time; // we hit the ball

      pick(sounds.tennis.bat).start({
        x: is_right ? 1 : -1
      }); // we move the narrator

      const other_player_right = Math.random() > 0.5 + (is_right ? 0.1 : -0.1);
      narrator_pos = {
        x: other_player_right ? 10 : -10,
        z: 10,
        y: 5
      };
      const end_time = _audio.audioCtx.currentTime + air_time + bounce_time;
      narrator_player.panner.positionX.linearRampToValueAtTime(narrator_pos.x, end_time);
      narrator_player.panner.positionY.linearRampToValueAtTime(narrator_pos.y, end_time);
      narrator_player.panner.positionZ.linearRampToValueAtTime(narrator_pos.z, end_time);
      narrator_player.gain.gain.exponentialRampToValueAtTime(2, end_time - 0.1);
      await (0, _util.sleep)(air_time);
      const threshold = (0, _util.interpolate)(player_points - computer_points, {
        input_min: 0,
        input_max: 12,
        output_min: 0,
        output_max: 0.2
      });
      const other_player_miss = Math.random() + timing / 2 < .5 - threshold && in_a_row > 2;

      if (other_player_miss) {
        // the other players bounce
        console.log("bounce_other");
        pick(sounds.tennis.ground_bounce).start({
          x: is_right ? 3 : -3,
          z: 7,
          y: -2
        });
        await (0, _util.sleep)(bounce_time + 0.2);
        console.log("other_missed");
        pick(sounds.tennis.bounce_failed).start({
          x: is_right ? 7 : -7,
          z: 10,
          y: 5,
          gain: 3
        });
        last_target = null;
        player_points += 1;
        in_a_row = 0;
        document.getElementById("game_counter").innerText = `${player_points}:${computer_points}`;
        await (0, _util.sleep)(1);
        pick(sounds.player.positive).start({
          gain: 0.8
        });

        if (player_points > 2) {
          await (0, _util.sleep)(0.5);
          narrator_player = story[story_progress];
          story_progress += 1;
          narrator_player.start({
            gain: 1.5,
            ...narrator_pos
          });
        }

        continue;
      }

      currentTime = _audio.audioCtx.currentTime;
      let duration = bounce_time + my_air_time + my_bounce_time;
      const target_time = currentTime + duration;
      last_target = {
        target_time,
        ball_right: other_player_right
      }; // the other players bounce

      console.log("bounce_other");
      pick(sounds.tennis.ground_bounce).start({
        gain: 1.2,
        x: (is_right && other_player_right ? 2 : -2) + (other_player_right ? 1 : -1),
        z: 7,
        y: -2
      });
      await (0, _util.sleep)(bounce_time); // the other players bat

      console.log("bat_other");

      if (Math.random() > .7) {
        pick(sounds.dev.huh).start(narrator_pos);
      }

      pick(sounds.tennis.bat).start({
        gain: 1.2,
        ...narrator_pos
      });
      narrator_player.gain.gain.exponentialRampToValueAtTime(1.5, end_time + 0.1); // the ball bounces on our side

      await (0, _util.sleep)(my_air_time);
      console.log("bounce_me");
      pick(sounds.tennis.ground_bounce).start({
        gain: 1.2,
        x: other_player_right ? 1.5 : -1.5,
        z: 1.5,
        y: -2
      });
    }
  }

  const start = document.getElementById("start");
  start.addEventListener("mousedown", startGame);
  start.innerText = "START GAME";
}

onload();
},{"./util":"BHXf","./audio":"omPi","./input":"QnDB","../sounds/**/*.mp3":"MhuC"}]},{},["QCba"], null)
//# sourceMappingURL=code.3c59dc58.js.map