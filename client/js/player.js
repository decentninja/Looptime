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

	if (this.position.y <= collision.lowY) {
		this.position.y = collision.highY
	}
}