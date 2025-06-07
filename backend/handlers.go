package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"

	"crypto/sha256"
	"encoding/hex"

	"github.com/dgrijalva/jwt-go"
	"github.com/google/uuid"
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
	r.HandleFunc("/sessions/{id}/stories", addStoryHandler).Methods("POST")
	r.HandleFunc("/sessions/{id}/stories/{index}", deleteStoryHandler).Methods("DELETE")
	r.HandleFunc("/sessions/{id}/stories/{index}", addStoryTaskHandler).Methods("POST")
	r.HandleFunc("/register", registerHandler).Methods("POST")
	r.HandleFunc("/login", loginHandler).Methods("POST")
	r.HandleFunc("/logout", logoutHandler).Methods("POST")

}
func registerHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Nieprawidłowe dane wejściowe", http.StatusBadRequest)
		return
	}

	if payload.Username == "" || payload.Password == "" {
		http.Error(w, "Nazwa użytkownika i hasło są wymagane", http.StatusBadRequest)
		return
	}

	user := &User{
		ID:       uuid.New().String(),
		Username: payload.Username,
		Password: payload.Password,
	}

	if err := saveUser(user); err != nil {
		if err.Error() == "użytkownik już istnieje" {
			http.Error(w, "Użytkownik już istnieje", http.StatusConflict)
		} else {
			http.Error(w, "Błąd podczas zapisywania użytkownika", http.StatusInternalServerError)
		}
		return
	}

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(struct {
		ID       string `json:"id"`
		Username string `json:"username"`
	}{
		ID:       user.ID,
		Username: user.Username,
	})
}
func parseJWT(tokenString string) (jwt.MapClaims, error) {

	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {

		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("niepoprawna metoda podpisu")
		}
		return jwtSecret, nil
	})

	if err != nil {
		return nil, err
	}


	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {

		expirationTime := int64(claims["exp"].(float64)) 

	
		if time.Now().Unix() > expirationTime {
			return nil, fmt.Errorf("token wygasł")
		}

		return claims, nil
	}


	return nil, fmt.Errorf("nieprawidłowy token")
}
func logoutHandler(w http.ResponseWriter, r *http.Request) {

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "Brak tokenu w nagłówku", http.StatusUnauthorized)
		return
	}

	tokenString := authHeader[len("Bearer "):]

	claims, err := parseJWT(tokenString) 
	if err != nil {
		if err.Error() == "token wygasł" {
			http.Error(w, "Token wygasł", http.StatusUnauthorized)
		} else {
			http.Error(w, "Błąd weryfikacji tokenu", http.StatusUnauthorized)
		}
		log.Printf("Błąd weryfikacji tokenu: %v", err)
		return
	}


	userID := claims["sub"].(string)


	user, err := getUserByID(userID)
	if err != nil {
		http.Error(w, "Użytkownik nie znaleziony", http.StatusNotFound)
		log.Printf("Błąd przy pobieraniu użytkownika: %v", err)
		return
	}

	if user.Token == "" {
		http.Error(w, "Użytkownik nie jest zalogowany", http.StatusBadRequest)
		return
	}

	user.Token = "" 
	user.TokenTime = 0 


	err = updateUser(user) 
	if err != nil {
		http.Error(w, "Błąd przy aktualizacji tokenu", http.StatusInternalServerError)
		log.Printf("Błąd przy aktualizacji tokenu: %v", err)
		return
	}


	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Wylogowanie zakończone sukcesem"))
	log.Printf("Użytkownik %s został wylogowany.", user.Username)
}


func loginHandler(w http.ResponseWriter, r *http.Request) {
	var payload struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}


	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Nieprawidłowe dane wejściowe", http.StatusBadRequest)
		log.Printf("Błąd przy dekodowaniu danych wejściowych: %v", err)
		return
	}


	if payload.Username == "" || payload.Password == "" {
		http.Error(w, "Nazwa użytkownika i hasło są wymagane", http.StatusBadRequest)
		return
	}


	user, err := getUserByUsername(payload.Username)
	if err != nil {
		http.Error(w, "Użytkownik nie znaleziony", http.StatusNotFound)
		log.Printf("Błąd przy pobieraniu użytkownika: %v", err)
		return
	}


	if !checkPassword(user.Password, payload.Password) {
		http.Error(w, "Błędne hasło", http.StatusUnauthorized)
		return
	}


	token, err := generateJWT(user.ID, user.Username)
	if err != nil {
		http.Error(w, "Błąd podczas generowania tokenu", http.StatusInternalServerError)
		log.Printf("Błąd przy generowaniu JWT: %v", err)
		return
	}


	user.Token = token
	user.TokenTime = time.Now().Unix()


	err = updateUser(user) 
	if err != nil {
		http.Error(w, "Błąd przy zapisie tokenu", http.StatusInternalServerError)
		log.Printf("Błąd przy zapisie tokenu: %v", err)
		return
	}


	log.Println("Wysyłam token do użytkownika:", token)


	w.Header().Set("Content-Type", "text/plain")
	w.WriteHeader(http.StatusOK) 


	_, err = w.Write([]byte(token)) 
	if err != nil {
		http.Error(w, "Błąd przy wysyłaniu odpowiedzi", http.StatusInternalServerError)
		log.Printf("Błąd przy wysyłaniu odpowiedzi: %v", err)
		return
	}

	log.Println("Zakończono odpowiedź z tokenem")
}


