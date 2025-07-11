---
title: Interactive Piano
author: d093w1z
date: 2025-06-18T18:11:15.000Z
lastmod: 2025-06-18T18:11:15.000Z
description: null
tags:
  - usb-c
  - usb
  - power
categories:
  - hardware
  - technology
  - device
slug: piano
draft: false
toc: true
---

<iframe id="myFrame" width="100%" height="900px" srcdoc='<!DOCTYPE html>
<html lang="en">

<head>
  <meta name="viewport" content="width=device-width">

  <meta charset="UTF-8">
  <title>Improved Piano Roll DAW</title>
  <style>
    body {
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #222;
      color: #ddd;
      margin: 0;
      padding: 20px;
    }

    #controls {
      margin: 10px;
    }

    #controls input,
    #controls select,
    #controls button {
      margin-left: 5px;
      margin-right: 5px;
      padding: 4px 6px;
    }

    #main-container {
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      align-items: flex-end;
    }

    #piano-roll-container {
      display: flex;
    }

    #piano {
      display: flex;
      flex-direction: column;
      margin-right: 2px;
    }

    .key {
      width: 50px;
      height: 16px;
      background: #eee;
      border: 1px solid #999;
      text-align: center;
      line-height: 16px;
      font-size: 11px;
      color: #000;
      cursor: pointer;
    }

    #piano-roll {
      display: grid;
      grid-template-columns: repeat(16, 32px);
    }

    #timing-bar {
      display: grid;
      grid-template-columns: repeat(16, 31px);
      gap: 1px;
      margin-bottom: 2px;
      margin-top: 2px;

    }

    .time-cell {
      width: 30px;
      height: 8px;
      background: #666;
    }

    .current-step {
      background: #ff0 !important;
    }

    #piano-roll {
      user-select: none;
      background: #444;
      grid-template-rows: repeat(36, 18px);
    }

    .cell {
      background: #333;
      border: 1px solid #555;
    }

    .active {
      background: #0f0;
    }

    .playing {
      outline: 2px solid #ff0;
    }

  </style>
</head>

