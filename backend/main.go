package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	initMongoDB()

	// Set up CORS options with more detailed configuration
	corsOptions := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "https://kat-poker.vercel.app"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization", "X-Requested-With"},
		ExposedHeaders:   []string{"Content-Length", "Access-Control-Allow-Origin"},
		AllowCredentials: true,
		Debug:            true, // Enable debug logging for CORS
	})

	// Initialize the router
	r := mux.NewRouter()

	// Add a simple health check endpoint
	r.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}).Methods("GET")

	// Register your application routes
	registerRoutes(r)

	// Apply CORS middleware
	handler := corsOptions.Handler(r)

	// Add logging middleware
	loggedHandler := loggingMiddleware(handler)

	// Get port from environment variable or default to 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the server with CORS enabled
	log.Printf("Server is running on port :%s", port)
	if err := http.ListenAndServe(":"+port, loggedHandler); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

// loggingMiddleware adds basic logging for all requests
func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Incoming %s request to %s from %s", r.Method, r.URL.Path, r.RemoteAddr)
		log.Printf("Headers: %v", r.Header)
		next.ServeHTTP(w, r)
	})
}
