// Main game file for Endless Racer

// Game variables
let scene, camera, renderer;
let road, car;
let obstacles = [];
let trees = [];
let score = 0;
let speed = 0;
let maxSpeed = 30;
let acceleration = 0.05;
let isGameOver = false;
let roadWidth = 15;
let roadLength = 300;
let carSpeed = 0;
let lanePositions = [5, 0, -5]; // Left, Middle, Right - reversed to match expected controls
let currentLane = 1; // Middle lane
let clock = new THREE.Clock();
let deltaTime;

// Control state
let keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

// DOM elements
const scoreElement = document.getElementById('score');
const speedElement = document.getElementById('speed');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');

// Initialize the game
init();

function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    scene.fog = new THREE.Fog(0x87CEEB, 50, 300); // Add fog for distance effect

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);
    camera.lookAt(0, 0, 30);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Create road
    createRoad();

    // Create player car
    createCar();

    // Create initial environment
    for (let i = 0; i < 50; i++) {
        createTree(true);
    }

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Start game loop
    animate();
}

function createRoad() {
    // Road
    const roadGeometry = new THREE.PlaneGeometry(roadWidth, roadLength);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide
    });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, -0.1, roadLength / 2);
    road.receiveShadow = true;
    scene.add(road);

    // Road markings
    const lineGeometry = new THREE.PlaneGeometry(0.5, roadLength);
    const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        side: THREE.DoubleSide
    });

    // Center line
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.set(0, -0.05, roadLength / 2);
    scene.add(centerLine);

    // Side lines
    const leftLine = centerLine.clone();
    leftLine.position.x = -roadWidth / 2;
    scene.add(leftLine);

    const rightLine = centerLine.clone();
    rightLine.position.x = roadWidth / 2;
    scene.add(rightLine);

    // Ground
    const groundGeometry = new THREE.PlaneGeometry(500, roadLength * 2);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x4CAF50,
        side: THREE.DoubleSide
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.2, roadLength / 2);
    ground.receiveShadow = true;
    scene.add(ground);
}

function createCar() {
    // Car body
    const carGeometry = new THREE.BoxGeometry(2, 1, 4);
    const carMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    car = new THREE.Mesh(carGeometry, carMaterial);
    car.position.set(0, 1, 0);
    car.castShadow = true;
    car.receiveShadow = true;
    scene.add(car);

    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.5, 0.7, 2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xaa0000 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 0.85, -0.5);
    roof.castShadow = true;
    car.add(roof);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    
    const wheelPositions = [
        { x: -1.1, y: -0.3, z: 1.3 },
        { x: 1.1, y: -0.3, z: 1.3 },
        { x: -1.1, y: -0.3, z: -1.3 },
        { x: 1.1, y: -0.3, z: -1.3 }
    ];

    wheelPositions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.castShadow = true;
        car.add(wheel);
    });
}

function createObstacle() {
    const lane = Math.floor(Math.random() * 3); // 0, 1, or 2
    const obstacleGeometry = new THREE.BoxGeometry(3, 1.5, 3);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    
    obstacle.position.set(lanePositions[lane], 0.75, roadLength);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push({
        mesh: obstacle,
        lane: lane
    });
}

function createTree(initialPlacement = false) {
    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.castShadow = true;
    trunk.receiveShadow = true;

    // Tree top
    const topGeometry = new THREE.ConeGeometry(3, 6, 8);
    const topMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.y = 5.5;
    top.castShadow = true;
    
    // Tree group
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(top);

    // Position tree
    const side = Math.random() > 0.5 ? 1 : -1;
    const distance = (roadWidth / 2) + 5 + Math.random() * 30;
    const zPos = initialPlacement ? Math.random() * roadLength : roadLength;
    
    tree.position.set(side * distance, 0, zPos);
    scene.add(tree);
    trees.push(tree);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (isGameOver) {
        if (event.code === 'Space') {
            resetGame();
        }
        return;
    }

    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = true;
            break;
        case 'ArrowUp':
        case 'KeyW':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowLeft':
        case 'KeyA':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            keys.right = false;
            break;
        case 'ArrowUp':
        case 'KeyW':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            keys.down = false;
            break;
    }
}

