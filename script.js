/*

 _____                         ______                 ___   ____ 
|  __ \                        |  _  \               /   | / ___|
| |  \/  __ _  _ __ ___    ___ | | | |  ___ __   __ / /| |/ /___ 
| | __  / _` || '_ ` _ \  / _ \| | | | / _ \\ \ / // /_| || ___ \
| |_\ \| (_| || | | | | ||  __/| |/ / |  __/ \ V / \___  || \_/ |
 \____/ \__,_||_| |_| |_| \___||___/   \___|  \_/      |_/\_____/


*/

/* 
	AUTHOR: GameDev46

	replit: https://replit.com/@GameDev46
	youtube: https://www.youtube.com/@gamedev46
	twitter: https://twitter.com/GameDev46
	github: https://github.com/GameDev46
*/

/* ------------------------------------ */

// https://threejs.org/examples

// import THREE.JS by Mr Doob https://threejs.org

import * as THREE from './three/three.module.min.js';

import { PointerLockControls } from './three/PointerLockControls.js';

import { Sky } from './three/sky.js';

import { perlin } from './perlin.js';

import { vertexShader, fragmentShader } from './three/grassShader.js';
import { waterVertexShader, waterFragmentShader } from './three/waterShader.js';

let scene, camera, renderer, cube, clock, mouseDown, middleButtonDown, rightClickDown, mobileFingerMovementPos, keyboard, mobileEuler, controls, gravity, chunks, chunkSize, voxelSize, worldHeight, worldSize, worldObjects, pointer, lastMouseDown, hasLocked, landscapeOctaves, landscapeHeightMultiplier, renderedVoxels, waterLevel, renderDistance, activeChunks, geometryCache, seed, tntToExplode, blastRadius, treeSpawnChance, waterPlanes, waterTimer, uniforms, sky, sun, directionalLight, ambience, breakBlockTimer, daylightCycle, seedOffset, grassUniforms, grassMaterials, waterUniforms, waterMaterials, grassTimeOffsets;

mobileFingerMovementPos = [0, 0];

daylightCycle = true;

seedOffset = {
	x: Math.random() * 200,
	y: Math.random() * 200,
	z: Math.random() * 200
}

pointer = {
	x: 0,
	y: 0
}

let hotBar = {
	inventory: [{ type: "tnt", count: 64, position: 0 }, { type: "glass", count: 64, position: 1 }, { type: "bricks", count: 64, position: 2 }],
	inventoryHolder: { "tnt": 0, "glass": 1, "bricks": 2 },
	selectedItem: 0,
	destroyTime: { "grass": 0.5, "dirt": 0.5, "stone": 1.5, "sand": 0.1, "bark": 1, "leaves": 0, "bricks": 1, "glass": 0, "tnt": 0.5 },
	updateInventoryUI: function() {

		for (let i = 0; i < hotBar.inventory.length; i++) {

			document.getElementById("slot" + hotBar.inventory[i].position).children[0].style.opacity = 1;
			document.getElementById("count" + hotBar.inventory[i].position).style.opacity = 1;

			document.getElementById("count" + hotBar.inventory[i].position).innerText = hotBar.inventory[i].count;
			document.getElementById("slot" + hotBar.inventory[i].position).children[0].src = "./textures/" + hotBar.inventory[i].type + ".png";

		}

		for (let i = 0; i < 9; i++) {

			let isFreePlace = true;

			for (let x = 0; x < hotBar.inventory.length; x++) {
				if (hotBar.inventory[x].position == i) {
					isFreePlace = false;
				}
			}

			if (isFreePlace) {
				document.getElementById("slot" + i).children[0].style.opacity = 0;
				document.getElementById("count" + i).style.opacity = 0;
			}

		}

	}
}

hotBar.updateInventoryUI();

breakBlockTimer = 0;

hasLocked = false;

keyboard = {};

chunks = []
chunkSize = 15

voxelSize = 3

worldHeight = 120
worldSize = 12 // Chunks

renderDistance = 100

landscapeOctaves = 8;
landscapeHeightMultiplier = 0.6;
waterLevel = 20;

treeSpawnChance = 1.5;

worldObjects = [];
renderedVoxels = [];

waterPlanes = [];
waterTimer = 0;

activeChunks = [];

lastMouseDown = [false, false, false, false];

geometryCache = {};

seed = "";

tntToExplode = [];

blastRadius = 5

let player = {
	yVelocity: 0,
	height: 5,
	gravity: 9.81,
	savedGravity: 9.81,
	mass: 20,
	canJump: false,
	groundHeight: 0,
	jumpHeight: 50,
	collisionAccuracy: 0.01,
	speed: 25,
	sideSpeed: 23,
	recordedSpeed: 25,
	friction: 0.8,
	waterFriction: 0.3,
	savedWaterFriction: 0.6,
	speedFriction: [0, 0],
	lastJump: false,
	lastPressedSpace: false,
	currentChunk: [0, 0],
	waterUpwardsSpeed: 20
}

gravity = player.gravity;

let sceneLoader = new THREE.TextureLoader();

let textureLoader = {
	grass: sceneLoader.load('./textures/grass.png'),
	dirt: sceneLoader.load('./textures/dirt.png'),
	stone: sceneLoader.load('./textures/stone.png'),
	wood: sceneLoader.load('./textures/wood.png'),
	sand: sceneLoader.load('./textures/sand.png'),
	bricks: sceneLoader.load('./textures/bricks.png'),
	water: sceneLoader.load('./textures/water.png'),
	bark: sceneLoader.load('./textures/wood.png'),
	bark2: sceneLoader.load('./textures/bark2.png'),
	leaves: sceneLoader.load('./textures/leaves.png'),
	leavesAlpha: sceneLoader.load('./textures/leavesAlpha.png'),
	leaves2: sceneLoader.load('./textures/leaves2.png'),
	tnt: sceneLoader.load('./textures/tnt.png'),
	glass: sceneLoader.load('./textures/glass.png'),
	glassAlpha: sceneLoader.load('./textures/glassAlpha.png'),
	grassTuft: sceneLoader.load('./textures/grass.png'),
	grassTuftAlpha: sceneLoader.load('./textures/grassTuftAlpha.png'),
	grassTuftAlpha2: sceneLoader.load('./textures/grassTuftAlpha2.png'),
	flower: sceneLoader.load('./textures/flower.png'),
	flowerAlpha: sceneLoader.load('./textures/flowerAlpha.png'),
	flower2: sceneLoader.load('./textures/flower2.png'),
	flower2Alpha: sceneLoader.load('./textures/flower2Alpha.png'),
	flower3: sceneLoader.load('./textures/flower3.png'),
	flower3Alpha: sceneLoader.load('./textures/flower2Alpha.png'),
	flower4: sceneLoader.load('./textures/flower4.png'),
	flower4Alpha: sceneLoader.load('./textures/flower4Alpha.png'),
	selectionCube: sceneLoader.load('./textures/selectionCube.png'),
	selectionCubeAlpha: sceneLoader.load('./textures/selectionCubeAlpha.png'),
	selectionCubeDigging1Alpha: sceneLoader.load('./textures/selectionCubeDigging1Alpha.png'),
	selectionCubeDigging2Alpha: sceneLoader.load('./textures/selectionCubeDigging2Alpha.png'),
	selectionCubeDigging3Alpha: sceneLoader.load('./textures/selectionCubeDigging3Alpha.png')
}

let normalLoader = {
	water: sceneLoader.load('./normals/waterNormal.png'),
	leaves: sceneLoader.load('./normals/leavesNormal.png'),
	grass: sceneLoader.load('./normals/leavesNormal.png')
}

let waterData = {
	waveLength: 0.1,
	waveHeight: 0.25,
	waveSpeed: 1
}

