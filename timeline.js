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

/*
	Bookkeeping events, states and waves
 */
function Timeline(stateFrequency) {
	this.timewaves = []
	this.events = []    // IMPROV Prealocate for performance?
	this.states = []
	this.stateFrequency = stateFrequency
}

/*
	Move all timewaves according to their speed. Handle wave collision with noopTick's.
 */
Timeline.prototype.tick = function(ticker) {
	this.timewaves.sort(function(a, b) {
		a.time - b.time
	})
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

Timeline.prototype.saveState = function(time, state) {
	if (time % this.stateFrequency !== 0) {
		return
	}

	this.states[time / this.stateFrequency] = deepCopy(state)
}

Timeline.prototype.addEvent = function(time, event) {
	if(!this.events[time]) {
		this.events[time] = []
	}
	this.events[time].push(event)
}