func hashPassword(password string) string {
	hash := sha256.Sum256([]byte(password))
	return hex.EncodeToString(hash[:])
}

func checkPassword(storedPassword, inputPassword string) bool {
	hash := sha256.Sum256([]byte(inputPassword))
	return storedPassword == hex.EncodeToString(hash[:])
}

var jwtSecret = []byte("yourSecretKey") // Tajny klucz do podpisywania tokenów

func generateJWT(userID, username string) (string, error) {
	// Tworzenie roli i claims (informacji o użytkowniku)
	claims := jwt.MapClaims{
		"sub":      userID,
		"username": username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token ważny przez 24 godziny
	}

	// Tworzenie tokenu
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Podpisanie tokenu z użyciem sekretu
	signedToken, err := token.SignedString(jwtSecret)
	if err != nil {
		return "", err
	}

	return signedToken, nil
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

func addStoryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]

	var payload struct {
		Story string `json:"story"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Błędne dane", http.StatusBadRequest)
		return
	}

	session, err := getSession(sessionID)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}
	session.User_stories = append(session.User_stories, payload.Story)
	if err := saveSession(session); err != nil {
		http.Error(w, "Błąd przy dodawaniu user story", http.StatusInternalServerError)
		return
	}

	message := fmt.Sprintf("/userstory-added:%s", payload.Story)
	for _, conn := range wsConnections[sessionID] {
		conn.WriteMessage(websocket.TextMessage, []byte(message))
	}

	notifySessionParticipants(sessionID, "/story-added")
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.CurrentRound)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func deleteStoryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	indexStr := vars["index"]

	var index int
	_, err := fmt.Sscanf(indexStr, "%d", &index)
	if err != nil {
		http.Error(w, "Invalid index", http.StatusBadRequest)
		return
	}

	session, err := getSession(sessionID)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}
	if index < 0 || index >= len(session.User_stories) {
		http.Error(w, "invalid story index", http.StatusNotFound)
		return
	}
	session.User_stories = append(session.User_stories[:index], session.User_stories[index+1:]...)
	delete(session.Tasks, index)
	if err := saveSession(session); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	message := fmt.Sprintf("/userstory-removed:%s", indexStr)
	for _, conn := range wsConnections[sessionID] {
		conn.WriteMessage(websocket.TextMessage, []byte(message))
	}

	notifySessionParticipants(sessionID, "/story-removed")
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.CurrentRound)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}

func addStoryTaskHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	sessionID := vars["id"]
	indexStr := vars["index"]

	var index int
	_, err := fmt.Sscanf(indexStr, "%d", &index)
	if err != nil {
		http.Error(w, "Invalid index", http.StatusBadRequest)
		return
	}

	session, err := getSession(sessionID)
	if err != nil {
		http.Error(w, "Sesja nie znaleziona", http.StatusNotFound)
		return
	}

	var payload struct {
		Task string `json:"task"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Błędne dane gracza", http.StatusBadRequest)
		return
	}

	if index < 0 || index >= len(session.User_stories) {
		http.Error(w, "invalid story index", http.StatusNotFound)
		return
	}

	if session.Tasks == nil {
		session.Tasks = make(map[int]string)
	}
	session.Tasks[index] = payload.Task

	message := fmt.Sprintf("/task-added:%s", indexStr)
	for _, conn := range wsConnections[sessionID] {
		conn.WriteMessage(websocket.TextMessage, []byte(message))
	}

	notifySessionParticipants(sessionID, "/task-added")
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(session.Tasks)
	if err != nil {
		http.Error(w, "Wystąpił błąd", http.StatusInternalServerError)
		return
	}
}