function init() {

	scene = new THREE.Scene();

	scene.fog = new THREE.Fog(0x63b9db, 2000, 2100);

	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);

	clock = new THREE.Clock();

	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor("#63b9db")
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	// THREE.BasicShadowMap, THREE.PCFShadowMap, THREE.PCFSoftShadowMap, THREE.VSMShadowMap

	// Default pixel quality
	renderer.setPixelRatio(window.devicePixelRatio);

	renderer.toneMapping = THREE.LinearToneMapping;
	renderer.toneMappingExposure = 0.95;

	document.body.appendChild(renderer.domElement);

	camera.position.z = (worldSize * chunkSize * voxelSize) / 2;
	camera.position.y = (150 * voxelSize);
	camera.position.x = (worldSize * chunkSize * voxelSize) / 2;

	camera.rotation.x = -1.3;

	sky = new Sky();
	sky.scale.setScalar(450000);
	scene.add(sky);

	sun = new THREE.Vector3();

	uniforms = sky.material.uniforms;
	uniforms['turbidity'].value = 3;
	uniforms['rayleigh'].value = 1.4;
	uniforms['mieCoefficient'].value = 0.07;
	uniforms['mieDirectionalG'].value = 0.99999;

	sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 30), THREE.MathUtils.degToRad(225));

	uniforms['sunPosition'].value.copy(sun);

	// Setup grass shader

	grassUniforms = {}
	grassMaterials = {}
	grassTimeOffsets = {}

	// Setup water shader

	waterUniforms = {}
	waterMaterials = {}

	// add lights

	directionalLight = new THREE.DirectionalLight(0xffffdd, 0.7);
	directionalLight.position.set((worldSize * chunkSize * voxelSize) / 2, 100, (worldSize * chunkSize * voxelSize) / 2)
	directionalLight.castShadow = true;
	directionalLight.isLightInScene = true;

	directionalLight.shadow.camera.near = 1;
	directionalLight.shadow.camera.far = 500;

	directionalLight.shadow.bias = -0.001;

	directionalLight.shadow.mapSize.width = 1024;
	directionalLight.shadow.mapSize.height = 1024;

	directionalLight.shadow.camera.left = 500;
	directionalLight.shadow.camera.right = -500;
	directionalLight.shadow.camera.top = 50;
	directionalLight.shadow.camera.bottom = -100;

	scene.add(directionalLight);

	directionalLight.target.position.set(((worldSize * chunkSize * voxelSize) / 2), 98, ((worldSize * chunkSize * voxelSize) / 2) + 1)

	scene.add(directionalLight.target);

	//scene.add(light.target);


	ambience = new THREE.HemisphereLight(0xffffdd, 0xddffdd, 0.7);
	ambience.isLightInScene = true;
	scene.add(ambience);

	// Bullet shooting
	renderer.domElement.addEventListener("mousedown", e => {
		if (e.button == 0) {
			mouseDown = true;

			breakBlockTimer = 0;
		}
		else if (e.button == 1) {
			e.preventDefault();
			middleButtonDown = true;
		}
		else if (e.button == 2) {
			rightClickDown = true;
		}

		if (hasLocked) {
			pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
			pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
		}
	})

	renderer.domElement.addEventListener("mouseup", e => {
		if (e.button == 0) {
			mouseDown = false;

			breakBlockTimer = 0;
		}
		else if (e.button == 1) {
			middleButtonDown = false;
		}
		else if (e.button == 2) {
			rightClickDown = false;
		}

		if (hasLocked) {
			pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
			pointer.y = - (e.clientY / window.innerHeight) * 2 + 1;
		}
	})

	renderer.domElement.addEventListener("touchstart", e => {
		let touch = e.targetTouches[0];
		mobileFingerMovementPos = [touch.pageX, touch.pageY];

		mouseDown = true;

		if (hasLocked) {
			pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
			pointer.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1;
		}
	})

	mobileEuler = new THREE.Euler(0, 0, 0, 'YXZ');

	renderer.domElement.addEventListener("touchmove", e => {
		let touch = e.targetTouches[0];

		let movementX = (mobileFingerMovementPos[0] - touch.pageX) * -0.02;
		let movementY = (mobileFingerMovementPos[1] - touch.pageY) * -0.01;

		let _PI_2 = Math.PI / 2;

		mobileEuler.setFromQuaternion(camera.quaternion);

		mobileEuler.y -= movementX;
		mobileEuler.x -= movementY;

		mobileEuler.x = Math.max(_PI_2 - Math.PI, Math.min(_PI_2 - 0, mobileEuler.x));

		camera.quaternion.setFromEuler(mobileEuler);

		mobileFingerMovementPos = [touch.pageX, touch.pageY];

		pointer.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
		pointer.y = - (e.touches[0].clientY / window.innerHeight) * 2 + 1;
	})

	renderer.domElement.addEventListener("touchend", e => {
		let touch = e.changedTouches[0];
		mobileFingerMovementPos = [touch.pageX, touch.pageY];

		mouseDown = false;

		pointer.x = (e.changedTouches[0].clientX / window.innerWidth) * 2 - 1;
		pointer.y = - (e.changedTouches[0].clientY / window.innerHeight) * 2 + 1;
	})

}

let developerInfoActive = false;

document.getElementById("developerInfo").style.display = "none";

window.addEventListener("keydown", e => {
	keyboard[e.key.toLowerCase()] = true;

	if (e.key.toLowerCase() == "h") {
		// toggle developer info

		developerInfoActive = !developerInfoActive;

		if (developerInfoActive) {
			document.getElementById("developerInfo").style.display = "block";
		}
		else {
			document.getElementById("developerInfo").style.display = "none";
		}
	}
})

window.addEventListener("keyup", e => {
	keyboard[e.key.toLowerCase()] = false;
})

// Keyboard controlls

function processKeyboard(delta) {

	let calcWaterHeight = (waterLevel * voxelSize) + (Math.cos(waterTimer + ((camera.position.x + camera.position.z) * waterData.waveLength)) * waterData.waveHeight)

	if (camera.position.y < calcWaterHeight + (player.height / 2)) {
		player.speedFriction[0] = player.waterFriction * player.speedFriction[0] * delta;
		player.speedFriction[1] = player.waterFriction * player.speedFriction[1] * delta;
	}
	else {
		player.speedFriction[0] = player.friction * player.speedFriction[0] * delta;
		player.speedFriction[1] = player.friction * player.speedFriction[1] * delta;
	}

	if (keyboard["w"]) {
		player.speedFriction[0] += player.speed * delta;
		if (keyboard["shift"]) player.speedFriction[0] += player.speed * delta * 0.4;
	}

	if (keyboard["s"]) {
		player.speedFriction[0] -= player.speed * delta;
	}

	if (keyboard["a"]) {
		player.speedFriction[1] -= player.sideSpeed * delta;
	}

	if (keyboard["d"]) {
		player.speedFriction[1] += player.sideSpeed * delta;
	}

	controls.moveForward(player.speedFriction[0])
	controls.moveRight(player.speedFriction[1])

	if (player.speedFriction[0] > 0.1 || player.speedFriction[1] > 0.1 || player.speedFriction[0] < -0.1 || player.speedFriction[1] < -0.1) {

		for (let x = 0; x < worldSize; x++) {
			for (let z = 0; z < worldSize; z++) {

				if (calculateDistance((x * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), (z * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), camera.position.x, camera.position.z) < renderDistance && activeChunks[x][z] == false) {
					removeChunks(x, z);

					renderChunks(x, z);

					activeChunks[x][z] = true;
				}
				else if (activeChunks[x][z] == true && calculateDistance((x * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), (z * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), camera.position.x, camera.position.z) > renderDistance) {
					removeChunks(x, z);
					activeChunks[x][z] = false;
				}
			}
		}

	}

}

function physicsUpdate(delta) {

	let calcWaterHeight = (waterLevel * voxelSize) + (Math.cos(waterTimer + ((camera.position.x + camera.position.z) * waterData.waveLength)) * waterData.waveHeight)

	player.yVelocity -= gravity * player.mass * delta;

	if (camera.position.y < calcWaterHeight + (player.height / 2)) {
		// Player is underwater
		player.yVelocity = player.yVelocity * player.waterFriction;
	}

	camera.position.y += player.yVelocity * delta;

	player.canJump = false;

	// Ground check

	let playerSize = 0.73;
	let distanceToRaycast = 1.6;

	let raycastPos1 = new THREE.Vector3(camera.position.x + playerSize, camera.position.y - player.height + 1.5, camera.position.z);
	let raycastPos2 = new THREE.Vector3(camera.position.x - playerSize, camera.position.y - player.height + 1.5, camera.position.z);
	let raycastPos3 = new THREE.Vector3(camera.position.x, camera.position.y - player.height + 1.5, camera.position.z + playerSize);
	let raycastPos4 = new THREE.Vector3(camera.position.x, camera.position.y - player.height + 1.5, camera.position.z - playerSize);
	let raycastPos5 = new THREE.Vector3(camera.position.x, camera.position.y - player.height + 1.5, camera.position.z);

	let raycaster = new THREE.Raycaster(raycastPos1, new THREE.Vector3(0, -1, 0), 0, distanceToRaycast);
	let raycaster2 = new THREE.Raycaster(raycastPos2, new THREE.Vector3(0, -1, 0), 0, distanceToRaycast);
	let raycaster3 = new THREE.Raycaster(raycastPos3, new THREE.Vector3(0, -1, 0), 0, distanceToRaycast);
	let raycaster4 = new THREE.Raycaster(raycastPos4, new THREE.Vector3(0, -1, 0), 0, distanceToRaycast);
	let raycaster5 = new THREE.Raycaster(raycastPos5, new THREE.Vector3(0, -1, 0), 0, distanceToRaycast);

	let intersects1 = raycaster.intersectObjects(scene.children);
	let intersects2 = raycaster2.intersectObjects(scene.children);
	let intersects3 = raycaster3.intersectObjects(scene.children);
	let intersects4 = raycaster4.intersectObjects(scene.children);
	let intersects5 = raycaster5.intersectObjects(scene.children);

	// Remove water as a valid surface

	for (let h = 0; h < intersects1.length; h++) {
		if (intersects1[h].object.jumpableSurface == false) {
			intersects1.splice(h, 1);
			h -= 1;
		}
	}

	for (let h = 0; h < intersects2.length; h++) {
		if (intersects2[h].object.jumpableSurface == false) {
			intersects2.splice(h, 1);
			h -= 1;;
		}
	}

	for (let h = 0; h < intersects3.length; h++) {
		if (intersects3[h].object.jumpableSurface == false) {
			intersects3.splice(h, 1);
			h -= 1;
		}
	}

	for (let h = 0; h < intersects4.length; h++) {
		if (intersects4[h].object.jumpableSurface == false) {
			intersects4.splice(h, 1);
			h -= 1;
		}
	}

	for (let h = 0; h < intersects5.length; h++) {
		if (intersects5[h].object.jumpableSurface == false) {
			intersects5.splice(h, 1);
			h -= 1;
		}
	};

	let intersects = intersects1.length + intersects2.length + intersects3.length + intersects4.length + intersects5.length;

	let padding = 0.12;

	if (player.groundHeight > camera.position.y - player.height) {
		camera.position.y += player.groundHeight - (camera.position.y - player.height)
		camera.position.y += padding;
	}

	if (intersects > 0) {

		if (intersects1.length > 0) {
			camera.position.y += intersects1[0].object.position.y - (camera.position.y - player.height)
			camera.position.y += padding;
		}
		else if (intersects2.length > 0) {
			camera.position.y += intersects2[0].object.position.y - (camera.position.y - player.height)
			camera.position.y += padding;
		}
		else if (intersects3.length > 0) {
			camera.position.y += intersects3[0].object.position.y - (camera.position.y - player.height)
			camera.position.y += padding;
		}
		else if (intersects4.length > 0) {
			camera.position.y += intersects4[0].object.position.y - (camera.position.y - player.height)
			camera.position.y += padding;
		}
		else if (intersects5.length > 0) {
			camera.position.y += intersects5[0].object.position.y - (camera.position.y - player.height)
			camera.position.y += padding;
		}

		player.yVelocity = 0;
		player.canJump = true;
	}

	if (camera.position.y - player.height < calcWaterHeight + (player.height / 2) && keyboard[" "]) {
		player.canJump = false;
		player.yVelocity = player.waterUpwardsSpeed;
	}

	if ((player.canJump && keyboard[" "] && !player.lastPressedSpace)) {
		player.canJump = false;
		player.yVelocity = player.jumpHeight;
	}

	player.lastJump = player.canJump;
	player.lastPressedSpace = keyboard[" "];

	// Reduce friction when in air

	if (player.canJump) {
		player.friction = 0.8;
	}
	else {
		player.friction = 0.82;
	}

	// Above head check

	distanceToRaycast = 2;

	raycastPos1 = new THREE.Vector3(camera.position.x, camera.position.y - 1.5, camera.position.z);

	raycaster = new THREE.Raycaster(raycastPos1, new THREE.Vector3(0, 1, 0), 0, distanceToRaycast);

	intersects1 = raycaster.intersectObjects(scene.children);

	// Remove water as a valid surface

	for (let h = 0; h < intersects1.length; h++) {
		if (intersects1[h].object.jumpableSurface == false) {
			intersects1.splice(h, 1);
			h -= 1;
		}
	}

	if (intersects1.length > 0) {
		// Player hit head
		player.yVelocity = 0;

		camera.position.y -= intersects1[0].object.position.y - camera.position.y;
	}

}

