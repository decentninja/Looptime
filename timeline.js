/*
	State and event tracking
 */

function Timeline(initialState) {
	this.timeline = new Array(100000)	// about 16 minutes of gameplay
	this.timeline = [{
		players: []
	}]
	this.i = 0
}

Timeline.prototype.next = function() {
	this.timeline[this.i].players.forEach(function(player) {
		player.events = []
	})
	this.i++
	if(!this.timeline[this.i]) {
		this.timeline[this.i] = {
			players: []
		}
	}
}

Timeline.prototype.get = function() {
	return this.timeline[this.i]
}

Timeline.prototype.addPlayer = function(player) {
	this.timeline[this.i].players.push(deepCopy(player))
}