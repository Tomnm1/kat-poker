package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	client     *mongo.Client
	sessionCol *mongo.Collection
)

func initMongoDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var err error
	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		// Pobierz zmienne środowiskowe
		username := os.Getenv("MONGO_USERNAME")
		password := os.Getenv("MONGO_PASSWORD")
		cluster := os.Getenv("MONGO_CLUSTER")
		
		if username != "" && password != "" && cluster != "" {
			mongoURI = fmt.Sprintf("mongodb+srv://%s:%s@%s/planning?retryWrites=true&w=majority&authSource=admin", username, password, cluster)
		} else {
			mongoURI = "mongodb://mongo:mongo@localhost:27017"
		}
	}
	
	// Debug - ukryj hasło w logach
	log.Printf("Connecting to MongoDB with URI: %s", mongoURI[:strings.Index(mongoURI, "://")+3]+"***")
	
	clientOptions := options.Client().ApplyURI(mongoURI)
	client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("MongoDB connection error: %v", err)
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("MongoDB ping error: %v", err)
	}

	sessionCol = client.Database("planning").Collection("sessions")
	log.Println("Connected to MongoDB")
}