// Change render scale on window size change

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupMouseLook() {

	controls = new PointerLockControls(camera, renderer.domElement)

	renderer.domElement.addEventListener('mousedown', () => {
		controls.lock();
		hasLocked = true;
	});

}

function playerToGroundCollisions() {
	let playerPos = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z);

	let halfVoxel = voxelSize / 2;

	let padding = 0.1;

	for (let xPos = 0; xPos < renderedVoxels.length; xPos++) {
		for (let zPos = 0; zPos < renderedVoxels[xPos].length; zPos++) {
			for (let i = 0; i < renderedVoxels[xPos][zPos].length; i++) {
				let voxel = new THREE.Vector3(renderedVoxels[xPos][zPos][i][0], renderedVoxels[xPos][zPos][i][1], renderedVoxels[xPos][zPos][i][2]);

				if (playerPos.x > voxel.x - halfVoxel - padding && playerPos.x < voxel.x + halfVoxel + padding) {
					if (playerPos.z > voxel.z - halfVoxel - padding && playerPos.z < voxel.z + halfVoxel + padding) {
						if (playerPos.y > voxel.y - halfVoxel - padding && playerPos.y - player.height + 1.5 < voxel.y + halfVoxel + padding) {
							// Move player backwards out of the voxel
							controls.moveForward(-player.speedFriction[0])
							controls.moveRight(-player.speedFriction[1])

							player.speedFriction[0] = 0;
							player.speedFriction[1] = 0;
						}
					}
				}
			}
		}
	}
}

function createCube(dimensions, positions, colour, doesNotCastShadows, opacity) {

	const geometry = new THREE.BoxBufferGeometry(1, 1, 1);

	let material = new THREE.MeshLambertMaterial({ color: colour });

	if (opacity < 1) {
		material = new THREE.MeshLambertMaterial({ color: colour, opacity: opacity, transparent: true });
	}

	let texture = textureLoader.selectionCube
	texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
	texture.offset.set(0, 0);
	texture.repeat.set(1, 1);

	material = new THREE.MeshPhongMaterial({
		map: texture,
		side: THREE.DoubleSide,
		alphaMap: textureLoader.selectionCubeAlpha,
		transparent: true,
		specular: 0x000000,
		shininess: 0
	});

	material.depthWrite = false;

	cube = new THREE.Mesh(geometry, material);

	cube.position.x = positions[0];
	cube.position.y = positions[1];
	cube.position.z = positions[2];

	cube.scale.x = dimensions[0];
	cube.scale.y = dimensions[1];
	cube.scale.z = dimensions[2];

	cube.receiveShadow = true;

	cube.jumpableSurface = false;

	if (!doesNotCastShadows) {
		cube.castShadow = true;
	}

	scene.add(cube);
	return cube;

}

function createPlane(dimensions, positions, rotations, colour, doesNotCastShadows, voxelName) {

	if (geometryCache[voxelName] != null) {

		cube = geometryCache[voxelName].clone();

	}
	else {

		let geometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);

		let material = new THREE.MeshLambertMaterial({ color: colour });

		if (voxelName == "grass" || voxelName == "grassWithTuft") {
			// Paint texture of grass
			let texture = textureLoader.grass
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "dirt") {
			// Paint texture of grass
			let texture = textureLoader.dirt
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "stone") {
			// Paint texture of grass
			let texture = textureLoader.stone
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "wood") {
			// Paint texture of grass
			let texture = textureLoader.wood
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "water") {

			geometry = new THREE.PlaneBufferGeometry(1, 1, 5, 5);

			/*material = new THREE.MeshPhongMaterial({
				opacity: 0.6,
				transparent: true,
				color: colour,
				specular: 0x575757,
				shininess: 70,
				normalMap: normalLoader.water
			});*/

			if (waterUniforms[voxelName] == null) {
				waterUniforms[voxelName] = {
					time: {
						value: 0
					},
					shadowDarkness: {
						value: 0
					},
					waveHeight: {
						value: 0.6
					},
					waveSpeed: {
						value: 2
					},
					sunDirection: {
						value: new THREE.Vector3(5.0, 5.0, 5.0)
					}
				}
			}

			if (waterMaterials[voxelName] == null) {

				material = new THREE.ShaderMaterial({
					uniforms: waterUniforms[voxelName],
					vertexShader: waterVertexShader,
					fragmentShader: waterFragmentShader,
					side: THREE.DoubleSide,
					transparent: true
				})

				waterMaterials[voxelName] = material;
			}
			else {

				material = waterMaterials[voxelName].clone();

			}

		}
		else if (voxelName == "sand") {
			// Paint texture of grass
			let texture = textureLoader.sand
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "bricks") {
			// Paint texture of grass
			let texture = textureLoader.bricks
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "bark") {
			// Paint texture of grass
			let texture = textureLoader.bark
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "bark2") {
			// Paint texture of grass
			let texture = textureLoader.bark2
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "leaves") {
			// Paint texture of grass
			let texture = textureLoader.leaves
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshPhongMaterial({
				map: texture,
				side: THREE.DoubleSide,
				alphaMap: textureLoader.leavesAlpha,
				transparent: true,
				specular: 0x272727,
				shininess: 30,
				normalMap: normalLoader.leaves
			});
		}
		else if (voxelName == "leaves2") {
			// Paint texture of grass
			let texture = textureLoader.leaves2
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshPhongMaterial({
				map: texture,
				side: THREE.DoubleSide,
				alphaMap: textureLoader.leavesAlpha,
				transparent: true,
				specular: 0x272727,
				shininess: 30,
				normalMap: normalLoader.leaves
			});
		}
		else if (voxelName == "tnt") {
			// Paint texture of grass
			let texture = textureLoader.tnt
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshLambertMaterial({
				map: texture
			});
		}
		else if (voxelName == "glass") {
			// Paint texture of grass
			let texture = textureLoader.glass
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			material = new THREE.MeshPhongMaterial({
				map: texture,
				side: THREE.DoubleSide,
				alphaMap: textureLoader.glassAlpha,
				transparent: true,
				specular: 0x575757,
				shininess: 50
			});
		}
		else if (voxelName == "grassTuft" || voxelName == "grassTuft2" || voxelName == "flower" || voxelName == "flower2" || voxelName == "flower3" || voxelName == "flower4") {

			geometry = new THREE.PlaneBufferGeometry(1, 1, 5, 5);

			// Paint texture of grass
			let texture = textureLoader.grassTuft

			if (voxelName == "flower") {
				texture = textureLoader.flower;
			}
			else if (voxelName == "flower2") {
				texture = textureLoader.flower2;
			}
			else if (voxelName == "flower3") {
				texture = textureLoader.flower3;
			} else if (voxelName == "flower4") {
				texture = textureLoader.flower4;
			}

			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.offset.set(0, 0);
			texture.repeat.set(1, 1);

			let alphaText = textureLoader.grassTuftAlpha;

			if (voxelName == "grassTuft2") {
				alphaText = textureLoader.grassTuftAlpha2;
			}
			else if (voxelName == "flower") {
				alphaText = textureLoader.flowerAlpha;
			}
			else if (voxelName == "flower2") {
				alphaText = textureLoader.flower2Alpha;
			}
			else if (voxelName == "flower3") {
				alphaText = textureLoader.flower2Alpha;
			}
			else if (voxelName == "flower4") {
				alphaText = textureLoader.flower4Alpha;
			}

			/*material = new THREE.MeshPhongMaterial({
				map: texture,
				side: THREE.DoubleSide,
				alphaMap: alphaText,
				transparent: true,
				specular: 0x171717,
				shininess: 70
			});*/

			if (grassUniforms[voxelName] == null) {
				grassUniforms[voxelName] = {
					time: {
						value: 0
					},
					map: {
						type: 't',
						value: texture
					},
					alphaMap: {
						type: 't',
						value: alphaText
					},
					shadowDarkness: {
						value: 0
					}
				}

				grassTimeOffsets[voxelName] = {
					time: Math.random() * 4
				}
			}

			if (grassMaterials[voxelName] == null) {

				material = new THREE.ShaderMaterial({
					uniforms: grassUniforms[voxelName],
					vertexShader: vertexShader,
					fragmentShader: fragmentShader,
					side: THREE.DoubleSide
				})

				grassMaterials[voxelName] = material;
			}
			else {

				material = grassMaterials[voxelName].clone();

			}

			material.transparent = true;
			material.depthWrite = false;
		}


		cube = new THREE.Mesh(geometry, material);
	}

	cube.position.x = positions[0];
	cube.position.y = positions[1];
	cube.position.z = positions[2];

	cube.scale.x = dimensions[0] + 0.03;
	cube.scale.y = dimensions[1] + 0.03;
	cube.scale.z = dimensions[2] + 0.03;

	cube.rotation.x = 0;
	cube.rotation.y = 0;
	cube.rotation.z = 0

	cube.rotateX(rotations[0]);
	cube.rotateY(rotations[1]);
	cube.rotateZ(rotations[2]);

	cube.receiveShadow = true;

	if (!doesNotCastShadows) {
		if (voxelName != "flower" && voxelName != "flower2" && voxelName != "flower3" && voxelName != "flower4") {
			cube.castShadow = true;
		}


		cube.jumpableSurface = true;
	}

	cube.matrixAutoUpdate = false;

	if (voxelName == "water") {
		cube.jumpableSurface = false;
		cube.castShadow = false;
		cube.matrixAutoUpdate = true;
	}

	geometryCache[voxelName] = cube;

	scene.add(cube);

	cube.updateMatrix();

	return cube;

}

