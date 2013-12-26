/*
	Scene, active player, time
 */

var PLAYER_SPEED = 0.1
var SAVE_STATE_RATE = 30		// Save state twice every second
var TARGET_FRAMERATE = 60

function Game() {
	this.timeline = new Timeline(SAVE_STATE_RATE, this.ticker.bind(this))
	this.pointerIsLocked = false
	this.time = 0
	this.deltatime = null
	this.realtime = performance.now()

	this.delayedJumpers = []

	this.scene = new THREE.Scene()
	this.map = new Lobby(this.scene)
	this.scene.add(this.map)
	this.playerModels = new THREE.Object3D()	// Object3D of Object3D's (players) of PlayerModels (versions)
	this.scene.add(this.playerModels)

	// Initialize controlled player
	var initialState = {
		players: [new Player(0)]
	}
	this.playerwave = new Timewave(-1, 1, initialState)
	this.timeline.timewaves.push(this.playerwave)
	this.controlled = { //TODO: replace with one per player + a controlledId
		id: 0,
		version: 0
	}
	this.activeplayer = null
	this.timecursor = 0
	this.update()		// Create model and camera for first frame
}

/*
	World and client specific event here, put player handling in player.js.
*/
Game.prototype.handleInput = function(event) {
	if (this.pointerIsLocked) {
		var internalEvent = new PlayerEvent(event)
		internalEvent.metatime = this.time //used to determine the age of player events, for properly syncing timewaves
		internalEvent.id = this.controlled.id,
		internalEvent.version = this.controlled.version
		switch(event.type) {
			case "wheel":
				if (event.wheelDelta) {
					this.timecursor -= event.wheelDelta
				} else if (event.deltaY) {
					this.timecursor -= event.deltaY
				}
				if(this.timecursor < 0) {
					this.timecursor = 0
				}
				var max = this.timeline.states.length * SAVE_STATE_RATE - 1
				if(this.timecursor > max) {
					this.timecursor = max
				}
				return 		// Don't register in timeline

			case "keydown":
				if (event.keyCode === 32) {
					internalEvent.type = "jump"
					internalEvent.jumptarget = this.timeline.calcJumpTarget(this.timecursor)
				}
				break
		}
		this.timeline.addEvent(this.playerwave.time, internalEvent)
	}
}

Game.prototype.ticker = function(state, events, latestAcceptableTime) {
	if(events) {		// Is someone doing something?
		events.forEach(function(event) {
			if (typeof latestAcceptableTime === "number" && event.metatime > latestAcceptableTime)
				return

			this.handleEvent(state, event, latestAcceptableTime)
		}, this)
	}
	state.players.forEach(function(player) {
		player.update(1000/TARGET_FRAMERATE)
	})
}

Game.prototype.handleEvent = function(state, event, latestAcceptableTime) {
	var found = false
	for (var index = 0; index < state.players.length; index++) {
		player = state.players[index]

		if (event.id !== player.id || event.version !== player.version)
			continue
		found = index

		switch(event.type) {
			case "jump":
				this.handleJumpEvent(event)
				break

			case "fire":
				this.handleFireEvent(state, event)
				break

			default:
				player.evaluate(event)
		}
		break //each event only deals with one player, so break here
	}
	if(event.type === "jump") {
		if (found !== false) {
			this.timeline.ensurePlayerAt(event.jumptarget, state.players[found])
			state.players.splice(found, 1)
		} else {
			this.timeline.removePlayerAt(event.jumptarget, {id: event.id, version: event.version})
		}
	}
}

Game.prototype.handleJumpEvent = function(event) {
	if (event.id === this.controlled.id && event.version === this.controlled.version) {
		this.controlled.version++
		this.delayedJumpers.push([event.jumptarget, this.playerwave])
	}
}

Game.prototype.handleFireEvent = function(state, event) {
	//TODO: actual math.
	/*
		assuming
		c = sphere center point (vector)
		r = radius of sphere
		o = starting point of line (vector)
		l = normalized direction of line (vector)

		then

		temp = (l * (o - c))^2 - (o - c)^2 + r^2
		temp < 0 => no intersection
		dist = -(l * (o - c)) - sqrt(temp)

		where dist is the distance to the closest intersection
		(assuming collision in front of character and point of origin
		not inside sphere)

		see wikipedia for more info
	*/
	/*
		could also make characters boxes, find the faces of the box that
		face the origin and check for collision, but it's slightly more complex
	*/
	var debugline = new THREE.Geometry()
	var gun = new THREE.Vector3(0, 8.8, 0)
	gun.add(player.position)
	debugline.vertices.push(gun)
	debugline.vertices.push(player.getLookDirection().multiplyScalar(1000).add(gun))
	this.scene.add(new THREE.Line(debugline, new THREE.LineBasicMaterial({
		color: 0x0000ff,
		linewidth: 5,
		transparent: true,
		opacity: 0.5
	})))

	// FIXME Should not use models. 
	var ray = new THREE.Raycaster()
	ray.set(gun, player.getLookDirection())

	var targets = []
	function add(playerModel) {
		if(!(playerModel.id === player.id && playerModel.version === player.version)) {
			targets.push(playerModel.body)
		}
	}
	function find(playerVersions) {
		playerVersions.children.forEach(add)
	}
	this.playerModels.children.forEach(find)
	var hit = ray.intersectObjects(targets, false)
	if(hit.length != 0) {
		console.log("hit: ", hit[0].object.parent)
	}
}

Game.prototype.update = function() {
	var temptime = performance.now()
	var deltatime = temptime - this.realtime
	this.realtime = temptime

	this.advanceTimelineAndJump()

	this.updateGraphics()
}

Game.prototype.advanceTimelineAndJump = function() {
	for(var i = 0; i <= this.deltatime; i += 1000/TARGET_FRAMERATE) {	// Catch up
		this.time++
		this.timeline.tick()
		if (this.delayedJumpers.length > 0) {
			this.delayedJumpers.forEach(function(info) {
				this.timeline.jump(info[0], info[1])
			}, this)
			this.delayedJumpers.length = 0
		}
	}
}

Game.prototype.updateGraphics = function() {
	//Reset alive book-keeping
	this.playerModels.children.forEach(function(players) {
		players.children.forEach(function(model) {
			model.alive = false
		}, this)
	}, this)

	// Add new players, timeclones and update old players
	this.playerwave.state.players.forEach(function(player) {
		var versions = this.playerModels.children.filter(function(differentversions) {
			return differentversions.id === player.id
		}, this)[0]
		if(!versions) {
			versions = new THREE.Object3D()
			versions.id = player.id
			this.playerModels.add(versions)
		}
		var version = versions.children.filter(function(version) {
			return version.version === player.version
		}, this)[0]
		if(!version) {
			var version = new PlayerModel(player.id, player.version)
			versions.add(version)
		}
		version.update(player)
		version.alive = true		// Model is new or existed before and in state	
	}, this)

	// Remove models that were not alive and move the camera
	this.playerModels.children.forEach(function(models) {
		var toberemoved = []
		models.children.forEach(function(model) {
			if(!model.alive) {
				toberemoved.push(model)
			}
			if(this.controlled.id === model.id && this.controlled.version === model.version) {
				this.activeplayer = model 	// Switch camera if nessesary
			}
		}, this)
		toberemoved.forEach(function(model) {
			models.remove(model)
		})
	}, this)
}