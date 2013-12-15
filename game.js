var TIME_STEP = 100

function Game() {
	this.mousefocus = false		// Pointer lock
	this.gametime = 0			// Milliseconds from gamestart
	this.time = Date.now()		// Unix time
	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.players = [new Player(this.scene)]
	this.active = this.players[0]
	this.timeline = new Array(100000)
	this.timeline[10] = {
		id: 0,
		action: "forward"
	}
}

Game.prototype.run = function() {
	var i = 0
	var that = this
	this.interval = setInterval(function() {
		i++
		that.players.forEach(function(player) {
			player.velocity.multiplyScalar(0.5)
			if(player.velocity.length() < 0.1) {
				player.velocity.set(0, 0, 0)
			}
		})
		var now = that.timeline[i]
		if(now) {
			that.players[now.id].velocity.x = 2
		}
	}, TIME_STEP)
}

Game.prototype.stop = function() {
	clearInterval(this.interval)
}

Game.prototype.mouse = function(event) {
	if(this.mousefocus) {
		console.log(event)
	}
}

Game.prototype.keydown = function(event) {
	if(this.mousefocus) {
		console.log(Math.round(this.gametime / TIME_STEP))
		console.log(event)
	}
}

Game.prototype.keyup = function(event) {
	if(this.mousefocus) {
		console.log(event)
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