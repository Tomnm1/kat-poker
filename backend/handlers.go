package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"errors"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("tajny_klucz")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

var wsConnections = make(map[string][]*websocket.Conn)

func registerRoutes(r *mux.Router) {
	r.HandleFunc("/sessions", JWTMiddleware(createSession)).Methods("POST")
	r.HandleFunc("/sessions/{id}", JWTMiddleware(getSessionHandler)).Methods("GET")
	r.HandleFunc("/sessions/{id}/join", JWTMiddleware(joinSession)).Methods("POST")
	r.HandleFunc("/sessions/{id}/start", JWTMiddleware(startRound)).Methods("POST")
	r.HandleFunc("/sessions/{id}/vote", JWTMiddleware(vote)).Methods("POST")
	r.HandleFunc("/sessions/{id}/results", JWTMiddleware(getResults)).Methods("GET")
	r.HandleFunc("/sessions/{id}/players/{playerName}", JWTMiddleware(removePlayer)).Methods("DELETE")
	r.HandleFunc("/sessions/{id}/rollback-vote", JWTMiddleware(rollbackVote)).Methods("POST")
	r.HandleFunc("/sessions/{id}/round-started", JWTMiddleware(isRoundStarted)).Methods("GET")
	r.HandleFunc("/sessions/{id}/reveal", JWTMiddleware(revealResults)).Methods("POST")

	// Public or unauthenticated routes
	r.HandleFunc("/test", test).Methods("GET")
	r.HandleFunc("/sessions/{id}/ws", sessionWebSocket).Methods("GET")
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

	round := &Round{
		ID:    fmt.Sprintf("round-%d", 1),
		Votes: make(map[string]int),
	}
	session.CurrentRound = round

	// Notify all WebSocket connections about the round start
	for _, conn := range wsConnections[id] {
		conn.WriteMessage(websocket.TextMessage, []byte("/starting"))
	}

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

	// TODO: Aktualizuj sesję w bazie
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

	// Notify all WebSocket connections about the player removal
	for _, conn := range wsConnections[sessionID] {
		conn.WriteMessage(websocket.TextMessage, []byte("/player-left"))
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.CurrentRound)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
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

func generateJWT(userID string) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}


func verifyJWT(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Sprawdzenie algorytmu
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("nieprawidłowy algorytm: %v", token.Header["alg"])
		}
		return jwtSecret, nil
	})
	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		userID, ok := claims["user_id"].(string)
		if !ok {
			return "", errors.New("brak user_id w tokenie")
		}
		return userID, nil
	}
	return "", errors.New("token nieważny")
}

func JWTMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Brak tokenu autoryzacyjnego", http.StatusUnauthorized)
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		userID, err := verifyJWT(tokenString)
		if err != nil {
			http.Error(w, "Nieprawidłowy token: "+err.Error(), http.StatusUnauthorized)
			return
		}

		// Można przekazać userID do kontekstu jeśli potrzebne
		r.Header.Set("X-User-ID", userID)

		next.ServeHTTP(w, r)
	}
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username string `json:"username"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.Username == "" {
		http.Error(w, "Nieprawidłowe dane logowania", http.StatusBadRequest)
		return
	}

	// TODO: sprawdzanie hasła i użytkownika w bazie

	token, err := generateJWT(payload.Username)
	if err != nil {
		http.Error(w, "Błąd generowania tokenu", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{
		"token": token,
	})
}

func test(w http.ResponseWriter, r *http.Request) {
	err := json.NewEncoder(w).Encode("test")
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}
