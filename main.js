var el = document.querySelector("#game")
var renderer = new THREE.WebGLRenderer({
    canvas: el,
    antialias: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)

var pointerlockchange = function ( event ) {
	var islocked = 
		document.pointerLockElement == el ||
		document.mozPointerLockElement == el || 
		document.webkitPointerLockElement == el
	if(islocked) {
		controls.enabled = true
	} else {
		controls.enabled = false
	}
}
document.addEventListener('pointerlockchange', pointerlockchange, false)
document.addEventListener('mozpointerlockchange', pointerlockchange, false)
document.addEventListener('webkitpointerlockchange', pointerlockchange, false)

document.addEventListener("click", function() {
	el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock
	el.requestPointerLock()
}, false)

var scene = new THREE.Scene()
var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
var controls = new THREE.PointerLockControls(camera)
scene.add(controls.getObject())

var pointLight = new THREE.PointLight(0xFFFFFF)
pointLight.position.x = 10
pointLight.position.y = 50
pointLight.position.z = 130
scene.add(pointLight)

var sphereMaterial =
  new THREE.MeshLambertMaterial(
    {
      color: 0xCC0000
    })
var sphere = new THREE.Mesh(
	new THREE.SphereGeometry(
		50,
		16,
		16),
	sphereMaterial)
scene.add(sphere)
sphere.position.z = -300

geometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
for ( var i = 0, l = geometry.vertices.length; i < l; i ++ ) {
	var vertex = geometry.vertices[ i ];
	vertex.x += Math.random() * 20 - 10;
	vertex.y += Math.random() * 2;
	vertex.z += Math.random() * 20 - 10;
}
for ( var i = 0, l = geometry.faces.length; i < l; i ++ ) {
	var face = geometry.faces[ i ];
	face.vertexColors[ 0 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
	face.vertexColors[ 1 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
	face.vertexColors[ 2 ] = new THREE.Color().setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75 )
}
material = new THREE.MeshBasicMaterial( { vertexColors: THREE.VertexColors } )
mesh = new THREE.Mesh( geometry, material )
scene.add(mesh)

var time = Date.now()
function update() {
	requestAnimationFrame(update)
	controls.update(Date.now() - time)
	renderer.render(scene, camera)
	time = Date.now()
}
update()