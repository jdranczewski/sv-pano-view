import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Create the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );

// Create the geometry of the various slices
const geometry = new THREE.SphereGeometry(
    1, 32, 16,
    0, 1.933287786824488, 0, 1.933287786824488
);
const loader = new THREE.TextureLoader();
const texture = loader.load( '0.jpg' );
texture.colorSpace = THREE.SRGBColorSpace;
const material = new THREE.MeshBasicMaterial({
  map: texture,
});

const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

const geometry2 = new THREE.SphereGeometry(
    1, 32, 16,
    1.933287786824488, 1.933287786824488, 0, 1.933287786824488
);
const loader2 = new THREE.TextureLoader();
const texture2 = loader.load( '1.jpg' );
texture2.colorSpace = THREE.SRGBColorSpace;
const material2 = new THREE.MeshBasicMaterial({
  map: texture2,
});

const cube2 = new THREE.Mesh( geometry2, material2 );
scene.add( cube2 );

camera.position.z = 5;
controls.update();

function animate() {
    renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );