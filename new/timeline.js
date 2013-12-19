function Timewave(time, speed, state) {
  this.time = time
  this.ticksDoneThisTick = 0
  this.speed = speed
  this.state = deepCopy(state)
}

//events - all events that happen at the current time
Timewave.prototype.tick = function(events) {
  //TODO: do things to state
  this.ticksDoneThisTick++
  this.time++
}

Timewave.prototype.noopTick = function(state) {
  this.state = deepCopy(state)
  this.ticksDoneThisTick++
  this.time++
}

function Timeline(stateFrequency) {
  this.timewaves = []
  this.events = []
  this.states = []
  this.stateFrequency = stateFrequency
}

Timeline.prototype.tick = function() {
  this.timewaves.sort(function(a, b) {a.time - b.time})
  this.timewaves.forEach(function(wave) {wave.ticksDoneThisTick = 0})
  this.timewaves.forEach(function(tickerwave, ti) {
    while (tickerwave.ticksDoneThisTick < tickerwave.speed) {
      tickerwave.tick(this.events[tickerwave.time])
      for (var i = ti + 1; i < this.timewaves.length; i++) {
        if (this.timewaves[i].time === tickerwave.time - 1
          && this.timewaves[i].ticksDoneThisTick < this.timewaves[i].speed)
          this.timewaves[i].noopTick(tickerwave.state)
      }
      this.saveState(tickerwave.time, tickerwave.state)
    }
  }, this)
}

Timeline.prototype.saveState = function(time, state) {
  if (time % this.stateFrequency !== 0)
    return

  this.states[time / this.stateFrequency] = deepCopy(state)
}