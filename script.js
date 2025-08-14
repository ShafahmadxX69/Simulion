const MODEL_LIBRARY = {
    A: { length: 1.2, width: 0.8, height: 1.0, color: 0xff9999 },
    B: { length: 1.0, width: 0.8, height: 0.8, color: 0x99ccff },
    C: { length: 0.8, width: 0.6, height: 0.6, color: 0x99ff99 }
};
const CONTAINER = { length: 12, width: 2.35, height: 2.39 };
let items = [];

document.getElementById('addBtn').onclick = () => {
    const model = document.getElementById('model').value;
    const qty = parseInt(document.getElementById('qty').value);
    for (let i = 0; i < qty; i++) items.push(model);
    alert(`Ditambahkan ${qty} item model ${model}`);
};

document.getElementById('renderBtn').onclick = () => renderStuffing();

function renderStuffing() {
    document.getElementById('three-container').innerHTML = "";
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('three-container').appendChild(renderer.domElement);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    camera.position.set(5, 5, 15);
    controls.update();

    const light = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(light);
    scene.add(new THREE.DirectionalLight(0xffffff, 0.5));

    const containerGeom = new THREE.BoxGeometry(CONTAINER.length, 0.05, CONTAINER.width);
    const containerMat = new THREE.MeshBasicMaterial({ color: 0xcc9966 });
    const containerMesh = new THREE.Mesh(containerGeom, containerMat);
    containerMesh.position.y = -0.025;
    scene.add(containerMesh);

    let sortedItems = items.slice().sort((a,b) => {
        let volA = MODEL_LIBRARY[a].length * MODEL_LIBRARY[a].width * MODEL_LIBRARY[a].height;
        let volB = MODEL_LIBRARY[b].length * MODEL_LIBRARY[b].width * MODEL_LIBRARY[b].height;
        return volB - volA;
    });

    let xPos = -CONTAINER.length/2, yPos = 0, zPos = -CONTAINER.width/2;
    let maxRowHeight = 0;
    for (let m of sortedItems) {
        let box = MODEL_LIBRARY[m];
        if (xPos + box.length > CONTAINER.length/2) {
            xPos = -CONTAINER.length/2;
            zPos += maxRowHeight; // tangga ke belakang
            maxRowHeight = 0;
        }
        const geom = new THREE.BoxGeometry(box.length, box.height, box.width);
        const mat = new THREE.MeshLambertMaterial({ color: box.color, transparent: true, opacity: 0.8 });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.position.set(xPos + box.length/2, box.height/2 + yPos, zPos + box.width/2);
        scene.add(mesh);
        xPos += box.length;
        maxRowHeight = Math.max(maxRowHeight, box.height);
    }

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}