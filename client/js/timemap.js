"strict mode";

/* global SAVE_STATE_RATE, SAVE_STATE_COUNT */

var VERSIONS_TO_DISPLAY = 5

function Timemap() {
  this.timecursor = 0
  this.players = []
}

Timemap.prototype.connect = function(timeline) {
  this.timeline = timeline
}

Timemap.prototype.onTimecursorUpdate = function(time) {
  this.timecursor = time
}

Timemap.prototype.readTimelines = function() {
  this.timeline.timewaves.forEach(function(wave) {
    this.readState(wave.time, wave.state)
  }, this)
}
Timemap.prototype.readState = function(time, state) {
  for (var i = 0; i < state.players.length; i++) {
    var sPlayer = state.players[i]
    if (!this.players[sPlayer.id])
      this.players[sPlayer.id] = []

    var version = null
    for (var j = 0; j < this.players[sPlayer.id].length; j++) {
      if (this.players[sPlayer.id][j].version === sPlayer.version) {
        version = this.players[sPlayer.id][j]
        break
      }
    }
    if (!version) {
      version = new Existance(sPlayer.version)
      this.players[sPlayer.id].push(version)
    }
    if (!version)
      continue

    version.existAt(time)
  }

  for (var i = 0; i < this.players.length; i++) {
    for (var j = 0; j < this.players[i].length; j++) {
      this.players[i][j].removeIfNotAffected(time)
    }
  }
}

function Existance(version) {
  this.version = version
  this.blocks = []
  this.affected = false
}

Existance.prototype.existAt = function(time) {
  this.affected = true
  this.setAt(time, true)
}

Existance.prototype.removeIfNotAffected = function(time) {
  if (!this.affected)
    this.setAt(time, false)
  this.affected = false
}

Existance.prototype.setAt = function(time, exists) {
  var block
  for (var i = 0; i < this.blocks.length; i++) {
    if (this.blocks[i].selectPriority(time, !block)) {
      if (!block) {
        block = this.blocks[i]

      } else {
        console.log("merging an existanceblock")
        block.merge(this.blocks[i])
        this.blocks.splice(i, 1)
      }
    }
  }

  if (!block) {
    if (exists) {
      this.blocks.push(new ExistanceBlock(time, time))
    }
    return
  }

  if (exists) {
    block.include(time)

  } else {
    var split = block.deleteAt(time)
    if (split)
      this.blocks.push(split)
    this.blocks = this.blocks.filter(function(block) {
      return block.length() > 0
    })
  }
}

function ExistanceBlock(start, end) {
  this.start = start
  this.end = end
}

ExistanceBlock.prototype.selectPriority = function(time, wide) {
  if (wide)
    return this.start-1 <= time && time <= this.end+1
  return this.start <= time && time <= this.end
}

ExistanceBlock.prototype.include = function(time) {
  if (time < this.start) {
    this.start = time
  } else if (this.end < time) {
    this.end = time
  }
}

ExistanceBlock.prototype.merge = function(block) {
  this.start = Math.min(this.start, block.start)
  this.end = Math.max(this.end, block.end)
}

ExistanceBlock.prototype.deleteAt = function(time) {
  switch (time) {
    case this.start:
      this.start++
      break

    case this.end:
      this.end--
      break

    default:
      if (time < this.start || this.end < time)
        return
      var ret = new ExistanceBlock(time+1, this.end)
      this.end = time-1
      return ret
  }
}

ExistanceBlock.prototype.length = function() {
  return this.end - this.start + 1
}

Timemap.prototype.render = function(ctx, width, height) {
  var totaltime = SAVE_STATE_COUNT * SAVE_STATE_RATE // Constants borrowed from game.js

  // Paint players
  this.players.forEach(function(player) {
    ctx.fillStyle = "rgba(0, 0, 200, 0.5)" //TODO: pick up player color somehow
    player.forEach(function(version, i) {
      var row = Math.max(0, i - Math.max(0, player.length - VERSIONS_TO_DISPLAY))
      version.blocks.forEach(function(block) {
        ctx.fillRect(
          width * block.start / totaltime,
          (height-12) * row / Math.min(player.length, VERSIONS_TO_DISPLAY),
          width * block.length() / totaltime,
          (height-12) / Math.min(player.length, VERSIONS_TO_DISPLAY)
        )
      })
    })
  })

  // Paint waves and cursor
  var timeline = this.timeline
  function marker(time, snap) {
    var position
    if (snap)
      position = width * timeline.calcJumpTarget(time, 0) / totaltime
    else
      position = width * time / totaltime
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
