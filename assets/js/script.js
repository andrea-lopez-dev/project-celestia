/* ==============================================================
   SCRIPT PROFESIONAL - OJOS VISIBLES SIN TEXTURAS
   ============================================================== */

import * as THREE from 'three';

// ==============================================================
// CONFIGURACIÓN
// ==============================================================

const CONFIG = {
    aspectBase: 4 / 3,
    lupaZoom: 1.05,
    parpadeoVelocidad: 3000,
    vientoVelocidad: 0.0005,
    maxHistory: 10
};

// ==============================================================
// ESTADO DE ANIMACIONES
// ==============================================================

let animationsEnabled = false;

// ==============================================================
// HISTORIAL DE UNDO/REDO
// ==============================================================

const history = [];
let historyIndex = -1;
let isUndoRedoAction = false;

// ==============================================================
// CONTADOR DE RENDER ORDER
// ==============================================================

let nextRenderOrder = 0;

// ==============================================================
// DETECCIÓN DE DEVTOOLS (F12)
// ==============================================================

let devToolsOpen = false;
let devToolsDetected = false;
let devToolsCheckInterval = null;

document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        console.log('🛡️ DevTools detectado (F12)');
        devToolsDetected = true;
        devToolsOpen = true;
        handleDevToolsOpen();
    }
});

document.addEventListener('contextmenu', (e) => {
    if (e.target.closest('#canvas-container')) {
        e.preventDefault();
        console.log('🛡️ Intento de inspección en canvas bloqueado');
    }
});

function detectDevToolsBySize() {
    const widthThreshold = 160;
    const heightThreshold = 160;
    const isWidthDevTools = window.outerWidth - window.innerWidth > widthThreshold;
    const isHeightDevTools = window.outerHeight - window.innerHeight > heightThreshold;
    if (isWidthDevTools || isHeightDevTools) {
        if (!devToolsOpen) {
            devToolsOpen = true;
            devToolsDetected = true;
            console.log('🛡️ DevTools detectado por tamaño de ventana');
            handleDevToolsOpen();
        }
    } else {
        if (devToolsOpen && devToolsDetected) {
            devToolsOpen = false;
            console.log('✅ DevTools cerrado');
        }
    }
}

function startDevToolsDetection() {
    if (devToolsCheckInterval) clearInterval(devToolsCheckInterval);
    devToolsCheckInterval = setInterval(detectDevToolsBySize, 1000);
}

function handleDevToolsOpen() {
    console.log('🛡️ Medidas de protección activadas por DevTools');
    renderer.domElement.style.opacity = '0';
    setTimeout(() => {
        renderer.domElement.style.opacity = '1';
    }, 100);
}

// ==============================================================
// CAPAS CON TAMAÑOS GRANDES
// ==============================================================

