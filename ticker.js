var TIMEJUMP_DELAY = 120 //roughly 2 seconds

var foundDuplicates = false

function Ticker() {
  this.delayedJumpers = []
  this.controlled = [] //should be set externally
}

Ticker.prototype.connect = function(map, timeline, sendmess) {
  this.map = map
  this.timeline = timeline
  this.sendmess = sendmess
}

Ticker.prototype.doDelayedJumps = function() {
  if (this.delayedJumpers.length > 0) {
    this.delayedJumpers.forEach(function(info) {
      this.timeline.jump(info[0], info[1])
    }, this)
    this.delayedJumpers.length = 0
  }
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
    player.update(1000/TARGET_FRAMERATE, this.map)
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
}

Ticker.prototype.handleEvent = function(time, state, event) {
  for (var index = 0; index < state.players.length; index++) {
    var player = state.players[index]

    if (event.id !== player.id || event.version !== player.version)
      continue

    switch(event.type) {
      case "jump":
        this.handleJumpEvent(time, state, event)
        break

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
  this.sendmess.send(time, "onJumpInitiated", {
    id: event.id,
    version: event.version,
    jumptarget: event.jumptarget,
  })
}

Ticker.prototype.handleJump = function(time, state, timer) {
  for (var i = 0; i < state.players.length; i++) {
    var player = state.players[i]
    if (player.id !== timer.id || player.version !== timer.version)
      continue

    if (this.controlled[timer.id].version === timer.version) {
      this.controlled[timer.id].version++
      this.delayedJumpers.push([timer.jumptarget, this.controlled[timer.id].timewave])
      this.sendmess.send(-1, "onNewJumpSuccessful", timer.id)
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
    Will use this until we see preformance problems
   */
  var gun = new THREE.Vector3(0, 8.8, 0)
  gun.add(player.position)
//  var debugline = new THREE.Geometry()
//  debugline.vertices.push(gun)
//  debugline.vertices.push(player.getLookDirection().multiplyScalar(1000).add(gun))
//  this.scene.add(new THREE.Line(debugline, new THREE.LineBasicMaterial({
//    color: 0x0000ff,
//    linewidth: 5,
//    transparent: true,
//    opacity: 0.5       // Will be filled by clone
//  })))

  var ray = new THREE.Raycaster()
  ray.set(gun, player.getLookDirection())

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

  var hit = ray.intersectObjects(targets, false)
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
    })
    state.players.splice(i, 1)
  } else {
    this.sendmess.send(time, "onMiss", player)
  }
}
