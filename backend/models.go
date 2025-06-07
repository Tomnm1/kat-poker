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
type User struct {
	ID        string `json:"id"`
	Username  string `json:"username"`
	Password  string `json:"password"`
	Token     string `json:"token,omitempty"`    
	TokenTime int64  `json:"token_time,omitempty"` 
}


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



func saveUser(user *User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	user.Password = hashPassword(user.Password)

	var existingUser User
	err := userCol.FindOne(ctx, bson.M{"username": user.Username}).Decode(&existingUser)
	if err == nil {
		return fmt.Errorf("użytkownik już istnieje")
	}

	_, err = userCol.InsertOne(ctx, user)
	return err
}
func getUserByUsername(username string) (*User, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err := userCol.FindOne(ctx, bson.M{"username": username}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("użytkownik nie znaleziony: %w", err)
	}
	return &user, nil
}


func updateUser(user *User) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()


	_, err := userCol.UpdateOne(
		ctx,
		bson.M{"username": user.Username}, 
		bson.M{
			"$set": bson.M{
				"token":      user.Token,
				"token_time": user.TokenTime,
			},
		},
	)

	if err != nil {
		return fmt.Errorf("błąd podczas aktualizacji użytkownika: %w", err)
	}

	return nil
}
func getUserByID(userID string) (*User, error) {

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user User
	err := userCol.FindOne(ctx, bson.M{"id": userID}).Decode(&user)
	if err != nil {
		return nil, fmt.Errorf("błąd przy pobieraniu użytkownika: %w", err)
	}
	return &user, nil
}
