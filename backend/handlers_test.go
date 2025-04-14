package main

import (
	"bytes"
	"encoding/json"
	"github.com/gorilla/mux"
	"net/http"
	"net/http/httptest"
	"testing"
)

func setupRouter() *mux.Router {
	r := mux.NewRouter()
	registerRoutes(r)
	return r
}

func TestCreateSession(t *testing.T) {
	router := setupRouter()

	sessionData := map[string]interface{}{
		"name": "TestSession",
	}
	body, _ := json.Marshal(sessionData)
	req, err := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("otrzymano %v, oczekiwano %v", status, http.StatusOK)
	}

	var session Session
	if err := json.Unmarshal(rr.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}
	if session.Name != "TestSession" {
		t.Errorf("oczekiwano 'TestSession', otrzymano '%s'", session.Name)
	}
}

func TestJoinSession(t *testing.T) {
	router := setupRouter()

	sessionData := map[string]interface{}{
		"name": "TestSessionJoin",
	}
	body, _ := json.Marshal(sessionData)
	req, _ := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	var session Session
	if err := json.Unmarshal(rr.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}

	joinData := map[string]string{
		"playerName": "Jacek",
	}
	joinBody, _ := json.Marshal(joinData)
	joinURL := "/sessions/" + session.ID + "/join"
	joinReq, _ := http.NewRequest("POST", joinURL, bytes.NewBuffer(joinBody))
	joinReq.Header.Set("Content-Type", "application/json")
	joinRr := httptest.NewRecorder()
	router.ServeHTTP(joinRr, joinReq)

	if joinRr.Code != http.StatusOK {
		t.Errorf("otrzymano %v", joinRr.Code)
	}

	var updatedSession Session
	if err := json.Unmarshal(joinRr.Body.Bytes(), &updatedSession); err != nil {
		t.Fatal(err)
	}
	if len(updatedSession.Players) != 1 || updatedSession.Players[0] != "Jacek" {
		t.Errorf("otrzymano: %v", updatedSession.Players)
	}
}

func TestRemovePlayer(t *testing.T) {
	router := setupRouter()

	sessionData := map[string]interface{}{
		"name": "TestRemovePlayer",
	}
	body, _ := json.Marshal(sessionData)
	req, _ := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	var session Session
	if err := json.Unmarshal(rr.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}

	joinData := map[string]string{
		"playerName": "Ania",
	}
	joinBody, _ := json.Marshal(joinData)
	joinReq, _ := http.NewRequest("POST", "/sessions/"+session.ID+"/join", bytes.NewBuffer(joinBody))
	joinReq.Header.Set("Content-Type", "application/json")
	joinRr := httptest.NewRecorder()
	router.ServeHTTP(joinRr, joinReq)

	if joinRr.Code != http.StatusOK {
		t.Fatalf("Błąd przy dołączaniu gracza: %v", joinRr.Code)
	}

	removeReq, _ := http.NewRequest("DELETE", "/sessions/"+session.ID+"/players/Ania", nil)
	removeRr := httptest.NewRecorder()
	router.ServeHTTP(removeRr, removeReq)

	if removeRr.Code != http.StatusNoContent {
		t.Errorf("oczekiwano 204, otrzymano %v", removeRr.Code)
	}

	removeReq2, _ := http.NewRequest("DELETE", "/sessions/"+session.ID+"/players/NieIstnieje", nil)
	removeRr2 := httptest.NewRecorder()
	router.ServeHTTP(removeRr2, removeReq2)

	if removeRr2.Code != http.StatusNotFound {
		t.Errorf("oczekiwano 404 dla nieistniejącego gracza, otrzymano %v", removeRr2.Code)
	}

	removeReq3, _ := http.NewRequest("DELETE", "/sessions/fakeID/players/Ania", nil)
	removeRr3 := httptest.NewRecorder()
	router.ServeHTTP(removeRr3, removeReq3)

	if removeRr3.Code != http.StatusNotFound {
		t.Errorf("oczekiwano 404 dla nieistniejącej sesji, otrzymano %v", removeRr3.Code)
	}
}


