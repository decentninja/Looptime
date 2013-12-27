/*
	Propagation of change though the timeline
 */
function Timewave(time, speed, state) {
	this.time = time
	this.ticksDoneThisTick = 0
	this.speed = speed
	this.state = deepCopy(state)
}

Timewave.prototype.tick = function(events, ticker, metatimeFilter) {
	ticker.tick(this.time, this.state, events, metatimeFilter)
	this.ticksDoneThisTick++
	this.time++
}

// Increment without updateing. Useful when other timewaves are on top
Timewave.prototype.noopTick = function(state) {
	this.state = deepCopy(state)
	this.ticksDoneThisTick++
	this.time++
}

/*
	Bookkeeping events, states and waves
 */
function Timeline(stateFrequency, sendmess) {
	this.timewaves = []
	this.events = []    // IMPROV Prealocate for performance?
	this.states = []
	this.stateFrequency = stateFrequency
	this.sendmess = sendmess
}

/*
	Move all timewaves according to their speed. Handle wave collision with noopTick's.
 */
Timeline.prototype.tick = function(ticker) {
	this.sortWaves()
	this.timewaves.forEach(function(wave) {
		wave.ticksDoneThisTick = 0
	})
	this.timewaves.forEach(function(tickerwave, ti) {
		while (tickerwave.ticksDoneThisTick < tickerwave.speed) {
			tickerwave.tick(this.events[tickerwave.time], ticker)
			for (var i = ti + 1; i < this.timewaves.length; i++) {
				if (this.timewaves[i].time === tickerwave.time - 1 && this.timewaves[i].ticksDoneThisTick < this.timewaves[i].speed) {
					this.timewaves[i].noopTick(tickerwave.state)
				}
			}
			this.saveState(tickerwave.time, tickerwave.state)
		}
	}, this)
}

Timeline.prototype.sortWaves = function() {
	this.timewaves.sort(function(a, b) {
		return a.time - b.time
	})
}

Timeline.prototype.saveState = function(time, state) {
	if (time % this.stateFrequency !== 0) {
		return
	}

	this.states[time / this.stateFrequency] = deepCopy(state)
}

Timeline.prototype.ensurePlayerAt = function(time, player) {
	var state = this.states[time/this.stateFrequency]
	for (var i = 0; i < state.players.length; i++) {
		if (state.players[i].id === player.id && state.players[i].version === player.version+1)
			return
	}
	console.log("jump "+player.id+":("+player.version+"->"+(player.version+1)+") changed to success")
	state.players.push(deepCopy(player))
	state.players[state.players.length-1].version++
	this.timewaves.forEach(function(wave) {
		if (wave.time === time)
			wave.state = deepCopy(state)
	})
}

Timeline.prototype.removePlayerAt = function(time, player) {
	var state = this.states[time/this.stateFrequency]
	for (var i = 0; i < state.players.length; i++) {
		if (state.players[i].id === player.id && state.players[i].version === player.version+1) {
			console.log("jump "+player.id+":("+player.version+"->"+(player.version+1)+") changed to failure")
			state.players.splice(i, 1)
			this.timewaves.forEach(function(wave) {
				if (wave.time === time)
					wave.state.players.splice(i, 1)
			})
			return
		}
	}
}

Timeline.prototype.calcJumpTarget = function(time) {
	return Math.floor(time/this.stateFrequency)*this.stateFrequency
}

Timeline.prototype.jump = function(time, timewave) {
	index = Math.floor(time/this.stateFrequency)
	timewave.state = deepCopy(this.states[index])
	timewave.time = index*this.stateFrequency
	return timewave.time
}

Timeline.prototype.addEvent = function(time, event) {
	if(!this.events[time]) {
		this.events[time] = []
	}
	this.events[time].push(event)
}

//TODO: enable this function to mass-insert events
/*
	This function assumes that all input-generating waves are
	at either the same point in time or with a distance of at
	least latency, as well as travelling at the same speed.
*/
Timeline.prototype.addAndReplayEvent = function(time, event, timewave, ticker) {
	this.addEvent(time, event)
	var tempwave = new Timewave(-1, -1, null)
	this.jump(time, tempwave)
	this.sortWaves()
	var i = 0
	while (this.timewaves[i] && this.timewaves[i].time <= time)
		i++
	//i points to the first timewave that may be affected

	var j = i
	while (this.timewaves[j] && this.timewaves[j].time <= timewave.time)
		j++
	//j points to the first timewave after the supplied timewave

	var branchpoints = []
	var s = timewave
	while (this.timewaves[j]) {
		var f = this.timewaves[j]
		var branchpoint = Math.floor(p.time + p.speed*(f.time - p.time)/(p.speed - f.speed))
		if (branchpoint >= time) {
			if (!branchpoints[branchpoint])
				branchpoints[branchpoint] = []
			branchpoints[branchpoint].push(f)
		}
		j++
	}

	while (tempwave.time < timewave.time) {
		tempwave.tick(this.events[tempwave.time], ticker)

		//update the state of all passed waves
		while (this.timewaves[i] && this.timewaves[i].time == time) {
			this.timewaves[i].state = deepCopy(tempwave.state)
			i++
		}

		//update the state of all waves that overtook timewave at this time
		if (branchpoints[tempwave.time]) {
			branchpoints[tempwave.time].forEach(function(f) {
				var twave = deepCopy(tempwave)
				var metatimeFilter = event.metatime + tempwave.time - time
				while (twave.time < f.time)
					twave.tick(this.events[twave.time], ticker, metatimeFilter)
				f.state = twave.state
			}, this)
		}
	}
}