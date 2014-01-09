package server

import (
	"log"
	"strconv"
)

type game struct {
	players     []*player
	messageChan chan message
}

type message struct {
	mess   string
	origin *player
}

func (g *game) add(p *player) {
	g.players = append(g.players, p)
	p.g = g // Potential datarace, probably not important
}

func (g *game) isFull() bool {
	return len(g.players) >= 2
}

func (g *game) start() {
	g.sendStartInfo()
	for m := range g.messageChan {
		switch m.mess {
		case "ready":
			g.startIfReady()

		default:
			g.sendToOthers(m)
		}
	}
}

func (g *game) startIfReady() {
	log.Println("Checking if everyone is ready")
	for _, p := range g.players {
		if !p.ready {
			return
		}
	}
	log.Println("Everyone ready, starting")
	for _, p := range g.players {
		p.send("start")
	}
}

func (g *game) sendToOthers(m message) {
	for _, p := range g.players {
		if p == m.origin {
			continue
		}
		p.send(m.mess)
	}
}

func (g *game) sendStartInfo() {
	count := strconv.Itoa(len(g.players))
	for i, p := range g.players {
		p.send("{\"playerCount\":" + count + ",\"playerId\":" + strconv.Itoa(i) + "}")
	}
}

func newGame() *game {
	return &game{
		messageChan: make(chan message),
	}
}