const CAPAS = {
    // Cabello
    c1:  { posX: 0.1, posY: 0.5,  posZ: 0.90, scaleX: 0.8, scaleY: 0.6, rotZ: 0, opacity: 0.9 },
    c2:  { posX: 0,   posY: 0.4,  posZ: 0.85, scaleX: 0.7, scaleY: 0.5, rotZ: 0, opacity: 0.9 },
    c3:  { posX: 0.2, posY: 0.3,  posZ: 0.80, scaleX: 0.6, scaleY: 0.4, rotZ: 0.1, opacity: 0.85 },
    c4:  { posX: -0.2,posY: 0.3,  posZ: 0.80, scaleX: 0.6, scaleY: 0.4, rotZ: -0.1, opacity: 0.85 },
    c5:  { posX: 0,   posY: 0.2,  posZ: 0.75, scaleX: 0.7, scaleY: 0.5, rotZ: 0, opacity: 0.85 },
    c6:  { posX: 0.3, posY: 0.1,  posZ: 0.70, scaleX: 0.5, scaleY: 0.4, rotZ: 0.2, opacity: 0.8 },
    c7:  { posX: -0.3,posY: 0.1,  posZ: 0.70, scaleX: 0.5, scaleY: 0.4, rotZ: -0.2, opacity: 0.8 },
    c8:  { posX: 0,   posY: -0.1, posZ: 0.65, scaleX: 0.8, scaleY: 0.5, rotZ: 0, opacity: 0.8 },
    c9:  { posX: 0.15,posY: -0.2, posZ: 0.60, scaleX: 0.6, scaleY: 0.4, rotZ: 0.1, opacity: 0.75 },
    c10: { posX: -0.15,posY:-0.2, posZ: 0.60, scaleX: 0.6, scaleY: 0.4, rotZ: -0.1, opacity: 0.75 },
    c11: { posX: 0,   posY: -0.3, posZ: 0.55, scaleX: 0.9, scaleY: 0.6, rotZ: 0, opacity: 0.7 },
    
    // Rostro
    rostroBase: { posX: 0, posY: 0, posZ: 0.5, scaleX: 1.8, scaleY: 1.4, rotZ: 0, opacity: 1 },
    nariz:      { posX: 0, posY: 0.05, posZ: 0.55, scaleX: 0.5, scaleY: 0.45, rotZ: 0, opacity: 1 },
    labios:     { posX: 0, posY: -0.15, posZ: 0.55, scaleX: 0.7, scaleY: 0.4, rotZ: 0, opacity: 1 },
    
    // Ojos - CON COLORES DIFERENTES PARA CADA UNO
    ojoIzq: { posX: -0.35, posY: 0.18, posZ: 0.56, scaleX: 0.4, scaleY: 0.4, rotZ: 0, opacity: 1 },
    ojoDer: { posX: 0.35, posY: 0.18, posZ: 0.57, scaleX: 0.4, scaleY: 0.4, rotZ: 0, opacity: 1 },
    
    // Párpados
    parpIzq: { posX: -0.35, posY: 0.18, posZ: 0.58, scaleX: 0.4, scaleY: 0.25, rotZ: 0, opacity: 1 },
    parpDer: { posX: 0.35, posY: 0.18, posZ: 0.59, scaleX: 0.4, scaleY: 0.25, rotZ: 0, opacity: 1 },
    
    // Pestañas y Cejas
    pestanas: { posX: 0, posY: 0.28, posZ: 0.60, scaleX: 0.7, scaleY: 0.25, rotZ: 0, opacity: 1 },
    cejas:    { posX: 0, posY: 0.45, posZ: 0.61, scaleX: 0.8, scaleY: 0.25, rotZ: 0, opacity: 1 },
    
    // Glow
    glow: { posX: 0, posY: 0, posZ: 0.62, scaleX: 1.8, scaleY: 1.4, rotZ: 0, opacity: 0.12 },
};

// ==============================================================
// ESCENA Y CÁMARA
// ==============================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0518);

// PARTÍCULAS CÓSMICAS
const particleCount = 2000;
const particlesGeo = new THREE.BufferGeometry();
const pos = new Float32Array(particleCount * 3);
const col = new Float32Array(particleCount * 3);
const sizes = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i++) {
    pos[i*3] = (Math.random() - 0.5) * 25;
    pos[i*3+1] = (Math.random() - 0.5) * 18;
    pos[i*3+2] = (Math.random() - 0.5) * 12 - 3;
    const c = new THREE.Color().setHSL(0.75 + Math.random() * 0.15, 0.7, 0.4 + Math.random() * 0.4);
    col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    sizes[i] = 0.01 + Math.random() * 0.05;
}
particlesGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
particlesGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
particlesGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

const particlesMat = new THREE.PointsMaterial({
    size: 0.03,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthWrite: false
});
const particles = new THREE.Points(particlesGeo, particlesMat);
scene.add(particles);

// Cámara
const frustumSize = 2.5;
const camera = new THREE.OrthographicCamera(
    -frustumSize * CONFIG.aspectBase,
    frustumSize * CONFIG.aspectBase,
    frustumSize,
    -frustumSize,
    0.1,
    10
);
camera.position.z = 2.5;
camera.updateProjectionMatrix();

const container = document.getElementById('canvas-container');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x0a0518, 1);
container.appendChild(renderer.domElement);

renderer.domElement.setAttribute('data-anti-spy', 'true');
renderer.domElement.style.pointerEvents = 'auto';

// ==============================================================
// CARGA DE TEXTURAS (CON RENDER ORDER ÚNICO Y COLORES DE FALLBACK)
// ==============================================================

const loader = new THREE.TextureLoader();
const allLayers = [];
const layerMap = {};
const layerNames = []; // Para el menú desplegable

