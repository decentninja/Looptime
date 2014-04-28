/*
	Player model data
 */
function PlayerModel(id, version) {
	THREE.Object3D.call(this)
	this.id = id
	this.version = version
	this.body = new THREE.Mesh(new THREE.CubeGeometry(7.5, 25, 7.5))
	this.body.position.y = 8
	this.body.material = new THREE.MeshBasicMaterial({
		color: new THREE.Color(
			0.2 * (id + 1),
			0.1 * (version + 1),
			0.5
		)
	})
	this.add(this.body)

	this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000000)
	this.body.add(this.camera)
	this.camera.position.y = 8

	var manager = new THREE.LoadingManager()
	manager.onProgress = function(item, loaded, total) {
		console.log(item, loaded, total)
	}
	var that = this

	var shotorigin = new THREE.Object3D()
	shotorigin.name = "shotorigin" // get by using getObjectByName("shotorigin")
	this.camera.add(shotorigin)
	shotorigin.position.x = 1.75
	shotorigin.position.z = -6.5
	shotorigin.position.y = -1

	var gun = new THREE.Mesh(assets["grandfather gun"].geometry)
	this.camera.add(gun)
	gun.position.z = -2
	gun.position.y = -1
	gun.material = new THREE.MeshNormalMaterial()
	gun.position.x = -1.5
	gun.scale.multiplyScalar(1.5)
	gun.rotation.y = -Math.PI / 2
}

PlayerModel.prototype = Object.create(THREE.Object3D.prototype)

PlayerModel.prototype.update = function(playerstate) {
	this.position = playerstate.position
	this.rotation.y = playerstate.look.y
	this.camera.rotation.x = playerstate.look.x
}