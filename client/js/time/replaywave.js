function Replaywave(timeline, timewave) {
	this.timeline = timeline
	this.tempwave = new Timewave(-1, false, false)
	this.timewave = timewave
}

Replaywave.prototype.replay = function(events) {
	console.log("Replaying!")
	var event = events[0]
	var startTime = event.time
	var startMetatime = event.metatime
	var endTime = this.timewave.time
	this.timeline.jump(startTime, this.tempwave)

	events.forEach(this.timeline.addEvent, this.timeline)

	if (this.hasJumped(this.timewave)) {
		endTime = this.timewave.lastjump.origin

		this.work(startTime, startMetatime, endTime, events)

		startTime = this.timewave.lastjump.target
		startMetatime = this.timewave.lastjump.metatime
		endTime = this.timewave.time
		this.timeline.jump(startTime, this.tempwave)
	}

	this.work(startTime, startMetatime, endTime, events)
	this.timeline.jumps.length = 0
}

Replaywave.prototype.hasJumped = function(w) {
	return event.metatime <= w.lastjump.metatime && w.lastjump.metatime <= timeline.metatime
}

Replaywave.prototype.work = function(startTime, startMetatime, endTime, events) {
	var i = 0
	while (this.timeline.timewaves[i] && this.timeline.timewaves[i].time <= startTime)
		i++
	//i points to the first timewave that may be affected

	var j = i
	while (this.timeline.timewaves[j] && this.timeline.timewaves[j].time <= endTime)
		j++
	//j points to the first timewave after the supplied timewave

	var branchpoints = []
	var s = {time: endTime, speed: this.timewave.speed}
	while (this.timeline.timewaves[j]) {
		var f = this.timeline.timewaves[j]
		var branchpoint = Math.floor(s.time + s.speed*(f.time - s.time)/(s.speed - f.speed))
		if (branchpoint >= startTime && (!this.hasJumped(f) || branchpoint >= f.lastjump.target)) {
			if (!branchpoints[branchpoint])
				branchpoints[branchpoint] = []
			branchpoints[branchpoint].push(f)
		}
		j++
	}

	while (this.tempwave.time < endTime) {
		this.tempwave.tick(events[this.tempwave.time], this.arrivals[this.tempwave.time+1], this.ticker)
		this.saveState(this.tempwave.time, this.tempwave.state)

		//update the state of all passed waves
		while (this.timeline.timewaves[i] && this.timeline.timewaves[i].time === this.tempwave.time) {
			console.log("addAndReplayEvent affected a timewave")
			this.timeline.timewaves[i].state = deepCopy(this.tempwave.state)
			i++
		}

		//update the state of all waves that overtook timewave at this time
		if (branchpoints[this.tempwave.time]) {
			var metatimeFilter = startMetatime + (this.tempwave.time - startTime) / this.timewave.speed
			branchpoints[this.tempwave.time].forEach(function(f) {
				var twave = deepCopy(tempwave)
				while (twave.time < f.time)
					twave.tick(events[twave.time], this.arrivals[twave.time+1], this.ticker, metatimeFilter)
				f.state = twave.state
			}, this)
		}
	}
}