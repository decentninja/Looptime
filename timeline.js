/*
	Propagation of change though the timeline
 */
function Timewave(time, speed, state) {
	this.time = time
	this.ticksDoneThisTick = 0
	this.speed = speed
	this.state = deepCopy(state)
}

Timewave.prototype.tick = function(events, ticker) {
	ticker(this.state, events)
	this.ticksDoneThisTick++
	this.time++
}

// Increment without updateing. Useful when other timewaves are on top
Timewave.prototype.noopTick = function(state) {
	this.state = deepCopy(state)
	this.ticksDoneThisTick++
	this.time++
}

Timewave.prototype.jump = function(time, timeline) {
	var index = Math.floor(time / timeline.stateFrequency)
	this.state = deepCopy(timeline.states[index])
	this.time = index*timeline.stateFrequency
	return this.time
}

/*
	Bookkeeping events, states and waves
 */
function Timeline(stateFrequency, ticker) {
	this.timewaves = []
	this.events = []    // IMPROV Prealocate for performance?
	this.states = []
	this.stateFrequency = stateFrequency
	this.ticker = ticker
}

/*
	Move all timewaves according to their speed. Handle wave collision with noopTick's.
 */
Timeline.prototype.tick = function() {
	this.sortWaves()
	this.timewaves.forEach(function(wave) {
		wave.ticksDoneThisTick = 0
	})
	this.timewaves.forEach(function(tickerwave, ti) {
		while (tickerwave.ticksDoneThisTick < tickerwave.speed) {
			tickerwave.tick(this.events[tickerwave.time], this.ticker)
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

Timeline.prototype.jump = function(time, timewave) {
	return timewave.jump(time, this)
}

Timeline.prototype.addEvent = function(time, event) {
	if(!this.events[time]) {
		this.events[time] = []
	}
	this.events[time].push(event)
}

/*
	This has the potential to cause temporary desyncs when
	a playerwave is overrun by a faster timewave when we're
	playing on a network. The magnitude of the desync should
	be relative to the latency between the players.
*/
Timeline.prototype.addAndReplayEvent = function(time, event, timewave) {
	this.addEvent(time, event)
	var tempwave = new Timewave(-1, -1, null)
	tempwave.jump(time, this)
	this.sortWaves()
	var i = 0
	while (this.timewaves[i] && this.timewaves[i].time <= time)
		i++
	while (tempwave.time < timewave.time) {
		tempwave.tick(this.events[tempwave.time], this.ticker)
		while (this.timewaves[i] && this.timewaves[i].time == time) {
			this.timewaves[i].state = deepCopy(tempwave.state)
			i++
		}
	}
}