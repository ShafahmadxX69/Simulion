<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Container Stuffing Visualizer (Three.js)</title>
  <style>
    :root {
      --sidebar: 300px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color: #111; }
    .app { display: grid; grid-template-columns: var(--sidebar) 1fr; height: 100vh; }
    aside { border-right: 1px solid #e5e7eb; overflow-y: auto; padding: 14px; background: #fafafa; }
    main { position: relative; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    h2 { font-size: 14px; margin: 18px 0 8px; }
    .row { display: grid; grid-template-columns: 1fr; gap: 8px; margin-bottom: 10px; }
    label { font-size: 12px; color: #374151; display: flex; flex-direction: column; gap: 6px; }
    input, select, button { padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; }
    input[type="color"] { padding: 0; height: 36px; }
    button { background: #111827; color: white; cursor: pointer; }
    button.secondary { background: white; color: #111; border: 1px solid #d1d5db; }
    .muted { color: #6b7280; font-size: 12px; }
    .list { display: grid; gap: 10px; }
    .box { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; background: white; }
    .box h3 { margin: 0 0 8px; font-size: 14px; }
    .inline { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .flex { display: flex; gap: 8px; align-items: center; }
    .actions { display: flex; gap: 8px; justify-content: space-between; }
    .sticky-footer { position: sticky; bottom: 0; background: #fafafa; padding-top: 8px; border-top: 1px solid #e5e7eb; }
    #hud { position: absolute; left: 10px; top: 10px; background: rgba(255,255,255,.92); border: 1px solid #e5e7eb; padding: 8px 10px; border-radius: 8px; font-size: 12px; z-index: 5; }
    #three { position: absolute; inset: 0; }
  </style>
</head>
<body>
<div class="app">
  <aside>
    <h1>Stuffing Planner</h1>
    <p class="muted">Input daftar model & qty, lalu tekan <b>Render</b>. Algoritma: besar di bawah, baris bertangga dari depan → belakang, minim rongga per baris.</p>

    <div class="box">
      <h3>Container</h3>
      <label>
        Jenis Container
        <select id="containerType">
          <option value="20GP">20FT (GP)</option>
          <option value="40GP">40FT (GP)</option>
          <option value="40HQ">40FT (HQ)</option>
        </select>
      </label>
      <label>
        Stair Rise (mm)
        <input id="stairRise" type="number" value="100" />
      </label>
      <label>
        Clear Gap antar Baris (mm)
        <input id="rowGap" type="number" value="0" />
      </label>
    </div>

    <div class="box">
      <h3>Tambah Item</h3>
      <div class="row">
        <label>Model
          <select id="modelSelect"></select>
        </label>
        <label>Size
          <select id="sizeSelect"></select>
        </label>
        <div class="inline">
          <label>Qty<input id="qtyInput" type="number" value="1" min="1" /></label>
          <label>Warna<input id="colorInput" type="color" value="#8ab4f8" /></label>
        </div>
        <button id="addBtn">+ Tambah ke Daftar</button>
      </div>
    </div>

    <div class="box">
      <h3>Daftar Muatan</h3>
      <div id="items" class="list"></div>
      <div class="actions sticky-footer">
        <button id="renderBtn">Render</button>
        <button id="clearBtn" class="secondary">Bersihkan</button>
      </div>
    </div>
  </aside>

  <main>
    <div id="hud">0 box</div>
    <canvas id="three"></canvas>
  </main>
</div>

<script type="module">
  // ===== Three.js setup (ESM via unpkg)
  import * as THREE from 'https://unpkg.com/three@0.152.2/build/three.module.js';
  import { OrbitControls } from 'https://unpkg.com/three@0.152.2/examples/jsm/controls/OrbitControls.js';

  // ===== Data: Dimensi Container (mm)
  const CONTAINERS = {
    '20GP': { label: '20FT (GP)', L: 5898, W: 2352, H: 2393 },
    '40GP': { label: '40FT (GP)', L: 12032, W: 2352, H: 2393 },
    '40HQ': { label: '40FT (HQ)', L: 12032, W: 2352, H: 2698 },
  };

  // ===== Data: Library Model (contoh dari kamu)
  const MODEL_LIBRARY = [
    { model: 'FQ803', size: '20', L: 385, W: 255, H: 576 },
    { model: 'FQ803', size: '21', L: 440, W: 255, H: 570 },
    { model: 'FQ803', size: '29', L: 537, W: 300, H: 789 },
    { model: 'FQ803', size: '24', L: 461, W: 295, H: 686 },
    { model: 'FL688', size: '16', L: 375, W: 245, H: 422 },
    { model: 'FL688', size: '17', L: 435, W: 245, H: 422 },
    { model: 'FL688', size: '21', L: 421, W: 255, H: 566 },
    { model: 'FL688', size: '24', L: 461, W: 295, H: 686 },
    { model: 'FL688', size: '19', L: 424, W: 242, H: 577 },
    { model: 'FL688', size: '29', L: 537, W: 300, H: 789 },
    { model: 'FL688', size: '20', L: 385, W: 255, H: 576 },
    { model: 'FL688', size: '31', L: 411, W: 350, H: 811 },
    { model: 'FL688', size: '32', L: 581, W: 345, H: 883 },
    { model: 'FL688', size: '29.5', L: 420, W: 385, H: 807 },
    { model: 'FJ616', size: '16', L: 424, W: 228, H: 440 },
    { model: 'FJ616', size: '20', L: 382, W: 262, H: 582 },
    { model: 'FJ616', size: '24', L: 467, W: 285, H: 692 },
    { model: 'FJ616', size: '19.5', L: 415, W: 235, H: 600 },
    { model: 'FJ616', size: '29', L: 522, W: 292, H: 792 },
    { model: 'FJ616', size: '31', L: 400, W: 340, H: 830 },
    { model: 'FJ616', size: '32', L: 558, W: 325, H: 880 },
    { model: 'FQ819-1', size: '21', L: 634, W: 419, H: 258 },
    { model: 'FQ819-1', size: '26', L: 757, W: 469, H: 293 },
    { model: 'FQ819-1', size: '29', L: 845, W: 519, H: 333 },
  ];

  // ====== UI State
  const $containerType = document.getElementById('containerType');
  const $stairRise = document.getElementById('stairRise');
  const $rowGap = document.getElementById('rowGap');
  const $modelSelect = document.getElementById('modelSelect');
  const $sizeSelect = document.getElementById('sizeSelect');
  const $qtyInput = document.getElementById('qtyInput');
  const $colorInput = document.getElementById('colorInput');
  const $addBtn = document.getElementById('addBtn');
  const $items = document.getElementById('items');
  const $renderBtn = document.getElementById('renderBtn');
  const $clearBtn = document.getElementById('clearBtn');
  const $hud = document.getElementById('hud');

  let itemList = []; // {model,size,qty,color,L,W,H}

  // Populate model dropdowns
  const uniqueModels = [...new Set(MODEL_LIBRARY.map(m => m.model))];
  for (const m of uniqueModels) {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m; $modelSelect.appendChild(opt);
  }
  function refreshSizes() {
    $sizeSelect.innerHTML = '';
    const selectedModel = $modelSelect.value;
    const sizes = MODEL_LIBRARY.filter(m => m.model === selectedModel).map(m => m.size);
    for (const s of sizes) { const o = document.createElement('option'); o.value = s; o.textContent = s; $sizeSelect.appendChild(o); }
  }
  $modelSelect.addEventListener('change', refreshSizes);
  refreshSizes();

  function renderItemList() {
    $items.innerHTML = '';
    itemList.forEach((it, idx) => {
      const div = document.createElement('div');
      div.className = 'box';
      div.innerHTML = `
        <div class="flex" style="justify-content:space-between;">
          <strong>${it.model} – ${it.size}</strong>
          <button class="secondary" data-rm="${idx}">Hapus</button>
        </div>
        <div class="inline" style="margin-top:8px;">
          <label>Qty<input data-idx="${idx}" data-field="qty" type="number" min="1" value="${it.qty}"></label>
          <label>Warna<input data-idx="${idx}" data-field="color" type="color" value="${it.color}"></label>
        </div>
      `;
      $items.appendChild(div);
    });
  }

  $items.addEventListener('input', (e) => {
    const idx = +e.target.dataset.idx; const field = e.target.dataset.field; if (Number.isNaN(idx) || !field) return;
    if (field === 'qty') itemList[idx].qty = Math.max(1, parseInt(e.target.value || '1', 10));
    if (field === 'color') itemList[idx].color = e.target.value;
  });
  $items.addEventListener('click', (e) => {
    const rm = e.target.getAttribute('data-rm');
    if (rm !== null) { itemList.splice(+rm,1); renderItemList(); }
  });

  $addBtn.addEventListener('click', () => {
    const model = $modelSelect.value; const size = $sizeSelect.value;
    const def = MODEL_LIBRARY.find(m => m.model === model && m.size === size);
    if (!def) return alert('Dimensi tidak ditemukan untuk kombinasi ini');
    itemList.push({ model, size, qty: Math.max(1, parseInt($qtyInput.value||'1',10)), color: $colorInput.value, L:def.L, W:def.W, H:def.H });
    renderItemList();
  });
  $clearBtn.addEventListener('click', () => { itemList = []; renderItemList(); draw([]); });

  // ====== Three Scene
  const canvas = document.getElementById('three');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xffffff);
  const camera = new THREE.PerspectiveCamera(55, 1, 1, 100000);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); scene.add(hemi);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8); dir.position.set(1,2,1); scene.add(dir);

  function onResize(){
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w/h; camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', onResize);
  onResize();

  function animate(){ controls.update(); renderer.render(scene, camera); requestAnimationFrame(animate); }
  animate();

  // ===== Helpers
  function edgesOfBox(L,H,W, color=0x111111){
    const geo = new THREE.BoxGeometry(L,H,W);
    const e = new THREE.EdgesGeometry(geo);
    return new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color }));
  }

  function makeBox(L,H,W, color){
    const geo = new THREE.BoxGeometry(L,H,W);
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness: 0, roughness: .9 });
    return new THREE.Mesh(geo, mat);
  }

  function draw(placed){
    // clear
    while(scene.children.length>0) scene.remove(scene.children[0]);
    scene.add(hemi, dir);

    const conf = CONTAINERS[$containerType.value];
    // container wireframe
    const frame = edgesOfBox(conf.L, conf.H, conf.W);
    frame.position.set(conf.L/2, conf.H/2, conf.W/2);
    scene.add(frame);

    // boxes
    for(const p of placed){
      const mesh = makeBox(p.L, p.H, p.W, p.color);
      mesh.position.set(p.x + p.L/2, p.y + p.H/2, p.z + p.W/2);
      scene.add(mesh);
    }

    // camera
    camera.position.set(conf.L*0.9, conf.H*0.9, conf.W*1.2);
    camera.lookAt(conf.L/2, conf.H/2, conf.W/2);
    controls.target.set(conf.L/2, conf.H/2, conf.W/2);
    controls.update();

    $hud.textContent = `${placed.length} box`;
  }

  // ===== Packing (heuristik baris bertangga)
  function getRotations(it){
    // return 3 orientation options (L,W,H) respecting axis (no arbitrary rotation around Z besides swap L/W)
    return [
      { L: it.L, W: it.W, H: it.H },
      { L: it.W, W: it.L, H: it.H },
      { L: it.L, W: it.H, H: it.W }, // berdiri di sisi lain jika perlu
    ];
  }

  function planPacking(items, containerKey, stairRise=100, rowGap=0){
    const C = CONTAINERS[containerKey];
    // expand quantities
    const expanded = [];
    for(const it of items){
      for(let i=0;i<it.qty;i++) expanded.push({ ...it });
    }
    // sort by volume desc (besar dulu)
    expanded.sort((a,b)=> (b.L*b.W*b.H) - (a.L*a.W*a.H));

    const placed = [];
    let x = 0; // posisi depan→belakang (panjang kontainer)
    let rowIndex = 0;

    while (expanded.length && x < C.L){
      const baseY = rowIndex * stairRise; // tangga
      const availH = C.H - baseY;
      if (availH <= 0) break;
      const lenRemain = C.L - x; if (lenRemain <= 0) break;

      let z = 0; // kiri→kanan (lebar kontainer)
      let maxLenInRow = 0;
      let progress = true;

      // Coba isi satu baris penuh (menutup lebar), lalu lanjut baris berikutnya
      while(progress){
        progress = false;
        // cari kandidat yang muat lebar, tinggi, dan panjang baris ini
        let bestIdx = -1; let bestRot = null; let bestScore = -Infinity;
        for(let i=0;i<expanded.length;i++){
          const it = expanded[i];
          for(const r of getRotations(it)){
            if(r.W <= (C.W - z) && r.H <= availH && r.L <= lenRemain){
              // skor: utamakan yang mendekati sisa lebar & tinggi agar minim rongga
              const score = (r.W / (C.W - z)) + (r.H / availH) + (r.L / lenRemain);
              if(score > bestScore){ bestScore = score; bestIdx = i; bestRot = r; }
            }
          }
        }
        if(bestIdx >= 0 && bestRot){
          // tempatkan
          const it = expanded.splice(bestIdx,1)[0];
          placed.push({ x, y: baseY, z, L: bestRot.L, W: bestRot.W, H: bestRot.H, color: it.color, model: it.model, size: it.size });
          z += bestRot.W; // geser ke kanan
          maxLenInRow = Math.max(maxLenInRow, bestRot.L);
          if (z + 1 <= C.W) progress = true; // lanjut isi jika masih ada sisa lebar
        }
      }

      if (maxLenInRow === 0) {
        // Tidak ada yang muat di baris ini → habis atau constrained oleh height → paksa naik baris (tangga) saja
        rowIndex++;
        continue;
      }

      // Selesaikan baris: geser x menurut balok terpanjang pada baris
      x += maxLenInRow + rowGap;
      rowIndex++;
    }

    return placed;
  }

  $renderBtn.addEventListener('click', () => {
    const placed = planPacking(itemList, $containerType.value, Math.max(0, parseInt($stairRise.value||'0',10)), Math.max(0, parseInt($rowGap.value||'0',10)));
    draw(placed);
  });

  // first draw empty container
  draw([]);
</script>
</body>
</html>