<body>

  <h2>Improved Piano Roll DAW</h2>
  <div id="controls">
    <button id="play">Play</button>
    <button id="stop">Stop</button>
    <button id="clear">Clear All</button>
    BPM: <input type="number" id="bpm" value="120" min="30" max="300" style="width:60px;">
    Instrument:
    <select id="instrument">
      <option value="synth">Synth</option>
      <option value="piano">Piano</option>
    </select>
    <button id="save">Save</button>
    <button id="load">Load</button>
    <button id="export">Export MIDI</button>
  </div>

  <div id="main-container">
    <div id="timing-bar"></div>
    <div id="piano-roll-container">
      <div id="piano"></div>
      <div id="piano-roll"></div>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.39/Tone.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/midiwriter-js@2.1.3/dist/MidiWriter.min.js"></script>
  <script>
    // Build note list for C3 to C5

    const MidiWriter = window.MidiWriter;

    const octaves = [5, 4, 3];
    const noteNames = ["B", "A#", "A", "G#", "G", "F#", "F", "E", "D#", "D", "C#", "C"];
    const notes = [];
    octaves.forEach(oct => {
      noteNames.forEach(note => {
        notes.push(note + oct);
      });
    });
    const rows = notes.length;
    const cols = 16;

    const gridMarkingColor = "#fff";

    const grid = [];
    const pianoRoll = document.getElementById("piano-roll");
    const piano = document.getElementById("piano");
    const timingBar = document.getElementById("timing-bar");

    const timeCells = [];
    for (let x = 0; x < cols; x++) {
      const tcell = document.createElement("div");
      tcell.className = "time-cell";
      timingBar.appendChild(tcell);
      timeCells.push(tcell);
    }

    const cellMap = [];

    // Build piano keyboard and grid
    for (let y = 0; y < rows; y++) {
      grid[y] = [];
      const key = document.createElement("div");
      key.className = "key";
      key.textContent = notes[y];
      key.style.background = notes[y].includes("#") ? "#444" : "#eee";
      key.style.color = notes[y].includes("#") ? "#fff" : "#000";
      key.addEventListener("click", async () => {
        await Tone.start();
        synth.triggerAttackRelease(notes[y], "8n");
      });
      piano.appendChild(key);

      cellMap[y] = [];

      for (let x = 0; x < cols; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = x;
        cell.dataset.y = y;
        if (y % 12 === 11)
          cell.style.borderBottomColor = gridMarkingColor;
        if (x % 4 === 3)
          cell.style.borderRightColor = gridMarkingColor;
        cell.addEventListener("mousedown", (e) => handleCellAction(e, cell));
        cell.addEventListener("mouseenter", (e) => {
          if (mouseDown) handleCellAction(e, cell);
        });
        pianoRoll.appendChild(cell);
        cellMap[y][x] = cell;
        grid[y][x] = false;
      }
    }

    let mouseDown = false;
    let mouseButton = 0;

    document.addEventListener("mousedown", (e) => {
      mouseDown = true;
      mouseButton = e.button; // 0 = left, 2 = right
    });

    document.addEventListener("mouseup", () => {
      mouseDown = false;
    });

    function handleCellAction(e, cell) {
      e.preventDefault();
      const x = cell.dataset.x;
      const y = cell.dataset.y;
      if (mouseButton === 2) {
        cell.classList.remove("active");
        grid[y][x] = false;
      } else if (mouseButton === 0) {
        cell.classList.add("active");
        grid[y][x] = true;
      }
    }


    pianoRoll.addEventListener("contextmenu", e => e.preventDefault());

    let synth = new Tone.PolySynth().toDestination();
    let step = 0, scheduledEvent = null;

    function clearIndicators() {
      document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));
      timeCells.forEach(c => c.classList.remove("current-step"));
    }

    document.getElementById("play").addEventListener("click", async () => {
      await Tone.start();
      Tone.Transport.bpm.value = parseInt(document.getElementById("bpm").value);
      step = 0;
      if (scheduledEvent) Tone.Transport.clear(scheduledEvent);

      const instrument = document.getElementById("instrument").value;
      synth = instrument === "piano"
        ? new Tone.Sampler({ urls: { C4: "C4.mp3" }, baseUrl: "https://tonejs.github.io/audio/salamander/" }).toDestination()
        : new Tone.PolySynth().toDestination();

      let lastStep = null;

      scheduledEvent = Tone.Transport.scheduleRepeat((time) => {

        if (lastStep !== null) {
          timeCells[lastStep].classList.remove("current-step");
          for (let y = 0; y < rows; y++) {
            const cell = cellMap[y][lastStep];
            cell.classList.remove("playing");
          }
        }

        timeCells[step].classList.add("current-step");
        for (let y = 0; y < rows; y++) {
          const cell = cellMap[y][step];
          if (grid[y][step]) {
            synth.triggerAttackRelease(notes[y], "8n", time);
            cell.classList.add("playing");
          }
        }
        lastStep = step;

        step = (step + 1) % cols;
      }, "8n");

      Tone.Transport.start();
    });

    document.getElementById("stop").addEventListener("click", () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      clearIndicators();
    });

    document.getElementById("clear").addEventListener("click", () => {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          grid[y][x] = false;
          const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
          cell.classList.remove("active");
        }
      }
    });

    document.getElementById("bpm").addEventListener("change", (e) => {
      Tone.Transport.bpm.value = parseInt(e.target.value);
    });

    document.getElementById("save").addEventListener("click", () => {
      localStorage.setItem("pianoPattern", JSON.stringify(grid));
      alert("Pattern saved!");
    });

    document.getElementById("load").addEventListener("click", () => {
      const saved = JSON.parse(localStorage.getItem("pianoPattern"));
      if (saved) {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++) {
            grid[y][x] = saved[y][x];
            const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
            cell.classList.toggle("active", grid[y][x]);
          }
        }
        alert("Pattern loaded!");
      }
    });

    document.getElementById("export").addEventListener("click", () => {
      const track = new MidiWriter.Track();
      track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
      for (let x = 0; x < cols; x++) {
        for (let y = 0; y < rows; y++) {
          if (grid[y][x]) {
            track.addEvent(new MidiWriter.NoteEvent({ pitch: [notes[y]], duration: "8" }));
          }
        }
      }
      const write = new MidiWriter.Writer([track]);
      const blob = new Blob([write.buildFile()], { type: "audio/midi" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "pattern.mid";
      a.click();
    });
  </script>

</body>

</html>'></iframe>
