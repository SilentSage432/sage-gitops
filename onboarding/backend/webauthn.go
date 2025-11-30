package main

import (
	"log"

	"github.com/go-webauthn/webauthn/webauthn"
)

var WAuth *webauthn.WebAuthn

func InitWebAuthn() {
	var err error
	WAuth, err = webauthn.New(&webauthn.Config{
		RPDisplayName: "SAGE Federation",
		RPID:          "localhost",
		RPOrigins:     []string{"http://localhost:3000", "https://localhost:3000"},
	})
	if err != nil {
		log.Fatalf("failed to initialize WebAuthn: %v", err)
		return
	}
	log.Println("WebAuthn initialized successfully for SAGE Federation")
}

