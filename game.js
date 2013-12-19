/*
	Scene, active player, time
 */

function Game() {
	this.timeline = new Timeline(30)		// Twice every second
	this.timeline.timewaves.push(new TimeWave(0, 1, {	// Initial state
		players: [new Player(0)]
	}))
	this.pointerIsLocked = false
	this.control = {
		id: 0,
		version: 0
	}
	this.time = 0

	this.scene = new THREE.Scene()
	this.scene.add(new Lobby(this.scene))
	this.activeplayer = new PlayerModel(this.scene)
}

Game.prototype.handle = function(event) {
	if(this.pointerIsLocked) {
		this.timeline.addEvent(this.time, new PlayerEvent(event))
	}
}

Game.prototype.update = function() {
	this.time++
	timeline.tick()
}