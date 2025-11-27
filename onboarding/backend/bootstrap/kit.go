package bootstrap

import (
	"archive/zip"
	"bytes"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/hex"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"math/big"
	"time"

	"github.com/silentsage432/sage-gitops/onboarding/backend/federation"
)

// TenantInfo represents tenant data needed for kit generation
type TenantInfo struct {
	ID          string
	Name        string
	Email       string
	Domain      string
	Region      string
	Agents      []string
	Config      map[string]interface{}
	Access      AccessConfig
	Regions     []string
	Sensitivity string
}

// AccessConfig represents authentication configuration
type AccessConfig struct {
	AuthMethod       string
	AdminEmail       string
	ClientId         string
	ClientSecret     string
	CallbackUrl      string
	ScimEnabled      bool
	IdentityProvider string
}

// BootstrapKit represents a generated bootstrap kit
type BootstrapKit struct {
	ZIPData     []byte
	Fingerprint string
	Size        int64
}

// GenerateBootstrapKit generates a complete bootstrap kit ZIP file
func GenerateBootstrapKit(tenant TenantInfo) (*BootstrapKit, error) {
	buf := new(bytes.Buffer)
	zipWriter := zip.NewWriter(buf)

	// Generate tenant keypair
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, fmt.Errorf("failed to generate RSA key: %w", err)
	}

	// Generate certificate
	cert, err := generateCertificate(privateKey, tenant)
	if err != nil {
		return nil, fmt.Errorf("failed to generate certificate: %w", err)
	}

	// Write README.md
	if err := writeFile(zipWriter, "README.md", generateREADME(tenant)); err != nil {
		return nil, err
	}

	// Write manifests/namespace.yaml
	if err := writeFile(zipWriter, "manifests/namespace.yaml", generateNamespace(tenant)); err != nil {
		return nil, err
	}

	// Write manifests/rbac.yaml
	if err := writeFile(zipWriter, "manifests/rbac.yaml", generateRBAC(tenant)); err != nil {
		return nil, err
	}

	// Write manifests/data-regions.yaml
	if err := writeFile(zipWriter, "manifests/data-regions.yaml", generateDataRegions(tenant)); err != nil {
		return nil, err
	}

	// Write manifests/access-config.yaml
	if err := writeFile(zipWriter, "manifests/access-config.yaml", generateAccessConfig(tenant)); err != nil {
		return nil, err
	}

	// Write manifests/tenant-config.yaml
	if err := writeFile(zipWriter, "manifests/tenant-config.yaml", generateTenantConfig(tenant)); err != nil {
		return nil, err
	}

	// Write agent configs
	for _, agentID := range tenant.Agents {
		agentConfig := generateAgentConfig(agentID, tenant)
		if err := writeFile(zipWriter, fmt.Sprintf("manifests/agents/%s.yaml", agentID), agentConfig); err != nil {
			return nil, err
		}
	}

	// Write secrets/tenant-key.pem
	privateKeyPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	})
	if err := writeFile(zipWriter, "secrets/tenant-key.pem", privateKeyPEM); err != nil {
		return nil, err
	}

	// Write secrets/tenant-cert.pem
	certPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "CERTIFICATE",
		Bytes: cert,
	})
	if err := writeFile(zipWriter, "secrets/tenant-cert.pem", certPEM); err != nil {
		return nil, err
	}

	// Write metadata.json
	metadata := map[string]interface{}{
		"tenantId":    tenant.ID,
		"tenantName":  tenant.Name,
		"generatedAt": time.Now().UTC().Format(time.RFC3339),
		"agents":      tenant.Agents,
		"regions":     tenant.Regions,
		"version":     "1.0.0",
	}
	
	// Phase 12: Add federation metadata if available
	if tenant.Config != nil {
		if federationMeta, ok := tenant.Config["federation"]; ok {
			metadata["federation"] = federationMeta
		}
	}
	
	// Phase 13.10: Generate federation token envelope for Pi bootstrap
	// Create a pre-signed federation token for this node/tenant
	if tenant.ID != "" && tenant.Region != "" {
		// Generate a node ID from tenant ID (or use provided nodeId if available)
		nodeID := "node-" + tenant.ID[:8]
		if tenant.Config != nil {
			if nodeIDFromConfig, ok := tenant.Config["nodeId"].(string); ok && nodeIDFromConfig != "" {
				nodeID = nodeIDFromConfig
			}
		}
		
		// Generate bootstrap fingerprint (simplified for now)
		fingerprint := "bootstrap-" + tenant.ID
		
		// Create and sign federation token using Ed25519
		// Import federation package to sign token
		payload := federation.FederationTokenPayload{
			NodeID:      nodeID,
			TenantID:    tenant.ID,
			Fingerprint: fingerprint,
			IssuedAt:    time.Now().UnixMilli(),
		}
		
		signedToken, err := federation.SignFederationToken(payload)
		if err == nil {
			// Include signed token in envelope
			metadata["federationEnvelope"] = map[string]interface{}{
				"token":       signedToken,
				"nodeId":      nodeID,
				"tenantId":    tenant.ID,
				"region":      tenant.Region,
				"source":      "bootstrap",
				"ts":          time.Now().UnixMilli(),
			}
		} else {
			// Fallback: include envelope structure without token
			// Pi will need to perform handshake to get token
			metadata["federationEnvelope"] = map[string]interface{}{
				"nodeId":      nodeID,
				"tenantId":    tenant.ID,
				"region":      tenant.Region,
				"source":      "bootstrap",
				"ts":          time.Now().UnixMilli(),
				"note":        "Token generation failed, handshake required",
			}
		}
	}
	metadataJSON, _ := json.MarshalIndent(metadata, "", "  ")
	if err := writeFile(zipWriter, "metadata.json", metadataJSON); err != nil {
		return nil, err
	}

	if err := zipWriter.Close(); err != nil {
		return nil, fmt.Errorf("failed to close zip writer: %w", err)
	}

	zipData := buf.Bytes()

	// Compute SHA256 fingerprint
	hash := sha256.Sum256(zipData)
	fingerprint := "sha256:" + hex.EncodeToString(hash[:])

	return &BootstrapKit{
		ZIPData:     zipData,
		Fingerprint: fingerprint,
		Size:        int64(len(zipData)),
	}, nil
}

