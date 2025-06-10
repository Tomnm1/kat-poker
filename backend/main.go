package main

import (
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	
)

func main() {
	initMongoDB()
	// Set up CORS options
	corsOptions := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://kat-poker.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Initialize the router
	r := mux.NewRouter()
	registerRoutes(r) // Register the routes from the handlers file

	// Apply CORS middleware
	handler := corsOptions.Handler(r)

	// Start the server with CORS enabled
	log.Println("Server is running on port :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