function returnRandomCaveValue(x, y, z, currentChunk, blockType) {

	let smoothing = 8;
	let threshhold = Number(document.getElementById("caveThreshhold").value);

	if (y == 0) {
		return blockType;
	}

	if (perlin.noise((x + seedOffset.x + (currentChunk[0] * chunkSize)) / smoothing, (y + seedOffset.y) / smoothing, (z + seedOffset.z + (currentChunk[1] * chunkSize)) / smoothing) < threshhold) {
		return ["air", 0, 0, 0xffffff, []];
	}
	else {
		return blockType;
	}
}

function loadChunks(chunkX, chunkZ) {
	let chunkData = [];

	let currentChunk = [chunkX, chunkZ]

	for (let x = 0; x < chunkSize; x++) {

		chunkData.push([]);
		for (let z = 0; z < chunkSize; z++) {
			chunkData[x].push([]);

			let height = heightMap[x + (currentChunk[0] * chunkSize)][z + (currentChunk[1] * chunkSize)];

			for (let y = 0; y < height; y++) {
				chunkData[x][z].push(returnRandomCaveValue(x, y, z, currentChunk, ["stone", 0, 0, 0x404040, []]));
			}

			for (let y = 0; y < 2; y++) {
				chunkData[x][z].push(returnRandomCaveValue(x, y + height, z, currentChunk, ["dirt", 0, 0, 0xdddd55, []]));
			}

			if (height + 2 <= waterLevel) {
				chunkData[x][z].push(returnRandomCaveValue(x, height + 3, z, currentChunk, ["sand", 0, 0, 0xdddd33, []]));
			}
			else {
				if (Math.random() * 100 < 70) {
					chunkData[x][z].push(returnRandomCaveValue(x, height + 3, z, currentChunk, ["grassWithTuft", 0, 0, 0x55dd55, []]))
				}
				else {
					chunkData[x][z].push(returnRandomCaveValue(x, height + 3, z, currentChunk, ["grass", 0, 0, 0x55dd55, []]))
				}
			}

			let y = heightMap[x + (currentChunk[0] * chunkSize) + (currentChunk[0] * -1)][z] + 2;
			while (y < worldHeight) {
				chunkData[x][z].push(["air", 0, 0, 0xffffff, []])
				y++
			}

		}
	}

	for (let x = 0; x < chunkSize; x++) {
		for (let z = 0; z < chunkSize; z++) {
			// Randomly spawn trees
			let createdTree = false;
			if (Math.round(Math.random() * 100) < treeSpawnChance) {

				for (let y = 1; y < chunkData[x][z].length; y++) {
					if (chunkData[x][z][y][0] == "air" && createdTree == false && (chunkData[x][z][y - 1][0] == "grass" || chunkData[x][z][y - 1][0] == "grassWithTuft")) {

						if (z > 2 && z < chunkSize - 3 && x > 2 && x < chunkSize - 3) {
							// Create tree

							let leafType = "leaves"

							let randomTreeHeight = Math.round(Math.random() * 7);

							if (Math.round(Math.random() * 1) == 0) {
								leafType = "leaves2"
							}

							if (leafType == "leaves") {
								for (let t = 0; t < randomTreeHeight; t++) {
									chunkData[x][z][y + t][0] = "bark"
								}
							}
							else {
								for (let t = 0; t < randomTreeHeight; t++) {
									chunkData[x][z][y + t][0] = "bark2"
								}
							}

							for (let xp = -1; xp < 2; xp++) {
								for (let zp = -1; zp < 2; zp++) {
									chunkData[x + xp][z + zp][y + randomTreeHeight][0] = leafType
								}
							}

							for (let xp = -2; xp < 3; xp++) {
								for (let zp = -2; zp < 3; zp++) {
									if (!(xp == 2 && zp == 2) && !(xp == -2 && zp == -2) && !(xp == -2 && zp == 2) && !(xp == 2 && zp == -2)) {
										chunkData[x + xp][z + zp][y + randomTreeHeight + 1][0] = leafType
									}
								}
							}

							for (let repeat = 0; repeat < 3; repeat++) {
								for (let xp = -3; xp < 4; xp++) {
									for (let zp = -3; zp < 4; zp++) {
										if (!(xp == 3 && zp == 3) && !(xp == -3 && zp == -3) && !(xp == -3 && zp == 3) && !(xp == 3 && zp == -3)) {
											chunkData[x + xp][z + zp][y + randomTreeHeight + 2 + repeat][0] = leafType
										}
									}
								}
							}

							for (let xp = -2; xp < 3; xp++) {
								for (let zp = -2; zp < 3; zp++) {
									if (!(xp == 2 && zp == 2) && !(xp == -2 && zp == -2) && !(xp == -2 && zp == 2) && !(xp == 2 && zp == -2)) {
										chunkData[x + xp][z + zp][y + randomTreeHeight + 5][0] = leafType
									}
								}
							}

							for (let xp = -1; xp < 2; xp++) {
								for (let zp = -1; zp < 2; zp++) {
									chunkData[x + xp][z + zp][y + randomTreeHeight + 6][0] = leafType
								}
							}

							if (leafType == "leaves") {
								chunkData[x][z][y + randomTreeHeight][0] = "bark"
								chunkData[x][z][y + randomTreeHeight + 1][0] = "bark"
							}
							else {
								chunkData[x][z][y + randomTreeHeight][0] = "bark2"
								chunkData[x][z][y + randomTreeHeight + 1][0] = "bark2"
							}

							createdTree = true;

						}

					}
				}

			}
		}
	}

	if (chunkX >= chunks.length) {
		chunks.push([])
	}

	if (chunkZ >= chunks[chunkX].length) {
		chunks[chunkX].push([])
	}

	chunks[chunkX][chunkZ] = chunkData;
}