// writeFile writes a file to the zip archive
func writeFile(zipWriter *zip.Writer, filename string, content []byte) error {
	writer, err := zipWriter.Create(filename)
	if err != nil {
		return fmt.Errorf("failed to create file %s: %w", filename, err)
	}
	_, err = writer.Write(content)
	return err
}

// generateCertificate generates a self-signed certificate for the tenant
func generateCertificate(privateKey *rsa.PrivateKey, tenant TenantInfo) ([]byte, error) {
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization:  []string{tenant.Name},
			Country:       []string{"US"},
			Province:      []string{},
			Locality:      []string{},
			StreetAddress: []string{},
			PostalCode:    []string{},
			CommonName:    tenant.Domain,
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour), // 1 year
		KeyUsage:              x509.KeyUsageKeyEncipherment | x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}

	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
	if err != nil {
		return nil, err
	}

	return certDER, nil
}

// generateREADME generates the README.md content
func generateREADME(tenant TenantInfo) []byte {
	agentsStr := fmt.Sprintf("%v", tenant.Agents)
	content := fmt.Sprintf(`# SAGE Bootstrap Kit

## Tenant Information

- **Tenant ID**: %s
- **Tenant Name**: %s
- **Domain**: %s
- **Primary Region**: %s
- **Generated**: %s

## Contents

This bootstrap kit contains:

- Kubernetes manifests for namespace and RBAC setup
- Agent configurations for: %s
- Data region configuration
- Access configuration (%s)
- Tenant-specific certificates and keys
- Metadata and instructions

## Installation

1. Extract this archive
2. Review the manifests in manifests/
3. Apply the namespace first:
   kubectl apply -f manifests/namespace.yaml
4. Apply RBAC:
   kubectl apply -f manifests/rbac.yaml
5. Apply data regions config:
   kubectl apply -f manifests/data-regions.yaml
6. Apply access config:
   kubectl apply -f manifests/access-config.yaml
7. Apply agent configs:
   kubectl apply -f manifests/agents/

## Verification

Verify the bootstrap kit fingerprint:

sage verify-kit --tenant %s --fingerprint <fingerprint>

## Security

- Keep secrets/ directory secure
- Do not commit private keys to version control
- Rotate certificates before expiration

## Support

For issues or questions, contact: %s
`, tenant.ID, tenant.Name, tenant.Domain, tenant.Region, time.Now().UTC().Format(time.RFC3339),
		agentsStr, tenant.Access.AuthMethod, tenant.ID, tenant.Email)
	return []byte(content)
}

