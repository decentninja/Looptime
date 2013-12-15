function Game() {
	this.map = new Lobby()
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
	this.controls = new THREE.PointerLockControls(this.camera)
	this.map.scene.add(this.controls.getObject())
}

Game.prototype.update = function(deltatime) {
	this.controls.update(deltatime)
}