package main

import (
	"fmt"
	"context"
	"time"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Session struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	User_stories []string        `json:"user_stories"`
	Tasks        map[int]string  `json:"tasks"`
	Players      []string        `json:"players"`
	CurrentRound *Round          `json:"currentRound,omitempty"`
	RoundHistory []*Round        `json:"roundHistory,omitempty"`
}

type Round struct {
	ID    string         `json:"id"`
	Votes map[string]int `json:"votes"`
}

// var sessions = make(map[string]*Session)

func saveSession(session *Session) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"id": session.ID}
	update := bson.M{"$set": session}
	_, err := sessionCol.UpdateOne(ctx, filter, update, options.Update().SetUpsert(true))
	return err
}

func getSession(id string) (*Session, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var session Session
	err := sessionCol.FindOne(ctx, bson.M{"id": id}).Decode(&session)
	if err != nil {
		return nil, fmt.Errorf("sesja nie znaleziona: %w", err)
	}
	return &session, nil
}