function createLayer(imagePath, config, label = '', fallbackColor = 0xaa66ff) {
    const { posX, posY, posZ, scaleX, scaleY, rotZ, opacity } = config;
    
    let material;
    try {
        const texture = loader.load(
            imagePath,
            () => console.log(`✅ ${label}`),
            undefined,
            () => console.warn(`⚠️ ${label} no cargó, usando color de fallback`)
        );
        material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: opacity !== undefined ? opacity : 1,
            depthWrite: false,
            side: THREE.DoubleSide
        });
    } catch {
        material = new THREE.MeshBasicMaterial({
            color: fallbackColor,
            transparent: true,
            opacity: opacity !== undefined ? opacity : 1,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        console.log(`🎨 ${label} usando color de fallback: #${fallbackColor.toString(16).padStart(6, '0')}`);
    }
    
    const geo = new THREE.PlaneGeometry(scaleX, scaleY, 20, 20);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(posX, posY, posZ);
    mesh.rotation.z = rotZ || 0;
    
    // ASIGNAR UN RENDER ORDER ÚNICO Y SECUENCIAL
    mesh.renderOrder = nextRenderOrder;
    nextRenderOrder++;
    
    mesh.userData = {
        config: { ...config },
        originalConfig: { ...config },
        label: label,
        bendX: 0,
        bendY: 0,
        originalPositionZ: posZ,
        isSelected: false,
        fromMenu: false,
        renderOrder: mesh.renderOrder // Guardar el renderOrder inicial
    };
    scene.add(mesh);
    allLayers.push(mesh);
    layerMap[label] = mesh;
    layerNames.push(label);
    return mesh;
}

// --- CREAR CAPAS ---
console.log('📂 Cargando capas...');

// Cabello
const c1  = createLayer('assets/02_cabello/01_Corona_Superior.png', CAPAS.c1, 'C1 Corona', 0xd4a574);
const c2  = createLayer('assets/02_cabello/02_Frontal_Superior.png', CAPAS.c2, 'C2 Frontal', 0xc9955a);
const c3  = createLayer('assets/02_cabello/03_Lateral_Superior_Derecho.png', CAPAS.c3, 'C3 Lat Der', 0xbf8a4a);
const c4  = createLayer('assets/02_cabello/04_Central_Derecho.png', CAPAS.c4, 'C4 Central Der', 0xbf8a4a);
const c5  = createLayer('assets/02_cabello/05_Lateral_Inf_Derecho.png', CAPAS.c5, 'C5 Lat Inf Der', 0xb57d3a);
const c6  = createLayer('assets/02_cabello/06_Puntas_Derechas.png', CAPAS.c6, 'C6 Puntas Der', 0xab702a);
const c7  = createLayer('assets/02_cabello/07_Inferior_Central.png', CAPAS.c7, 'C7 Inf Central', 0xab702a);
const c8  = createLayer('assets/02_cabello/08_Masa_Inf_Principal.png', CAPAS.c8, 'C8 Masa Inf', 0xa1631a);
const c9  = createLayer('assets/02_cabello/09_Central_Izquierdo.png', CAPAS.c9, 'C9 Central Izq', 0x97560a);
const c10 = createLayer('assets/02_cabello/10_Inferior_Izquierdo.png', CAPAS.c10, 'C10 Inf Izq', 0x97560a);
const c11 = createLayer('assets/02_cabello/11_Cuello_Hombro.png', CAPAS.c11, 'C11 Cuello', 0x8d4900);

// Rostro
const rostroBase = createLayer('assets/01_rostro/01_Rostro_Base_Completa.png', CAPAS.rostroBase, 'Rostro Base', 0xf5d0b8);
const nariz      = createLayer('assets/01_rostro/02_Nariz.png', CAPAS.nariz, 'Nariz', 0xe8c0a8);
const labios     = createLayer('assets/01_rostro/03_Labios.png', CAPAS.labios, 'Labios', 0xd4848a);

// Ojos - CON COLORES DE FALLBACK DIFERENTES Y POSICIONES Z DISTINTAS
const ojoIzq = createLayer('assets/01_rostro/04_Ojo_Izquierdo.png', CAPAS.ojoIzq, 'Ojo Izq', 0x4488ff); // Azul
const ojoDer = createLayer('assets/01_rostro/05_Ojo_Derecho.png', CAPAS.ojoDer, 'Ojo Der', 0x8b4513); // Marrón

// Párpados
const parpIzq = createLayer('assets/01_rostro/06_Parpado_Izquierdo.png', CAPAS.parpIzq, 'Párpado Izq', 0xf5d0b8);
const parpDer = createLayer('assets/01_rostro/07_Parpado_Derecho.png', CAPAS.parpDer, 'Párpado Der', 0xf5d0b8);

// Pestañas y Cejas
const pestanas = createLayer('assets/01_rostro/08_Pestanas.png', CAPAS.pestanas, 'Pestañas', 0x2d1b0e);
const cejas    = createLayer('assets/01_rostro/09_Cejas.png', CAPAS.cejas, 'Cejas', 0x4a2a1a);

// Glow
const glow = createLayer('assets/01_rostro/10_Control_Glow.png', CAPAS.glow, 'Glow', 0xaa66ff);
glow.material.blending = THREE.AdditiveBlending;

// ==============================================================
// POBLAR EL MENÚ DESPLEGABLE DE CAPAS
// ==============================================================

const select = document.getElementById('layerSelect');
layerNames.sort((a, b) => a.localeCompare(b));
layerNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    select.appendChild(option);
});

