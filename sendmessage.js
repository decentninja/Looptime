//heavily inspired by SendMessage in Unity, might be useful to tie graphics to things

/*
  Give the timeline an instance of SendMessage, register the graphics
  components to it, then have the timewave/ticker/w/e generate messages as applicable.
  By sending the time when the event happens messages can be filtered so that only those
  that happen where the player timewave is are sent.

  For example
  when a shot is fired the timewave should call
  sendmessinstance.send("fired shot", function() {
    return {x: <x>, y: <y>, dist: <dist calculation>}
  }, this)
*/

function SendMessage(timewave) {
  this.receivers = []
  this.timewave = timewave
}

SendMessage.prototype.register = function(receiver) {
  this.receivers.push(receiver)
}

/*
  time - the time from which the message is sent
         if it is negative the message is always sent
  name - the name of the function to be called
  argFunc - a function that will be evaluated to provide arguments
         to the receiver if required. Will only evaluate once.
  argThis - the object to be considered this while evaluating argFunc
*/
SendMessage.prototype.send = function(time, name, argFunc, argThis) {
  if (time !== this.timewave.time && time >= 0)
    return
  var arg
  this.receivers.forEach(function(receiver) {
    if (typeof receiver[name] !== "function")
      return
    if (!arg)
      arg = argFunc.call(argThis)
    receiver.call(receiver, arg)
  })
}
