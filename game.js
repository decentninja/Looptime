function Game() {
	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
	this.player = new Player(this)
}

Game.prototype.update = function(deltatime) {
	this.player.update(deltatime)
}