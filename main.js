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
		game.mousefocus = true
	} else {
		game.mousefocus = false
	}
}
document.addEventListener('pointerlockchange', pointerlockchange, false)
document.addEventListener('mozpointerlockchange', pointerlockchange, false)
document.addEventListener('webkitpointerlockchange', pointerlockchange, false)

document.addEventListener("click", function() {
	el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock
	el.requestPointerLock()
}, false)

window.addEventListener('resize', function() {
	game.active.camera.aspect = window.innerWidth / window.innerHeight;
	game.active.camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}, false)


game = null
running = false
function update() {
	requestAnimationFrame(update)
	if(running) {
		game.update()
		renderer.render(game.scene, game.active.camera)
	}
}
update()
function enterGame(name, password) {
	// Do websocket setup, password logon and map loading etc
	if(game) {
		game.stop()
	}
	game = new Game()
	game.run()
	running = true
}
enterGame("lobby")		// The lobby is also a game map but without networking
document.addEventListener('mousemove', function(event) {
	game.mouse(event)
}, false)
document.addEventListener('keydown', function(event) {
	game.keydown(event)
}, false)