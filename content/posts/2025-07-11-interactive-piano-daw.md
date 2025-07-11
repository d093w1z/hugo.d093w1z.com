---
author: d093w1z
title: Interactive Piano DAW
date: 2025-07-11T15:51:10.000Z
publishDate: 2025-07-11T00:00:00.000Z
description: A light-weight standalone DAW implementation for Piano.
tags:
  - piano
  - syntesis
  - daw
  - audio
  - music
categories: []
slug: interactive-piano-daw
draft: false
toc: true
---
# Interactive Piano DAW

<iframe id="myFrame" width="100%" height="900px" srcdoc='&lt;!DOCTYPE html&gt;
&lt;html lang=&quot;en&quot;&gt;

&lt;head&gt;
  &lt;meta name=&quot;viewport&quot; content=&quot;width=device-width&quot;&gt;
  &lt;meta charset=&quot;UTF-8&quot;&gt;
  &lt;title&gt;Improved Piano Roll DAW&lt;/title&gt;
  &lt;style&gt;
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
      box-sizing: border-box;
      border: 1px solid #999;
      text-align: center;
      line-height: 16px;
      font-size: 11px;
      color: #000;
      cursor: pointer;
    }

    .unselectable {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    #piano-roll {
      display: grid;
      grid-template-columns: repeat(16, 32px);
      user-select: none;
      background: #444;
      grid-template-rows: repeat(36, 16px);
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

    .cell {
      background: #333;
      box-sizing: border-box;
      border: 1px solid #555;
    }

    .active {
      background: #0f0;
    }

    .playing {
      outline: 2px solid #ff0;
    }
  &lt;/style&gt;
&lt;/head&gt;

&lt;body&gt;
  &lt;h2&gt;Improved Piano Roll DAW&lt;/h2&gt;
  &lt;div id=&quot;controls&quot;&gt;
    &lt;button id=&quot;play&quot;&gt;Play&lt;/button&gt;
    &lt;button id=&quot;stop&quot;&gt;Stop&lt;/button&gt;
    &lt;button id=&quot;clear&quot;&gt;Clear All&lt;/button&gt;
    BPM: &lt;input type=&quot;number&quot; id=&quot;bpm&quot; value=&quot;120&quot; min=&quot;30&quot; max=&quot;300&quot; style=&quot;width:60px;&quot;&gt;
    Instrument:
    &lt;select id=&quot;instrument&quot;&gt;
      &lt;option value=&quot;synth&quot;&gt;Synth&lt;/option&gt;
      &lt;option value=&quot;piano&quot;&gt;Piano&lt;/option&gt;
    &lt;/select&gt;
    &lt;button id=&quot;save&quot;&gt;Save&lt;/button&gt;
    &lt;button id=&quot;load&quot;&gt;Load&lt;/button&gt;
    &lt;button id=&quot;export&quot;&gt;Export MIDI&lt;/button&gt;
  &lt;/div&gt;
  &lt;div id=&quot;main-container&quot;&gt;
    &lt;div id=&quot;timing-bar&quot;&gt;&lt;/div&gt;
    &lt;div id=&quot;piano-roll-container&quot;&gt;
      &lt;div id=&quot;piano&quot;&gt;&lt;/div&gt;
      &lt;div id=&quot;piano-roll&quot;&gt;&lt;/div&gt;
    &lt;/div&gt;
  &lt;/div&gt;
  &lt;script src=&quot;https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.39/Tone.min.js&quot;&gt;&lt;/script&gt;
  &lt;script src=&quot;https://cdn.jsdelivr.net/npm/midiwriter-js@2.1.3/dist/MidiWriter.min.js&quot;&gt;&lt;/script&gt;
  &lt;script&gt;
    // Build note list for C3 to C5

    const MidiWriter = window.MidiWriter;

    const octaves = [5, 4, 3];
    const noteNames = [&quot;B&quot;, &quot;A#&quot;, &quot;A&quot;, &quot;G#&quot;, &quot;G&quot;, &quot;F#&quot;, &quot;F&quot;, &quot;E&quot;, &quot;D#&quot;, &quot;D&quot;, &quot;C#&quot;, &quot;C&quot;];
    const notes = [];
    octaves.forEach(oct =&gt; {
      noteNames.forEach(note =&gt; {
        notes.push(note + oct);
      });
    });
    const rows = notes.length;
    const cols = 16;

    const gridMarkingColor = &quot;#fff&quot;;

    const grid = [];
    const pianoRoll = document.getElementById(&quot;piano-roll&quot;);
    const piano = document.getElementById(&quot;piano&quot;);
    const timingBar = document.getElementById(&quot;timing-bar&quot;);

    const timeCells = [];
    for (let x = 0; x &lt; cols; x++) {
      const tcell = document.createElement(&quot;div&quot;);
      tcell.className = &quot;time-cell&quot;;
      timingBar.appendChild(tcell);
      timeCells.push(tcell);
    }

    const cellMap = [];

    // Build piano keyboard and grid
    for (let y = 0; y &lt; rows; y++) {
      grid[y] = [];
      const key = document.createElement(&quot;div&quot;);
      key.className = &quot;key&quot;;
      key.textContent = notes[y];
      key.style.background = notes[y].includes(&quot;#&quot;) ? &quot;#444&quot; : &quot;#eee&quot;;
      key.style.color = notes[y].includes(&quot;#&quot;) ? &quot;#fff&quot; : &quot;#000&quot;;
      key.addEventListener(&quot;click&quot;, async () =&gt; {
        await Tone.start();
        synth.triggerAttackRelease(notes[y], &quot;8n&quot;);
      });
      piano.appendChild(key);

      cellMap[y] = [];

      for (let x = 0; x &lt; cols; x++) {
        const cell = document.createElement(&quot;div&quot;);
        cell.className = &quot;cell&quot;;
        cell.dataset.x = x;
        cell.dataset.y = y;
        if (y % 12 === 11)
          cell.style.borderBottomColor = gridMarkingColor;
        if (x % 4 === 3)
          cell.style.borderRightColor = gridMarkingColor;
        cell.addEventListener(&quot;mousedown&quot;, (e) =&gt; handleCellAction(e, cell));
        cell.addEventListener(&quot;mouseenter&quot;, (e) =&gt; {
          if (mouseDown) handleCellAction(e, cell);
        });
        pianoRoll.appendChild(cell);
        cellMap[y][x] = cell;
        grid[y][x] = false;
      }
    }

    let mouseDown = false;
    let mouseButton = 0;

    document.addEventListener(&quot;mousedown&quot;, (e) =&gt; {
      mouseDown = true;
      mouseButton = e.button; // 0 = left, 2 = right
    });

    document.addEventListener(&quot;mouseup&quot;, () =&gt; {
      mouseDown = false;
    });

    function handleCellAction(e, cell) {
      e.preventDefault();
      const x = cell.dataset.x;
      const y = cell.dataset.y;
      if (mouseButton === 2) {
        cell.classList.remove(&quot;active&quot;);
        grid[y][x] = false;
      } else if (mouseButton === 0) {
        cell.classList.add(&quot;active&quot;);
        grid[y][x] = true;
      }
    }


    pianoRoll.addEventListener(&quot;contextmenu&quot;, e =&gt; e.preventDefault());

    let synth = new Tone.PolySynth().toDestination();
    let step = 0, scheduledEvent = null;

    function clearIndicators() {
      document.querySelectorAll(&quot;.cell&quot;).forEach(c =&gt; c.classList.remove(&quot;playing&quot;));
      timeCells.forEach(c =&gt; c.classList.remove(&quot;current-step&quot;));
    }

    document.getElementById(&quot;play&quot;).addEventListener(&quot;click&quot;, async () =&gt; {
      await Tone.start();
      Tone.Transport.bpm.value = parseInt(document.getElementById(&quot;bpm&quot;).value);
      step = 0;
      if (scheduledEvent) Tone.Transport.clear(scheduledEvent);

      const instrument = document.getElementById(&quot;instrument&quot;).value;
      synth = instrument === &quot;piano&quot;
        ? new Tone.Sampler({ urls: { C4: &quot;C4.mp3&quot; }, baseUrl: &quot;https://tonejs.github.io/audio/salamander/&quot; }).toDestination()
        : new Tone.PolySynth().toDestination();

      let lastStep = null;

      scheduledEvent = Tone.Transport.scheduleRepeat((time) =&gt; {

        if (lastStep !== null) {
          timeCells[lastStep].classList.remove(&quot;current-step&quot;);
          for (let y = 0; y &lt; rows; y++) {
            const cell = cellMap[y][lastStep];
            cell.classList.remove(&quot;playing&quot;);
          }
        }

        timeCells[step].classList.add(&quot;current-step&quot;);
        for (let y = 0; y &lt; rows; y++) {
          const cell = cellMap[y][step];
          if (grid[y][step]) {
            synth.triggerAttackRelease(notes[y], &quot;8n&quot;, time);
            cell.classList.add(&quot;playing&quot;);
          }
        }
        lastStep = step;

        step = (step + 1) % cols;
      }, &quot;8n&quot;);

      Tone.Transport.start();
    });

    document.getElementById(&quot;stop&quot;).addEventListener(&quot;click&quot;, () =&gt; {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      clearIndicators();
    });

    document.getElementById(&quot;clear&quot;).addEventListener(&quot;click&quot;, () =&gt; {
      for (let y = 0; y &lt; rows; y++) {
        for (let x = 0; x &lt; cols; x++) {
          grid[y][x] = false;
          const cell = document.querySelector(`.cell[data-x=&quot;${x}&quot;][data-y=&quot;${y}&quot;]`);
          cell.classList.remove(&quot;active&quot;);
        }
      }
    });

    document.getElementById(&quot;bpm&quot;).addEventListener(&quot;change&quot;, (e) =&gt; {
      Tone.Transport.bpm.value = parseInt(e.target.value);
    });

    document.getElementById(&quot;save&quot;).addEventListener(&quot;click&quot;, () =&gt; {
      localStorage.setItem(&quot;pianoPattern&quot;, JSON.stringify(grid));
      alert(&quot;Pattern saved!&quot;);
    });

    document.getElementById(&quot;load&quot;).addEventListener(&quot;click&quot;, () =&gt; {
      const saved = JSON.parse(localStorage.getItem(&quot;pianoPattern&quot;));
      if (saved) {
        for (let y = 0; y &lt; rows; y++) {
          for (let x = 0; x &lt; cols; x++) {
            grid[y][x] = saved[y][x];
            const cell = document.querySelector(`.cell[data-x=&quot;${x}&quot;][data-y=&quot;${y}&quot;]`);
            cell.classList.toggle(&quot;active&quot;, grid[y][x]);
          }
        }
        alert(&quot;Pattern loaded!&quot;);
      }
    });

    document.getElementById(&quot;export&quot;).addEventListener(&quot;click&quot;, () =&gt; {
      const track = new MidiWriter.Track();
      track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }));
      for (let x = 0; x &lt; cols; x++) {
        for (let y = 0; y &lt; rows; y++) {
          if (grid[y][x]) {
            track.addEvent(new MidiWriter.NoteEvent({ pitch: [notes[y]], duration: &quot;8&quot; }));
          }
        }
      }
      const write = new MidiWriter.Writer([track]);
      const blob = new Blob([write.buildFile()], { type: &quot;audio/midi&quot; });
      const url = URL.createObjectURL(blob);
      const a = document.createElement(&quot;a&quot;);
      a.href = url; a.download = &quot;pattern.mid&quot;;
      a.click();
    });
  &lt;/script&gt;
&lt;/body&gt;

&lt;/html&gt;'></iframe>

