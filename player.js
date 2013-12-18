/*
	Player mesh, update and event handling
 */

var PLAYER_SPEED = 3 

function Player(scene) {
	this.events = []	// Events this tick
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
	this.angular = new THREE.Vector2()
}

Player.prototype.update = function(deltatime) {
	var change = new THREE.Vector3()
	change.copy(this.velocity)
	change.multiplyScalar(deltatime/30)
	this.body.translateX(change.x)
	this.body.translateY(change.y)
	this.body.translateZ(change.z)
	this.camera.rotation.x += this.angular.x
	this.angular.x -= this.angular.x
	this.body.rotation.y += this.angular.y
	this.angular.y -= this.angular.y
}

Player.prototype.handle = function(event, isReplay) {
	switch(event.type) {
		case "click":
			console.log("TODO Fire gun!")
			break
		case "mousemove":
			var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0
			var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0
			this.angular.x -= movementY * 0.002
			this.angular.y -= movementX * 0.002
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
			break
	}
	if(!isReplay) {
		this.events.push(event)
	}
}