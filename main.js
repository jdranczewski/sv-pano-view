import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// Obtain metadata
const panoId =  "bl3v0-ol5SonuMF_4ozgxQ";
const API_KEY = "API_KEY"
// https://developers.google.com/maps/documentation/tile/session_tokens
const session = 'session';
const meta_response = await fetch(
    "https://tile.googleapis.com/v1/streetview/metadata" +
    `?session=${session}&key=${API_KEY}&` +
    `panoId=${panoId}`
)
const metadata = await meta_response.json();
console.log(metadata);

// Compute pano properties
const zoom = 2

const tileWidth = metadata["tileWidth"]
const tileHeight = metadata["tileHeight"]

const imageWidth = metadata["imageWidth"]
const imageHeight = metadata["imageHeight"]

const cropWidth = Math.floor(imageWidth/2**(5-zoom))
const cropHeight = Math.floor(imageHeight/2**(5-zoom))

const nX = Math.ceil(cropWidth/tileWidth)
const nY = Math.ceil(cropHeight/tileHeight)

// this much pi per tile
const slice_h = 2*Math.PI / (cropWidth/tileWidth)
const slice_v = Math.PI / (cropHeight/tileHeight)
console.log(slice_h, cropWidth, tileWidth, cropWidth/tileWidth)

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
            1, 32, 16,
            start_x, width_x, start_y, width_y
        );

        let loader = new THREE.TextureLoader();
        // let texture = loader.load( `${x}${y}.jpg` );
        let texture = loader.load(
            "https://tile.googleapis.com/v1/streetview/tiles" +
            `/${zoom}/${x}/${y}` +
            `?session=${session}&key=${API_KEY}&` +
            `panoId=${panoId}`
        );
        texture.colorSpace = THREE.SRGBColorSpace;
        if ((x == nX-1) || (y == nY-1)) {
            texture.matrixAutoUpdate = false;
            let scale_x = (x == nX-1) ? width_x/slice_h : 1;
            let scale_y = (y == nY-1) ? width_y/slice_v : 1;
            let shift_y = (y == nY-1) ? (1-width_y/slice_v) : 0;
            console.log(x, y, scale_x, scale_y)
            texture.matrix.set(scale_x, 0, 0, 0, scale_y, shift_y, 0, 0, 1)
        }
        console.log(texture);
        let material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
        });

        let cube = new THREE.Mesh( geometry, material );
        scene.add( cube );
    }
}

camera.position.z = 5;
controls.update();

function animate() {
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );