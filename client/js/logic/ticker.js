"strict mode";

/* global TARGET_FRAMERATE */

var TIMEJUMP_DELAY = 120 //roughly 2 seconds

function Ticker() {
  this.controlled = [] //should be set externally
  this.wrapJumpers = []
  this.handler = new HandleEvent()
}

Ticker.prototype.connect = function(collisionMap, timeline, sendmess) {
  this.collisionMap = collisionMap
  this.timeline = timeline
  this.sendmess = sendmess
  this.handler.connect(sendmess)
}

Ticker.prototype.tick = function(time, state, events, latestAcceptableTime) {
  if (events) {    // Is someone doing something?
    events.forEach(function(event) {
      if (typeof latestAcceptableTime === "number" && event.metatime > latestAcceptableTime)
        return

      this.handleEvent(time, state, event)
    }, this)
  }
  state.players.forEach(function(player) {
    player.update(1000/TARGET_FRAMERATE, this.collisionMap)
  }, this)
  state.jumptimers.forEach(function(timer) {
    timer.timeLeft--
    if (timer.timeLeft > 0)
      return

    this.handleJump(time, state, timer)
  }, this)
  state.jumptimers = state.jumptimers.filter(function(timer) {
    return timer.timeLeft > 0
  })

  if (time === this.timeline.length() - 1) {
    this.wrapItUp(time, state)
  }
}

Ticker.prototype.handleEvent = function(time, state, event) {
  if (event.type === "jump") {
    this.handler.handleJumpEvent(time, state, event)
    return
  }
  for (var index = 0; index < state.players.length; index++) {
    var player = state.players[index]

    if (event.id !== player.id || event.version !== player.version)
      continue

    switch(event.type) {
      case "fire":
        this.handler.handleFireEvent(time, state, player)
        break

      default:
        player.evaluate(time, event, this.sendmess)
    }
    return //each event only deals with one player, so return here
  }
}

Ticker.prototype.handleJump = function(time, state, timer) {
  for (var i = 0; i < state.players.length; i++) {
    var player = state.players[i]
    if (player.id !== timer.id || player.version !== timer.version)
      continue

    if (this.controlled[timer.id].version === timer.version) {
      this.controlled[timer.id].version++
      this.timeline.prepareJump(timer.jumptarget, this.controlled[timer.id].timewave)
      this.sendmess.send(-1, "onNewJump", timer.id)
    }
    this.timeline.ensurePlayerAt(timer.jumptarget, player)
    state.players.splice(i, 1)
    this.sendmess.send(time, "onJumpSuccessful", {
      id: timer.id,
      version: timer.version,
      jumptarget: timer.jumptarget,
    })
    return
  }

  this.timeline.removePlayerAt(timer.jumptarget, timer)
  this.sendmess.send(time, "onJumpFailure", {
    id: timer.id,
    version: timer.version,
    jumptarget: timer.jumptarget,
  })
}

Ticker.prototype.wrapItUp = function(time, state) {
  this.controlled.forEach(function(contr) {
    if (contr.timewave.time === time) {
      this.wrapJumpers.push({id: contr.id, version: contr.version})
      contr.version++
      this.timeline.prepareJump(0, contr.timewave)
      this.sendmess.send(-1, "onNewJump", contr.id)
    }
  }, this)

  this.wrapJumpers.forEach(function(jumper) {
    for (var i = 0; i < state.players.length; i++) {
      if (state.players[i].id === jumper.id && state.players[i].version === jumper.version)
        return
    }
    this.timeline.removePlayerAt(0, jumper)
  }, this)

  state.players.forEach(function(player) {
    for (var i = 0; i < this.wrapJumpers.length; i++) {
      if (player.id === this.wrapJumpers[i].id && player.version === this.wrapJumpers[i].version) {
        this.timeline.ensurePlayerAt(0, player)
        return
      }
    }
  }, this)

}
