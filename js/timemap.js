function Timemap() {
  this.timecursor = 0
}

Timemap.prototype.connect = function(timeline) {
  this.timeline = timeline
}

Timemap.prototype.onTimecursorUpdate = function(time) {
  this.timecursor = time
}

Timemap.prototype.update = function(ctx, width, height) {
  var totaltime = this.timeline.states.length * SAVE_STATE_RATE

  // Gather players and record existance times, TODO rewrite
  var players = []
  this.timeline.states.forEach(function(state, i) {
    state.players.forEach(function(player, j) {
      var found = false
      players.forEach(function(other) {
        if(player.id === other.id && player.version === other.version) {
          found = true
        }
      })
      if(found) {
        players.forEach(function(p, k) {
          if(p.version === player.version) {
            players[k].endtime = i * SAVE_STATE_RATE
          }
        })
      } else {
        player.starttime = i * SAVE_STATE_RATE
        players.push(player)
      }
    })
  })
  
  // Paint players
  players.forEach(function(player, i) {
    ctx.fillStyle = "blue"
    ctx.fillRect(
      width * player.starttime / totaltime,
      (height-12) * i / players.length,
      width * player.endtime / totaltime,
      (height-12) / players.length
    )
  })

  // Paint waves and cursor
  var timeline = this.timeline
  function marker(time, snap) {
    var position
    if (snap)
      position = (width-10) * timeline.calcJumpTarget(time, 0) / totaltime
    else
      position = (width-10) * time / totaltime
    ctx.fillStyle = "black"
    ctx.fillRect(position, 0, 2, height-12)
    ctx.textAlign = "center"
    ctx.font = "10pt Helvetica"
    ctx.fillText(Math.round(time/60), position, height)
  }
  marker(this.timecursor, true)
  this.timeline.timewaves.forEach(function(timewave) {
    marker(timewave.time, false)
  })
}