// ==============================================================
// INTERACCIÓN - CON ARRASTRE Y SELECCIÓN PERMITIDOS
// ==============================================================

let selectedLayer = null;
let isDragging = false;
let dragStart = new THREE.Vector2();
let initialPosition = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const canvas = renderer.domElement;

canvas.addEventListener('mousedown', onPointerDown);
canvas.addEventListener('mousemove', onPointerMove);
canvas.addEventListener('mouseup', onPointerUp);

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function onPointerDown(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(allLayers);
    if (intersects.length > 0) {
        selectLayer(intersects[0].object, false);
        dragStart.set(event.clientX, event.clientY);
        initialPosition.copy(selectedLayer.position);
        isDragging = true;
        canvas.style.cursor = 'grabbing';
    } else {
        deselectLayer();
        canvas.style.cursor = 'default';
    }
}

function onPointerMove(event) {
    if (selectedLayer && isDragging) {
        const dx = event.clientX - dragStart.x;
        const dy = event.clientY - dragStart.y;
        const sens = 0.005;
        selectedLayer.position.x = initialPosition.x + dx * sens;
        selectedLayer.position.y = initialPosition.y - dy * sens;
        updateControlsFromLayer(selectedLayer);
    } else {
        const rect = canvas.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(allLayers);
        canvas.style.cursor = intersects.length > 0 ? 'grab' : 'default';
    }
}

function onPointerUp() {
    if (selectedLayer) {
        isDragging = false;
        canvas.style.cursor = 'default';
        saveState();
    }
}

// ==============================================================
// SELECCIÓN Y CONTROLES
// ==============================================================

function selectLayer(layer, fromMenu = false) {
    if (selectedLayer) {
        selectedLayer.material.color.setHex(0xffffff);
        selectedLayer.userData.isSelected = false;
        selectedLayer.userData.fromMenu = false;
    }
    
    selectedLayer = layer;
    selectedLayer.material.color.setHex(0xffdd00);
    selectedLayer.userData.isSelected = true;
    selectedLayer.userData.fromMenu = fromMenu;
    
    document.getElementById('layerSelect').value = layer.userData.label;
    updateControlsFromLayer(layer);
    document.querySelectorAll('.control-group input').forEach(input => input.disabled = false);
    document.getElementById('btnBringToFront').disabled = false;
    document.getElementById('btnSendToBack').disabled = false;
}

function deselectLayer() {
    if (selectedLayer) {
        selectedLayer.material.color.setHex(0xffffff);
        selectedLayer.userData.isSelected = false;
        selectedLayer.userData.fromMenu = false;
        selectedLayer = null;
    }
    document.getElementById('layerSelect').value = '';
    document.querySelectorAll('.control-group input').forEach(input => input.disabled = true);
    document.getElementById('btnBringToFront').disabled = true;
    document.getElementById('btnSendToBack').disabled = true;
}

select.addEventListener('change', function() {
    const label = this.value;
    if (!label) {
        deselectLayer();
        return;
    }
    const layer = layerMap[label];
    if (layer) {
        selectLayer(layer, true);
        saveState();
    }
});