// generateNamespace generates the namespace manifest
func generateNamespace(tenant TenantInfo) []byte {
	namespaceName := fmt.Sprintf("tenant-%s", sanitizeName(tenant.Name))
	content := fmt.Sprintf(`apiVersion: v1
kind: Namespace
metadata:
  name: %s
  labels:
    tenant-id: "%s"
    tenant-name: "%s"
    pod-security.kubernetes.io/enforce: "restricted"
    pod-security.kubernetes.io/audit: "restricted"
    pod-security.kubernetes.io/warn: "restricted"
`, namespaceName, tenant.ID, tenant.Name)
	return []byte(content)
}

// generateRBAC generates the RBAC manifest
func generateRBAC(tenant TenantInfo) []byte {
	namespaceName := fmt.Sprintf("tenant-%s", sanitizeName(tenant.Name))
	content := fmt.Sprintf(`apiVersion: v1
kind: ServiceAccount
metadata:
  name: tenant-admin
  namespace: %s
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-admin
  namespace: %s
rules:
  - apiGroups: [""]
    resources: ["pods", "services", "configmaps", "secrets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: ["apps"]
    resources: ["deployments", "statefulsets", "replicasets"]
    verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tenant-admin
  namespace: %s
subjects:
  - kind: ServiceAccount
    name: tenant-admin
    namespace: %s
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tenant-admin
`, namespaceName, namespaceName, namespaceName, namespaceName)
	return []byte(content)
}

// generateDataRegions generates the data regions configuration
func generateDataRegions(tenant TenantInfo) []byte {
	regionsJSON, _ := json.Marshal(tenant.Regions)
	sensitivity := tenant.Sensitivity
	if sensitivity == "" {
		sensitivity = "None"
	}
	content := fmt.Sprintf(`apiVersion: v1
kind: ConfigMap
metadata:
  name: data-regions-config
  namespace: tenant-%s
data:
  selectedRegions: '%s'
  sensitivity: "%s"
  residencyRequired: "true"
`, sanitizeName(tenant.Name), string(regionsJSON), sensitivity)
	return []byte(content)
}

// generateAccessConfig generates the access configuration
func generateAccessConfig(tenant TenantInfo) []byte {
	namespaceName := fmt.Sprintf("tenant-%s", sanitizeName(tenant.Name))

	var content string
	if tenant.Access.AuthMethod == "local" {
		content = fmt.Sprintf(`apiVersion: v1
kind: Secret
metadata:
  name: access-config
  namespace: %s
type: Opaque
stringData:
  authMethod: "local"
  adminEmail: "%s"
  scimEnabled: "false"
`, namespaceName, tenant.Access.AdminEmail)
	} else {
		content = fmt.Sprintf(`apiVersion: v1
kind: Secret
metadata:
  name: access-config
  namespace: %s
type: Opaque
stringData:
  authMethod: "sso"
  identityProvider: "%s"
  clientId: "%s"
  clientSecret: "%s"
  callbackUrl: "%s"
  scimEnabled: "%t"
`, namespaceName, tenant.Access.IdentityProvider, tenant.Access.ClientId,
			tenant.Access.ClientSecret, tenant.Access.CallbackUrl, tenant.Access.ScimEnabled)
	}
	return []byte(content)
}

