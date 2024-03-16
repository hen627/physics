import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import CANNON from 'cannon'

// NOTE, there is an audio bug that causes the program to hang up after a while.

/**
 * Debug
 */
const gui = new dat.GUI()
const debugObject = {} // remember when you use dat.gui the thing you want to edit has to be in an object, so that's why we are creating an empty object.


debugObject.createSphere = () =>
{
    createSphere( Math.random() * 0.5, 
        {x: (Math.random() - 0.5) * 3, y:3, z: (Math.random() - 0.5) * 3})
}

debugObject.createBox = () =>
{
    createBox( Math.random(), // width height depth
               Math.random(),
               Math.random(),
        {   x: (Math.random() - 0.5) * 3, 
            y:3, 
            z: (Math.random() - 0.5) * 3})
}

debugObject.reset = () => {
    for(const object of objectsToUpdate)
    {
        object.body.removeEventListener('collide', playHitSound)
        world.removeBody(object.body)

        //remove mesh
        scene.remove(object.mesh)
    }
}
gui.add(debugObject, 'createSphere')
gui.add(debugObject, 'createBox')
gui.add(debugObject, 'reset')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Sounds
 */

const normalize = (value, min, max) => {
    return (value - min) / (max - min);
}

const hitSound = new Audio('/sounds/recording.mp3')
const playHitSound = (collision) => //we use the event here to then measure collision, to make it so that the audio only plays on heavy impact. 
{
    const impactStrength = collision.contact.getImpactVelocityAlongNormal()
    if(impactStrength > 1.2){
    const normalizedImpactStrength = normalize(impactStrength,0,10)
    hitSound.currentTime = 0.63
    hitSound.volume = normalizedImpactStrength // the randomness in the volume makes it more realistic, we can also for example scale it with the impact strength, to do that we need to normalize the impact strength since the volume can only go from 0 to 1
    hitSound.play()
    }
}
console.log(hitSound)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png'
])
/**
 * Physics
 */
// Materials
// const concreteMaterial = new CANNON.Material('concrete')
// const plasticMaterial = new CANNON.Material('plastic')

// const concretePlasticContactMaterial = new CANNON.ContactMaterial(
//     concreteMaterial,
//     plasticMaterial,
//     {
//         friction: 0.1,
//         restitution: 0.7
//     }
// )
 // the above is the finetuned way of creating materials for the physics. below is a simplified for smaller projects.

 const defaultMaterial = new CANNON.Material('default')
 const defaultContactMaterial = new CANNON.ContactMaterial(
    defaultMaterial,
    defaultMaterial,
    {
        friction: 0.1,
        restitution: 0.7
    }
 )

// World
const world = new CANNON.World() //creates a physics world, remember the physics world is a mirror of the real world that then returns values.
world.gravity.set(0, -9.82, 0) // need to add gravity to create movement, Gravity is a Vec3, similar to vector3 but it's CANNON.JS specific.
// to add a object to a physics world we need to create a body, and to create a body we need a shape.
world.broadphase = new CANNON.SAPBroadphase(world) // changes how collision is tested for optimizations
world.addContactMaterial(defaultContactMaterial)
world.defaultContactMaterial = defaultContactMaterial
world.allowSleep = true // changes how objects are tracked, if they aren't moving they start to sleep, which will improve performance, until they move again.

// Sphere
// const sphereShape = new CANNON.Sphere(0.5) // The reason we use a 0.5 radius is because that is the same radius as the sphere geometry.
// const sphereBody = new CANNON.Body({
//     mass: 1,
//     position: new CANNON.Vec3(0 , 3, 0),
//     shape: sphereShape,
//     // material: defaultMaterial
// })
// sphereBody.applyLocalForce(new CANNON.Vec3(150, 0 , 0), new CANNON.Vec3(0,0,0)) //the first is how we're going to push it, and the second is where we are going to push it form, the center that is.
// world.addBody(sphereBody)

// Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5) //rotating things in CANNON requires quaternion
// floorBody.material = defaultMaterial
world.addBody(floorBody)

/**
 * Test sphere
 */
// const sphere = new THREE.Mesh(
//     new THREE.SphereGeometry(0.5, 32, 32),
//     new THREE.MeshStandardMaterial({
//         metalness: 0.3,
//         roughness: 0.4,
//         envMap: environmentMapTexture,
//         envMapIntensity: 0.5
//     })
// )
// sphere.castShadow = true
// sphere.position.y = 0.5
// scene.add(sphere)

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshStandardMaterial({
        color: '#777777',
        metalness: 0.3,
        roughness: 0.4,
        envMap: environmentMapTexture,
        envMapIntensity: 0.5
    })
)
floor.receiveShadow = true
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Utils
 */
const objectsToUpdate = []

// sphere


const sphereGeometry = new THREE.SphereBufferGeometry(1, 20, 20)
const sphereMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture
})

const createSphere = (radius, position) => // function for creating spheres
{
    // THREE.JS Mesh
    const mesh = new THREE.Mesh(sphereGeometry, sphereMaterial)
    mesh.castShadow = true
    mesh.scale.set(radius, radius, radius)
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Sphere(radius)
    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0,3,0),
        shape, // in javascript you can just put shape instead of shape: shape if the thing has the same name.
        material: defaultMaterial
    })

    body.addEventListener('collide', playHitSound)
    body.position.copy(position)
    world.addBody(body)

    // Save in objects to update
    objectsToUpdate.push({
        mesh: mesh,
        body: body
    })
}

createSphere(0.5, {x:0, y:3, z:0})

// Box

const boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const boxMaterial = new THREE.MeshStandardMaterial({
    metalness: 0.3,
    roughness: 0.4,
    envMap: environmentMapTexture
})

const createBox = (width, height, depth, position) => // function for creating spheres
{
    // THREE.JS Mesh
    const mesh = new THREE.Mesh(boxGeometry, boxMaterial)
    mesh.castShadow = true
    mesh.scale.set(width, height, depth)
    mesh.position.copy(position)
    scene.add(mesh)

    // Cannon.js body
    const shape = new CANNON.Box(new CANNON.Vec3(width * 0.5, height * 0.5, depth * 0.5)) // the way box works is that it uses half extent, meaning it starts from the center of the box before heading xyz etc. so we give it half values.
    const body = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(0,3,0),
        shape, // in javascript you can just put shape instead of shape: shape if the thing has the same name.
        material: defaultMaterial
    })

    body.addEventListener('collide', playHitSound)
    body.position.copy(position)
    world.addBody(body)

    // Save in objects to update
    objectsToUpdate.push({
        mesh: mesh,
        body: body
    })
}

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    // Update Physics world
    // sphereBody.applyForce(new CANNON.Vec3(-0.5, 0, 0), sphereBody.position)

    world.step(1 / 60, deltaTime, 3) //first parameter is fixed time step, the second is how much time passed since last step, the third is how many iterations the world can appy to catch up with a potential delay.
    // 1/60 is 60fps, deltatime is the time passed between each tick.

    for(const object of objectsToUpdate)
    {
        object.mesh.position.copy(object.body.position)
        object.mesh.quaternion.copy(object.body.quaternion)
    }
    
    // THREEJS world
    // sphere.position.copy(sphereBody.position) //altough sphereBody is a vec3 we can still copy it as if it was a vector 3 object.

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()