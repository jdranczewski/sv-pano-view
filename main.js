import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'dat.gui'

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
// controls.autoRotate = true;
controls.enableDamping = true;

// Simple GUI
var settings = {
    live: false,
    api_key: "",
    session: "",
    zoom: 3
};
const gui = new GUI();
gui.remember(settings)
let folder = gui.addFolder("Settings")
folder.add(settings, "live");
folder.add(settings, "zoom");
folder.add(settings, "api_key");
folder.add(settings, "session");

// Get the current IRT pano
const socket = new WebSocket(
  "wss://internet-roadtrip-listen-eqzms.ondigitalocean.app",
);
let panoId = "";
var force_refresh = {refresh: async function(){ await show_pano() }};
gui.add(force_refresh, "refresh");

socket.onmessage = async (event) => {
    const msg = JSON.parse(event.data);
    if (panoId == msg["pano"]) return;

    if (!settings.live && panoId == "") {
        panoId = msg["pano"];
        await show_pano();
    } else {
        panoId = msg["pano"];
        if (settings.live) await show_pano();
    }
}

async function show_pano() {
    // Obtain metadata
    // const panoId =  "bl3v0-ol5SonuMF_4ozgxQ";
    // const panoId = "CAoSLEFGMVFpcE1fc2VYOHFCa3drZS1LSUVPS0QzVE52UWpWbjlVT1Z2OUZvaVBX";
    const meta_response = await fetch(
        "https://tile.googleapis.com/v1/streetview/metadata" +
        `?session=${settings['session']}&key=${settings['api_key']}&` +
        `panoId=${panoId}`
    )
    const metadata = await meta_response.json();

    // Compute pano properties
    const zoom = settings["zoom"];

    const tileWidth = metadata["tileWidth"]
    const tileHeight = metadata["tileHeight"]

    const imageWidth = metadata["imageWidth"]
    const imageHeight = metadata["imageHeight"]

    const zoom_crop = panoId.substring(0, 4) == "CAoS" ? zoom + 1 : zoom
    const cropWidth = Math.floor(imageWidth/2**(5-zoom_crop))
    const cropHeight = Math.floor(imageHeight/2**(5-zoom_crop))

    const nX = Math.ceil(cropWidth/tileWidth)
    const nY = Math.ceil(cropHeight/tileHeight)

    // this much pi per tile
    const slice_h = 2*Math.PI / (cropWidth/tileWidth)
    const slice_v = Math.PI / (cropHeight/tileHeight)

    // Clear the scene
    while(scene.children.length > 0){ 
        scene.remove(scene.children[0]); 
    }

    // Create the geometry of the various slices
    for (let y = 0; y < nY; y++) {
        for (let x = 0; x < nX; x++) {
            let start_x = slice_h*x;
            let width_x = slice_h;
            if (start_x + width_x > 2*Math.PI) {
                width_x = 2*Math.PI - start_x;
            }

            let start_y = slice_v*y;
            let width_y = slice_v;
            if (start_y + width_y > Math.PI) {
                width_y = Math.PI - start_y;
            }

            let geometry = new THREE.SphereGeometry(
                10, 32, 16,
                -start_x, -width_x, start_y, width_y
            );

            let loader = new THREE.TextureLoader();
            // let texture = loader.load( `${x}${y}.jpg` );
            let texture = loader.load(
                "https://tile.googleapis.com/v1/streetview/tiles" +
                `/${zoom}/${x}/${y}` +
                `?session=${settings['session']}&key=${settings['api_key']}&` +
                `panoId=${panoId}`
            );
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.matrixAutoUpdate = false;
            let scale_x = (x == nX-1) ? width_x/slice_h : 1;
            let scale_y = (y == nY-1) ? width_y/slice_v : 1;
            let shift_y = (y == nY-1) ? (1-width_y/slice_v) : 0;
            texture.matrix.set(scale_x, 0, 0, 0, scale_y, shift_y, 0, 0, 1)
            let material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
            });

            let cube = new THREE.Mesh( geometry, material );
            scene.add( cube );
        }
    }
}

camera.position.z = 1;
controls.update();

function animate() {
    controls.update();
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );