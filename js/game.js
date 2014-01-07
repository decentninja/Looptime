/*
	Scene, active player, time
 */

var PLAYER_SPEED = 0.1
var SAVE_STATE_RATE = 30		// Save state twice every second
var SAVE_STATE_COUNT = 600  // A timeline of 5 min
var FASTWAVE_SPEED = 3
var FASTWAVE_SPACING = 120  // About a minute between each fastwave
var TARGET_FRAMERATE = 60

function Game(numplayers, playerid, sendmess) {
	// The initial state that will populate the entire timeline at game start
	var initialState = {
		players: [],
		jumptimers: [],
	}

	// Initialize timing things
	this.deltatime = null
	this.realtime = performance.now()

	map = new Lobby()
	this.timeline = new Timeline(SAVE_STATE_COUNT, SAVE_STATE_RATE, initialState)
	this.ticker = new Ticker()
	this.graphics = new Graphics(playerid)
	this.timemap = new Timemap()
	this.input = new Input(playerid)

	// Set up initial events and stuff on the timeline
	var startTime = this.timeline.calcJumpTarget(SAVE_STATE_COUNT * SAVE_STATE_RATE / 2)
	for (var id = 0; id < numplayers; id++)
		this.timeline.ensurePlayerAt(startTime, new Player(id, -1))
	// It is now safe to create timewaves, they will have an updated state

	// Create fast waves
	for (var time = 0; time < SAVE_STATE_COUNT * SAVE_STATE_RATE; time += FASTWAVE_SPACING * SAVE_STATE_RATE) {
		this.timeline.createTimewave(time, FASTWAVE_SPEED, false, true)
	}

	// Create the playerwave
	var playerwave = this.timeline.createTimewave(startTime, 1, true, false)

	// Set up ticker controlled array and create timewaves for other players
	for (var id = 0; id < numplayers; id++) {
		this.ticker.controlled.push({
			version: 0,
			timewave: id === playerid ? playerwave : this.timeline.createTimewave(startTime, 1, true, false)
		})
	}

	// Connect everything
	this.timeline.connect(this.ticker, sendmess)
	this.ticker.connect(map, this.timeline, sendmess)
	this.timemap.connect(this.timeline)
	this.graphics.connect(map, playerwave)
	this.input.connect(this.timeline, playerwave, sendmess)
	sendmess.connect(playerwave)

	// Register receivers with sendmess
	sendmess.register(this.graphics)
	sendmess.register(this.timemap)
	sendmess.register(this.input)
}

/*
	World and client specific event here, put player handling in player.js.
*/

Game.prototype.update = function(ctx, width, height) {
	var temptime = performance.now()
	this.deltatime += temptime - this.realtime
	this.realtime = temptime

	this.advanceTime()

	this.graphics.update()
	this.timemap.update(ctx, width, height)
}

Game.prototype.advanceTime = function() {
	while (this.deltatime >= 1000/TARGET_FRAMERATE) {	// Catch up
		this.timeline.tick()
		this.ticker.doDelayedJumps()
		this.input.tick()
		this.deltatime -= 1000/TARGET_FRAMERATE
	}
}


