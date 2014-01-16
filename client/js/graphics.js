function Graphics(playerid) {
  this.controlledId = playerid
  this.controlledVersion = 0

  this.scene = new THREE.Scene()
  this.playerModels = new THREE.Object3D()  // Object3D of Object3D's (players) of PlayerModels (versions)
  this.scene.add(this.playerModels)
}

Graphics.prototype.connect = function(map, playerwave) {
  this.scene.add(map)
  this.playerwave = playerwave
}

Graphics.prototype.onNewJumpSuccessful = function(id) {
  if (this.controlledId === id)
    this.controlledVersion++
}

Graphics.prototype.update = function() {
  //Reset alive book-keeping
  this.playerModels.children.forEach(function(players) {
    players.children.forEach(function(model) {
      model.alive = false
    }, this)
  }, this)

  // Add new players, timeclones and update old players
  this.playerwave.state.players.forEach(function(player) {
    var versions = this.playerModels.children.filter(function(differentversions) {
      return differentversions.id === player.id
    }, this)[0]
    if(!versions) {
      versions = new THREE.Object3D()
      versions.id = player.id
      this.playerModels.add(versions)
    }
    var version = versions.children.filter(function(version) {
      return version.version === player.version
    }, this)[0]
    if(!version) {
      var version = new PlayerModel(player.id, player.version)
      versions.add(version)
    }
    version.update(player)
    version.alive = true    // Model is new or existed before and in state
  }, this)

  // Remove models that were not alive and move the camera
  this.playerModels.children.forEach(function(models) {
    var toberemoved = []
    models.children.forEach(function(model) {
      if(!model.alive) {
        toberemoved.push(model)
      }
      if(this.controlledId === model.id && this.controlledVersion === model.version) {
        this.activeplayer = model   // Switch camera if nessesary
      }
    }, this)
    toberemoved.forEach(function(model) {
      models.remove(model)
    })
  }, this)
}