function renderChunks(chunkX, chunkZ) {

	renderedVoxels[chunkX][chunkZ] = [];

	let currentChunk = [chunkX, chunkZ]

	for (let i = 0; i < 2; i++) {

		for (let x = 0; x < chunkSize; x++) {
			for (let z = 0; z < chunkSize; z++) {
				for (let y = 0; y < chunks[chunkX][chunkZ][x][z].length; y++) {

					let upperBlock = "";
					let lowerBlock = chunks[chunkX][chunkZ][x][z][y][0];
					let underneathBlock = "";

					let zPlusBlock = "";
					let zMinusBlock = "";

					let zPlusBlockAcrossChunk = "";
					let zMinusBlockAcrossChunk = "";

					let xPlusBlock = "";
					let xMinusBlock = "";

					let xPlusBlockAcrossChunk = "";
					let xMinusBlockAcrossChunk = "";

					let blocksAround = [upperBlock, lowerBlock, underneathBlock, zPlusBlock, zMinusBlock, zPlusBlockAcrossChunk, zMinusBlockAcrossChunk, xPlusBlock, xMinusBlock, xPlusBlockAcrossChunk, xMinusBlockAcrossChunk]

					// y

					if (chunks[chunkX][chunkZ][x][z].length > y + 1) {
						blocksAround[0] = chunks[chunkX][chunkZ][x][z][y + 1][0];
					}

					if (0 <= y - 1) {
						blocksAround[2] = chunks[chunkX][chunkZ][x][z][y - 1][0];
					}

					if (blocksAround[1] != "air") {
						// z

						if (chunks[chunkX][chunkZ][x].length > z + 1) {
							blocksAround[3] = chunks[chunkX][chunkZ][x][z + 1][y][0];
						}

						if (z - 1 >= 0) {
							blocksAround[4] = chunks[chunkX][chunkZ][x][z - 1][y][0];
						}

						// across chunk

						if (chunkZ + 1 < chunks[chunkX].length && z % (chunkSize - 1) == 0) {
							blocksAround[5] = chunks[chunkX][chunkZ + 1][x][(z * -1) + chunkSize - 1][y][0];
						}

						if (chunkZ - 1 >= 0 && z % (chunkSize - 1) == 0) {
							blocksAround[6] = chunks[chunkX][chunkZ - 1][x][(z * -1) + chunkSize - 1][y][0];
						}

						// x

						if (chunks[chunkX][chunkZ].length > x + 1) {
							blocksAround[7] = chunks[chunkX][chunkZ][x + 1][z][y][0];
						}

						if (x - 1 >= 0) {
							blocksAround[8] = chunks[chunkX][chunkZ][x - 1][z][y][0];
						}

						// across chunk

						if (chunkX + 1 < chunks.length && x % (chunkSize - 1) == 0) {
							blocksAround[9] = chunks[chunkX + 1][chunkZ][(x * -1) + chunkSize - 1][z][y][0];
						}

						if (chunkX - 1 >= 0 && x % (chunkSize - 1) == 0) {
							blocksAround[10] = chunks[chunkX - 1][chunkZ][(x * -1) + chunkSize - 1][z][y][0];
						}

					}

					// Opaque and transparent rendering cycles

					if (i == 0) {

						for (let p = 0; p < blocksAround.length; p++) {
							if (blocksAround[p] == "leaves" || blocksAround[p] == "leaves2" || blocksAround[p] == "glass") {
								blocksAround[p] = "air";
							}
						}

					}
					else {

						for (let p = 0; p < blocksAround.length; p++) {
							if (blocksAround[p] != "leaves" && blocksAround[p] != "leaves2" && blocksAround[p] != "glass") {
								blocksAround[p] = "air";
							}
						}

					}

					let hasCreatedPlane = false;

					if (chunks[chunkX][chunkZ][x][z].length > y + 1) {
						if (blocksAround[0] == "air" && blocksAround[1] != "air") {
							// Add flat plane chunk to world

							let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize) + (voxelSize / 2), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [3.14 / 2, 3.14, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

							chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

							hasCreatedPlane = true;

							// If block is grass place some 3D grass on top
							if (blocksAround[1] == "grassWithTuft") {

								// Randomize the kind of grass

								let grassType = "grassTuft"

								let randomNum = Math.round(Math.random() * 7);

								if (randomNum == 1 || randomNum == 2 || randomNum == 3) {
									grassType = "grassTuft2"
								}
								else if (randomNum == 4) {
									grassType = "flower"
								}
								else if (randomNum == 5) {
									grassType = "flower2"
								}
								else if (randomNum == 6) {
									grassType = "flower3"
								}
								else if (randomNum == 7) {
									grassType = "flower4"
								}

								let randomOffset = {
									x: ((Math.random() * (voxelSize * 0.7)) - (voxelSize * 0.35)),
									z: ((Math.random() * (voxelSize * 0.7)) - (voxelSize * 0.35))
								}

								tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize) + randomOffset.x, (y * voxelSize) + voxelSize, (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize) + randomOffset.z], [0, (3.14 / 2) + (3.14 / 4), 0], 0xffffff, true, grassType);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize) + randomOffset.x, (y * voxelSize) + voxelSize, (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize) + randomOffset.z], [0, 3.14 / 4, 0], 0xffffff, true, grassType);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);
							}

						}
					}

					if (0 <= y - 1) {
						if (blocksAround[2] == "air" && blocksAround[1] != "air") {
							// Add flat plane chunk to world

							let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize) - (voxelSize / 2), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [3.14 / 2, 0, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

							chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

							hasCreatedPlane = true;

						}
					}

					if (blocksAround[1] != "air") {
						// Render side dirt planes if necessary

						if (chunks[chunkX][chunkZ][x].length > z + 1) {
							if (blocksAround[3] == "air") {
								// Add flat plane chunk to world

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize) + (voxelSize / 2)], [3.14, 3.14, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}
						else if (chunkZ + 1 < chunks[chunkX].length && z % (chunkSize - 1) == 0) {
							// Chunk to chunk rendering
							if (blocksAround[5] == "air") {

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize) + (voxelSize / 2)], [3.14, 3.14, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}

						if (z - 1 >= 0) {
							if (blocksAround[4] == "air") {
								// Add flat plane chunk to world

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize) - (voxelSize / 2)], [0, 3.14, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}
						else if (chunkZ - 1 >= 0 && z % (chunkSize - 1) == 0) {
							// Chunk to chunk rendering

							if (blocksAround[6] == "air") {

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize) - (voxelSize / 2)], [0, 3.14, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}

						// X plane side

						if (chunks[chunkX][chunkZ].length > x + 1) {
							if (blocksAround[7] == "air") {
								// Add flat plane chunk to world

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize) + (voxelSize / 2), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [0, 3.14 / 2, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}
						else if (chunkX + 1 < chunks.length && x % (chunkSize - 1) == 0) {
							// Chunk to chunk rendering
							if (blocksAround[9] == "air") {

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize) + (voxelSize / 2), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [0, 3.14 / 2, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}

						if (x - 1 >= 0) {
							if (blocksAround[8] == "air") {
								// Add flat plane chunk to world

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize) - (voxelSize / 2), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [0, 3.14 * 1.5, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}
						else if (chunkX - 1 >= 0 && x % (chunkSize - 1) == 0) {
							// Chunk to chunk rendering
							if (blocksAround[10] == "air") {

								let tempPlane = createPlane([voxelSize, voxelSize, voxelSize], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize) - (voxelSize / 2), (y * voxelSize), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [0, 3.14 * 1.5, 0], chunks[chunkX][chunkZ][x][z][y][3], false, blocksAround[1]);

								chunks[chunkX][chunkZ][x][z][y][4].push(tempPlane);

								hasCreatedPlane = true;
							}
						}

					}

					if (hasCreatedPlane) {
						renderedVoxels[chunkX][chunkZ].push([(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (y * voxelSize) + (voxelSize / 2), (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)]);
					}

				}

				if (chunks[chunkX][chunkZ][x][z][waterLevel][0] == "air") {
					// Top side of water
					let tempPlane = createPlane([voxelSize, voxelSize, voxelSize / 15], [(x * voxelSize) + (currentChunk[0] * chunkSize * voxelSize), (waterLevel * voxelSize) + (voxelSize / 2) - 1, (z * voxelSize) + (currentChunk[1] * chunkSize * voxelSize)], [3.14 / 2, 3.14, 0], 0x4444FF, false, "water");

					chunks[chunkX][chunkZ][x][z][waterLevel][4].push(tempPlane);

					tempPlane.savedPosition = tempPlane.position.clone();
					tempPlane.savedScale = tempPlane.scale;

					waterPlanes[chunkX][chunkZ].push(tempPlane);
				}
			}
		}
	}

	// Update shadow map if daylight cycle is disabled

	if (!daylightCycle) {
		renderer.shadowMap.needsUpdate = true;
	}

}

function generateHeightMap() {

	let generatedMap = [];

	let tempHeight = 30;

	for (let x = 0; x < worldSize * chunkSize; x++) {
		generatedMap.push([]);
		for (let z = 0; z < worldSize * chunkSize; z++) {
			if (x < 1) {
				generatedMap[x][z] = tempHeight + Math.round((Math.random() * 2) - 1);
				tempHeight = generatedMap[x][z];
			}
			else {
				if (z < 1) {
					generatedMap[x][z] = tempHeight + Math.round((Math.random() * 2) - 1);
				}
				else {
					generatedMap[x][z] = Math.round(((generatedMap[x][z - 1] + generatedMap[x - 1][z] + generatedMap[x - 1][z - 1]) / 3) + Math.round((Math.random() * 2) - 1));
				}
			}
		}
	}

	// Smooth out height map

	for (let o = 0; o < landscapeOctaves; o++) {
		for (let x = 0; x < worldSize * chunkSize; x++) {
			for (let z = 0; z < worldSize * chunkSize; z++) {
				if (x > 0) {
					generatedMap[x][z] = (generatedMap[x][z] + generatedMap[x - 1][z]) / 2;
				}
			}
		}
	}

	// Landscape height multiplier

	for (let x = 0; x < worldSize * chunkSize; x++) {
		for (let z = 0; z < worldSize * chunkSize; z++) {
			generatedMap[x][z] *= landscapeHeightMultiplier;
		}
	}

	// Create a world seed

	for (let z = 0; z < worldSize * chunkSize; z++) {
		for (let x = 0; x < worldSize * chunkSize; x++) {
			seed = seed + Math.round(generatedMap[x][z]).toString() + "_";
		}
	}

	return generatedMap;
}

