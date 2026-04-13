// RAM-sparende Zustände
const S = { NOT_WORN: 1, AWAKE: 2, LIGHT: 3, DEEP: 4, REM: 5 };

function getSleepData() {
  let settings = require("Storage").readJSON("mysleep.json", true) || {
    wearTemp: 27.0, lightMoveTh: 250, lightHrmTh: 110, deepMoveTh: 100, deepHrmTh: 55, remMoveTh: 100, remHrmTh: 90
  };
  
  let rawData = [];
  // Lade die letzten 24 Stunden
  let yesterday = new Date(Date.now() - 86400000);
  
  require("health").readAllRecordsSince(yesterday, (data) => {
    let state = S.AWAKE;
    let isWorn = true;

    // 1. Wear Check (Temperatur vs Z-Achse)
    if (settings.wearTemp > 0 && data.temperature && data.temperature < settings.wearTemp) {
      isWorn = false;
    }

    if (!isWorn) {
      state = S.NOT_WORN;
    } else {
      // 2. Der Wasserfall (Deine neuen Parameter)
      let m = data.movement;
      let h = data.bpm;

      if (m <= settings.remMoveTh && h >= settings.remHrmTh) {
        state = S.REM;
      } else if (m <= settings.deepMoveTh && h > 0 && h <= settings.deepHrmTh) {
        state = S.DEEP;
      } else if (m <= settings.lightMoveTh && (h === 0 || h <= settings.lightHrmTh)) {
        state = S.LIGHT;
      } else {
        state = S.AWAKE; // Bewegung oder Puls zu hoch
      }
    }
    
    // RAM extrem sparsam: Speichere nur den state und die Uhrzeit (Minuten des Tages)
    rawData.push({ time: (data.hr * 60) + data.min, s: state });
  });

  return rawData; //filterMinSleep(rawData);
}

// Löscht "Fake-Schlaf", der kürzer als 3 Blöcke (< 30 Min) ist
function filterMinSleep(data) {
  let seqLen = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].s >= S.LIGHT) {
      seqLen++; // Ist eine Schlafphase
    } else {
      // Phase unterbrochen! War sie zu kurz?
      if (seqLen > 0 && seqLen < 3) {
        for (let j = i - seqLen; j < i; j++) data[j].s = S.AWAKE;
      }
      seqLen = 0;
    }
  }
  // Ende des Arrays prüfen
  if (seqLen > 0 && seqLen < 3) {
    for (let j = data.length - seqLen; j < data.length; j++) data[j].s = S.AWAKE;
  }
  return data;
}

// Zeichnet den Verlauf auf das Display
function drawGraph() {
  g.clear();
  Bangle.drawWidgets();
  
  let data = getSleepData();
  
  g.setFontAlign(0, -1).setFont("6x8");
  g.drawString("Schlaf: Letzte 24h", g.getWidth()/2, 30);

  if (data.length === 0) {
    g.drawString("Keine Health-Daten", g.getWidth()/2, 80);
    return;
  }

  let w = g.getWidth();
  let bottom = g.getHeight() - 20;
  
  // Jeder Datenpunkt (10-Min-Block) bekommt eine feste Breite im Graphen
  let blockWidth = w / data.length;

  data.forEach((d, i) => {
    let x = Math.floor(i * blockWidth);
    let nextX = Math.floor((i + 1) * blockWidth);
    let rectH = 0;
    let col = 0; // Standard: Schwarz

    // Visualisierung je nach Zustand
    switch(d.s) {
      case S.NOT_WORN: col = 0x52AA; rectH = 10; break; // Dunkelgrau
      case S.AWAKE:    col = 0x07E0; rectH = 20; break; // Grün (Aktivität)
      case S.LIGHT:    col = 0x07FF; rectH = 50; break; // Hellblau
      case S.DEEP:     col = 0x001F; rectH = 80; break; // Dunkelblau
      case S.REM:      col = 0xF81F; rectH = 65; break; // Lila
    }

    g.setColor(col);
    g.fillRect(x, bottom - rectH, nextX > x ? nextX : x + 1, bottom);
  });

  // Zeitachse malen
  g.setColor(0xFFFF); // Weiß
  g.drawLine(0, bottom, w, bottom);
  
  // Start- und Endzeit (z.B. 14:20) aus den Minuten des Tages zurückrechnen
  let startT = data[0].time;
  let endT = data[data.length - 1].time;
  
  let fTime = (mins) => Math.floor(mins/60) + ":" + ("0" + (mins%60)).substr(-2);
  
  g.setFontAlign(-1, -1).drawString(fTime(startT), 2, bottom + 4);
  g.setFontAlign(1, -1).drawString(fTime(endT), w - 2, bottom + 4);
}

// App initialisieren
Bangle.loadWidgets();
drawGraph();

// UI Setup: Beim Tippen den Graph neu zeichnen (um auf dem neuesten Stand zu sein)
Bangle.setUI({
  mode: "custom",
  touch: drawGraph
});
