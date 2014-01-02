/*
	Scene, active player, time
 */

var PLAYER_SPEED = 0.1
var SAVE_STATE_RATE = 30		// Save state twice every second
var SAVE_STATE_COUNT = 600  // A timeline of 5 min
var TARGET_FRAMERATE = 60

function Game() {
	var initialState = {
		players: [],
		jumptimers: [],
	}
	this.sendmess = new SendMessage() //it feels a lot like the graphics stuff should be split out of game
	this.sendmess.register(this)
	this.map = new Lobby()

	this.timeline = new Timeline(SAVE_STATE_COUNT, SAVE_STATE_RATE, initialState, this.sendmess)
	this.ticker = new Ticker(this.map, this.timeline, this.sendmess)

	this.pointerIsLocked = false
	this.metatime = 0
	this.deltatime = null
	this.realtime = performance.now()

	this.delayedJumpers = []

	this.scene = new THREE.Scene()
	this.scene.add(this.map)
	this.playerModels = new THREE.Object3D()	// Object3D of Object3D's (players) of PlayerModels (versions)
	this.scene.add(this.playerModels)

	// Initialize controlled player
	this.playerwave = new Timewave(-1, 1, initialState)
	this.sendmess.timewave = this.playerwave
	this.timeline.timewaves.push(this.playerwave)
	this.controlledId = 0
	this.controlledVersions = [0]
	this.ticker.controlled = [{
		version: 0,
		timewave: this.playerwave,
	}]
	this.activeplayer = null
	this.timecursor = 0

	var startTime = this.timeline.calcJumpTarget(SAVE_STATE_COUNT * SAVE_STATE_RATE / 2)
	this.timeline.ensurePlayerAt(startTime, new Player(0, -1))
	this.timeline.jump(startTime, this.playerwave)

	this.update()		// Create model and camera for first frame
}

/*
	World and client specific event here, put player handling in player.js.
*/
Game.prototype.handleInput = function(event) {
	if (this.pointerIsLocked) {
		var internalEvent = new PlayerEvent(event)
		internalEvent.metatime = this.metatime //used to determine the age of player events, for properly syncing timewaves
		internalEvent.id = this.controlledId
		internalEvent.version = this.controlledVersions[this.controlledId]
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
					internalEvent.jumptarget = this.timeline.calcJumpTarget(this.timecursor, TIMEJUMP_DELAY)
				}
				break
		}
		this.timeline.addEvent(this.playerwave.time, internalEvent)
	}
}

Game.prototype.onNewJumpSuccessful = function(id) {
	this.controlledVersions[id]++
}

Game.prototype.update = function() {
	var temptime = performance.now()
	var deltatime = temptime - this.realtime
	this.realtime = temptime

	this.advanceTimeline()

	this.updateGraphics()
}

Game.prototype.advanceTimeline = function() {
	for(var i = 0; i <= this.deltatime; i += 1000/TARGET_FRAMERATE) {	// Catch up
		this.metatime++
		this.timeline.tick(this.ticker)
		this.ticker.doDelayedJumps()
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
			if(this.controlledId === model.id && this.controlledVersions[model.id] === model.version) {
				this.activeplayer = model 	// Switch camera if nessesary
			}
		}, this)
		toberemoved.forEach(function(model) {
			models.remove(model)
		})
	}, this)
}

Game.prototype.updateMap = function(ctx, width, height) {
	var totaltime = this.timeline.states.length * SAVE_STATE_RATE

	// Gather players and record existance times, TODO rewrite
	var players = []
	this.timeline.states.forEach(function(state, i) {
		state.players.forEach(function(player, j) {
			var found = false
			players.forEach(function(other) {
				if(player.id === other.id && player.version === other.version) {
					found = true
				}
			})
			if(found) {
				players.forEach(function(p, k) {
					if(p.version === player.version) {
						players[k].endtime = i * SAVE_STATE_RATE
					}
				})
			} else {
				player.starttime = i * SAVE_STATE_RATE
				players.push(player)
			}
		})
	})
	
	// Paint players
	players.forEach(function(player, i) {
		ctx.fillStyle = "blue"
		ctx.fillRect(
			width * player.starttime / totaltime,
			(height-12) * i / players.length,
			width * player.endtime / totaltime,
			(height-12) / players.length
		)
	})

	// Paint waves and cursor
	var timeline = this.timeline
	function marker(time) {
		var position = (width-10) * timeline.calcJumpTarget(time, 0) / totaltime
		ctx.fillStyle = "black"
		ctx.fillRect(position, 0, 2, height-12)
		ctx.textAlign = "center"
		ctx.font = "10pt Helvetica"
		ctx.fillText(Math.round(time/60), position, height)
	}
	marker(this.timecursor)
	this.timeline.timewaves.forEach(function(timewave) {
		marker(timewave.time)
	})
}