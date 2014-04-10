"strict mode";

/* global TARGET_FRAMERATE */

var TIMEJUMP_DELAY = 120 //roughly 2 seconds

function Ticker() {
  this.controlled = [] //should be set externally
  this.wrapJumpers = []
}

Ticker.prototype.connect = function(collisionMap, timeline, sendmess) {
  this.collisionMap = collisionMap
  this.timeline = timeline
  this.sendmess = sendmess
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
    this.handleJumpEvent(time, state, event)
    return
  }
  for (var index = 0; index < state.players.length; index++) {
    var player = state.players[index]

    if (event.id !== player.id || event.version !== player.version)
      continue

    switch(event.type) {
      case "fire":
        this.handleFireEvent(time, state, player)
        break

      default:
        player.evaluate(time, event, this.sendmess)
    }
    return //each event only deals with one player, so return here
  }
}

Ticker.prototype.handleJumpEvent = function(time, state, event) {
  state.jumptimers.push({
    id: event.id,
    version: event.version,
    jumptarget: event.jumptarget,
    timeLeft: TIMEJUMP_DELAY,
  })
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].id !== event.id || state.players[i].version !== event.version)
      continue
    state.players[i].stop()
    this.sendmess.send(time, "onJumpInitiated", {
      id: event.id,
      version: event.version,
      jumptarget: event.jumptarget,
    })
    return
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

Ticker.prototype.handleFireEvent = function(time, state, player) {
  //TODO: actual math.
  /*
    assuming
    c = sphere center point (vector)
    r = radius of sphere
    o = starting point of line (vector)
    l = normalized direction of line (vector)

    then

    temp = (l * (o - c))^2 - (o - c)^2 + r^2
    temp < 0 => no intersection
    dist = -(l * (o - c)) - sqrt(temp)

    where dist is the distance to the closest intersection
    (assuming collision in front of character and point of origin
    not inside sphere)

    see wikipedia for more info
  */
  /*
    could also make characters boxes, find the faces of the box that
    face the origin and check for collision, but it's slightly more complex
  */
  /*
    Will use this until we see performance problems
   */
  var pModel = new PlayerModel(player.id, player.version)
  pModel.update(player)
  pModel.updateMatrixWorld()
  var originPoint = new THREE.Vector3()
  originPoint.setFromMatrixPosition(pModel.getObjectByName("shotorigin", true).matrixWorld)

  var ray = new THREE.Raycaster()
  ray.set(originPoint, player.getLookDirection())

  var targets = []
  state.players.forEach(function(other) {
    if(player.id === other.id && player.version === other.version)
      return
    // Everyone except the shooter
    var model = new PlayerModel(other.id, other.version)
    model.update(other)
    model.updateMatrixWorld()
    targets.push(model.body)
  })

  var hit = ray.intersectObjects(targets)
  if(hit.length !== 0) { //todo: check colliion with obstacles
    var targetModel = hit[0].object.parent
    console.log("hit", targetModel)
    var target
    var i
    for (i = 0; i < state.players.length; i++) {
      target = state.players[i]
      if (target.id === targetModel.id && target.version === targetModel.version)
        break
    }
    this.sendmess.send(time, "onHit", {
      player: player,
      target: target,
      originPoint: originPoint,
      hitPoint: hit[0].point,
    })
    state.players.splice(i, 1)
  } else {
    this.sendmess.send(time, "onMiss", {
      player: player,
      originPoint: originPoint,
      direction: player.getLookDirection(),
    })
  }
}

Ticker.prototype.wrapItUp = function(time, state) {
  this.wrapJumpers.forEach(function(jumper) {
    for (var i = 0; i < state.players.length; i++) {
      if (state.players[i].id === jumper.id && state.players[i].version === jumper.version)
        break
    }
    if (i === state.players.length)
      this.timeline.removePlayerAt(0, jumper)
  }, this)

  state.players.forEach(function(player) {
    for (var i = 0; i < this.wrapJumpers.length; i++) {
      if (player.id === this.wrapJumpers[i].id && player.version === this.wrapJumpers[i].version)
        break
    }
    if (player.version === this.controlled[player.id].version && this.controlled[player.id].timewave.time !== time) {
      return
    }
    if (i === this.wrapJumpers.length) {
      this.wrapJumpers.push({id: player.id, version: player.version})
    }
    this.timeline.ensurePlayerAt(0, player)
  }, this)

  this.controlled.forEach(function(contr) {
    if (contr.timewave.time === time) {
      contr.version++
      this.timeline.prepareJump(0, contr.timewave)
      this.sendmess.send(-1, "onNewJump", contr.id)
    }
  }, this)
}
