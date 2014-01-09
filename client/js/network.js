var MAX_QUEUE_LENGTH = 20 //TODO: figure out if this is a good limit
var LATENCY_MEMORY = (1 << 3) - 1

function Network(websocket, startFunction) {
  if (!websocket)
    return

  this.startFunction = startFunction
  this.queue = []
  this.websocket = websocket
  latencyMemory = []
  var latencyIndex = 0

  websocket.onmessage = function(mess) {
    switch (mess.data) {
      case "pong":
        latencyMemory[latencyIndex & LATENCY_MEMORY] = performance.now() - this.lastTime
        latencyIndex++
        if (latencyIndex > LATENCY_MEMORY) {
          websocket.send("ready")
        } else {
          this.sendPing()
        }
        return

      case "start":
        this.startFunction(latencyMemory.reduce(function(a, b) { return a + b }) / latencyMemory.length)
        return

      default:
        this.onReceivedRemoteEvents(JSON.parse(mess.data))
    }
  }.bind(this)
}

Network.prototype.sendPing = function() {
  if (!this.queue)
    return

  this.lastTime = performance.now()
  websocket.send("ping")
}

Network.prototype.connect = function(timeline, timewaves) {
  this.timeline = timeline
  this.timewaves = timewaves
}

Network.prototype.onAddedLocalEvent = function(event) {
  if (!this.queue)
    return

  this.queue.push(event)

  if (this.queue.length < MAX_QUEUE_LENGTH && event.type === "mousemove")
    return

  this.websocket.send(JSON.stringify(this.queue))
  this.queue.length = []
}

Network.prototype.onReceivedRemoteEvents = function(events) {
  events.forEach(function(event) {
    this.timeline.addAndReplayEvent(event, this.timewaves[event.id])
  }, this)
}