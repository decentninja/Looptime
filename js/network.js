var MAX_QUEUE_LENGTH = 20 //TODO: figure out if this is a good limit
var LATENCY_MEMORY = (1 << 3) - 1

function Network(websocket, startFunction) {
  if (!websocket)
    return

  this.startFunction = startFunction
  this.queue = []
  latencyMemory = []
  var latencyIndex
  var lastTime

  socket.onmessage = function(mess) {
    switch (mess.data) {
      case "pong":
        latencyMemory[latencyIndex & LATENCY_MEMORY] = performance.now() - lastTime
        if (latencyIndex > LATENCY_MEMORY) {
          socket.send("ready")
        } else {
          lastTime = performance.now()
          socket.send("ping")
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

  //TODO: send all events in queue
}

Network.prototype.onReceivedRemoteEvents = function(events) {
  events.forEach(function(event) {
    this.timeline.addAndReplayEvent(event, this.timewaves[event.id])
  }, this)
}