document.getElementById("world-reload").addEventListener("click", e => {

	landscapeOctaves = Number(document.getElementById("octaves").value);
	landscapeHeightMultiplier = Number(document.getElementById("heightMultiplier").value);

	treeSpawnChance = Number(document.getElementById("treeSpawnChance").value);

	seedOffset = {
		x: Math.random() * 200,
		y: Math.random() * 200,
		z: Math.random() * 200
	}

	heightMap = generateHeightMap();

	for (let x = 0; x < worldSize; x++) {
		for (let z = 0; z < worldSize; z++) {
			removeChunks(x, z);
			activeChunks[x][z] = false;

			loadChunks(x, z);

			if (calculateDistance((x * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), (z * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), camera.position.x, camera.position.z) < renderDistance) {
				renderChunks(x, z);

				activeChunks[x][z] = true;
			}
		}
	}

	let spawnY = heightMap[Math.floor((worldSize * chunkSize * voxelSize) / 2)][Math.floor((worldSize * chunkSize * voxelSize) / 2)]

	camera.position.z = (worldSize * chunkSize * voxelSize) / 2;
	camera.position.y = (spawnY * voxelSize) + (voxelSize * 2);
	camera.position.x = (worldSize * chunkSize * voxelSize) / 2;
})

document.getElementById("world-update").addEventListener("click", e => {

	for (let key in waterUniforms) {
		waterUniforms[key].waveHeight.value = Number(document.getElementById("waterWaveHeight").value);
		waterUniforms[key].waveSpeed.value = Number(document.getElementById("waterWaveSpeed").value);
	}

})

document.getElementById("world-save").addEventListener("click", e => {

	let bufferedWorldSeeding = ""

	for (let xChunk = 0; xChunk < worldSize; xChunk++) {
		for (let zChunk = 0; zChunk < worldSize; zChunk++) {
			// Blocks in chunk
			for (let x = 0; x < chunks[xChunk][zChunk].length; x++) {
				for (let z = 0; z < chunks[xChunk][zChunk][x].length; z++) {
					// Read through blocks on y axis
					let repeatedBlocks = []
					for (let y = 0; y < chunks[xChunk][zChunk][x][z].length; y++) {

						if (repeatedBlocks[0] == chunks[xChunk][zChunk][x][z][y][0]) {
							repeatedBlocks.push(chunks[xChunk][zChunk][x][z][y][0])
						}
						else if (repeatedBlocks.length == 0) {
							repeatedBlocks.push(chunks[xChunk][zChunk][x][z][y][0])
							bufferedWorldSeeding = bufferedWorldSeeding + repeatedBlocks[0] + "::" + repeatedBlocks.length + "@@";
						}
						else {
							bufferedWorldSeeding = bufferedWorldSeeding + repeatedBlocks[0] + "::" + repeatedBlocks.length + "@@";
							repeatedBlocks = []

							repeatedBlocks.push(chunks[xChunk][zChunk][x][z][y][0])
						}

					}

					if (repeatedBlocks.length > 0) {
						bufferedWorldSeeding = bufferedWorldSeeding + repeatedBlocks[0] + "::" + repeatedBlocks.length + "@@";
					}
				}
			}
		}
	}

	// Copy world data

	navigator.clipboard.writeText(bufferedWorldSeeding).then(res => {
		alert('Copied world data to clipboard, paste it into a text file to save it for later!');
	})
})

document.getElementById("world-load").addEventListener("click", e => {

	// Load world data

	navigator.clipboard.readText().then(res => {

		let fetchedData = res.split("@@");
		fetchedData.pop();

		// Remove all active chunks

		for (let x = 0; x < worldSize; x++) {
			for (let z = 0; z < worldSize; z++) {
				removeChunks(x, z);
				activeChunks[x][z] = false;
			}
		}

		for (let xChunk = 0; xChunk < worldSize; xChunk++) {
			for (let zChunk = 0; zChunk < worldSize; zChunk++) {
				// Blocks in chunk

				for (let x = 0; x < chunks[xChunk][zChunk].length; x++) {
					for (let z = 0; z < chunks[xChunk][zChunk][x].length; z++) {
						// Read through blocks on y axis
						let y = 0;
						while (y < chunks[xChunk][zChunk][x][z].length) {
							let repeatCount = Number(fetchedData[0].split("::")[1])

							y += repeatCount;

							for (let p = 0; p < repeatCount; p++) {
								if (y + p < chunks[xChunk][zChunk][x][z].length) {
									chunks[xChunk][zChunk][x][z][y + p][0] = fetchedData[0].split("::")[0];
								}
							}

							fetchedData.shift();
						}
					}
				}

			}
		}


		for (let x = 0; x < worldSize; x++) {
			for (let z = 0; z < worldSize; z++) {

				if (calculateDistance((x * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), (z * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), camera.position.x, camera.position.z) < renderDistance) {
					renderChunks(x, z);

					activeChunks[x][z] = true;
				}

			}
		}

		let spawnY = heightMap[Math.floor((worldSize * chunkSize * voxelSize) / 2)][Math.floor((worldSize * chunkSize * voxelSize) / 2)]

		camera.position.z = (worldSize * chunkSize * voxelSize) / 2;
		camera.position.y = (spawnY * voxelSize) + (voxelSize * 2);
		camera.position.x = (worldSize * chunkSize * voxelSize) / 2;

	})
})

function removeChunks(chunkX, chunkZ) {

	for (let xPos = 0; xPos < chunks[chunkX][chunkZ].length; xPos++) {
		for (let zPos = 0; zPos < chunks[chunkX][chunkZ][xPos].length; zPos++) {
			for (let yPos = 0; yPos < chunks[chunkX][chunkZ][xPos][zPos].length; yPos++) {
				if (chunks[chunkX][chunkZ][xPos][zPos][yPos][4].length > 0) {
					for (let ch = 0; ch < chunks[chunkX][chunkZ][xPos][zPos][4].length; ch++) {
						scene.remove(chunks[chunkX][chunkZ][xPos][zPos][yPos][4][ch]);
					}
					chunks[chunkX][chunkZ][xPos][zPos][yPos][4] = [];
				}
			}
		}
	}

	waterPlanes[chunkX][chunkZ] = [];

}

let raycaster = new THREE.Raycaster();

let interactTimer = 1;