function updateControlsFromLayer(layer) {
    if (!layer) return;
    document.getElementById('posX').value = layer.position.x;
    document.getElementById('posXVal').value = layer.position.x.toFixed(3);
    document.getElementById('posY').value = layer.position.y;
    document.getElementById('posYVal').value = layer.position.y.toFixed(3);
    const rotDeg = layer.rotation.z * (180 / Math.PI);
    document.getElementById('rotZ').value = rotDeg;
    document.getElementById('rotZVal').value = rotDeg.toFixed(1);
    document.getElementById('scaleX').value = layer.scale.x;
    document.getElementById('scaleXVal').value = layer.scale.x.toFixed(2);
    document.getElementById('scaleY').value = layer.scale.y;
    document.getElementById('scaleYVal').value = layer.scale.y.toFixed(2);
    document.getElementById('opacity').value = layer.material.opacity;
    document.getElementById('opacityVal').value = layer.material.opacity.toFixed(2);
    document.getElementById('bendX').value = layer.userData.bendX || 0;
    document.getElementById('bendXVal').value = (layer.userData.bendX || 0).toFixed(2);
    document.getElementById('bendY').value = layer.userData.bendY || 0;
    document.getElementById('bendYVal').value = (layer.userData.bendY || 0).toFixed(2);
}

function updateLayerFromControls() {
    if (!selectedLayer) return;
    const posX = parseFloat(document.getElementById('posX').value);
    selectedLayer.position.x = posX;
    const posY = parseFloat(document.getElementById('posY').value);
    selectedLayer.position.y = posY;
    const rotDeg = parseFloat(document.getElementById('rotZ').value);
    selectedLayer.rotation.z = rotDeg * (Math.PI / 180);
    const scaleX = parseFloat(document.getElementById('scaleX').value);
    selectedLayer.scale.x = scaleX;
    const scaleY = parseFloat(document.getElementById('scaleY').value);
    selectedLayer.scale.y = scaleY;
    const opacity = parseFloat(document.getElementById('opacity').value);
    selectedLayer.material.opacity = opacity;
    
    const bendX = parseFloat(document.getElementById('bendX').value);
    const bendY = parseFloat(document.getElementById('bendY').value);
    selectedLayer.userData.bendX = bendX;
    selectedLayer.userData.bendY = bendY;
    applyBend(selectedLayer, bendX, bendY);
    
    document.getElementById('posXVal').value = posX.toFixed(3);
    document.getElementById('posYVal').value = posY.toFixed(3);
    document.getElementById('rotZVal').value = rotDeg.toFixed(1);
    document.getElementById('scaleXVal').value = scaleX.toFixed(2);
    document.getElementById('scaleYVal').value = scaleY.toFixed(2);
    document.getElementById('opacityVal').value = opacity.toFixed(2);
    document.getElementById('bendXVal').value = bendX.toFixed(2);
    document.getElementById('bendYVal').value = bendY.toFixed(2);
}

function applyBend(mesh, bendX, bendY) {
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        vertex.fromBufferAttribute(pos, i);
        const xOffset = (vertex.x * vertex.x) * bendX * 0.3;
        const yOffset = (vertex.y * vertex.y) * bendY * 0.3;
        vertex.z += xOffset + yOffset;
        pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
}

// ==============================================================
// UNDO / REDO SYSTEM
// ==============================================================

function saveState() {
    if (isUndoRedoAction) return;
    
    const state = {
        layers: allLayers.map(layer => ({
            id: layer.userData.label,
            position: layer.position.clone(),
            rotation: layer.rotation.z,
            scale: layer.scale.clone(),
            opacity: layer.material.opacity,
            bendX: layer.userData.bendX || 0,
            bendY: layer.userData.bendY || 0,
            z: layer.position.z,
            renderOrder: layer.renderOrder
        }))
    };
    
    if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1);
    }
    
    history.push(state);
    if (history.length > CONFIG.maxHistory) {
        history.shift();
    }
    historyIndex = history.length - 1;
    updateUndoRedoButtons();
}

function restoreState(state) {
    state.layers.forEach(layerState => {
        const mesh = layerMap[layerState.id];
        if (!mesh) return;
        mesh.position.copy(layerState.position);
        mesh.rotation.z = layerState.rotation;
        mesh.scale.copy(layerState.scale);
        mesh.material.opacity = layerState.opacity;
        mesh.userData.bendX = layerState.bendX;
        mesh.userData.bendY = layerState.bendY;
        applyBend(mesh, layerState.bendX, layerState.bendY);
        mesh.position.z = layerState.z;
        mesh.renderOrder = layerState.renderOrder;
    });
    if (selectedLayer) {
        updateControlsFromLayer(selectedLayer);
        document.getElementById('posXVal').value = selectedLayer.position.x.toFixed(3);
        document.getElementById('posYVal').value = selectedLayer.position.y.toFixed(3);
        const rotDeg = selectedLayer.rotation.z * (180 / Math.PI);
        document.getElementById('rotZVal').value = rotDeg.toFixed(1);
        document.getElementById('scaleXVal').value = selectedLayer.scale.x.toFixed(2);
        document.getElementById('scaleYVal').value = selectedLayer.scale.y.toFixed(2);
        document.getElementById('opacityVal').value = selectedLayer.material.opacity.toFixed(2);
        document.getElementById('bendXVal').value = (selectedLayer.userData.bendX || 0).toFixed(2);
        document.getElementById('bendYVal').value = (selectedLayer.userData.bendY || 0).toFixed(2);
    }
}

