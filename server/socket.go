package server

import (
	"code.google.com/p/go.net/websocket"
	"log"
	"net/http"
)

type sockServer struct {
	addChan chan *player
}

func SetupSocketServer() {
	s := newSockServer()
	go s.dispatchGames()
	http.Handle("/ws", websocket.Handler(s.handler))
}

func (s *sockServer) dispatchGames() {
	g := newGame()
	for p := range s.addChan {
		g.add(p)
		log.Print("Added player")
		if g.isFull() {
			go g.start()
			g = newGame()
			log.Print("Started new game")
		}
	}
}

func (s *sockServer) handler(conn *websocket.Conn) {
	p := newPlayer(conn)
	s.addChan <- p
	p.listen()
}

func newSockServer() *sockServer {
	return &sockServer{
		addChan: make(chan *player),
	}
}