function updateCar() {
    // Handle continuous key presses
    if (keys.left && currentLane > 0) {
        currentLane--;
        keys.left = false; // Reset to prevent multiple lane changes
    }
    if (keys.right && currentLane < 2) {
        currentLane++;
        keys.right = false; // Reset to prevent multiple lane changes
    }
    if (keys.up && speed < maxSpeed) {
        speed += acceleration * 5;
    }
    if (keys.down && speed > 0) {
        speed -= acceleration * 10;
    }
    
    // Smooth lane transition
    const targetX = lanePositions[currentLane];
    car.position.x += (targetX - car.position.x) * 0.2; // Increased from 0.1 to 0.2 for faster response
    
    // Car tilt when changing lanes
    const targetRotationZ = (targetX - car.position.x) * 0.05;
    car.rotation.z += (targetRotationZ - car.rotation.z) * 0.1;
    
    // Car movement animation
    car.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.05;
    car.rotation.x = Math.sin(Date.now() * 0.002) * 0.02;
}

function updateObstacles() {
    // Move existing obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        obstacle.mesh.position.z -= speed;
        
        // Check collision
        if (Math.abs(obstacle.mesh.position.z - car.position.z) < 3 && 
            Math.abs(obstacle.mesh.position.x - car.position.x) < 2.5) {
            gameOver();
            return;
        }
        
        // Remove obstacles that are behind the camera
        if (obstacle.mesh.position.z < -10) {
            scene.remove(obstacle.mesh);
            obstacles.splice(i, 1);
            score += 10;
            updateScore();
        }
    }
    
    // Create new obstacles
    if (Math.random() < 0.01 * (speed / 10) && obstacles.length < 5) {
        createObstacle();
    }
}

function updateTrees() {
    // Move existing trees
    for (let i = trees.length - 1; i >= 0; i--) {
        const tree = trees[i];
        tree.position.z -= speed;
        
        // Remove trees that are behind the camera
        if (tree.position.z < -20) {
            scene.remove(tree);
            trees.splice(i, 1);
        }
    }
    
    // Create new trees
    if (Math.random() < 0.05) {
        createTree();
    }
}

function updateScore() {
    scoreElement.textContent = `Score: ${score}`;
    speedElement.textContent = `Speed: ${Math.floor(speed * 10)} km/h`;
}

function gameOver() {
    isGameOver = true;
    speed = 0;
    finalScoreElement.textContent = `Score: ${score}`;
    gameOverElement.classList.remove('hidden');
}

function resetGame() {
    // Reset game variables
    score = 0;
    speed = 0;
    isGameOver = false;
    currentLane = 1;
    
    // Reset car position
    car.position.set(0, 1, 0);
    car.rotation.set(0, 0, 0);
    
    // Remove all obstacles
    obstacles.forEach(obstacle => scene.remove(obstacle.mesh));
    obstacles = [];
    
    // Remove all trees
    trees.forEach(tree => scene.remove(tree));
    trees = [];
    
    // Create initial trees
    for (let i = 0; i < 50; i++) {
        createTree(true);
    }
    
    // Update UI
    updateScore();
    gameOverElement.classList.add('hidden');
}

function animate() {
    requestAnimationFrame(animate);
    
    deltaTime = clock.getDelta();
    
    if (!isGameOver) {
        // Gradually increase speed if not at max
        if (speed < maxSpeed) {
            speed += acceleration * deltaTime;
        }
        
        // Update game elements
        updateCar();
        updateObstacles();
        updateTrees();
        updateScore();
    }
    
    renderer.render(scene, camera);
}
