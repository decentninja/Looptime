/*
	Player event handling, state at one tick
 */

function Player() {
	this.position = THREE.Vector3()
	this.look = THREE.Euler()
}

Player.prototype.handle = function(event) {
	r = {
		type: event.type
	}
	switch(event.type) {
		case "mousemove":
			r.mouse = new Vector3()
			r.mouse.y = event.movementX || event.mozMovementX || event.webkitMovementX || 0
			r.mouse.x = event.movementY || event.mozMovementY || event.webkitMovementY || 0
			r.mouse.multiplyScalar(0.002)
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
					r.velocity.z = -change
					break
				case 37: // left
				case 65: // a
					r.velocity.x = -change
					break
				case 40: // down
				case 83: // s
					r.velocity.z = change
					break
				case 39: // right
				case 68: // d
					r.velocity.x = change
					break
			}
	}
	return r
}

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
			// TODO position update euler angles
			// http://www-rohan.sdsu.edu/~stewart/cs583/LearningXNA3_lects/Lect15_Ch11_CreateFirstPersonCamera.html
			break
	}
}