function undo() {
    if (historyIndex > 0) {
        isUndoRedoAction = true;
        historyIndex--;
        restoreState(history[historyIndex]);
        updateUndoRedoButtons();
        isUndoRedoAction = false;
    }
}

function redo() {
    if (historyIndex < history.length - 1) {
        isUndoRedoAction = true;
        historyIndex++;
        restoreState(history[historyIndex]);
        updateUndoRedoButtons();
        isUndoRedoAction = false;
    }
}

function updateUndoRedoButtons() {
    document.getElementById('btnUndo').disabled = historyIndex <= 0;
    document.getElementById('btnRedo').disabled = historyIndex >= history.length - 1;
}

document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRedo').addEventListener('click', redo);

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
});

// ==============================================================
// VINCULAR CONTROLES Y GUARDAR ESTADO
// ==============================================================

let saveTimeout = null;
function saveStateDebounced() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveState();
    }, 100);
}

document.getElementById('posX').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('posY').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('rotZ').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('scaleX').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('scaleY').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('opacity').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('bendX').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });
document.getElementById('bendY').addEventListener('input', () => { updateLayerFromControls(); saveStateDebounced(); });

['posX', 'posY', 'rotZ', 'scaleX', 'scaleY', 'opacity', 'bendX', 'bendY'].forEach(id => {
    document.getElementById(id + 'Val').addEventListener('input', function() {
        document.getElementById(id).value = this.value;
        updateLayerFromControls();
        saveStateDebounced();
    });
});

document.getElementById('posX').addEventListener('change', saveState);
document.getElementById('posY').addEventListener('change', saveState);
document.getElementById('rotZ').addEventListener('change', saveState);
document.getElementById('scaleX').addEventListener('change', saveState);
document.getElementById('scaleY').addEventListener('change', saveState);
document.getElementById('opacity').addEventListener('change', saveState);
document.getElementById('bendX').addEventListener('change', saveState);
document.getElementById('bendY').addEventListener('change', saveState);

document.getElementById('btnResetLayer').addEventListener('click', () => {
    if (!selectedLayer) return;
    const orig = selectedLayer.userData.originalConfig;
    selectedLayer.position.set(orig.posX, orig.posY, orig.posZ);
    selectedLayer.rotation.z = orig.rotZ || 0;
    selectedLayer.scale.set(orig.scaleX, orig.scaleY, 1);
    selectedLayer.material.opacity = orig.opacity !== undefined ? orig.opacity : 1;
    selectedLayer.userData.bendX = 0;
    selectedLayer.userData.bendY = 0;
    applyBend(selectedLayer, 0, 0);
    updateControlsFromLayer(selectedLayer);
    saveState();
});

document.getElementById('btnResetAll').addEventListener('click', () => {
    allLayers.forEach(layer => {
        const orig = layer.userData.originalConfig;
        layer.position.set(orig.posX, orig.posY, orig.posZ);
        layer.rotation.z = orig.rotZ || 0;
        layer.scale.set(orig.scaleX, orig.scaleY, 1);
        layer.material.opacity = orig.opacity !== undefined ? orig.opacity : 1;
        layer.userData.bendX = 0;
        layer.userData.bendY = 0;
        applyBend(layer, 0, 0);
    });
    if (selectedLayer) updateControlsFromLayer(selectedLayer);
    saveState();
});

setTimeout(() => { saveState(); }, 100);

// ==============================================================
// CONTROL DE SUPERPOSICIÓN
// ==============================================================

