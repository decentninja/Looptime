/*
	Scene, active player, time
 */

function Game() {
	this.pointerIsLocked = false
	this.time = performance.now()
	this.intotick = 0
	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.activeplayer = new Player(this.scene)
	this.timeline = new Timeline()
	this.timeline.addPlayer(this.activeplayer)
	this.state = this.timeline.getCurrentState()
}

Game.prototype.handle = function(event) {
	if(this.pointerIsLocked) {
		this.activeplayer.handle(event)
	}
}

Game.prototype.update = function() {
	var temptime = performance.now()
	var deltatime = temptime - this.time
	this.time = temptime
	this.intotick += deltatime
	this.activeplayer.update(deltatime)
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
		this.intotick -= 100
	}
}