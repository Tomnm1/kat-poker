package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
)

func registerRoutes(r *mux.Router) {
	r.HandleFunc("/sessions", createSession).Methods("POST")
	r.HandleFunc("/sessions/{id}", getSessionHandler).Methods("GET")
	r.HandleFunc("/sessions/{id}/join", joinSession).Methods("POST")
	r.HandleFunc("/sessions/{id}/start", startRound).Methods("POST")
	r.HandleFunc("/sessions/{id}/vote", vote).Methods("POST")
	r.HandleFunc("/sessions/{id}/results", getResults).Methods("GET")
	r.HandleFunc("/test", test).Methods("GET")
	r.HandleFunc("/sessions/{id}/players/{playerName}", removePlayer).Methods("DELETE")

}

func createSession(w http.ResponseWriter, r *http.Request) {
	var session Session
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, "Nieprawidłowe dane", http.StatusBadRequest)
		return
	}
	session.ID = fmt.Sprintf("session-%d", len(sessions)+1)
	session.Players = []string{}
	sessions[session.ID] = &session

	// TODO: Zapis sesji do bazy
	if err := saveSession(&session); err != nil {
		http.Error(w, "Błąd przy zapisie sesji", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err := json.NewEncoder(w).Encode(session)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func getSessionHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func joinSession(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	var payload struct {
		PlayerName string `json:"playerName"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Błędne dane gracza", http.StatusBadRequest)
		return
	}

	session.Players = append(session.Players, payload.PlayerName)

	// TODO: Aktualizuj sesję w bazie
	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy aktualizacji sesji", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func startRound(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	round := &Round{
		ID:    fmt.Sprintf("round-%d", 1),
		Votes: make(map[string]int),
	}
	session.CurrentRound = round

	// TODO: Aktualizuj sesję w bazie
	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy aktualizacji rundy", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(round)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func vote(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	if session.CurrentRound == nil {
		http.Error(w, "Runda nie została rozpoczęta", http.StatusBadRequest)
		return
	}

	var payload struct {
		PlayerName string `json:"playerName"`
		Vote       int    `json:"vote"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Błędne dane głosowania", http.StatusBadRequest)
		return
	}

	session.CurrentRound.Votes[payload.PlayerName] = payload.Vote

	// TODO: Aktualizuj sesję w bazie
	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy aktualizacji głosów", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.CurrentRound)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func getResults(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	if session.CurrentRound == nil {
		http.Error(w, "Runda nie została rozpoczęta", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.CurrentRound)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}
func removePlayer(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	playerName := vars["playerName"]

	session, err := getSession(sessionID)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	// Usuń gracza z listy
	updatedPlayers := []string{}
	found := false
	for _, p := range session.Players {
		if p != playerName {
			updatedPlayers = append(updatedPlayers, p)
		} else {
			found = true
		}
	}

	if !found {
		http.Error(w, "Gracz nie znaleziony w sesji", http.StatusNotFound)
		return
	}

	session.Players = updatedPlayers

	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy aktualizacji sesji", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}


func test(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode("test")
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}
