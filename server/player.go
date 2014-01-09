package server

import (
	"code.google.com/p/go.net/websocket"
	"log"
)

type player struct {
	conn  *websocket.Conn
	g     *game
	ready bool
}

func newPlayer(conn *websocket.Conn) *player {
	return &player{
		conn: conn,
	}
}

func (p *player) listen() {
	var mess string
	for {
		err := websocket.Message.Receive(p.conn, &mess)
		if err != nil {
			log.Println("Player got an error in websocket", p, err)
			return
		}

		switch mess {
		case "ping":
			websocket.Message.Send(p.conn, "pong")
			log.Println("Pong")

		case "ready":
			p.ready = true
			log.Println("Ready")
			if p.g != nil {
				p.g.messageChan <- message{mess, p}
			}

		default:
			if p.g != nil {
				p.g.messageChan <- message{mess, p}
			}
		}
	}
}

func (p *player) send(mess string) {
	websocket.Message.Send(p.conn, mess)
}
