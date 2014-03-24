Looptime
========

Looptime is a 3D multiplayer game built in HTML5, WebGL, JavaScript and GoLang.


Setup
-----

1. http://golang.org/doc/install
2. git clone https://github.com/sootn/Looptime
3. cd Looptime
4. go get
5. go run main.go
6. open http://localhost:9000


Debug
-----

http://localhost:9000/?debug=true will activate debug mode.
In debug mode you are in a single player game without networking. You also see the otherwise invisible collisionmap.


TODO
----

### High priority, in preparation of playtest

- color players (and related things in Timemap) (maybe two colors per player, one for 'active' and one for 'previous')
- solve falling off the map
- timemap usability (lots of tinkering)
- visual effect when jump in progress (as feedback)
- some sort of shield
- wrap playerwaves somehow (or kill players that exit the playtime)
- block default action on right click

### (Presumably) Lower priority

- make addAndReplayEvent capable of taking multiple events at a time
- improve handling of timewave wraparound
- [bugfix] disable jumping to the current time, I think it breaks things
- make something graphically pleasing when the start delay is happening
- make the gun a MeshPhongMaterial with envMap for shinynesss
- mark killer waves in timemap
- integrate effects from assets/material/index.html
- [bugfix] sometimes (extreme rarity) an arriving player is not there when the timewave finishes the jump
