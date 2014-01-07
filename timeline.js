var TIMEWAVE_SNAP = 240 //roughly 4 seconds

/*
	Propagation of change though the timeline
 */
function Timewave(speed, snap, wraparound) {
	this.time = -1
	this.ticksDoneThisTick = 0
	this.speed = speed
	this.state = null
	this.snap = snap
	this.wraparound = wraparound
}

Timewave.prototype.tick = function(events, arrivals, ticker, metatimeFilter) {
	if (arrivals)
		this.state.players.push.apply(this.state.players, deepCopy(arrivals))
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
function Timeline(stateCount, stateFrequency, initialState) {
	this.timewaves = []
	this.events = []    // IMPROV Prealocate for performance?
	this.arrivals = []
	this.states = new Array(stateCount)
	for (var i = 0; i < this.states.length; i++)
		this.states[i] = initialState
	this.stateCount = stateCount
	this.stateFrequency = stateFrequency
}

Timeline.prototype.connect = function(sendmess) {
	this.sendmess = sendmess
}

Timeline.prototype.createTimewave = function(time, speed, snap, wraparound) {
	var wave = new Timewave(speed, snap, wraparound)
	this.timewaves.push(wave)
	this.jump(time, wave)
	return wave
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
			tickerwave.tick(this.events[tickerwave.time], this.arrivals[tickerwave.time+1], ticker)
			for (var i = ti + 1; i < this.timewaves.length && this.timewaves[i].time === tickerwave.time - 1; i++) {
				if (this.timewaves[i].ticksDoneThisTick < this.timewaves[i].speed) {
					this.timewaves[i].noopTick(tickerwave.state)
				}
			}
			this.saveState(tickerwave.time, tickerwave.state)
		}
	}, this)
	this.timewaves.forEach(function(wave) {
		if (wave.wraparound && wave.time > this.stateFrequency * this.stateCount)
			this.jump(0, wave)
	}, this)
}

Timeline.prototype.sortWaves = function() {
	this.timewaves.sort(function(a, b) {
		return a.time - b.time
	})
}

Timeline.prototype.saveState = function(time, state) {
	var index = time / this.stateFrequency
	if (index > this.stateCount || index !== index|0) {
		return
	}

	this.states[index] = deepCopy(state)
}

Timeline.prototype.ensurePlayerAt = function(time, player) {
	var player = deepCopy(player)
	player.version++
	if (!this.arrivals[time])
		this.arrivals[time] = []
	for (var i = 0; i < this.arrivals[time].length; i++) {
		p = this.arrivals[time][i]
		if (p.id !== player.id || p.version !== player.version)
			continue
		this.arrivals[time][i] = player
		return
	}
	console.log("jump "+player.id+":("+(player.version-1)+"->"+player.version+") changed to success")
	this.arrivals[time].push(player)
}

Timeline.prototype.removePlayerAt = function(time, player) {
	if (!this.arrivals[time])
		return
	for (var i = 0; i < this.arrivals[time].length; i++) {
		var p = this.arrivals[time][i]
		if (p.id === player.id && p.version === player.version+1) {
			this.arrivals[time].splice(i, 1)
			console.log("jump "+player.id+":("+player.version+"->"+(player.version+1)+") changed to failure")
			return
		}
	}
}

Timeline.prototype.calcJumpTarget = function(time, metatimeOffset) {
	for (var i = 0; i < this.timewaves.length; i++) {
		var wave = this.timewaves[i]
		if (wave.snap && Math.abs(wave.time - time) < TIMEWAVE_SNAP) {
			return wave.time + metatimeOffset*wave.speed
		}
	}
	return Math.floor(time/this.stateFrequency)*this.stateFrequency
}

Timeline.prototype.jump = function(time, timewave) {
	index = Math.floor(time/this.stateFrequency)
	timewave.state = deepCopy(this.states[index])
  if (this.arrivals[time]) {
    timewave.state.players.push.apply(timewave.state.players, deepCopy(this.arrivals[time]))
  }
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
		tempwave.tick(this.events[tempwave.time], this.arrivals[tempwave.time+1], ticker)

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
					twave.tick(this.events[twave.time], this.arrivals[tempwave.time+1], ticker, metatimeFilter)
				f.state = twave.state
			}, this)
		}
	}
}