function checkToInteract(delta, chunkX, chunkZ) {
	// Dig

	interactTimer += 1 * delta;

	if (interactTimer > 0.2) {
		lastMouseDown[0] = false;
		lastMouseDown[1] = false;
	}

	if (mouseDown && (!lastMouseDown[0] || breakBlockTimer > 0)) {

		raycaster.setFromCamera(new THREE.Vector2(pointer.x, pointer.y), camera);

		let intersects = raycaster.intersectObjects(scene.children);

		let negativeI = 0;
		for (let i = 0; i < intersects.length; i++) {
			if (intersects[i - negativeI].object.isCursorCube) {
				intersects.splice(i - negativeI, 1);
				negativeI += 1;
			}
			else if (intersects[i - negativeI].object.jumpableSurface == false) {
				intersects.splice(i - negativeI, 1);
				negativeI += 1;
			}
		}

		if (intersects.length < 1) {
			return;
		}

		let closestItem = 0;
		let closestDistance = Infinity

		for (let i = 0; i < intersects.length; i++) {
			let actualDist = calculateDistance3D(camera.position.x, camera.position.y, camera.position.z, intersects[i].object.position.x, intersects[i].object.position.y, intersects[i].object.position.z);

			if (actualDist < closestDistance) {
				closestDistance = actualDist;
				closestItem = i;
			}
		}

		intersects[closestItem].point.x -= (chunkX * (voxelSize * chunkSize));
		intersects[closestItem].point.z -= (chunkZ * (voxelSize * chunkSize));

		//intersects[closestItem].object.material.color.set(0xff0000);


		if (chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0] != "air") {

			// Check if the player has fully broken the block

			let currentBlock = chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0];

			if (currentBlock == "grassWithTuft") {
				currentBlock = "grass"
			}
			else if (currentBlock == "leaves2") {
				currentBlock = "leaves"
			}
			else if (currentBlock == "bark2") {
				currentBlock = "bark"
			}

			if (breakBlockTimer >= hotBar.destroyTime[currentBlock]) {

				breakBlockTimer = 0;

				// Update the hotbar display and the inventory of the player

				if (hotBar.inventoryHolder[currentBlock] == null) {
					// New block
					let inventoryPos = 100;

					for (let p = 0; p < 9; p++) {
						let isSafe = true;

						for (let key in hotBar.inventory) {
							if (hotBar.inventory[key].position == p) {
								isSafe = false;
							}
						}

						if (p < inventoryPos && isSafe) {
							inventoryPos = p;
						}
					}


					if (inventoryPos < 9) {
						hotBar.inventoryHolder[currentBlock] = hotBar.inventory.length;
						hotBar.inventory.push({ type: currentBlock, count: 0, position: inventoryPos });
					}
				}

				hotBar.inventory[hotBar.inventoryHolder[currentBlock]].count += 1;

				hotBar.updateInventoryUI();

				chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0] = "air";

				removeChunks(chunkX, chunkZ);
				renderChunks(chunkX, chunkZ);

				// Update neighbouring chunks if the player edits a block next to them

				if (Math.round(intersects[closestItem].point.x / voxelSize) == chunkSize - 1) {
					removeChunks(chunkX + 1, chunkZ);
					renderChunks(chunkX + 1, chunkZ);
				}

				if (Math.round(intersects[closestItem].point.x / voxelSize) == 0) {
					removeChunks(chunkX - 1, chunkZ);
					renderChunks(chunkX - 1, chunkZ);
				}

				// Z location calculations

				if (Math.round(intersects[closestItem].point.z / voxelSize) == chunkSize - 1) {
					removeChunks(chunkX, chunkZ + 1);
					renderChunks(chunkX, chunkZ + 1);
				}

				if (Math.round(intersects[closestItem].point.z / voxelSize) == 0) {
					removeChunks(chunkX, chunkZ - 1);
					renderChunks(chunkX, chunkZ - 1);
				}

				interactTimer = 0;
			}
			else {
				breakBlockTimer += 1 * delta;
			}

		}

		lastMouseDown[0] = true;
	}
	else if (!mouseDown) {
		lastMouseDown[0] = false;
	}

	// Build

	if (rightClickDown && !lastMouseDown[1]) {

		raycaster.setFromCamera(new THREE.Vector2(pointer.x, pointer.y), camera);

		let intersects = raycaster.intersectObjects(scene.children);

		let negativeI = 0;
		for (let i = 0; i < intersects.length; i++) {
			if (intersects[i - negativeI].object.isCursorCube) {
				intersects.splice(i - negativeI, 1);
				negativeI += 1;
			}
			else if (intersects[i - negativeI].object.jumpableSurface == false) {
				intersects.splice(i - negativeI, 1);
				negativeI += 1;
			}
		}

		if (intersects.length < 1) {
			return;
		}

		let closestItem = 0;
		let closestDistance = Infinity

		for (let i = 0; i < intersects.length; i++) {
			let actualDist = calculateDistance3D(camera.position.x, camera.position.y, camera.position.z, intersects[i].object.position.x, intersects[i].object.position.y, intersects[i].object.position.z);

			if (actualDist < closestDistance) {
				closestDistance = actualDist;
				closestItem = i;
			}
		}

		intersects[closestItem].point.x -= (chunkX * (voxelSize * chunkSize));
		intersects[closestItem].point.z -= (chunkZ * (voxelSize * chunkSize));

		//intersects[closestItem].object.material.color.set(0xff0000);

		if (chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)].length > Math.round(intersects[closestItem].point.y / voxelSize) + 1) {

			// TNT check

			if (chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0] == "tnt") {
				// If there is TNT, detonate it

				tntToExplode.push([0, chunkX, chunkZ, Math.round(intersects[closestItem].point.x / voxelSize), Math.round(intersects[closestItem].point.z / voxelSize), Math.round(intersects[closestItem].point.y / voxelSize)])
			}
			else {

				// Build on block selected

				if (chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0] == "air" || chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0] == "water") {

					let buildItem = "";

					for (let v = 0; v < hotBar.inventory.length; v++) {
						if (hotBar.inventory[v].position == hotBar.selectedItem) {
							buildItem = hotBar.inventory[v].type;
						}
					}

					if (buildItem == "grass" && Math.random() * 100 < 50) {
						buildItem = "grassWithTuft"
					}

					if (hotBar.inventory[hotBar.inventoryHolder[buildItem]].count > 0) {
						chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][0] = buildItem;

						chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize)][3] = 0x775511;

						// Update player inventory

						hotBar.inventory[hotBar.inventoryHolder[buildItem]].count -= 1;

						if (hotBar.inventory[hotBar.inventoryHolder[buildItem]].count <= 0) {
							// Remove block if player has none left
							hotBar.inventory.splice(hotBar.inventoryHolder[buildItem], 1);
							hotBar.inventoryHolder[buildItem] = null;
						}

						hotBar.updateInventoryUI();

					}
				}
				else {
					if (chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize) + 1][0] == "air" || chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize) + 1][0] == "water") {

						let buildItem = "";

						for (let v = 0; v < hotBar.inventory.length; v++) {
							if (hotBar.inventory[v].position == hotBar.selectedItem) {
								buildItem = hotBar.inventory[v].type;
							}
						}

						if (buildItem == "grass" && Math.random() * 100 < 50) {
							buildItem = "grassWithTuft"
						}

						if (hotBar.inventory[hotBar.inventoryHolder[buildItem]].count > 0) {
							chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize) + 1][0] = buildItem;

							chunks[chunkX][chunkZ][Math.round(intersects[closestItem].point.x / voxelSize)][Math.round(intersects[closestItem].point.z / voxelSize)][Math.round(intersects[closestItem].point.y / voxelSize) + 1][3] = 0x775511;

							// Update player inventory

							hotBar.inventory[hotBar.inventoryHolder[buildItem]].count -= 1;

							if (hotBar.inventory[hotBar.inventoryHolder[buildItem]].count <= 0) {
								// Remove block if player has none left
								hotBar.inventory.splice(hotBar.inventoryHolder[buildItem], 1);
								hotBar.inventoryHolder[buildItem] = null;
							}

							hotBar.updateInventoryUI();

						}
					}
				}
			}

			removeChunks(chunkX, chunkZ);

			renderChunks(player.currentChunk[0], player.currentChunk[1]);

			interactTimer = 0;
		}

		lastMouseDown[1] = true;
	}
	else if (!rightClickDown) {
		lastMouseDown[1] = false;
	}
}

function showSelectedVoxel() {
	raycaster.setFromCamera(new THREE.Vector2(pointer.x, pointer.y), camera);

	let intersects = raycaster.intersectObjects(scene.children);

	let negativeI = 0;
	for (let i = 0; i < intersects.length; i++) {
		if (intersects[i - negativeI].object.isCursorCube) {
			intersects.splice(i - negativeI, 1);
			negativeI += 1;
		}
		else if (intersects[i - negativeI].object.jumpableSurface == false) {
			intersects.splice(i - negativeI, 1);
			negativeI += 1;
		}
	}

	if (intersects.length < 1) {
		cursorCube.position.set(-1000, -1000, -1000);
		return;
	}

	let closestItem = -1;
	let closestDistance = 20

	for (let i = 0; i < intersects.length; i++) {

		let actualDist = calculateDistance3D(intersects[i].object.position.x, intersects[i].object.position.y, intersects[i].object.position.z, camera.position.x, camera.position.y, camera.position.z);

		if (actualDist < closestDistance) {
			closestDistance = actualDist;
			closestItem = i;
		}
	}

	if (closestItem == -1) {
		cursorCube.position.set(-1000, -1000, -1000);
		return;
	}

	cursorCube.position.set(Math.round(intersects[closestItem].point.x / voxelSize) * voxelSize, Math.round(intersects[closestItem].point.y / voxelSize) * voxelSize, Math.round(intersects[closestItem].point.z / voxelSize) * voxelSize);

	if (breakBlockTimer > 0 && breakBlockTimer <= 0.5) {
		cursorCube.material.alphaMap = textureLoader.selectionCubeDigging1Alpha;
	}
	else if (breakBlockTimer > 0.5 && breakBlockTimer <= 1) {
		cursorCube.material.alphaMap = textureLoader.selectionCubeDigging2Alpha;
	}
	else if (breakBlockTimer > 1) {
		cursorCube.material.alphaMap = textureLoader.selectionCubeDigging3Alpha;
	}
	else {
		cursorCube.material.alphaMap = textureLoader.selectionCubeAlpha;
	}

}

function checkTNTTimers() {

	let iMinus = 0;

	let chunksToRender = [];

	for (let i = 0; i < tntToExplode.length; i++) {

		if (tntToExplode[i - iMinus][0] < 0) {

			let chunkX = tntToExplode[i - iMinus][1]
			let chunkZ = tntToExplode[i - iMinus][2]

			let removedChunksAround = [false, false, false, false];

			// Remove some blocks

			chunks[chunkX][chunkZ][tntToExplode[i - iMinus][3]][tntToExplode[i - iMinus][4]][tntToExplode[i - iMinus][5]][0] = "air";

			for (let x = -blastRadius; x < blastRadius; x++) {
				for (let z = -blastRadius; z < blastRadius; z++) {
					for (let y = -blastRadius; y < blastRadius; y++) {

						let offsets = [0, 0];

						let positions = [tntToExplode[i - iMinus][3] + x, tntToExplode[i - iMinus][4] + z, tntToExplode[i - iMinus][5] + y]

						if (tntToExplode[i - iMinus][3] + x < 0) {
							offsets[0] = -1;
							positions[0] = chunkSize + positions[0]
						}
						else if (tntToExplode[i - iMinus][3] + x >= chunkSize) {
							offsets[0] = 1;
							positions[0] = positions[0] - chunkSize
						}

						if (tntToExplode[i - iMinus][4] + z < 0) {
							offsets[1] = -1;
							positions[1] = chunkSize + positions[1]
						}
						else if (tntToExplode[i - iMinus][4] + z >= chunkSize) {
							offsets[1] = 1;
							positions[1] = positions[1] - chunkSize
						}

						// Chunk re-rendering calculations

						if (tntToExplode[i - iMinus][3] + x <= 1) {
							removedChunksAround[0] = true;
						}
						else if (tntToExplode[i - iMinus][3] + x >= chunkSize - 2) {
							removedChunksAround[1] = true;
						}

						if (tntToExplode[i - iMinus][4] + z <= 1) {
							removedChunksAround[2] = true;
						}
						else if (tntToExplode[i - iMinus][4] + z >= chunkSize - 2) {
							removedChunksAround[3] = true;
						}

						if (chunks[chunkX + offsets[0]][chunkZ + offsets[1]][positions[0]][positions[1]][positions[2]][0] == "tnt") {
							// Set off tnt in radius

							tntToExplode.push([1, chunkX + offsets[0], chunkZ + offsets[1], positions[0], positions[1], positions[2]])
						}
						else {
							chunks[chunkX + offsets[0]][chunkZ + offsets[1]][positions[0]][positions[1]][positions[2]][0] = "air";
						}
					}
				}
			}

			removeChunks(chunkX, chunkZ);
			renderChunks(chunkX, chunkZ);

			// Update neighbouring chunks if the player edits a block next to them

			if (removedChunksAround[1]) {
				chunksToRender.push([chunkX + 1, chunkZ])
			}

			if (removedChunksAround[0]) {
				chunksToRender.push([chunkX - 1, chunkZ])
			}

			// Z location calculations

			if (removedChunksAround[3]) {
				chunksToRender.push([chunkX, chunkZ + 1])
			}

			if (removedChunksAround[2]) {
				chunksToRender.push([chunkX, chunkZ - 1])
			}

			// Diagonal chunk checks

			if (removedChunksAround[1] && removedChunksAround[3]) {
				chunksToRender.push([chunkX + 1, chunkZ + 1])
			}

			if (removedChunksAround[0] && removedChunksAround[2]) {
				chunksToRender.push([chunkX - 1, chunkZ - 1])
			}

			if (removedChunksAround[3] && removedChunksAround[0]) {
				chunksToRender.push([chunkX - 1, chunkZ + 1])
			}

			if (removedChunksAround[2] && removedChunksAround[1]) {
				chunksToRender.push([chunkX + 1, chunkZ - 1])
			}

			tntToExplode.splice(i, 1);

			iMinus += 1;

		}
		else {
			tntToExplode[i - iMinus][0] -= (1 / FPS);
		}

	}

	for (let i = 0; i < chunksToRender.length; i++) {

		removeChunks(chunksToRender[i][0], chunksToRender[i][1]);
		renderChunks(chunksToRender[i][0], chunksToRender[i][1]);

	}
}


