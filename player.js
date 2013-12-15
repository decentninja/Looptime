function Player(scene) {
	this.body = new THREE.Mesh(new THREE.CubeGeometry(5, 10, 5))
	this.body.position.y = 8
	scene.add(this.body)

	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
	this.body.add(this.camera)
	this.camera.position.y = 1.8

	var gun = new THREE.Mesh(new THREE.CubeGeometry(0.3, 4, 0.75))
	this.camera.add(gun)
	gun.position.y = -1
	gun.position.x = 1
	gun.position.z = -2
	gun.rotation.x = - Math.PI / 2

	this.velocity = new THREE.Vector3()
}

Player.prototype.update = function(deltatime) {
	var change = this.velocity.multiplyScalar(deltatime/30)
	this.body.position.add(change)
}