package main

import (
	"context"
	"log"
	"time"
	"os"
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
		mongoURI = fmt.Sprintf("mongodb+srv://%s:%s@%s/planning?retryWrites=true&w=majority&authSource=admin", username, password, cluster)
	}

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

