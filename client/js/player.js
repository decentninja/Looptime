"strict mode";

var PLAYER_SPEED = 0.02
var FRICTION = .9
var GRAVITY = -0.007
var HEAD_HEIGHT = 10
var STEP_HEIGHT = 2.5
var NUDGE = 0.01
var SNAP_DISTANCE = 2
var JUMP_HEIGHT = 2.3
var PLAYER_THICKNESS = 2

/*
	Player state at one tick
 */
function Player(id, version) {
	this.position = new THREE.Vector3(0, 300, 0)
	this.stop()
	this.look = new THREE.Euler()
	this.velocity = new THREE.Vector3()
	this.look.reorder("YXZ")
	this.id = id
	this.version = version | 0
	this.grounded = false
}

Player.prototype.stop = function() {
	this.movement = {
		forward: 0,
		back: 0,
		left: 0,
		right: 0
	}
}

/*
	Event handling
 */
Player.prototype.evaluate = function(time, event, sendmess) {
	switch(event.type) {
		case "mousemove":
			this.look.x += event.mouse.x
			this.look.y += event.mouse.y
			var max = Math.PI/2
			if(this.look.x < -max) {
				this.look.x = -max
			} else if(this.look.x > max) {
				this.look.x = max
			}
			break
		case "keydown":
		case "keyup":
			for(var direction in event.movement) {
				this.movement[direction] = event.movement[direction]
			}
			break
		case "hop":
			if(this.grounded) {
				this.grounded = false
				this.velocity.y = JUMP_HEIGHT
			}
			break
	}
}

Player.prototype.getLookDirection = function() {
	var direction = new THREE.Vector3(0, 0, -1)		// The camera is looking down internaly
	var quaternion = new THREE.Quaternion()
	quaternion.setFromEuler(this.look)
	direction.applyQuaternion(quaternion)
	direction.normalize()
	return direction
}

Player.prototype.update = function(deltatime, collision) {
	var acceleration = new THREE.Vector3(
		this.movement.right - this.movement.left,
		0,
		this.movement.back - this.movement.forward
		)
	var quaternion = new THREE.Quaternion()
	quaternion.setFromEuler(this.look)
	acceleration.applyQuaternion(quaternion)

	acceleration.y = 0		// No fly
	acceleration.setLength(PLAYER_SPEED * deltatime)
	this.velocity.add(acceleration)
	this.velocity.x *= FRICTION
	this.velocity.z *= FRICTION

	this.velocity.y += GRAVITY * deltatime

	var change = this.velocity.clone()

	var horChange = new THREE.Vector3(change.x, 0, change.z)
	var from = this.position.clone()
	var direction = horChange.clone().normalize()
	from.y += STEP_HEIGHT

	var ray = new THREE.Raycaster(from, direction, 0, change.length() + NUDGE + PLAYER_THICKNESS)
	var hits = ray.intersectObject(collision)
	if (hits.length > 0) {
		horChange.setLength(hits[0].distance - NUDGE - PLAYER_THICKNESS)
		change.x = horChange.x
		change.z = horChange.z
	}

	from.add(horChange)
	from.y += HEAD_HEIGHT - STEP_HEIGHT
	ray.set(from, new THREE.Vector3(0, -1, 0))
	if (this.grounded) {
		ray.far = HEAD_HEIGHT + SNAP_DISTANCE
	} else {
		ray.far = HEAD_HEIGHT - change.y
	}
	hits = ray.intersectObject(collision)
	if(hits.length > 0) {
		change.y = -(hits[0].distance - HEAD_HEIGHT)
		this.grounded = true
		this.velocity.y = 0
	} else {
		this.grounded = false
	}
	
	this.position.add(change)
}

/*
	Player event type
 */
function PlayerEvent(event) {
	this.type = event.type
	switch(event.type) {
		case "mousemove":
			this.mouse = new THREE.Vector2()
			this.mouse.y = event.movementX || event.mozMovementX || event.webkitMovementX || 0
			this.mouse.x = event.movementY || event.mozMovementY || event.webkitMovementY || 0
			this.mouse.multiplyScalar(-0.002)
			break
		case "mouseup":
			break
		case "mousedown":
			if(event.button == 0) {
				this.type = "fire"
			}
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
				case 188: // , (for dvorak)
					this.movement.forward = change
					break
				case 37: // left
				case 65: // a (both for qwerty and dvorak)
					this.movement.left = change
					break
				case 40: // down
				case 83: // s
				case 79: // o (for dvorak)
					this.movement.back = change
					break
				case 39: // right
				case 68: // d
				case 69: // e (for dvorak)
					this.movement.right = change
					break
				case 32: // Space
					this.type = "hop"
					break
			}
			break
	}
}

/*
	Player model data
 */
function PlayerModel(id, version) {
	THREE.Object3D.call(this)
	this.id = id
	this.version = version
	this.body = new THREE.Mesh(new THREE.CubeGeometry(7.5, 25, 7.5))
	this.body.position.y = 8
	this.add(this.body)

	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000000)
	this.body.add(this.camera)
	this.camera.position.y = 8

	var manager = new THREE.LoadingManager()
	manager.onProgress = function(item, loaded, total) {
		console.log(item, loaded, total)
	}
	var that = this

	var shotorigin = new THREE.Object3D()
	shotorigin.name = "shotorigin" // get by using getObjectByName("shotorigin")
	this.camera.add(shotorigin)
	shotorigin.position.x = 1.75
	shotorigin.position.z = -6.5
	shotorigin.position.y = -1

	var gun = new THREE.Mesh(assets["grandfather gun"].geometry)
	this.camera.add(gun)
	gun.position.z = -2
	gun.position.y = -1
	gun.material = new THREE.MeshNormalMaterial()
	gun.position.x = -1.5
	gun.scale.multiplyScalar(1.5)
	gun.rotation.y = -Math.PI / 2
}

PlayerModel.prototype = Object.create(THREE.Object3D.prototype)

PlayerModel.prototype.update = function(playerstate) {
	this.position = playerstate.position
	this.rotation.y = playerstate.look.y
	this.camera.rotation.x = playerstate.look.x
}