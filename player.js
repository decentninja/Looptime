/*
	Player state at one tick
 */
function Player(id, speed) {
	this.position = new THREE.Vector3()
	this.look = new THREE.Euler()
	this.id = id
	this.version = 0
	this.speed = speed
}

/*
	Event handling
 */
Player.prototype.evaluate = function(event) {
	switch(event.type) {
		case "click":
			console.log("TODO Fire gun!")
			break
		case "mousemove":
			this.look.x += event.mouse.x
			this.look.y += event.mouse.y
			break
		case "keydown":
		case "keyup":
			var offset = new Vector3()
			var up = new Vector3(0, 1, 0)		// TODO Check is this correct?
			offset.crossVectors(up, this.look)
			offset.multiplyScalar(this.speed)
			this.position.add(offset)
			break
	}
}

/*
	Player event type
 */
function PlayerEvent(event, id, version) {
	this.id = id
	this.version = version
	this.type = event.type
	switch(event.type) {
		case "mousemove":
			this.mouse = new Euler()
			this.mouse.y = event.movementX || event.mozMovementX || event.webkitMovementX || 0
			this.mouse.x = event.movementY || event.mozMovementY || event.webkitMovementY || 0
			this.mouse.multiplyScalar(0.002)
			break
		case "click":
			// TODO What button
			break
		case "keydown":
		case "keyup":
			var change
			if(event.type == "keydown") {
				change = PLAYER_SPEED
			} else {
				change = 0
			}
			switch ( event.keyCode ) {
				case 38: // up
				case 87: // w
					this.velocity.z = -change
					break
				case 37: // left
				case 65: // a
					this.velocity.x = -change
					break
				case 40: // down
				case 83: // s
					this.velocity.z = change
					break
				case 39: // right
				case 68: // d
					this.velocity.x = change
					break
			}
	}
}

/*
	Player model data
 */
function PlayerModel(id, version) {
	this.id = id
	this.version = version
	this.body = new THREE.Mesh(new THREE.CubeGeometry(5, 10, 5))
	this.body.position.y = 8

	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
	this.body.add(this.camera)
	this.camera.position.y = 1.8

	var gun = new THREE.Mesh(new THREE.CubeGeometry(0.3, 4, 0.75))
	this.camera.add(gun)
	gun.position.y = -1
	gun.position.x = 1
	gun.position.z = -2
	gun.rotation.x = - Math.PI / 2
}

PlayerModel.prototype.update = function(playerstate) {
	this.body.position = playerstate.position
	this.body.rotation.y = playerstate.look.y
	this.camera.rotation.x = playerstate.look.x
}