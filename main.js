/*
	DOM stuff, start and global debugging hooks
 */

var debug = location.search == "?debug=true"

var el = document.querySelector("#game")
var renderer = new THREE.WebGLRenderer({
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

var game = null				// Game logic scope
function enterGame(name) {
	// TODO websocket setup, password logon and map loading etc
	game = new Game()
}
function update() {
	requestAnimationFrame(update)
	if(!debug || debug && game.pointerIsLocked) {		// Pause on mouse blur while not debugging
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
function handle(event) {
	game.handle(event)
}
document.addEventListener('mousemove', handle, false)
document.addEventListener('keydown', handle, false)
document.addEventListener('keyup', handle, false)
document.addEventListener('wheel', function(event) {
	event.preventDefault()
	handle(event)
}, false)function message(msg) {
	var info = document.querySelector(".cross .info")
	info.innerHTML = msg
	info.style.opacity = 1
	setTimeout(function() {
		info.style.opacity = 0
	}, 1000)
}