/*
	DOM stuff, start and global debugging hooks
 */

debug = location.search == "?debug=true"

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
		game.pointerIsLocked = true
	} else {
		game.pointerIsLocked = false
	}
}

game = null				// Game logic scope
function enterGame(name) {
	// TODO websocket setup, password logon and map loading etc
	game = new Game()
}
function update() {
	requestAnimationFrame(update)
	if(!debug || debug && game.pointerlockchange) {		// Pause on mouse blur while not debugging
		game.update()
		renderer.render(game.scene, game.activeplayer.camera)
	}
}

enterGame("lobby")		// The lobby is also a game map but without networking
update()

document.addEventListener('pointerlockchange', pointerlockchange, false)
document.addEventListener('mozpointerlockchange', pointerlockchange, false)
document.addEventListener('webkitpointerlockchange', pointerlockchange, false)
document.addEventListener("click", function(event) {
	if(game.pointerIsLocked) {
		game.handle(event)
	} else {
		el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock
		el.requestPointerLock()
	}
}, false)
window.addEventListener('resize', function() {
	game.activeplayer.camera.aspect = window.innerWidth / window.innerHeight;
	game.activeplayer.camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}, false)
document.addEventListener('mousemove', function(event) {
	game.handle(event)
}, false)
document.addEventListener('keydown', function(event) {
	game.handle(event)
}, false)
document.addEventListener('keyup', function(event) {
	game.handle(event)
}, false)