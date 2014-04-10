"strict mode";

/* global START_DELAY */

/*
	DOM stuff, start and global debugging hooks
 */

var debug = location.protocol === "file:" || location.search.indexOf("debug") != -1

var el = document.querySelector("#game")
var renderer = new THREE.WebGLRenderer({
    canvas: el,
    antialias: true,
})
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0xffffff, 1)

var sendmess = new SendMessage()

var pointerlockchange = function ( event ) {
	var islocked =
		document.pointerLockElement === el ||
		document.mozPointerLockElement === el ||
		document.webkitPointerLockElement === el
	if(islocked) {
		sendmess.send(-1, "onPointerLockChange", true)
	} else {
		sendmess.send(-1, "onPointerLockChange", false)
	}
}

var canvas = document.querySelector(".map > canvas")
var ctx = canvas.getContext("2d")
canvas.width = canvas.clientWidth
canvas.height = canvas.clientHeight

var game = null				// Game logic scope
var websocket = null
function update() {
	requestAnimationFrame(update)
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	game.update(ctx, canvas.width, canvas.height)
	renderer.render(game.graphics.scene, game.graphics.activeplayer.camera)
}
function startFunc(latency) {
	console.log("About to start the game with a latency adjustment of " +latency)
	game.adjustTimer(-latency)
	update()
}
function enterGame(name, numplayers, playerid) {
	game = new Game(numplayers, playerid, new Network(websocket, startFunc), sendmess)
}

if (debug) {
	enterGame("lobby", 1, 0)		// The lobby is also a game map but without networking
	startFunc(START_DELAY) // Constant borrowed from game.js
} else {
	websocket = new WebSocket("ws://" + location.host + "/ws")
	websocket.onmessage = function(mess) {
		console.log("got first message")
		var m = JSON.parse(mess.data)
		enterGame("lobby", m.playerCount, m.playerId)
	}
	websocket.onerror = function(thing) {
		console.error("The network died somehow.", thing)
	}
	websocket.onopen = function(thing) {
		console.log("connected", thing)
	}
}

document.addEventListener('pointerlockchange', pointerlockchange, false)
document.addEventListener('mozpointerlockchange', pointerlockchange, false)
document.addEventListener('webkitpointerlockchange', pointerlockchange, false)
document.addEventListener("click", function(event) {
	if(!game.pointerIsLocked) {
		el.requestPointerLock = el.requestPointerLock || el.mozRequestPointerLock || el.webkitRequestPointerLock
		el.requestPointerLock()
	}
}, false)
window.addEventListener('resize', function() {
	game.graphics.activeplayer.camera.aspect = window.innerWidth / window.innerHeight;
	game.graphics.activeplayer.camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	canvas.width = canvas.clientWidth
	canvas.height = canvas.clientHeight
}, false)
function handle(event) {
	sendmess.send(-1, "onWindowInput", event)
}
document.addEventListener('mousemove', handle, false)
document.addEventListener('keydown', handle, false)
document.addEventListener('keyup', handle, false)
document.addEventListener('mousedown', handle, false)
document.addEventListener('mouseup', handle, false)
document.addEventListener('wheel', function(event) {
	event.preventDefault()
	handle(event)
}, false)

function message(msg) {
	var info = document.querySelector(".cross .info")
	info.innerHTML = msg
	info.style.opacity = 1
	setTimeout(function() {
		info.style.opacity = 0
	}, 1000)
}