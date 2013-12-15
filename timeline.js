function Timeline() {
	this.theline = new Array(10000)
}

Timeline.prototype.add = function(gametime, what) {
	var index = Math.floor(gametime / TIME_STEP)
	if(!this.theline[index]) {
		this.theline[index] = [what]
	} else {
		this.theline[index].push(what)
	}
}

Timeline.prototype.get = function(where) {
	if(this.theline[where]) {
		return this.theline[where]
	} else {
		return []
	}
}