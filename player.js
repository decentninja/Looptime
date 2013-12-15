function Player(game) {
	this.enabled = false

	var body = new THREE.Mesh(new THREE.CubeGeometry(5, 10, 5))
	body.position.y = 8
	game.scene.add(body)

	body.add(game.camera)
	game.camera.position.y = 1.8

	var gun = new THREE.Mesh(new THREE.CubeGeometry(0.3, 4, 0.75))
	game.camera.add(gun)
	gun.position.y = -1
	gun.position.x = 1
	gun.position.z = -2
	gun.rotation.x = - Math.PI / 2
}

Player.prototype.mouse = function(event) {
	if(this.enabled) {
		console.log(event)
	}
}

Player.prototype.keydown = function(event) {
	if(this.enabled) {
		console.log(event)
	}
}

Player.prototype.keyup = function(event) {
	if(this.enabled) {
		console.log(event)
	}
}

Player.prototype.update = function(deltatime) {
}