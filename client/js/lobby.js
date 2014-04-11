"strict mode";

/*
	Debug level, future tutorial and game select menu
	With code from http://threejs.org/examples/#misc_controls_pointerlock
 */

function Lobby() {
	THREE.Object3D.call(this)
	// Light
	var pointLight = new THREE.PointLight(0xFFFFFF)
	pointLight.position.x = 10
	pointLight.position.y = 50
	pointLight.position.z = 130
	this.add(pointLight)

	var map = new THREE.Mesh(assets["clock map"].geometry)
	map.scale.multiplyScalar(300)
	map.position.y -= 1400
	map.material = new THREE.MeshNormalMaterial()
	this.add(map)

	if(debug) {
		var collision = new THREE.Mesh(assets["collision map"].geometry)
		collision.scale.multiplyScalar(300)
		collision.position.y -= 1401
		this.add(collision)
	}

	var mesh = THREEx.createSkymap("skybox")
	mesh.scale.multiplyScalar(1000)
	this.add(mesh)

	this.collision = new THREE.Mesh(assets["collision map"].geometry)
	this.collision.scale.multiplyScalar(300)
	this.collision.position.y -= 1400

	this.collision.lowY = -400
	this.collision.highY = 400

	this.collision.updateMatrixWorld()
}

Lobby.prototype = Object.create(THREE.Object3D.prototype)
