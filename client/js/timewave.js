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