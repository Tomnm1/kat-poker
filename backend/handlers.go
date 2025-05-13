package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var wsConnections = make(map[string][]*websocket.Conn)

func registerRoutes(r *mux.Router) {
	r.HandleFunc("/sessions", createSession).Methods("POST")
	r.HandleFunc("/sessions/{id}", getSessionHandler).Methods("GET")
	r.HandleFunc("/sessions/{id}/join", joinSession).Methods("POST")
	r.HandleFunc("/sessions/{id}/start", startRound).Methods("POST")
	r.HandleFunc("/sessions/{id}/vote", vote).Methods("POST")
	r.HandleFunc("/sessions/{id}/results", getResults).Methods("GET")
	r.HandleFunc("/test", test).Methods("GET")
	r.HandleFunc("/sessions/{id}/players/{playerName}", removePlayer).Methods("DELETE")
	r.HandleFunc("/sessions/{id}/rollback-vote", rollbackVote).Methods("POST")
	r.HandleFunc("/sessions/{id}/round-started", isRoundStarted).Methods("GET")
	r.HandleFunc("/sessions/{id}/reveal", revealResults).Methods("POST")
	r.HandleFunc("/sessions/{id}/ws", sessionWebSocket).Methods("GET")
	r.HandleFunc("/sessions/{id}/rounds/{roundId}", getRoundDetails).Methods("GET")

}

func getRoundDetails(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	roundID := vars["roundId"]

	session, err := getSession(sessionID)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	if session.CurrentRound != nil && session.CurrentRound.ID == roundID {
		w.Header().Set("Content-Type", "application/json")
		err = json.NewEncoder(w).Encode(session.CurrentRound)
		if err != nil {
			http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		}
		return
	}

	if session.RoundHistory != nil {
		for _, round := range session.RoundHistory {
			if round.ID == roundID {
				w.Header().Set("Content-Type", "application/json")
				err = json.NewEncoder(w).Encode(round)
				if err != nil {
					http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
				}
				return
			}
		}
	}

	http.Error(w, "Runda nie znaleziona", http.StatusNotFound)
}

func notifySessionParticipants(sessionID, message string) {
	var connectionsToKeep []*websocket.Conn

	log.Printf("Notifying session %s participants: %s", sessionID, message)

	for _, conn := range wsConnections[sessionID] {
		err := conn.WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			log.Printf("Error sending WebSocket message: %v", err)
			conn.Close()
		} else {
			connectionsToKeep = append(connectionsToKeep, conn)
		}
	}

	wsConnections[sessionID] = connectionsToKeep

	log.Printf("Notification sent to %d connections", len(connectionsToKeep))
}

func sessionWebSocket(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, "Failed to upgrade to WebSocket", http.StatusInternalServerError)
		return
	}

	wsConnections[sessionID] = append(wsConnections[sessionID], conn)

	go func() {
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				removeConnection(sessionID, conn)
				break
			}
		}
	}()
}

func removeConnection(sessionID string, conn *websocket.Conn) {
	connections := wsConnections[sessionID]
	for i, c := range connections {
		if c == conn {
			wsConnections[sessionID] = append(connections[:i], connections[i+1:]...)
			break
		}
	}
	if len(wsConnections[sessionID]) == 0 {
		delete(wsConnections, sessionID)
	}
}

func createSession(w http.ResponseWriter, r *http.Request) {
	var session Session
	if err := json.NewDecoder(r.Body).Decode(&session); err != nil {
		http.Error(w, "Nieprawidłowe dane", http.StatusBadRequest)
		return
	}
	session.Players = []string{}
	session.ID = fmt.Sprintf("session-%d", time.Now().UnixNano())

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

	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy aktualizacji sesji", http.StatusInternalServerError)
		return
	}
	for _, conn := range wsConnections[id] {
		conn.WriteMessage(websocket.TextMessage, []byte("/player-joined"))
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

	roundNumber := 1
	if session.CurrentRound != nil {
		_, err := fmt.Sscanf(session.CurrentRound.ID, "round-%d", &roundNumber)
		if err == nil {
			roundNumber++
		}
	}

	if session.CurrentRound != nil {
		if session.RoundHistory == nil {
			session.RoundHistory = []*Round{}
		}
		session.RoundHistory = append(session.RoundHistory, session.CurrentRound)
	}

	round := &Round{
		ID:    fmt.Sprintf("round-%d", roundNumber),
		Votes: make(map[string]int),
	}
	session.CurrentRound = round

	notifySessionParticipants(id, "/starting")

	// Save the session with the new round
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

	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy aktualizacji głosów", http.StatusInternalServerError)
		return
	}

	message := fmt.Sprintf("/player-voted:%s", payload.PlayerName)
	for _, conn := range wsConnections[id] {
		conn.WriteMessage(websocket.TextMessage, []byte(message))
	}

	if len(session.CurrentRound.Votes) == len(session.Players) {
		// If all have voted, notify to reveal
		for _, conn := range wsConnections[id] {
			conn.WriteMessage(websocket.TextMessage, []byte("/all-voted"))
		}
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
func revealResults(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	// Notify all players to reveal choices
	for _, conn := range wsConnections[id] {
		conn.WriteMessage(websocket.TextMessage, []byte("/reveals"))
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

	for _, conn := range wsConnections[sessionID] {
		conn.WriteMessage(websocket.TextMessage, []byte("/player-left"))
	}

	w.WriteHeader(http.StatusNoContent)
	return
}

func rollbackVote(w http.ResponseWriter, r *http.Request) {
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
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Błędne dane", http.StatusBadRequest)
		return
	}

	if _, exists := session.CurrentRound.Votes[payload.PlayerName]; !exists {
		http.Error(w, "Głos gracza nie istnieje", http.StatusNotFound)
		return
	}

	delete(session.CurrentRound.Votes, payload.PlayerName)

	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy zapisie sesji", http.StatusInternalServerError)
		return
	}

	// w.WriteHeader(http.StatusNoContent)
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.CurrentRound)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func isRoundStarted(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	session, err := getSession(id)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	response := struct {
		RoundStarted bool `json:"roundStarted"`
	}{
		RoundStarted: session.CurrentRound != nil,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func test(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode("test")
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}