func TestRollbackVote(t *testing.T) {
	router := setupRouter()

	sessionData := map[string]interface{}{
		"name": "TestRollbackVote",
	}
	body, _ := json.Marshal(sessionData)
	req, _ := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	var session Session
	if err := json.Unmarshal(rr.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}

	joinData := map[string]string{
		"playerName": "Ala",
	}
	joinBody, _ := json.Marshal(joinData)
	joinReq, _ := http.NewRequest("POST", "/sessions/"+session.ID+"/join", bytes.NewBuffer(joinBody))
	joinReq.Header.Set("Content-Type", "application/json")
	joinRr := httptest.NewRecorder()
	router.ServeHTTP(joinRr, joinReq)

	startReq, _ := http.NewRequest("POST", "/sessions/"+session.ID+"/start", nil)
	startReq.Header.Set("Content-Type", "application/json")
	startRr := httptest.NewRecorder()
	router.ServeHTTP(startRr, startReq)

	voteData := map[string]interface{}{
		"playerName": "Ala",
		"vote":       8,
	}
	voteBody, _ := json.Marshal(voteData)
	voteReq, _ := http.NewRequest("POST", "/sessions/"+session.ID+"/vote", bytes.NewBuffer(voteBody))
	voteReq.Header.Set("Content-Type", "application/json")
	voteRr := httptest.NewRecorder()
	router.ServeHTTP(voteRr, voteReq)

	rollbackData := map[string]string{
		"playerName": "Ala",
	}
	rollbackBody, _ := json.Marshal(rollbackData)
	rollbackReq, _ := http.NewRequest("POST", "/sessions/"+session.ID+"/rollback-vote", bytes.NewBuffer(rollbackBody))
	rollbackReq.Header.Set("Content-Type", "application/json")
	rollbackRr := httptest.NewRecorder()
	router.ServeHTTP(rollbackRr, rollbackReq)

	if rollbackRr.Code != http.StatusNoContent {
		t.Errorf("oczekiwano 204 No Content, otrzymano %v", rollbackRr.Code)
	}

	getResultsReq, _ := http.NewRequest("GET", "/sessions/"+session.ID+"/results", nil)
	getResultsRr := httptest.NewRecorder()
	router.ServeHTTP(getResultsRr, getResultsReq)

	var round Round
	if err := json.Unmarshal(getResultsRr.Body.Bytes(), &round); err != nil {
		t.Fatal(err)
	}
	if _, exists := round.Votes["Ala"]; exists {
		t.Errorf("Głos nie został usunięty: %v", round.Votes)
	}
}

func TestIsRoundStarted(t *testing.T) {
	router := setupRouter()

	sessionData := map[string]interface{}{
		"name": "TestIsRoundStarted",
	}
	body, _ := json.Marshal(sessionData)
	req, _ := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	var session Session
	if err := json.Unmarshal(rr.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}

	checkReq, _ := http.NewRequest("GET", "/sessions/"+session.ID+"/round-started", nil)
	checkRr := httptest.NewRecorder()
	router.ServeHTTP(checkRr, checkReq)

	var beforeResponse struct {
		RoundStarted bool `json:"roundStarted"`
	}
	if err := json.Unmarshal(checkRr.Body.Bytes(), &beforeResponse); err != nil {
		t.Fatal(err)
	}
	if beforeResponse.RoundStarted {
		t.Errorf("oczekiwano false, otrzymano true")
	}

	startReq, _ := http.NewRequest("POST", "/sessions/"+session.ID+"/start", nil)
	startRr := httptest.NewRecorder()
	router.ServeHTTP(startRr, startReq)

	checkReq2, _ := http.NewRequest("GET", "/sessions/"+session.ID+"/round-started", nil)
	checkRr2 := httptest.NewRecorder()
	router.ServeHTTP(checkRr2, checkReq2)

	var afterResponse struct {
		RoundStarted bool `json:"roundStarted"`
	}
	if err := json.Unmarshal(checkRr2.Body.Bytes(), &afterResponse); err != nil {
		t.Fatal(err)
	}
	if !afterResponse.RoundStarted {
		t.Errorf("oczekiwano true, otrzymano false")
	}
}


func TestVote(t *testing.T) {
	router := setupRouter()

	sessionData := map[string]interface{}{
		"name": "TestSessionVote",
	}
	body, _ := json.Marshal(sessionData)
	req, _ := http.NewRequest("POST", "/sessions", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	router.ServeHTTP(rr, req)

	var session Session
	if err := json.Unmarshal(rr.Body.Bytes(), &session); err != nil {
		t.Fatal(err)
	}

	startURL := "/sessions/" + session.ID + "/start"
	startReq, _ := http.NewRequest("POST", startURL, nil)
	startReq.Header.Set("Content-Type", "application/json")
	startRr := httptest.NewRecorder()
	router.ServeHTTP(startRr, startReq)
	if startRr.Code != http.StatusOK {
		t.Errorf("otrzymano %v", startRr.Code)
	}

	voteData := map[string]interface{}{
		"playerName": "Jan",
		"vote":       5,
	}
	voteBody, _ := json.Marshal(voteData)
	voteURL := "/sessions/" + session.ID + "/vote"
	voteReq, _ := http.NewRequest("POST", voteURL, bytes.NewBuffer(voteBody))
	voteReq.Header.Set("Content-Type", "application/json")
	voteRr := httptest.NewRecorder()
	router.ServeHTTP(voteRr, voteReq)
	if voteRr.Code != http.StatusOK {
		t.Errorf("otrzymano %v", voteRr.Code)
	}

	var round Round
	if err := json.Unmarshal(voteRr.Body.Bytes(), &round); err != nil {
		t.Fatal(err)
	}
	if v, ok := round.Votes["Jan"]; !ok || v != 5 {
		t.Errorf(" otrzymano: %v", round.Votes)
	}
}
