import React from "react";
import {
  View,
  Button,
  StyleSheet,
} from "react-native";

const ProfileUodateButtonFD = () => {
  return (
    <View style={styles.profileUpdateContainer}>
      <Button
        title="Edit Profile"
        color="#08422d"
        onPress={() => alert("Editing profile")}
      />
    </View>
  );
};

const styles = StyleSheet.create({

  statusContainer: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderColor: "#08422d",
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 10,
  },
  profileUpdateContainer: {
    padding: 10,
    marginVertical: 10,
    backgroundColor: "white",
    borderRadius: 10,
    borderColor: "#08422d",
    borderWidth: 1,
  },
});

export default ProfileUodateButtonFD;
