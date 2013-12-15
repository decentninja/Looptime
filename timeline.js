function Timeline() {
	this.theline = new Array(100000)
}

Timeline.prototype.add = function(index, what) {
	console.log("added on", index)
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