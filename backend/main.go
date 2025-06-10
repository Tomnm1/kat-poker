package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	
)

func main() {
	initMongoDB()
	corsOptions := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://kat-poker.vercel.app",
			"http://kat-poker.vercel.app",
			"kat-poker.vercel.app",
			"https://kat-poker.vercel.app/*",
			"http://kat-poker.vercel.app/*",
			"kat-poker.vercel.app/*",
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "WEBSOCKET"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "Application", "application/json"},
		AllowCredentials: true,
	})


	r := mux.NewRouter()
	registerRoutes(r) 

	handler := corsOptions.Handler(r)

	log.Println("Server is running on port :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
