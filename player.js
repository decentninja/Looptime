/*
	Player state at one tick
 */
function Player(id) {
	this.position = new THREE.Vector3(0, 0, 0)
	this.movement = {
		forward: 0,
		back: 0,
		left: 0,
		right: 0
	}
	this.look = new THREE.Euler()
	this.look.reorder("YXZ")
	this.id = id
	this.version = 0
	this.shieldUp = false
}

/*
	Event handling
 */
Player.prototype.evaluate = function(time, event, sendmess) {
	switch(event.type) {
		case "shield":
			this.shieldUp = event.change
			console.log("shield", this.shieldUp ? "up" : "down")
			break
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

Player.prototype.update = function(deltatime, map) {
	var change = new THREE.Vector3(
		this.movement.right - this.movement.left,
		0,
		this.movement.back - this.movement.forward
	)
	var quaternion = new THREE.Quaternion()
	quaternion.setFromEuler(this.look)
	change.applyQuaternion(quaternion)
	
	change.y = 0 		// No fly
	change.normalize()

	var ray = new THREE.Raycaster(this.position, new THREE.Vector3(), 0, 5)

	var dirs = [
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(1, 0, 1),
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(1, 0, -1),
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(-1, 0, -1),
        new THREE.Vector3(-1, 0, 0),
        new THREE.Vector3(-1, 0, 1)
	]
	change.setLength(PLAYER_SPEED * deltatime)
	dirs.forEach(function(dir) {
		ray.set(this.position, dir)
		var col = ray.intersectObject(map.testcube, false)
		if(col.length !== 0) {
			if(dir.x) {
				dir.multiplyScalar(Math.abs(change.x))
			}
			if(dir.z) {
				dir.multiplyScalar(Math.abs(change.z))
			}
			change.sub(dir)
		}
	}, this)
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
			if(event.button == 2) {
				this.type = "shield"
				this.change = false
			}
			break
		case "mousedown":
			switch(event.button) {
				case 0:
					this.type = "fire"
					break
				case 2:
					this.type = "shield"
					this.change = true
					break
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

	var textGeo = new THREE.TextGeometry( this.version, {
		size: 80,
		height: 20,
		curveSegments: 2,
		font: "optimer"
	})
	var textMesh = new THREE.Mesh(textGeo)
	textMesh.scale.multiplyScalar(0.002)
	textMesh.position.y = 0.4
	textMesh.position.x = -0.5
	textMesh.position.z = 0.35
	textMesh.rotation.x = 1.3
	gun.add(textMesh)
}

PlayerModel.prototype = Object.create(THREE.Object3D.prototype)

PlayerModel.prototype.update = function(playerstate) {
	this.position = playerstate.position
	this.rotation.y = playerstate.look.y
	this.camera.rotation.x = playerstate.look.x
}