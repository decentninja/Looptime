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
	this.timeline.addPlayer(new Player(this.scene))
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
	if(this.intotick >= 100) {
		this.timeline.next()
		this.intotick -= 100
	}
	var state = this.timeline.get()
	state.players.forEach(function(player) {
		this.timeline.addPlayer(player)
		player.update(deltatime)
	})
}