function bringToFront() {
    if (!selectedLayer) {
        console.warn('⚠️ No hay capa seleccionada');
        return;
    }
    
    const sorted = [...allLayers].sort((a, b) => a.renderOrder - b.renderOrder);
    const totalLayers = sorted.length;
    
    console.log(`📊 Total de capas: ${totalLayers}`);
    console.log('🔍 Orden actual:');
    sorted.forEach((layer, i) => {
        console.log(`  ${i+1}. ${layer.userData.label} (renderOrder=${layer.renderOrder})`);
    });
    
    const currentIndex = sorted.findIndex(layer => layer === selectedLayer);
    console.log(`📌 ${selectedLayer.userData.label} está en posición ${currentIndex + 1} de ${totalLayers}`);
    
    if (currentIndex >= totalLayers - 1) {
        console.log('⚠️ La capa ya está en la posición más alta');
        return;
    }
    
    const layerAbove = sorted[currentIndex + 1];
    const tempRenderOrder = selectedLayer.renderOrder;
    selectedLayer.renderOrder = layerAbove.renderOrder;
    layerAbove.renderOrder = tempRenderOrder;
    
    console.log(`✅ ${selectedLayer.userData.label} subió a la posición ${currentIndex + 2} de ${totalLayers}`);
    console.log(`📊 ${layerAbove.userData.label} bajó a la posición ${currentIndex + 1} de ${totalLayers}`);
    
    saveState();
}

function sendToBack() {
    if (!selectedLayer) {
        console.warn('⚠️ No hay capa seleccionada');
        return;
    }
    
    const sorted = [...allLayers].sort((a, b) => a.renderOrder - b.renderOrder);
    const totalLayers = sorted.length;
    
    console.log(`📊 Total de capas: ${totalLayers}`);
    console.log('🔍 Orden actual:');
    sorted.forEach((layer, i) => {
        console.log(`  ${i+1}. ${layer.userData.label} (renderOrder=${layer.renderOrder})`);
    });
    
    const currentIndex = sorted.findIndex(layer => layer === selectedLayer);
    console.log(`📌 ${selectedLayer.userData.label} está en posición ${currentIndex + 1} de ${totalLayers}`);
    
    if (currentIndex <= 0) {
        console.log('⚠️ La capa ya está en la posición más baja');
        return;
    }
    
    const layerBelow = sorted[currentIndex - 1];
    const tempRenderOrder = selectedLayer.renderOrder;
    selectedLayer.renderOrder = layerBelow.renderOrder;
    layerBelow.renderOrder = tempRenderOrder;
    
    console.log(`✅ ${selectedLayer.userData.label} bajó a la posición ${currentIndex} de ${totalLayers}`);
    console.log(`📊 ${layerBelow.userData.label} subió a la posición ${currentIndex + 1} de ${totalLayers}`);
    
    saveState();
}

document.getElementById('btnBringToFront').addEventListener('click', bringToFront);
document.getElementById('btnSendToBack').addEventListener('click', sendToBack);

document.getElementById('btnBringToFront').disabled = true;
document.getElementById('btnSendToBack').disabled = true;

// ==============================================================
// INTERRUPTOR DE ANIMACIONES
// ==============================================================

const btnToggleAnimations = document.getElementById('btnToggleAnimations');

btnToggleAnimations.addEventListener('click', () => {
    animationsEnabled = !animationsEnabled;
    if (animationsEnabled) {
        btnToggleAnimations.textContent = 'DESACTIVAR ANIMACIONES';
        btnToggleAnimations.classList.add('active');
        console.log('✅ ANIMACIONES ACTIVADAS');
    } else {
        btnToggleAnimations.textContent = 'ACTIVAR ANIMACIONES';
        btnToggleAnimations.classList.remove('active');
        console.log('⏸️ ANIMACIONES DESACTIVADAS');
    }
});

// ==============================================================
// CONTROL DEL SIDEBAR
// ==============================================================

document.getElementById('btnToggleSidebar').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});
document.getElementById('btnMinimize').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
});

// ==============================================================
// ANIMACIÓN
// ==============================================================

const mouse = { x: 0, y: 0 };
let isHovering = false;
let time = 0;

document.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const dist = Math.sqrt(Math.pow(mouse.x, 2) + Math.pow(mouse.y, 2));
    isHovering = dist < 0.3;
});

const ojoIzqCenter = new THREE.Vector2(CAPAS.ojoIzq.posX, CAPAS.ojoIzq.posY);
const ojoDerCenter = new THREE.Vector2(CAPAS.ojoDer.posX, CAPAS.ojoDer.posY);

