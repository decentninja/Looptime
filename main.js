/*
	DOM stuff, start and global debugging hooks
 */

el = document.querySelector("#game")
renderer = new THREE.WebGLRenderer({
    canvas: el,
    antialias: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0xffffff, 1)

var pointerlockchange = function ( event ) {
	var islocked = 
		document.pointerLockElement == el ||
		document.mozPointerLockElement == el || 
		document.webkitPointerLockElement == el
	if(islocked) {
		game.controls.enabled = true
	} else {
		game.controls.enabled = false
	}
}
document.addEventListener('pointerlockchange', pointerlockchange, false)
document.addEventListener('mozpointerlockchange', pointerlockchange, false)
document.addEventListener('webkitpointerlockchange', pointerlockchange, false)

document.addEventListener("click", function() {
	el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock
	el.requestPointerLock()
}, false)

game = null
var time = Date.now()
running = false
function enterGame(name, password) {
	// Do websocket setup, password logon and map loading etc
	game = new Game()
	running = true
}
function update() {
	requestAnimationFrame(update)
	if(running) {
		var deltatime = Date.now() - time
		game.update(deltatime)
		renderer.render(game.map.scene, game.camera)
		time = Date.now()
	}
}
update()
enterGame("lobby")		// The lobby is also a game map but without networking