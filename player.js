/*
	Player state at one tick
 */
function Player(id) {
	this.position = new THREE.Vector3(0, 4, 0)
	this.movement = {
		forward: 0,
		back: 0,
		left: 0,
		right: 0
	}
	this.look = new THREE.Vector3()
	this.id = id
	this.version = 0
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
			for(var direction in event.movement) {
				this.movement[direction] = event.movement[direction]
			}
			break
	}
}

Player.prototype.update = function(deltatime) {
	var object = new THREE.Object3D()	// XXX Should be done with math
	object.position.x = this.position.x
	object.position.y = this.position.y
	object.position.z = this.position.z
	object.rotation.x = this.look.x
	object.rotation.y = this.look.y
	object.rotation.z = this.look.z
	var direction = new THREE.Vector3(
		this.movement.right - this.movement.left,
		0,
		this.movement.back - this.movement.forward
	)
	object.translateX(direction.x)
	object.translateY(direction.y)
	object.translateZ(direction.z)
	var change = new THREE.Vector3()
	change.subVectors(object.position, this.position)
	change.y = 0 										// No fly
	change.setLength(PLAYER_SPEED * deltatime)
	this.position.add(change)
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
			this.mouse = new THREE.Vector2()
			this.mouse.y = event.movementX || event.mozMovementX || event.webkitMovementX || 0
			this.mouse.x = event.movementY || event.mozMovementY || event.webkitMovementY || 0
			this.mouse.multiplyScalar(-0.002)
			break
		case "click":
			// TODO What button
			break
		case "keydown":
		case "keyup":
			var change
			if(event.type === "keydown") {
				change = 1
			} else {
				change = 0
			}
			this.movement = {}
			switch ( event.keyCode ) {
				case 38: // up
				case 87: // w
					this.movement.forward = change
					break
				case 37: // left
				case 65: // a
					this.movement.left = change
					break
				case 40: // down
				case 83: // s
					this.movement.back = change
					break
				case 39: // right
				case 68: // d
					this.movement.right = change
					break
			}
			break
	}
}

/*
	Player model data
 */
function PlayerModel(id, version) {
	THREE.Object3D.call( this );
	this.id = id
	this.version = version
	this.body = new THREE.Mesh(new THREE.CubeGeometry(5, 10, 5))
	this.body.position.y = 8
	this.add(this.body)

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

PlayerModel.prototype = Object.create(THREE.Object3D.prototype)

PlayerModel.prototype.update = function(playerstate) {
	this.body.position = playerstate.position
	this.body.rotation.y = playerstate.look.y
	this.camera.rotation.x = playerstate.look.x
}