function animate() {
    requestAnimationFrame(animate);
    time += 0.001;
    
    if (isHovering) {
        renderer.domElement.style.transform = `scale(${CONFIG.lupaZoom})`;
        renderer.domElement.style.transition = 'transform 0.1s';
    } else {
        renderer.domElement.style.transform = 'scale(1)';
        renderer.domElement.style.transition = 'transform 0.3s';
    }
    
    if (!animationsEnabled) {
        renderer.render(scene, camera);
        return;
    }
    
    const ppos = particles.geometry.attributes.position.array;
    for (let i = 0; i < ppos.length; i += 3) {
        ppos[i] += Math.sin(time + i) * 0.0002;
        ppos[i+1] += Math.cos(time * 0.8 + i * 0.5) * 0.0002;
        ppos[i+2] += Math.sin(time * 0.5 + i * 0.3) * 0.0001;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y += 0.0001;
    particles.material.opacity = 0.7 + Math.sin(time * 0.5) * 0.1;
    
    const isOjoSelected = selectedLayer && 
        (selectedLayer === layerMap['Ojo Izq'] || selectedLayer === layerMap['Ojo Der']);
    
    if (!isOjoSelected) {
        const maxAngle = 0.26;
        const angleIzqVal = Math.atan2(mouse.y - ojoIzqCenter.y, mouse.x - ojoIzqCenter.x);
        const angleDerVal = Math.atan2(mouse.y - ojoDerCenter.y, mouse.x - ojoDerCenter.x);
        layerMap['Ojo Izq'].rotation.z += (Math.max(-maxAngle, Math.min(maxAngle, angleIzqVal * 0.5)) - layerMap['Ojo Izq'].rotation.z) * 0.1;
        layerMap['Ojo Der'].rotation.z += (Math.max(-maxAngle, Math.min(maxAngle, angleDerVal * 0.5)) - layerMap['Ojo Der'].rotation.z) * 0.1;
    }
    
    const isParpSelected = selectedLayer && 
        (selectedLayer === layerMap['Párpado Izq'] || selectedLayer === layerMap['Párpado Der']);
    
    if (!isParpSelected) {
        const blinkProgress = (Date.now() % CONFIG.parpadeoVelocidad) / CONFIG.parpadeoVelocidad;
        let blink = 0;
        if (blinkProgress > 0.95) {
            const blinkPhase = (blinkProgress - 0.95) / 0.05;
            blink = Math.sin(blinkPhase * Math.PI);
        }
        layerMap['Párpado Izq'].material.opacity = blink;
        layerMap['Párpado Der'].material.opacity = blink;
    }
    
    const breath = 1 + Math.sin(Date.now() * 0.0005) * 0.01;
    layerMap['C11 Cuello'].scale.y = breath;
    layerMap['C11 Cuello'].position.y = (breath - 1) * -0.5;
    
    const isCapaCabelloSelected = selectedLayer && selectedLayer.userData.label?.startsWith('C');
    
    if (!isCapaCabelloSelected) {
        const wind = Math.sin(Date.now() * CONFIG.vientoVelocidad) * 0.005;
        const speedWind = 0.01;
        layerMap['C1 Corona'].position.x += (wind * 0.5 - layerMap['C1 Corona'].position.x) * speedWind;
        layerMap['C2 Frontal'].position.x += (wind * 0.3 - layerMap['C2 Frontal'].position.x) * speedWind;
        layerMap['C4 Central Der'].position.x += (wind * 0.4 - layerMap['C4 Central Der'].position.x) * speedWind;
        layerMap['C6 Puntas Der'].position.x += (wind * 0.6 - layerMap['C6 Puntas Der'].position.x) * speedWind;
        layerMap['C7 Inf Central'].position.x += (wind * 0.2 - layerMap['C7 Inf Central'].position.x) * speedWind;
    }
    
    layerMap['Glow'].material.opacity = 0.12 + Math.sin(Date.now() * 0.001) * 0.05;
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    const w = container.clientWidth, h = container.clientHeight;
    const aspect = w / h;
    if (aspect > CONFIG.aspectBase) {
        camera.left = -CONFIG.aspectBase;
        camera.right = CONFIG.aspectBase;
        camera.top = 1;
        camera.bottom = -1;
    } else {
        camera.left = -1;
        camera.right = 1;
        camera.top = 1 / CONFIG.aspectBase;
        camera.bottom = -1 / CONFIG.aspectBase;
    }
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
});

startDevToolsDetection();

console.log('✅ Editor con OJOS VISIBLES (color de fallback)');
animate();