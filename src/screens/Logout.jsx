import React from "react";
import { Alert, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { signOut } from "firebase/auth"; // Importing signOut from the modular SDK
import { auth } from "./firebaseConfig"; // Import the auth instance from your firebase config

const Logout = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Using signOut from the modular SDK
      Alert.alert("Logged out successfully");

      // Reset navigation to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }], // Navigate to 'Login' screen after logout
      });
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
    }
  };

  return (
    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
      <FontAwesome
        name="sign-out"
        size={20}
        color="white"
        style={styles.icon}
      />
      <Text style={styles.buttonText}>Logout</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d32f2f", // Red color for logout
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 8,
  },
  icon: {
    marginRight: 8,
  },
});

export default Logout;
