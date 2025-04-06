package main

import (
	"fmt"
)

type Session struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Players      []string `json:"players"`
	CurrentRound *Round   `json:"currentRound,omitempty"`
}

type Round struct {
	ID    string         `json:"id"`
	Votes map[string]int `json:"votes"`
}

var sessions = make(map[string]*Session)

func saveSession(session *Session) error {
	// TODO: Zapis do bazy
	return nil
}

func getSession(id string) (*Session, error) {
	// TODO: Pobieranie sesji
	if session, exists := sessions[id]; exists {
		return session, nil
	}
	return nil, fmt.Errorf("sesja nie znaleziona")
}
