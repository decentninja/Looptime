function Ticker(map, timeline, sendmess) {
  this.map = map
  this.timeline = timeline
  this.sendmess = sendmess
  this.delayedJumpers = []
  this.controlled = [] //should be set externally
}

Ticker.prototype.doDelayedJumps = function() {
  if (this.delayedJumpers.length > 0) {
    this.delayedJumpers.forEach(function(info) {
      this.timeline.jump(info[0], info[1])
    }, this)
    this.delayedJumpers.length = 0
  }
}

Ticker.prototype.tick = function(time, state, events, arrivals, latestAcceptableTime) {
  if (arrivals) {
    state.players.push.apply(state.players, deepCopy(arrivals))
  }
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
}

Ticker.prototype.handleEvent = function(time, state, event) {
  var found = false
  for (var index = 0; index < state.players.length; index++) {
    var player = state.players[index]

    if (event.id !== player.id || event.version !== player.version)
      continue
    found = index

    switch(event.type) {
      case "jump":
        this.handleJumpEvent(time, event)
        break

      case "fire":
        this.handleFireEvent(time, state, player)
        break

      default:
        player.evaluate(time, event, this.sendmess)
    }
    break //each event only deals with one player, so break here
  }
  if(event.type === "jump") {
    if (found !== false) {
      this.timeline.ensurePlayerAt(event.jumptarget, state.players[found])
      state.players.splice(found, 1)
    } else {
      this.timeline.removePlayerAt(event.jumptarget, {id: event.id, version: event.version})
    }
  }
}

Ticker.prototype.handleJumpEvent = function(time, event) {
  if (this.controlled[event.id].version === event.version) {
    this.controlled[event.id].version++
    this.delayedJumpers.push([event.jumptarget, this.controlled[event.id].timewave])
    this.sendmess.send(-1, "onNewJumpSuccessful", event.id)
  }
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
    console.log("hit", hit[0].object.parent)
    this.sendmess.send(time, "onHit", {
      player: player,
      target: hit[0].object.parent,
    })
  }
  this.sendmess.send(time, "onMiss", player)
}
