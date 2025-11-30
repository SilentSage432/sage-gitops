// Phase 73: Registerable Hardware Identity
// Operator model with hardware key support
// This enables storing and associating a hardware credential with an operator
// No authentication yet. No enforcement. No routing with the key yet.
// Just the ability to persist it.

// In-memory operator store (simulation)
// Later this will be persisted to database
let operatorStore = {
  hardwareKey: {
    id: null,
    publicKey: null,
    registeredAt: null,
  },
};

export function getOperatorModel() {
  return {
    ...operatorStore,
  };
}

export function updateOperatorModel(updates) {
  operatorStore = {
    ...operatorStore,
    ...updates,
  };
  return operatorStore;
}

export function getHardwareKey() {
  return operatorStore.hardwareKey || {
    id: null,
    publicKey: null,
    registeredAt: null,
  };
}

export function setHardwareKey(hardwareKey) {
  operatorStore.hardwareKey = {
    ...hardwareKey,
    registeredAt: hardwareKey.registeredAt || Date.now(),
  };
  return operatorStore.hardwareKey;
}

