function HandleEvent() {}

HandleEvent.prototype.connect = function(sendmess) {
  this.sendmess = sendmess
}


HandleEvent.prototype.handleJumpEvent = function(time, state, event) {
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

HandleEvent.prototype.handleFireEvent = function(time, state, player) {
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