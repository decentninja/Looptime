"strict mode";

/* global SAVE_STATE_RATE, TIMEJUMP_DELAY */

function Input(playerid) {
  this.pointerIsLocked = false
  this.inputIsAllowed = true
  this.controlledId = playerid
  this.controlledVersion = 0
  this.timecursor = 0
  this.metatime = 0
}

Input.prototype.connect = function(timeline, playerwave, sendmess) {
  this.timeline = timeline
  this.playerwave = playerwave
  this.sendmess = sendmess
}

Input.prototype.onNewJump = function(id) {
  if (this.controlledId === id) {
    this.controlledVersion++
    this.inputIsAllowed = true
  }
}

Input.prototype.onPointerLockChange = function(pointerIsLocked) {
  this.pointerIsLocked = pointerIsLocked
}

Input.prototype.tick = function() {
  this.metatime++
}

Input.prototype.onWindowInput = function(event) {
  if (!this.pointerIsLocked || !this.inputIsAllowed)
    return

  var internalEvent = new PlayerEvent(event)
  internalEvent.metatime = this.metatime //used to determine the age of player events, for properly syncing timewaves
  internalEvent.id = this.controlledId
  internalEvent.version = this.controlledVersion
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
      this.sendmess.send(-1, "onTimecursorUpdate", this.timecursor)
      return    // Don't register in timeline

    case "mousedown":
      if(event.button == 2) {
        internalEvent.type = "jump"
        internalEvent.jumptarget = this.timeline.calcJumpTarget(this.timecursor, TIMEJUMP_DELAY)
        this.inputIsAllowed = false
      }
      break
  }
  internalEvent.time = this.playerwave.time
  this.timeline.addEvent(internalEvent)
  this.sendmess.send(-1, "onAddedLocalEvent", internalEvent)
}
