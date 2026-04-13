(function(back) {
  var filename = "sleeptracker.json";
  // Deine neuen Schwellenwerte als Defaults
  var settings = Object.assign({
    wearTemp: 27.0,
    lightMoveTh: 250,
    lightHrmTh: 110,
    deepMoveTh: 100,
    deepHrmTh: 55,
    remMoveTh: 100,
    remHrmTh: 90
  }, require("Storage").readJSON(filename, true) || {});

  function writeSetting() {
    require("Storage").writeJSON(filename, settings);
  }

  E.showMenu({
    "": { title: /*LANG*/"Sleep Tracker", back: back },
    /*LANG*/"Wear Temp": {
      value: settings.wearTemp, min: 0, max: 40, step: 0.5,
      format: v => v === 0 ? "Off" : v.toFixed(1) + "°C",
      onchange: v => { settings.wearTemp = v; writeSetting(); }
    },
    /*LANG*/"Light Move <=": {
      value: settings.lightMoveTh, min: 100, max: 1000, step: 10,
      onchange: v => { settings.lightMoveTh = v; writeSetting(); }
    },
    /*LANG*/"Light HRM <=": {
      value: settings.lightHrmTh, min: 60, max: 150, step: 1,
      onchange: v => { settings.lightHrmTh = v; writeSetting(); }
    },
    /*LANG*/"Deep Move <=": {
      value: settings.deepMoveTh, min: 10, max: 500, step: 10,
      onchange: v => { settings.deepMoveTh = v; writeSetting(); }
    },
    /*LANG*/"Deep HRM <=": {
      value: settings.deepHrmTh, min: 40, max: 100, step: 1,
      onchange: v => { settings.deepHrmTh = v; writeSetting(); }
    },
    /*LANG*/"REM Move <=": {
      value: settings.remMoveTh, min: 10, max: 500, step: 10,
      onchange: v => { settings.remMoveTh = v; writeSetting(); }
    },
    /*LANG*/"REM HRM >=": {
      value: settings.remHrmTh, min: 50, max: 150, step: 1,
      onchange: v => { settings.remHrmTh = v; writeSetting(); }
    }
  });
})
