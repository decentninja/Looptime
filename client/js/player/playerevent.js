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