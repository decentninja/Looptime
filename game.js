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
	this.controlled = {
		id: 0,
		version: 0
	}
	this.activeplayer = null
	this.update()		// Create model and camera for first frame
}

Game.prototype.handle = function(event) {
	if(this.pointerIsLocked) {
		this.timeline.addEvent(this.playerwave.time, new PlayerEvent(event, this.controlled.id, this.controlled.version, this.timeline))
	}
}

Game.prototype.ticker = function(state, events) {
	var that = this
	if(events) {		// Is someone doing something?
		events.forEach(function(event) {
			var found = false
			state.players.forEach(function(player, index) {
				if(event.id == player.id && event.version == player.version) {
					found = index
					if (event.type === "jump") {
						if (event.id === that.controlled.id && event.version === that.controlled.version) {
							that.controlled.version++
							that.timeline.jump(that.playerwave, event.jumptarget)
						}
					} else {
						player.evaluate(event)
					}
				}
			})
			if (event.type === "jump") {
				if (found !== false) {
					this.timeline.ensurePlayerAt(state.players[found], event.jumptarget)
					state.players.splice(found, 1)
				} else {
					this.timeline.removePlayerAt(state.players[found], event.jumptarget)
				}
			}
		}, this)
	}
	state.players.forEach(function(player) {
		player.update(1000/TARGET_FRAMERATE)
	})
}

Game.prototype.update = function() {
	var temptime = performance.now()
	var deltatime = temptime - this.realtime
	this.realtime = temptime

	for(var i = 0; i <= this.deltatime; i += 1000/TARGET_FRAMERATE) {	// Catch up
		this.time++
		this.timeline.tick()
	}

	// Add new players, timeclones and update old players
	this.playerModels.children.forEach(function(players) {
		players.children.forEach(function(model) {
			model.alive = false		// Reset existed-before bookkeeping
		}, this)
	}, this)
	this.playerwave.state.players.forEach(function(player) {
		var versions = this.playerModels.children.filter(function(differentversions) {
			return differentversions.gameid === player.id
		}, this)[0]
		if(!versions) {
			versions = new THREE.Object3D()
			versions.gameid = player.id
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

	this.playerModels.children.forEach(function(models) {
		models.children.forEach(function(model) {
			if(!model.alive) {
				models.remove(model)		// Remove models that did exist and does not in this state
			}
			if(this.controlled.id === model.id && this.controlled.version === model.version) {
				this.activeplayer = model 	// Switch camera if nessesary
			}
		}, this)
	}, this)
}