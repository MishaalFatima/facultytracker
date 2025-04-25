import React, { useState } from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

const LockScreenModal = ({ visible, onUnlock, onCancel }) => {
  const [authenticating, setAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    setAuthenticating(true);
    try {
      // Check if hardware supports local authentication
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        alert("Device does not support biometric authentication.");
        setAuthenticating(false);
        return;
      }

      // Check if biometrics are enrolled
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) {
        alert("No biometric records found. Please set up your biometrics or use your device passcode.");
        setAuthenticating(false);
        return;
      }

      // Prompt for authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate",
        fallbackLabel: "Enter Passcode", // This will fallback to device PIN if available
        disableDeviceFallback: false,   // Allows PIN/passcode fallback
      });

      if (result.success) {
        onUnlock();
      } else {
        alert("Authentication failed, please try again.");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert("An error occurred during authentication.");
    }
    setAuthenticating(false);
  };

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.lockScreen}>
          <Text style={styles.title}>Unlock Screen</Text>
          {authenticating ? (
            <ActivityIndicator size="large" color="#08422d" />
          ) : (
            <>
              <TouchableOpacity style={styles.button} onPress={handleBiometricAuth}>
                <Text style={styles.buttonText}>Authenticate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  lockScreen: {
    width: "80%",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#08422d",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    marginTop: 15,
  },
  cancelText: {
    color: "#08422d",
  },
});

export default LockScreenModal;
