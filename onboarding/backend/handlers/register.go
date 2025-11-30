package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/go-webauthn/webauthn/webauthn"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// GetOperatorKey retrieves an operator from the operators table
// Returns a WebAuthnUser and error
func GetOperatorKey(ctx context.Context, db *pgxpool.Pool, operatorName string) (*WebAuthnUser, error) {
	// Query the operators table for the operator
	var credentialJSON string
	err := db.QueryRow(ctx,
		"SELECT credential FROM public.operators WHERE name = $1",
		operatorName,
	).Scan(&credentialJSON)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Operator doesn't exist yet - return a new user (for registration)
			return &WebAuthnUser{
				ID:          []byte(operatorName),
				Name:        operatorName,
				DisplayName: operatorName,
				userID:      operatorName,
				credentials: []webauthn.Credential{},
			}, nil
		}
		return nil, err
	}

	// Parse credential from JSON
	var credential webauthn.Credential
	if err := json.Unmarshal([]byte(credentialJSON), &credential); err != nil {
		// If credential is invalid, return user without credentials
		return &WebAuthnUser{
			ID:          []byte(operatorName),
			Name:        operatorName,
			DisplayName: operatorName,
			userID:      operatorName,
			credentials: []webauthn.Credential{},
		}, nil
	}

	// Return user with loaded credential
	return &WebAuthnUser{
		ID:          []byte(operatorName),
		Name:        operatorName,
		DisplayName: operatorName,
		userID:      operatorName,
		credentials: []webauthn.Credential{credential},
	}, nil
}

// SaveOperatorKey saves a credential to the operators table
func SaveOperatorKey(ctx context.Context, db *pgxpool.Pool, operatorName string, credentialData interface{}) error {
	// Marshal credential to JSON
	credentialJSON, err := json.Marshal(credentialData)
	if err != nil {
		return err
	}

	// Insert or update the operator's credential
	_, err = db.Exec(ctx,
		"INSERT INTO public.operators (name, credential, created_at) VALUES ($1, $2, $3) ON CONFLICT (name) DO UPDATE SET credential = $2",
		operatorName,
		credentialJSON,
		time.Now(),
	)

	return err
}

// WebAuthnUser implements webauthn.User interface
type WebAuthnUser struct {
	ID          []byte
	Name        string
	DisplayName string
	userID      string
	credentials []webauthn.Credential
}

func (u *WebAuthnUser) WebAuthnID() []byte {
	return u.ID
}

func (u *WebAuthnUser) WebAuthnName() string {
	return u.Name
}

func (u *WebAuthnUser) WebAuthnDisplayName() string {
	return u.DisplayName
}

func (u *WebAuthnUser) WebAuthnCredentials() []webauthn.Credential {
	if u.credentials == nil {
		return []webauthn.Credential{}
	}
	return u.credentials
}

func (u *WebAuthnUser) WebAuthnIcon() string {
	return ""
}

