/*
	Scene, active player, time
 */

function Game() {
	this.pointerIsLocked = false
	this.time = performance.now()
	this.intotick = 0
	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.timeline = new Timeline()
	this.activeplayer = 0
	this.timeline.addPlayer(new Player(this.scene, this.activeplayer))
	this.state = this.timeline.getCurrentState()
}

Game.prototype.getActivePlayer = function() {
	var that = this
	for(var i in this.state.players) {
		if(this.state.players[i].id == 0) {
			return this.state.players[i]
		}
	}
}

Game.prototype.handle = function(event) {
	if(this.pointerIsLocked) {
		this.getActivePlayer().handle(event, false)
	}
}

Game.prototype.update = function() {
	var temptime = performance.now()
	var deltatime = temptime - this.time
	this.time = temptime
	this.intotick += deltatime
	this.state.players.forEach(function(player) {
		player.update(deltatime)
	})
	if(this.intotick >= 100) {
		this.timeline.next()
		this.state = this.timeline.getCurrentState()
		var last = this.timeline.getLastState()
		var that = this
		last.players.forEach(function(player) {
			that.timeline.addPlayer(player)
		})
		if(this.pointerIsLocked)
			console.log(this.scene.children)
		this.intotick -= 100
	}
}