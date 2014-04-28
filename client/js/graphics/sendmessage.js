"strict mode";

/* global TIMEJUMP_DELAY */

var MAX_TIME_GAP = TIMEJUMP_DELAY
//heavily inspired by SendMessage in Unity, might be useful to tie graphics to things

/*
  Give the timeline an instance of SendMessage, register the graphics
  components to it, then have the timewave/ticker/w/e generate messages as applicable.
  By sending the time when the event happens messages can be filtered so that only those
  that happen where the player timewave is are sent.

  For example
  when a shot is fired the timewave should call
  sendmessinstance.send("onShotFired", {x: <x>, y: <y>, dist: <dist calculation>})
  or something similar
*/

function SendMessage() {
  this.receivers = []
}

SendMessage.prototype.connect = function(timewave) {
  this.timewave = timewave
}

SendMessage.prototype.register = function(receiver) {
  this.receivers.push(receiver)
}

/*
  time - the time from which the message is sent
         if it is negative the message is always sent
  name - the name of the function to be called
  arg  - the argument to supply to the receiver
*/
SendMessage.prototype.send = function(time, name, arg) {
  if ((time < this.timewave.time - MAX_TIME_GAP || time > this.timewave.time) && time >= 0)
    return
  var received = false
  this.receivers.forEach(function(receiver) {
    if (typeof receiver[name] !== "function")
      return
    received = true
    receiver[name].call(receiver, arg, this.timewave.time - time)
  }, this)
  if (!received)
    console.warn("No receiver for message", name, arg)
}
