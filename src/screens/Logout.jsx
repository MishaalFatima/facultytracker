import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import {
  query,
  where,
  getDocs,
  collection,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth } from "./firebaseConfig";
import LoadingScreen from "./LoadingScreen";

const Logout = () => {
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleLogout = async () => {
    setLoading(true);

    try {
      // Log the user out
      await signOut(auth);
      Alert.alert("Logged out successfully");

      // Reset navigation to the login screen
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    } catch (error) {
      Alert.alert("Error", "Failed to log out");
      console.log("Failed to log out:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />; // Show the loading screen when the loading state is true
  }

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