function animateWater(delta, ambientLightIntensity) {

	waterTimer += waterData.waveSpeed * delta;

	for (let key in waterUniforms) {
		waterUniforms[key].time.value = waterTimer;
		waterUniforms[key].shadowDarkness.value = ambientLightIntensity;
	}

	for (let key in waterMaterials) {
		waterMaterials[key].uniformsNeedUpdate = true;
	}
}

function animatePlants(delta, ambientLightIntensity) {
	for (let key in grassUniforms) {
		grassUniforms[key].time.value = clock.getElapsedTime() + grassTimeOffsets[key].time;
		grassUniforms[key].shadowDarkness.value = ambientLightIntensity;
	}

	for (let key in grassMaterials) {
		grassMaterials[key].uniformsNeedUpdate = true;
	}
}


function calculateDistance(x1, y1, x2, y2) {
	let ySq = (y2 - y1) * (y2 - y1)
	let xSq = (x2 - x1) * (x2 - x1)

	return Math.sqrt(xSq + ySq);
}

function calculateDistance3D(x1, y1, z1, x2, y2, z2) {

	let posDif = [x2 - x1, y2 - y1, z2 - z1]

	let distance2d = (posDif[0] * posDif[0]) + (posDif[1] * posDif[1])

	let distance3d = Math.sqrt(distance2d + (posDif[2] * posDif[2]))

	return distance3d;
}

function updateHotBar() {
	// Listen for when a number key is presses and update the hotbar

	let hotBarHolder = document.getElementById("hotbar");

	for (let i = 0; i < hotBarHolder.children.length; i++) {
		if (keyboard[i + 1]) {
			hotBar.selectedItem = i;
		}
	}
}

function updateDeveloperPanel() {
	document.getElementById("coordinates").innerText = "Coordinates: " + round(camera.position.x / voxelSize, 10) + " " + round(camera.position.y / voxelSize, 10) + " " + round(camera.position.z / voxelSize, 10);

	document.getElementById("view-distance").innerText = "Render Distance: " + renderDistance;
}

// Events

window.addEventListener("resize", onWindowResize, false);

// Main Game Loop

let FPS = 0;
let framesPassed = 0;
let lastTime = 0;

let sunPositionInSky = 90;

function animate() {
	requestAnimationFrame(animate);

	framesPassed += 1;

	if (lastTime > 1) {
		FPS = framesPassed;
		framesPassed = 0;

		lastTime = 0;

		document.getElementById("FPS").innerText = "FPS: " + FPS;
	}

	let delta = clock.getDelta();

	lastTime += 1 * delta;

	player.currentChunk = [Math.round((cursorCube.position.x - ((chunkSize * voxelSize) / 2) + (voxelSize / 2)) / (chunkSize * voxelSize)), Math.round((cursorCube.position.z - ((chunkSize * voxelSize) / 2) + (voxelSize / 2)) / (chunkSize * voxelSize))]

	processKeyboard(delta);

	physicsUpdate(delta);

	playerToGroundCollisions();

	checkToInteract(delta, player.currentChunk[0], player.currentChunk[1]);

	showSelectedVoxel();

	updateHotBar();

	checkTNTTimers();

	animateWater(delta, Math.max(0.2, Math.min(0.7, sunPositionInSky)));
	animatePlants(delta, Math.max(0.2, Math.min(0.7, sunPositionInSky)));

	let calcWaterHeight = (waterLevel * voxelSize) + (Math.cos(waterTimer + ((camera.position.x + camera.position.z) * waterData.waveLength)) * waterData.waveHeight)

	if (camera.position.y < calcWaterHeight + (player.height / 2)) {
		scene.fog = new THREE.Fog(0x3169bb, 2, 20);
	}
	else {
		scene.fog = new THREE.Fog(0x63b9db, 2000, 2100);
	}

	renderer.render(scene, camera);

	updateDeveloperPanel();

	if (daylightCycle) {
		sunPositionInSky -= 1 * delta;
	}

	if (sunPositionInSky <= -180) {
		sunPositionInSky = 180;
	}

	if (daylightCycle) {

		sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - sunPositionInSky), THREE.MathUtils.degToRad(225));
		uniforms['sunPosition'].value.copy(sun);

		directionalLight.target.position.set(((worldSize * chunkSize * voxelSize) / 2) + (10 * Math.sin(THREE.MathUtils.degToRad(90 - sunPositionInSky))), 98, ((worldSize * chunkSize * voxelSize) / 2) + (10 * Math.sin(THREE.MathUtils.degToRad(90 - sunPositionInSky))))
		scene.add(directionalLight.target);

		directionalLight.intensity = Math.max(0, Math.min(0.7, sunPositionInSky));
		ambience.intensity = Math.max(0.2, Math.min(0.7, sunPositionInSky));

	}

}

init();

let cursorCube, heightMap;

document.getElementById("beginGame").addEventListener("click", e => {
	document.getElementById("loadingScreen").style.opacity = 1;

	renderDistance = Number(document.getElementById("viewDistance").value);
	worldSize = Number(document.getElementById("worldSize").value);

	waterLevel = Number(document.getElementById("waterLevel").value);

	if (document.getElementById("dayCycle").value == "off") {
		daylightCycle = false;

		renderer.shadowMap.autoUpdate = false;
	}
	else {
		daylightCycle = true;

		renderer.shadowMap.autoUpdate = true;
	}

	renderer.shadowMap.enabled = true;

	if (document.getElementById("shadowType").value == "Ultra") {
		renderer.shadowMap.type = THREE.VSMShadowMap;
	}
	else if (document.getElementById("shadowType").value == "High") {
		renderer.shadowMap.type = THREE.PCFSoftShadowMap;
	}
	else if (document.getElementById("shadowType").value == "Medium") {
		renderer.shadowMap.type = THREE.PCFShadowMap;
	}
	else if (document.getElementById("shadowType").value == "Low") {
		renderer.shadowMap.type = THREE.BasicShadowMap;
	}
	else if (document.getElementById("shadowType").value == "None") {
		renderer.shadowMap.type = THREE.BasicShadowMap;
		renderer.shadowMap.enabled = false;
	}

	// THREE.BasicShadowMap, THREE.PCFShadowMap, THREE.PCFSoftShadowMap, THREE.VSMShadowMap

	camera.position.z = (worldSize * chunkSize * voxelSize) / 2;
	camera.position.y = (30 * voxelSize);
	camera.position.x = (worldSize * chunkSize * voxelSize) / 2;

	player.gravity = 0;

	let waitPeriod = setTimeout(startWorldLoad, 1000);
})

function startWorldLoad() {

	setupMouseLook();

	cursorCube = createCube([voxelSize + 0.1, voxelSize + 0.1, voxelSize + 0.1], [-1000, -1000, -1000], 0x000000, true, 0.4)
	cursorCube.isCursorCube = true;

	heightMap = generateHeightMap();

	for (let x = 0; x < worldSize; x++) {
		renderedVoxels.push([]);
		activeChunks.push([])
		waterPlanes.push([])
		for (let z = 0; z < worldSize; z++) {
			renderedVoxels[x].push([])
			activeChunks[x].push(false)
			waterPlanes[x].push([]);

			loadChunks(x, z);
		}
	}

	for (let x = 0; x < worldSize; x++) {
		for (let z = 0; z < worldSize; z++) {
			if (calculateDistance((x * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), (z * chunkSize * voxelSize) + ((chunkSize * voxelSize) / 2), camera.position.x, camera.position.z) < renderDistance) {
				renderChunks(x, z);

				activeChunks[x][z] = true;
			}
		}
	}

	animate();

	let waitPeriod = setTimeout(finishLoad, 1000);
}

function finishLoad() {
	document.getElementById("mainMenu").style.display = "none";

	document.getElementById("loadingScreen").style.opacity = 0;
	document.getElementById("loadingScreen").style.display = "none";

	player.gravity = player.savedGravity;
}

// Check when tab is active or not

document.addEventListener("visibilitychange", e => {
	if (document.visibilityState == "visible") {
		console.log("tab is active")

		player.gravity = player.savedGravity;
		player.waterFriction = player.savedWaterFriction;

	} else {
		console.log("tab is inactive")

		player.gravity = 0;
		player.waterFriction = 0;
	}
});

// Round values

function round(num, accuracy) {
	return Math.round(num * accuracy) / accuracy;
}
