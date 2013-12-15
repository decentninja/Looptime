var TIME_STEP = 10
var PLAYER_SPEED = 2.5

function Game() {
	this.mousefocus = false		// Pointer lock
	this.gametime = 0			// Milliseconds from gamestart
	this.time = Date.now()		// Unix time
	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.players = [new Player(this.scene)]
	this.active = this.players[0]
	this.timeline = new Timeline()
}

Game.prototype.run = function() {
	var i = 0
	var that = this
	this.interval = setInterval(function() {
		i++
		var now = that.timeline.get(i)
		now.forEach(function(event) {
			switch(event.action) {	// should be in player
				case "move":
					that.players[event.id].velocity = event.change
					console.log(event)
					break
				case "look":
					that.players[event.id].look(event.change)
					break
			}
		})
	}, TIME_STEP)
}

Game.prototype.stop = function() {
	clearInterval(this.interval)
}

Game.prototype.mouse = function(event) {
	if(this.mousefocus) {
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		this.timeline.add(this.gametime, {
			id: 0,
			action: "look",
			change: new THREE.Vector2(movementX, movementY)
		})
	}
}

Game.prototype.keydown = function(event) {
	if(this.mousefocus) {
		var change = new THREE.Vector3()
		switch ( event.keyCode ) {
			case 38: // up
			case 87: // w
				change.z = -PLAYER_SPEED
				break
			case 37: // left
			case 65: // a
				change.x = -PLAYER_SPEED
				break
			case 40: // down
			case 83: // s
				change.z = PLAYER_SPEED
				break
			case 39: // right
			case 68: // d
				change.x = PLAYER_SPEED
				break
		}
		if(change.length() != 0) {
			this.timeline.add(this.gametime, {
				id: 0,
				action: "move",
				change: change,
			})
		}
	}
}

Game.prototype.update = function() {
	var temptime = Date.now()
	var deltatime = temptime - this.time
	this.time = temptime
	this.gametime += deltatime
	this.players.forEach(function(player) {
		player.update(deltatime)
	})
}