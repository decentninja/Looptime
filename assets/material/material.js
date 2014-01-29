"strict mode";

var el = document.querySelector("#game")
var renderer = new THREE.WebGLRenderer({
    canvas: el,
    antialias: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0xffffff, 1)

window.addEventListener('resize', function() {
	game.graphics.activeplayer.camera.aspect = window.innerWidth / window.innerHeight;
	game.graphics.activeplayer.camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}, false)

var scene = new THREE.Scene()

// Light
var pointLight = new THREE.PointLight(0xFFFFFF)
pointLight.position.y = 200
pointLight.position.x = 100
scene.add(pointLight)

// Sample Sphere
var rand = new THREE.MeshLambertMaterial({
    color: Math.random() * 0xffffff,
    shading: THREE.NoShading,
})

var geo = new THREE.SphereGeometry(50, 16, 16)
var sphere = new THREE.Mesh(geo, rand)
sphere.position.z = -300
sphere.position.x = 100
scene.add(sphere)

var geo2 = new THREE.CubeGeometry(50, 50, 50)
cube = new THREE.Mesh(geo2, rand)
cube.position.z = -300
cube.position.x = -100
cube.rotation.y += 100
scene.add(cube)

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
var glfx = fx.canvas()
el.parentElement.removeChild(el)
document.body.appendChild(glfx)

var swirl = -20

function update() {
	requestAnimationFrame(update)
	renderer.render(scene, camera)
	var texture = glfx.texture(el)
	glfx.draw(texture).vignette(0.5, 0.3).ink(0.25).swirl(glfx.width/2, glfx.height/2, 464, swirl).update()
	swirl *= 0.99
}
update()