// Phase 10: generateIdentityConfig generates the identity configuration manifest
func generateIdentityConfig(tenant TenantInfo) []byte {
	namespaceName := fmt.Sprintf("tenant-%s", sanitizeName(tenant.Name))

	content := fmt.Sprintf(`apiVersion: v1
kind: ConfigMap
metadata:
  name: identity-config
  namespace: %s
data:
  identityProvider: "%s"
  clientId: "%s"
  callbackUrl: "%s"
  scimEnabled: "%t"
---
apiVersion: v1
kind: Secret
metadata:
  name: identity-secret
  namespace: %s
type: Opaque
stringData:
  clientSecret: "%s"
`, namespaceName, tenant.Access.IdentityProvider, tenant.Access.ClientId,
		tenant.Access.CallbackUrl, tenant.Access.ScimEnabled,
		namespaceName, tenant.Access.ClientSecret)

	return []byte(content)
}

// generateTenantConfig generates the tenant configuration
func generateTenantConfig(tenant TenantInfo) []byte {
	namespaceName := fmt.Sprintf("tenant-%s", sanitizeName(tenant.Name))
	content := fmt.Sprintf(`apiVersion: v1
kind: ConfigMap
metadata:
  name: tenant-config
  namespace: %s
data:
  tenantId: "%s"
  tenantName: "%s"
  domain: "%s"
  region: "%s"
  email: "%s"
`, namespaceName, tenant.ID, tenant.Name, tenant.Domain, tenant.Region, tenant.Email)
	return []byte(content)
}

// generateAgentConfig generates configuration for a specific agent
func generateAgentConfig(agentID string, tenant TenantInfo) []byte {
	namespaceName := fmt.Sprintf("tenant-%s", sanitizeName(tenant.Name))

	// Agent-specific configurations
	agentConfigs := map[string]string{
		"researcher": `apiVersion: v1
kind: ConfigMap
metadata:
  name: researcher-agent-config
  namespace: %s
data:
  enabled: "true"
  mode: "data-gathering"
  externalRetrieval: "enabled"
`,
		"audit-logger": `apiVersion: v1
kind: ConfigMap
metadata:
  name: audit-logger-config
  namespace: %s
data:
  enabled: "true"
  mode: "immutable-logging"
  compliance: "enabled"
`,
		"etl-lite": `apiVersion: v1
kind: ConfigMap
metadata:
  name: etl-lite-config
  namespace: %s
data:
  enabled: "true"
  mode: "basic-processing"
  ingestion: "enabled"
`,
		"notification-relay": `apiVersion: v1
kind: ConfigMap
metadata:
  name: notification-relay-config
  namespace: %s
data:
  enabled: "true"
  mode: "async-messaging"
  alerts: "enabled"
`,
		"observer": `apiVersion: v1
kind: ConfigMap
metadata:
  name: observer-agent-config
  namespace: %s
data:
  enabled: "true"
  mode: "passive-telemetry"
  driftDetection: "enabled"
`,
	}

	template := agentConfigs[agentID]
	if template == "" {
		// Default template for unknown agents
		template = `apiVersion: v1
kind: ConfigMap
metadata:
  name: %s-config
  namespace: %s
data:
  enabled: "true"
`
		return []byte(fmt.Sprintf(template, agentID, namespaceName))
	}

	return []byte(fmt.Sprintf(template, namespaceName))
}

// sanitizeName sanitizes a name for use in Kubernetes resources
func sanitizeName(name string) string {
	// Convert to lowercase and replace invalid characters
	result := ""
	for _, r := range name {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			result += string(r)
		} else if r >= 'A' && r <= 'Z' {
			result += string(r + 32) // to lowercase
		} else {
			result += "-"
		}
	}
	// Remove leading/trailing dashes and limit length
	if len(result) > 63 {
		result = result[:63]
	}
	return result
}
