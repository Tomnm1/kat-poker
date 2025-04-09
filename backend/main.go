package main

import (
	"github.com/gorilla/mux"
	"log"
	"net/http"
)

func connectToMongo() {
	// TODO
}

func main() {
	r := mux.NewRouter()
	registerRoutes(r)

	log.Println("Serwer działa na porcie :8080")
	if err := http.ListenAndServe(":8080", r); err != nil {
		log.Fatalf("Błąd przy uruchamianiu serwera: %v", err)
	}
}
