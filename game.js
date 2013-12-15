function Game() {
	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 10000)
	this.controls = new THREE.PointerLockControls(this.camera)
	this.scene.add(this.controls.getObject())
	this.player = new Player(this)
}

Game.prototype.update = function(deltatime) {
	this.controls.update(deltatime)
}


function Player(game) {
	this.enabled = false
	var body = new THREE.Mesh(new THREE.CubeGeometry(5, 10, 5))
	body.position.y = 8
	game.scene.add(body)

	var gun = new THREE.Mesh(new THREE.CubeGeometry(0.3, 4, 0.75))
	gun.position.y = 9
	gun.position.x = 1
	gun.position.z = -2
	gun.rotation.x = - Math.PI / 2
	game.scene.add(gun)
}

Player.prototype.mouse = function(event) {
	console.log(event)
}

Player.prototype.keydown = function(event) {
	console.log(event)
}

Player.prototype.keyup = function(event) {
	console.log(event)
}

