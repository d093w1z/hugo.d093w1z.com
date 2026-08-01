(function(){
  const MidiWriter = window.MidiWriter;

  // ============================================================
  // Constants
  // ============================================================
  const octaves = [5,4,3];
  const noteNames = ['B','A#','A','G#','G','F#','F','E','D#','D','C#','C'];
  const semitoneOf = {C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
  const notes = [];
  octaves.forEach(oct => noteNames.forEach(n => notes.push(n+oct)));
  const ROWS = notes.length;   // 36
  const ROW_H = 16;            // fixed, zoom never touches this
  const STEP = '16n';
  const STEPS_PER_BAR = 16;
  const TICKS_PER_16TH = 32;   // MidiWriter default TPQ=128 -> 16th = 32 ticks
  const VEL_LANE_H = 60;
  const HISTORY_LIMIT = 100;

  const SCALES = {
    major:[0,2,4,5,7,9,11], minor:[0,2,3,5,7,8,10],
    dorian:[0,2,3,5,7,9,10], mixolydian:[0,2,4,5,7,9,10],
    pentatonic:[0,2,4,7,9], blues:[0,3,5,6,7,10],
    harmonicMinor:[0,2,3,5,7,8,11], melodicMinor:[0,2,3,5,7,9,11]
  };
  const CHORDS = {
    major:[0,4,7], minor:[0,3,7], dom7:[0,4,7,10], maj9:[0,4,7,11,14],
    sus4:[0,5,7], dim:[0,3,6], aug:[0,4,8], power:[0,7]
  };

  // ============================================================
  // Document state (everything that gets saved/undone)
  // ============================================================
  const doc = {
    bars: 4,
    cols: 4*STEPS_PER_BAR,
    cellW: 16,             // the only thing the zoom slider changes
    notes: [],             // {id,row,col,len,vel,muted,selected}
    nextId: 1,
  };
  let tool = 'draw';
  let history = [], future = [];
  let clipboard = [];

  // Playback runtime state, kept separate from the editable document.
  const playback = {
    playing: false,
    step: 0,
    scheduledEvent: null,
    synth: new Tone.PolySynth().toDestination(),
  };

  // ============================================================
  // DOM refs
  // ============================================================
  const pianoEl = document.getElementById('piano');
  const rollEl = document.getElementById('piano-roll');
  const rollContainerEl = document.getElementById('piano-roll-container');
  const mainContainerEl = document.getElementById('main-container');
  const rulerEl = document.getElementById('ruler');
  const velLaneEl = document.getElementById('velocity-lane');
  const marqueeEl = document.getElementById('marquee');
  const subline = document.getElementById('subline');
  const cellEls = [];           // persistent grid cells, rebuilt only when bar count changes

  // ============================================================
  // Small geometry / data helpers
  // ============================================================
  function pitchClass(row){ return semitoneOf[notes[row].replace(/\d+$/,'')]; }
  function isBlack(row){ return notes[row].includes('#'); }
  function clampRow(r){ return Math.max(0, Math.min(ROWS-1, r)); }
  function clampCol(c){ return Math.max(0, Math.min(doc.cols-1, c)); }
  function clampLen(col, len){ return Math.max(1, Math.min(len, doc.cols-col)); }
  function snapStepsVal(){ return parseInt(document.getElementById('snap').value,10); }
  function snapCol(c, bypass){
    const s = snapStepsVal();
    if(bypass || !s) return clampCol(c);
    return clampCol(Math.round(c/s)*s);
  }
  function clone(arr){ return JSON.parse(JSON.stringify(arr)); }
  function overlaps(a,b){ return a.col<b.col+b.len && a.col+a.len>b.col; }
  function velColor(v){
    const t = v/127;
    const g = Math.round(70 + t*(255-70));
    return `rgb(0,${g},0)`;
  }

  // Remove any OTHER note whose [col,col+len) range overlaps this row/range.
  function clearOverlap(row, col, len, excludeId){
    doc.notes = doc.notes.filter(n => n.id===excludeId || !(n.row===row && col < n.col+n.len && col+len > n.col));
  }

  function deselectAll(){ doc.notes.forEach(n=>n.selected=false); }
  function renderAll(){ renderNotes(); renderVel(); }

  // ============================================================
  // History (undo/redo)
  // ============================================================
  function pushHistory(){
    history.push(clone(doc.notes));
    if(history.length>HISTORY_LIMIT) history.shift();
    future = [];
  }
  function undo(){
    if(!history.length) return;
    future.push(clone(doc.notes));
    doc.notes = history.pop();
    renderAll();
  }
  function redo(){
    if(!future.length) return;
    history.push(clone(doc.notes));
    doc.notes = future.pop();
    renderAll();
  }
  // Runs a mutation as one undoable step and re-renders once it's done.
  function commit(mutator){
    pushHistory();
    mutator();
    renderAll();
  }

  // ============================================================
  // Static grid construction (rebuilt only on init / bar-count change)
  // ============================================================
  function buildKeysAndGrid(){
    pianoEl.innerHTML='';
    rollEl.querySelectorAll('.cell,.note').forEach(c=>c.remove());
    cellEls.length = 0;

    for(let r=0;r<ROWS;r++){
      const key = document.createElement('div');
      key.className = 'key ' + (isBlack(r)?'black':'');
      key.textContent = notes[r];
      key.addEventListener('pointerdown', async ()=>{ await Tone.start(); playback.synth.triggerAttackRelease(notes[r],'8n'); });
      pianoEl.appendChild(key);

      cellEls[r] = [];
      for(let c=0;c<doc.cols;c++){
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.style.height = ROW_H+'px';
        cell.style.gridRow = r+1;
        cell.style.gridColumn = c+1;
        if((c+1)%STEPS_PER_BAR===0) cell.classList.add('bar-edge');
        if((r+1)%12===0) cell.classList.add('oct-edge');
        rollEl.appendChild(cell);
        cellEls[r][c] = cell;
      }
    }
    rollEl.style.gridTemplateRows = `repeat(${ROWS}, ${ROW_H}px)`;
    rollEl.appendChild(marqueeEl);

    subline.textContent = `${doc.bars} bar${doc.bars>1?'s':''} · 1/16 grid · draw / select / chord / mute`;
    layoutGrid();
    highlightScale();
  }

  // Zoom-only relayout: rows/keys/cells stay put, only column pixel width changes.
  function layoutGrid(){
    rollEl.style.gridTemplateColumns = `repeat(${doc.cols}, ${doc.cellW}px)`;
    rollEl.style.width = (doc.cols*doc.cellW)+'px';
    velLaneEl.style.width = (doc.cols*doc.cellW)+'px';
    buildRuler();
    renderAll();
  }

  function buildRuler(){
    rulerEl.innerHTML='';
    rulerEl.style.width = (doc.cols*doc.cellW)+'px';
    for(let c=0;c<=doc.cols;c++){
      const t = document.createElement('div');
      t.className = 'tick' + (c%STEPS_PER_BAR===0?' bar':'');
      t.style.left = (c*doc.cellW)+'px';
      rulerEl.appendChild(t);
      if(c%STEPS_PER_BAR===0 && c<doc.cols){
        const lbl = document.createElement('div');
        lbl.className='ticklabel';
        lbl.style.left=(c*doc.cellW+2)+'px';
        lbl.textContent = 'Bar '+(c/STEPS_PER_BAR+1);
        rulerEl.appendChild(lbl);
      }
    }
    const pl = document.createElement('div');
    pl.className='playline'; pl.id='ruler-playline';
    pl.style.left='0px';
    rulerEl.appendChild(pl);
  }

  function highlightScale(){
    document.querySelectorAll('.key').forEach(k=>k.classList.remove('root-hl'));
    for(let r=0;r<ROWS;r++) for(let c=0;c<doc.cols;c++) cellEls[r][c].classList.remove('scale-hl');

    const rootSel = document.getElementById('root').value;
    const scaleSel = document.getElementById('scale').value;
    const rootSemi = semitoneOf[rootSel];
    for(let r=0;r<ROWS;r++){
      if(pitchClass(r)===rootSemi) pianoEl.children[r].classList.add('root-hl');
    }
    if(!scaleSel) return;
    const offs = SCALES[scaleSel];
    for(let r=0;r<ROWS;r++){
      const rel = ((pitchClass(r) - rootSemi)+12)%12;
      if(offs.includes(rel)) for(let c=0;c<doc.cols;c++) cellEls[r][c].classList.add('scale-hl');
    }
  }
  document.getElementById('root').addEventListener('change', highlightScale);
  document.getElementById('scale').addEventListener('change', highlightScale);

  document.getElementById('bars').addEventListener('change', e=>{
    pushHistory();
    doc.bars = parseInt(e.target.value,10);
    doc.cols = doc.bars*STEPS_PER_BAR;
    // Notes fully past the new grid are dropped; notes that only partly
    // overhang it are shortened to fit instead of being left overhanging.
    doc.notes = doc.notes
      .filter(n=>n.col<doc.cols)
      .map(n=> n.len>doc.cols-n.col ? {...n, len:clampLen(n.col,n.len)} : n);
    buildKeysAndGrid();
  });

  // ============================================================
  // Notes / velocity rendering
  // ============================================================
  function renderNotes(){
    rollEl.querySelectorAll('.note').forEach(n=>n.remove());
    doc.notes.forEach(n=>{
      const el = document.createElement('div');
      el.className = 'note' + (n.selected?' selected':'') + (n.muted?' muted':'');
      el.style.left = (n.col*doc.cellW)+'px';
      el.style.top = (n.row*ROW_H)+'px';
      el.style.width = (n.len*doc.cellW-2)+'px';
      el.style.height = (ROW_H-2)+'px';
      el.style.background = velColor(n.vel);
      el.dataset.id = n.id;
      const rsz = document.createElement('div');
      rsz.className='rsz';
      // A fixed 8px resize strip can cover most of a short note (e.g. over
      // half of a single-cell note), making it nearly impossible to grab
      // the note to move it instead of resizing it. Scale the strip down
      // for narrow notes so most of the note stays "movable".
      const noteWidthPx = n.len*doc.cellW-2;
      rsz.style.width = Math.max(3, Math.min(8, noteWidthPx/3))+'px';
      el.appendChild(rsz);
      rollEl.appendChild(el);
    });
  }

  function renderVel(){
    velLaneEl.innerHTML='';
    doc.notes.forEach(n=>{
      const bar = document.createElement('div');
      bar.className = 'vbar'+(n.selected?' selected':'');
      const w = Math.min(doc.cellW-4, 10);
      bar.style.left = (n.col*doc.cellW + (doc.cellW-w)/2)+'px';
      bar.style.width = Math.max(2,w)+'px';
      bar.style.height = Math.max(2,(n.vel/127)*VEL_LANE_H)+'px';
      bar.style.background = velColor(n.vel);
      bar.dataset.id = n.id;
      velLaneEl.appendChild(bar);
    });
  }

  // ============================================================
  // Delegated pointer interaction over the whole grid
  // ============================================================
  let drawing=null, moving=null, resizing=null, marquee=null, erasing=false;

  function gridCoords(e){
    const rect = rollEl.getBoundingClientRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    return { x, y, col: clampCol(Math.floor(x/doc.cellW)), row: clampRow(Math.floor(y/ROW_H)) };
  }

  rollEl.addEventListener('contextmenu', e=>e.preventDefault());

  rollEl.addEventListener('pointerdown', e=>{
    if(e.button===1){ startPan(e); return; }

    const {x,y,col,row} = gridCoords(e);
    const noteEl = e.target.closest('.note');

    if(e.button===2){
      pushHistory();
      erasing = true;
      rollEl.setPointerCapture(e.pointerId);
      eraseAt(row,col);
      return;
    }
    if(e.button!==0) return;

    if(noteEl && tool!=='draw' && tool!=='chord'){
      const id = Number(noteEl.dataset.id);
      const n = doc.notes.find(x=>x.id===id);
      if(!n) return;

      if(tool==='mute'){
        commit(()=>{ n.muted = !n.muted; });
        return;
      }
      // select tool
      const isRsz = e.target.classList.contains('rsz');
      if(e.shiftKey && !isRsz){
        n.selected = !n.selected;
        renderAll();
        return;
      }
      if(!n.selected){ deselectAll(); n.selected = true; }
      pushHistory();

      if(isRsz){
        resizing = {note:n, dragged:false};
      } else {
        let group = doc.notes.filter(g=>g.selected);
        if(e.ctrlKey || e.metaKey){
          group = group.map(g=>{
            const dup = {...g, id:doc.nextId++, selected:true};
            g.selected = false;
            doc.notes.push(dup);
            return dup;
          });
        }
        moving = {
          orig: group.map(g=>({id:g.id,row:g.row,col:g.col,len:g.len})),
          startCol:col, startRow:row, shiftLock:null
        };
      }
      renderAll();
      rollEl.setPointerCapture(e.pointerId);
      return;
    }

    // empty-area (or draw/chord tool clicking through a note)
    if(tool==='draw'){
      pushHistory();
      const startCol = snapCol(col, e.altKey);
      clearOverlap(row,startCol,1,null);
      const n = {id:doc.nextId++, row, col:startCol, len:1, vel:100, muted:false, selected:false};
      doc.notes.push(n);
      drawing = {note:n, startCol, dragged:false};
      renderAll();
    } else if(tool==='select'){
      if(!e.shiftKey) deselectAll();
      marquee = {x0:x,y0:y};
      marqueeEl.style.display='block';
      marqueeEl.style.left=x+'px'; marqueeEl.style.top=y+'px';
      marqueeEl.style.width='0px'; marqueeEl.style.height='0px';
      renderAll();
    } else if(tool==='chord'){
      stampChord(row,col);
    }
    rollEl.setPointerCapture(e.pointerId);
  });

  rollEl.addEventListener('pointermove', e=>{
    if(!drawing && !moving && !resizing && !marquee && !erasing) return;
    const {x,y,col,row} = gridCoords(e);

    if(erasing){ eraseAt(row,col); return; }

    if(drawing){
      drawing.dragged = true;
      const len = Math.max(1, col-drawing.startCol+1);
      drawing.note.len = len;
      clearOverlap(drawing.note.row, drawing.note.col, len, drawing.note.id);
      renderAll();
    }
    if(resizing){
      resizing.dragged = true;
      resizing.note.len = Math.max(1, col-resizing.note.col+1);
      renderAll();
    }
    if(moving){
      if(moving.shiftLock===null && (col!==moving.startCol || row!==moving.startRow)){
        moving.shiftLock = Math.abs(col-moving.startCol) >= Math.abs(row-moving.startRow) ? 'h' : 'v';
      }
      const lock = e.shiftKey ? moving.shiftLock : null;
      let dCol = lock==='v' ? 0 : (col-moving.startCol);
      let dRow = lock==='h' ? 0 : (row-moving.startRow);

      let minDCol=-Infinity, maxDCol=Infinity, minDRow=-Infinity, maxDRow=Infinity;
      moving.orig.forEach(o=>{
        minDCol = Math.max(minDCol, -o.col);
        maxDCol = Math.min(maxDCol, (doc.cols-o.len)-o.col);
        minDRow = Math.max(minDRow, -o.row);
        maxDRow = Math.min(maxDRow, (ROWS-1)-o.row);
      });
      dCol = Math.max(minDCol, Math.min(maxDCol, dCol));
      dRow = Math.max(minDRow, Math.min(maxDRow, dRow));

      moving.orig.forEach(o=>{
        const n = doc.notes.find(x=>x.id===o.id);
        if(n){ n.col = o.col+dCol; n.row = o.row+dRow; }
      });
      renderAll();
    }
    if(marquee){
      const mx=Math.min(x,marquee.x0), my=Math.min(y,marquee.y0);
      const mw=Math.abs(x-marquee.x0), mh=Math.abs(y-marquee.y0);
      marqueeEl.style.left=mx+'px'; marqueeEl.style.top=my+'px';
      marqueeEl.style.width=mw+'px'; marqueeEl.style.height=mh+'px';
      marquee.rect={mx,my,mw,mh};
    }
  });

  function finishPointer(e){
    if(erasing){ erasing=false; }

    if(drawing){
      const s = snapStepsVal();
      let len = drawing.note.len;
      // Only round to the snap grid if the user actually dragged to size the
      // note - otherwise a plain click can round 1 step up to a full snap
      // unit (e.g. Math.round(1/2)*2 === 2), silently inflating a 1-cell
      // click into a 2-cell note.
      if(s && !e.altKey && drawing.dragged) len = Math.round(len/s)*s;
      drawing.note.len = clampLen(drawing.note.col, len);
      clearOverlap(drawing.note.row, drawing.note.col, drawing.note.len, drawing.note.id);
      drawing = null;
      renderAll();
    }
    if(resizing){
      const s = snapStepsVal();
      let len = resizing.note.len;
      if(s && !e.altKey && resizing.dragged) len = Math.round(len/s)*s;
      resizing.note.len = clampLen(resizing.note.col, len);
      clearOverlap(resizing.note.row, resizing.note.col, resizing.note.len, resizing.note.id);
      resizing = null;
      renderAll();
    }
    if(moving){
      const s = snapStepsVal();
      if(s && !e.altKey && moving.orig.length){
        const anchor = moving.orig[0];
        const n = doc.notes.find(x=>x.id===anchor.id);
        if(n){
          const snapped = snapCol(n.col,false);
          const extra = snapped - n.col;
          if(extra!==0){
            moving.orig.forEach(o=>{
              const nn = doc.notes.find(x=>x.id===o.id);
              if(nn) nn.col = Math.max(0, Math.min(doc.cols-nn.len, nn.col+extra));
            });
          }
        }
      }
      moving.orig.forEach(o=>{
        const nn = doc.notes.find(x=>x.id===o.id);
        if(nn) clearOverlap(nn.row, nn.col, nn.len, nn.id);
      });
      moving = null;
      renderAll();
    }
    if(marquee){
      if(marquee.rect){
        const {mx,my,mw,mh} = marquee.rect;
        doc.notes.forEach(n=>{
          const nx=n.col*doc.cellW, ny=n.row*ROW_H, nw=n.len*doc.cellW, nh=ROW_H;
          if(nx<mx+mw && nx+nw>mx && ny<my+mh && ny+nh>my) n.selected=true;
        });
        renderAll();
      }
      marqueeEl.style.display='none';
      marquee = null;
    }
    stopPan();
  }
  rollEl.addEventListener('pointerup', finishPointer);
  rollEl.addEventListener('pointercancel', finishPointer);

  // The undo checkpoint for a whole erase-drag gesture is pushed once, at
  // pointerdown, not per cell - so this just mutates and re-renders.
  function eraseAt(row,col){
    doc.notes = doc.notes.filter(n=>!(n.row===row && col>=n.col && col<n.col+n.len));
    renderAll();
  }

  // ============================================================
  // Velocity lane: click/drag paints velocity for whatever note starts under the cursor
  // ============================================================
  velLaneEl.addEventListener('pointerdown', e=>{
    e.stopPropagation();
    pushHistory();
    velLaneEl.setPointerCapture(e.pointerId);
    applyVel(e);
  });
  velLaneEl.addEventListener('pointermove', e=>{
    if(e.buttons & 1) applyVel(e);
  });
  function applyVel(e){
    const rect = velLaneEl.getBoundingClientRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    const col = clampCol(Math.floor(x/doc.cellW));
    const v = Math.round((1 - Math.max(0,Math.min(1,y/VEL_LANE_H)))*127);
    doc.notes.filter(n=>n.col===col).forEach(n=>{ n.vel = Math.max(1,Math.min(127,v)); });
    renderAll();
  }

  // ============================================================
  // Chord stamping
  // ============================================================
  function stampChord(rootRow,col){
    const type = document.getElementById('chordtype').value;
    const offs = CHORDS[type];
    const startCol = snapCol(col,false);
    const len = 4;
    const inRange = offs.filter(off => rootRow-off>=0 && rootRow-off<ROWS);
    if(!inRange.length) return;
    commit(()=>{
      inRange.forEach(off=>{
        const r = rootRow - off;
        clearOverlap(r,startCol,len,null);
        doc.notes.push({id:doc.nextId++, row:r, col:startCol, len, vel:100, muted:false, selected:false});
      });
    });
  }

  // ============================================================
  // Middle-mouse pan
  // ============================================================
  let panState = null;
  function startPan(e){
    e.preventDefault();
    panState = {x:e.clientX, scrollLeft:mainContainerEl.scrollLeft};
    window.addEventListener('pointermove', onPan);
  }
  function onPan(e){
    if(!panState) return;
    mainContainerEl.scrollLeft = panState.scrollLeft - (e.clientX-panState.x);
  }
  function stopPan(){
    panState = null;
    window.removeEventListener('pointermove', onPan);
  }

  // ============================================================
  // Zoom (wheel, anchored left; only column width changes) and slider
  // ============================================================
  const zoomInput = document.getElementById('zoom');
  const zoomValEl = document.getElementById('zoomVal');

  function setZoom(v){
    v = Math.max(parseInt(zoomInput.min,10), Math.min(parseInt(zoomInput.max,10), Math.round(v)));
    zoomInput.value = v;
    zoomValEl.textContent = v+'px';
    doc.cellW = v;
    layoutGrid();
  }

  // Width available for the actual column grid inside the scrolling
  // container: its padding box minus the fixed-width piano-key column.
  function gridViewportWidth(){
    const cs = getComputedStyle(mainContainerEl);
    const pad = parseFloat(cs.paddingLeft)+parseFloat(cs.paddingRight);
    return Math.max(1, mainContainerEl.clientWidth - pad - 52);
  }

  function zoomToFit(){
    setZoom(gridViewportWidth()/doc.cols);
    mainContainerEl.scrollLeft = 0;
  }

  function zoomToSelection(){
    const sel = doc.notes.filter(n=>n.selected);
    if(!sel.length){ zoomToFit(); return; }
    const minCol = Math.min(...sel.map(n=>n.col));
    const maxCol = Math.max(...sel.map(n=>n.col+n.len));
    setZoom(gridViewportWidth()/Math.max(1, maxCol-minCol));
    mainContainerEl.scrollLeft = Math.max(0, minCol*doc.cellW);
  }

  rollContainerEl.addEventListener('wheel', e=>{
    if(!e.ctrlKey && !e.altKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(parseInt(zoomInput.value,10) + (e.deltaY<0 ? 2 : -2));
  }, {passive:false});

  zoomInput.addEventListener('input', e=>{
    setZoom(parseInt(e.target.value,10));
  });
  document.getElementById('zoomFit').addEventListener('click', zoomToFit);
  document.getElementById('zoomSel').addEventListener('click', zoomToSelection);

  // Forces the controls that mirror `doc` state (bars, zoom) back to the
  // truth after init/load/import. Browsers can restore stale <select>/
  // <input> values from a previous session on reload, which otherwise
  // leaves the UI showing e.g. "2 bars" while the document actually has 4.
  function syncControlsFromState(){
    document.getElementById('bars').value = String(doc.bars);
    setZoom(doc.cellW);
  }

  // ============================================================
  // Tool switching
  // ============================================================
  document.querySelectorAll('[data-tool]').forEach(btn=>{
    btn.addEventListener('click', ()=> setTool(btn.dataset.tool));
  });
  function setTool(t){
    tool = t;
    document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active', b.dataset.tool===t));
  }

  // ============================================================
  // Top-level actions
  // ============================================================
  document.getElementById('undo').addEventListener('click', undo);
  document.getElementById('redo').addEventListener('click', redo);

  document.getElementById('clear').addEventListener('click', ()=>{
    commit(()=>{ doc.notes = []; });
  });

  document.getElementById('quantize').addEventListener('click', quantizeSelection);

  // Quantizing several notes at once used to remove notes from each other
  // whenever two of them landed on the same cell after snapping, because
  // each note's overlap-clear only protected itself. Now the whole batch is
  // protected from each other and any resulting duplicates are collapsed
  // deterministically (first note in the batch wins) instead of depending
  // on iteration order.
  function quantizeSelection(){
    commit(()=>{
      const target = doc.notes.some(n=>n.selected) ? doc.notes.filter(n=>n.selected) : doc.notes;
      const ids = new Set(target.map(n=>n.id));
      target.forEach(n=>{ n.col = snapCol(n.col,false); });
      doc.notes = doc.notes.filter(n => ids.has(n.id) || !target.some(t=>t.row===n.row && overlaps(t,n)));
      collapseBatchOverlaps(target);
    });
  }
  function collapseBatchOverlaps(batch){
    const kept = [];
    batch.forEach(n=>{
      if(!doc.notes.includes(n)) return;
      const clash = kept.find(k=>k.row===n.row && overlaps(k,n));
      if(clash) doc.notes = doc.notes.filter(x=>x!==n);
      else kept.push(n);
    });
  }

  document.getElementById('humanize').addEventListener('click', ()=>{
    commit(()=>{
      const target = doc.notes.some(n=>n.selected) ? doc.notes.filter(n=>n.selected) : doc.notes;
      target.forEach(n=>{
        const jitter = Math.round((Math.random()-0.5)*30);
        n.vel = Math.max(1,Math.min(127, n.vel+jitter));
      });
    });
  });

  // ============================================================
  // Clipboard (copy / paste / duplicate)
  // ============================================================
  function copySelection(){
    clipboard = clone(doc.notes.filter(n=>n.selected));
  }
  // Paste always lands the copied block immediately to the right of itself
  // (like duplicate), rather than at the transport's playhead position.
  // Anchoring to the playhead meant pasting before ever pressing Play
  // landed the copy exactly on top of the originals and silently deleted
  // them (clearOverlap with no excluded id).
  function pasteClipboard(){
    if(!clipboard.length) return;
    commit(()=>{
      const minCol = Math.min(...clipboard.map(n=>n.col));
      const maxEnd = Math.max(...clipboard.map(n=>n.col+n.len));
      const shift = maxEnd-minCol;
      deselectAll();
      clipboard.forEach(c=>{
        const col = Math.min(doc.cols-c.len, Math.max(0, c.col+shift));
        clearOverlap(c.row, col, c.len, null);
        doc.notes.push({...c, id:doc.nextId++, col, selected:true});
      });
    });
  }
  function duplicateSelection(){
    const sel = doc.notes.filter(n=>n.selected);
    if(!sel.length) return;
    commit(()=>{
      const maxEnd = Math.max(...sel.map(n=>n.col+n.len));
      const minCol = Math.min(...sel.map(n=>n.col));
      const shift = maxEnd-minCol;
      deselectAll();
      sel.forEach(n=>{
        const nc = Math.min(doc.cols-n.len, n.col+shift);
        clearOverlap(n.row,nc,n.len,null);
        doc.notes.push({...n, id:doc.nextId++, col:nc, selected:true});
      });
    });
  }

  // ============================================================
  // Keyboard shortcuts
  // ============================================================
  window.addEventListener('keydown', e=>{
    const tagIsInput = ['INPUT','SELECT'].includes(document.activeElement.tagName);
    if(e.code==='Space' && !tagIsInput){
      e.preventDefault();
      playback.playing ? doStop() : doPlay();
      return;
    }
    if(tagIsInput) return;

    if(e.key==='Delete' || e.key==='Backspace'){
      if(doc.notes.some(n=>n.selected)){
        commit(()=>{ doc.notes = doc.notes.filter(n=>!n.selected); });
      }
      return;
    }
    if(!e.ctrlKey && !e.metaKey){
      if(e.key==='b'||e.key==='B') setTool('draw');
      else if(e.key==='s'||e.key==='S') setTool('select');
      else if(e.key==='c'||e.key==='C') setTool('chord');
      else if(e.key==='m'||e.key==='M') setTool('mute');
      return;
    }
    if(e.key==='z'){ e.preventDefault(); undo(); }
    else if(e.key==='y'){ e.preventDefault(); redo(); }
    else if(e.key==='q'){ e.preventDefault(); quantizeSelection(); }
    else if(e.key==='c'){ copySelection(); }
    else if(e.key==='v'){ pasteClipboard(); }
    else if(e.key==='d'){ e.preventDefault(); duplicateSelection(); }
  });

  // ============================================================
  // Instruments
  // ============================================================
  // Tone.PolySynth requires its voice class to extend Tone.Monophonic, and
  // Tone.PluckSynth doesn't (it's a physical-model instrument with no
  // standard oscillator/envelope voice interface) - wrapping it in
  // PolySynth throws "Voice must extend Monophonic class" as soon as
  // anything tries to play. Fake polyphony instead with a small round-robin
  // pool of plain PluckSynth instances, exposing the same
  // triggerAttackRelease/dispose interface the rest of the app expects.
  function buildPluckPool(size){
    const voices = Array.from({length:size}, ()=> new Tone.PluckSynth().toDestination());
    let next = 0;
    return {
      triggerAttackRelease(note, duration, time, velocity){
        voices[next].triggerAttackRelease(note, duration, time, velocity);
        next = (next+1)%voices.length;
      },
      dispose(){ voices.forEach(v=>v.dispose()); }
    };
  }

  function buildInstrument(kind){
    if(kind==='piano'){
      return new Tone.Sampler({urls:{C4:'C4.mp3'}, baseUrl:'https://tonejs.github.io/audio/salamander/'}).toDestination();
    }
    if(kind==='pluck'){
      return buildPluckPool(8);
    }
    return new Tone.PolySynth().toDestination();
  }

  // ============================================================
  // Playback
  // ============================================================
  async function doPlay(){
    await Tone.start();
    playback.playing = true;
    Tone.Transport.bpm.value = parseInt(document.getElementById('bpm').value,10);
    playback.step = 0;
    if(playback.scheduledEvent!=null) Tone.Transport.clear(playback.scheduledEvent);

    // Dispose the previous instrument before replacing it, otherwise every
    // Play press leaks the old synth's audio nodes.
    if(playback.synth) playback.synth.dispose();
    playback.synth = buildInstrument(document.getElementById('instrument').value);

    const loop = document.getElementById('loop').checked;
    const stepSeconds = Tone.Time(STEP).toSeconds();

    playback.scheduledEvent = Tone.Transport.scheduleRepeat((time)=>{
      clearPlayheadVisual();
      setPlayheadVisual(playback.step);

      doc.notes.forEach(n=>{
        if(n.col===playback.step && !n.muted){
          playback.synth.triggerAttackRelease(notes[n.row], n.len*stepSeconds, time, n.vel/127);
        }
      });
      playback.step = playback.step+1;
      if(playback.step>=doc.cols){
        if(loop) playback.step = 0;
        else { Tone.Transport.stop(); Tone.Transport.cancel(); playback.playing=false; }
      }
    }, STEP);

    Tone.Transport.start();
  }

  function doStop(){
    playback.playing = false;
    Tone.Transport.stop();
    Tone.Transport.cancel();
    clearPlayheadVisual();
    const pl = document.getElementById('ruler-playline');
    if(pl) pl.style.left='0px';
  }

  function setPlayheadVisual(s){
    const pl = document.getElementById('ruler-playline');
    if(pl) pl.style.left = (s*doc.cellW)+'px';
    document.querySelectorAll('.note[data-id]').forEach(el=>{
      const n = doc.notes.find(x=>x.id==el.dataset.id);
      if(n && s>=n.col && s<n.col+n.len) el.classList.add('playing');
    });
  }
  function clearPlayheadVisual(){
    document.querySelectorAll('.note.playing').forEach(el=>el.classList.remove('playing'));
  }

  document.getElementById('play').addEventListener('click', doPlay);
  document.getElementById('stop').addEventListener('click', doStop);
  document.getElementById('bpm').addEventListener('change', e=>{
    Tone.Transport.bpm.value = parseInt(e.target.value,10);
  });

  // ============================================================
  // Save / load
  // ============================================================
  document.getElementById('save').addEventListener('click', ()=>{
    localStorage.setItem('pianoRollV2', JSON.stringify({bars:doc.bars, notes:doc.notes}));
    alert('Pattern saved!');
  });
  document.getElementById('load').addEventListener('click', ()=>{
    const raw = localStorage.getItem('pianoRollV2');
    if(!raw){ alert('No saved pattern found.'); return; }
    pushHistory();
    const data = JSON.parse(raw);
    if(data.bars){
      doc.bars = data.bars;
      doc.cols = doc.bars*STEPS_PER_BAR;
    }
    doc.notes = data.notes || data; // tolerate old save format
    doc.nextId = doc.notes.length ? Math.max(...doc.notes.map(n=>n.id))+1 : 1;
    buildKeysAndGrid();
    syncControlsFromState();
    alert('Pattern loaded!');
  });

  // ============================================================
  // MIDI export
  // ============================================================
  // MidiWriter tracks are sequential (each event's "wait" is measured from
  // the end of the previous event on that track), so a single track can't
  // represent two notes that overlap in time. The previous implementation
  // grouped notes by identical start column into chords but still used one
  // running cursor, so any note that started while an earlier, longer note
  // was still sounding got its wait time clamped to 0 and was pushed to
  // start right after that earlier note instead of at its real position.
  //
  // Fix: greedily assign each note to the first "voice" (track) that is
  // free at its start time - i.e. do interval scheduling - so every voice
  // is internally non-overlapping and can safely use the sequential
  // wait/duration model. Notes that must sound simultaneously (chords)
  // simply end up in different voices, each keeping its own velocity.
  function assignVoices(activeNotes){
    const sorted = activeNotes.slice().sort((a,b)=>a.col-b.col);
    const voiceEndTicks = [];
    const voices = [];
    sorted.forEach(n=>{
      const startTicks = n.col*TICKS_PER_16TH;
      const durTicks = n.len*TICKS_PER_16TH;
      let vi = voiceEndTicks.findIndex(end=>end<=startTicks);
      if(vi===-1){ vi = voices.length; voices.push([]); voiceEndTicks.push(0); }
      voices[vi].push({startTicks, durTicks, pitch:notes[n.row], vel:n.vel});
      voiceEndTicks[vi] = startTicks+durTicks;
    });
    return voices;
  }

  // General MIDI program numbers (0-indexed - MidiWriter's ProgramChangeEvent
  // writes the `instrument` value as the raw program-change data byte, not
  // the 1-indexed number GM patch lists are usually printed with) chosen to
  // roughly match each in-app instrument, so a file opened in another DAW or
  // played on real GM hardware sounds close to what was heard here.
  const GM_PROGRAM = { synth: 80, piano: 0, pluck: 45 }; // Lead 1 (square), Acoustic Grand Piano, Pizzicato Strings

  document.getElementById('export').addEventListener('click', ()=>{
    const active = doc.notes.filter(n=>!n.muted);
    if(!active.length){ alert('Nothing to export.'); return; }

    const bpm = parseInt(document.getElementById('bpm').value,10) || 120;
    const program = GM_PROGRAM[document.getElementById('instrument').value] ?? 0;

    const tracks = assignVoices(active).map((events, i)=>{
      const track = new MidiWriter.Track();
      if(i===0) track.setTempo(bpm); // conductor track: tempo applies to the whole file
      track.addEvent(new MidiWriter.ProgramChangeEvent({instrument:program}));
      let cursorTicks = 0;
      events.forEach(ev=>{
        const waitTicks = Math.max(0, ev.startTicks-cursorTicks);
        track.addEvent(new MidiWriter.NoteEvent({
          pitch: [ev.pitch],
          duration: 'T'+ev.durTicks,
          // NoteEvent defaults `wait` to 0 via Object.assign, but that
          // default only applies if the key is absent - explicitly passing
          // `wait: undefined` (e.g. via a `cond ? val : undefined` ternary)
          // overwrites it and crashes deep inside Utils.getTickDuration.
          // Always pass an explicit tick string instead, 'T0' included.
          wait: 'T'+waitTicks,
          velocity: Math.max(1, Math.round(ev.vel/127*100))
        }));
        cursorTicks = ev.startTicks+ev.durTicks;
      });
      return track;
    });

    const writer = new MidiWriter.Writer(tracks);
    const blob = new Blob([writer.buildFile()], {type:'audio/midi'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pattern.mid'; a.click();
  });

  // ============================================================
  // MIDI import
  // ============================================================
  const NOTE_NAMES_ASC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
  // Standard MIDI note numbers to our row index (our grid only covers C3-B5).
  function midiNumberToRow(num){
    const name = NOTE_NAMES_ASC[((num%12)+12)%12] + (Math.floor(num/12)-1);
    const idx = notes.indexOf(name);
    return idx===-1 ? null : idx;
  }

  async function importMidiFile(file){
    const midi = new Midi(await file.arrayBuffer());
    const ppq = midi.header.ppq;
    const STEPS_PER_QUARTER = 4; // our grid column is a 16th note

    const imported = [];
    let skippedOutOfRange = 0;
    midi.tracks.forEach(track=>{
      track.notes.forEach(note=>{
        const row = midiNumberToRow(note.midi);
        if(row===null){ skippedOutOfRange++; return; }
        imported.push({
          row,
          col: Math.round(note.ticks/ppq*STEPS_PER_QUARTER),
          len: Math.max(1, Math.round(note.durationTicks/ppq*STEPS_PER_QUARTER)),
          vel: Math.max(1, Math.min(127, Math.round(note.velocity*127))),
        });
      });
    });
    if(!imported.length){
      alert('No compatible notes found in that MIDI file (only pitches C3-B5 are supported).');
      return;
    }

    // Grow the grid to fit, capped at the largest bar count the UI offers.
    const maxEndCol = Math.max(...imported.map(n=>n.col+n.len));
    const bars = [2,4,8,16].find(b => b*STEPS_PER_BAR>=maxEndCol) || 16;

    pushHistory();
    doc.bars = bars;
    doc.cols = bars*STEPS_PER_BAR;
    doc.notes = [];
    let droppedBeyondGrid = 0;
    imported
      .sort((a,b)=>a.col-b.col)
      .forEach(n=>{
        if(n.col>=doc.cols){ droppedBeyondGrid++; return; }
        const len = clampLen(n.col, n.len);
        clearOverlap(n.row, n.col, len, null);
        doc.notes.push({id:doc.nextId++, row:n.row, col:n.col, len, vel:n.vel, muted:false, selected:false});
      });

    const tempo = midi.header.tempos[0];
    if(tempo) document.getElementById('bpm').value = Math.round(tempo.bpm);

    buildKeysAndGrid();
    syncControlsFromState();

    let msg = `Imported ${doc.notes.length} note${doc.notes.length===1?'':'s'}.`;
    if(skippedOutOfRange) msg += ` ${skippedOutOfRange} note(s) outside the C3-B5 range were skipped.`;
    if(droppedBeyondGrid) msg += ` ${droppedBeyondGrid} note(s) beyond the ${bars}-bar grid were dropped.`;
    alert(msg);
  }

  document.getElementById('importMidi').addEventListener('click', ()=>{
    document.getElementById('importMidiFile').click();
  });
  document.getElementById('importMidiFile').addEventListener('change', async e=>{
    const file = e.target.files[0];
    e.target.value = ''; // allow re-importing the same file again later
    if(!file) return;
    try{ await importMidiFile(file); }
    catch(err){ alert('Could not read that MIDI file: '+err.message); }
  });

  // ============================================================
  // Init
  // ============================================================
  buildKeysAndGrid();
  syncControlsFromState();
})();
