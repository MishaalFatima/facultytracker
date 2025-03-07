import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { getFirestore, doc, updateDoc } from "firebase/firestore";
import {
  getAuth,
  updateEmail,
  EmailAuthProvider,
  sendEmailVerification,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { useRoute } from "@react-navigation/native";

const EditProfileScreen = ({ navigation }) => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const route = useRoute();
  const { profile } = route.params;

  const roleFields = {
    Principal: [
      "name",
      "email",
      "currentPassword",
      "newPassword",
      "gender",
      "registrationNumber",
      "campusName",
      "phoneNumber",
      "designation",
      "imageUrl",
    ],
    Faculty: [
      "name",
      "email",
      "currentPassword",
      "newPassword",
      "gender",
      "registrationNumber",
      "campusName",
      "phoneNumber",
      "designation",
      "FacultyType",
      "department",
      "imageUrl",
    ],
    "CR/GR": [
      "name",
      "email",
      "currentPassword",
      "newPassword",
      "gender",
      "registrationNumber",
      "campusName",
      "phoneNumber",
      "department",
      "programName",
      "session",
    ],
    Admin: [
      "name",
      "email",
      "currentPassword",
      "newPassword",
      "gender",
      "campusName",
      "phoneNumber",
      "registrationNumber",
    ],
  };

  // Initialize formData with current profile info plus password fields
  const [formData, setFormData] = useState({
    ...profile,
    currentPassword: "",
    newPassword: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!profile.role) return;
    const allowedFields = roleFields[profile.role] || [];
    setFormData((prevData) => {
      return allowedFields.reduce((acc, field) => {
        acc[field] = prevData[field] || "";
        return acc;
      }, {});
    });
  }, [profile.role]);

  const validateFields = () => {
    let newErrors = {};

    // Validate all fields except newPassword (which is optional)
    Object.keys(formData).forEach((key) => {
      if (!formData[key]?.trim() && key !== "newPassword") {
        newErrors[key] = "This field is required";
      }
    });

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters long";
    }

    if (formData.phoneNumber && !/^\+923\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber =
        "Phone number must start with +923 and have 13 digits.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key, value) => {
    setFormData((prevData) => ({ ...prevData, [key]: value }));
  };

  const handleSave = async () => {
    if (!validateFields()) {
      Alert.alert("Validation Error", "Please fix the errors before saving.");
      return;
    }

    const user = auth.currentUser;
    const userId = user?.uid;

    if (!userId) {
      Alert.alert("Error", "User not found!");
      return;
    }

    try {
      // Reauthenticate using the current password
      if (formData.currentPassword) {
        const credential = EmailAuthProvider.credential(
          user.email,
          formData.currentPassword
        );
        await reauthenticateWithCredential(user, credential);
      }

      // Update password in Firebase Auth (if provided)
      if (formData.newPassword) {
        await updatePassword(user, formData.newPassword);
      }

      // Update email in Firebase Auth if it was changed
      if (formData.email !== user.email) {
        console.log("Updating email in Firebase Auth...");
        await updateEmail(user, formData.email);
        console.log("Email updated successfully in Firebase Auth");
      }

      // Prepare updated data for Firestore (updating existing "password" field)
      const { currentPassword, newPassword, ...updateData } = formData;

      // If newPassword exists, add it to Firestore's existing "password" field
      if (formData.newPassword) {
        updateData.password = formData.newPassword;
      }

      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, updateData);

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.log("Error updating profile:", error);
      Alert.alert("Error", error.message);
    }
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const selectedImage = result.assets[0].uri;
      uploadImage(selectedImage);
    }
  };

  const uploadImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const imageRef = ref(
        storage,
        `profile_images/${auth.currentUser.uid}.jpg`
      );
      await uploadBytes(imageRef, blob);
      const downloadURL = await getDownloadURL(imageRef);
      setFormData((prevData) => ({ ...prevData, imageUrl: downloadURL }));
      Alert.alert("Success", "Image uploaded successfully");
    } catch (error) {
      Alert.alert("Error", "Failed to upload image");
      console.error(error);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {(profile.role === "Faculty" || profile.role === "Principal") && (
        <>
          <Image
            source={{
              uri: formData.imageUrl || "https://via.placeholder.com/100",
            }}
            style={styles.profileImage}
          />
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickImage}
          >
            <Text style={styles.uploadButtonText}>Change Image</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Current Password Field */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={[styles.input, errors.currentPassword && styles.inputError]}
          value={formData.currentPassword}
          onChangeText={(text) => handleChange("currentPassword", text)}
          secureTextEntry
        />
        {errors.currentPassword && (
          <Text style={styles.errorText}>{errors.currentPassword}</Text>
        )}
      </View>

      {/* New Password Field */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={[styles.input, errors.newPassword && styles.inputError]}
          value={formData.newPassword}
          onChangeText={(text) => handleChange("newPassword", text)}
          secureTextEntry
        />
        {errors.newPassword && (
          <Text style={styles.errorText}>{errors.newPassword}</Text>
        )}
      </View>

      {/* Other fields */}
      {Object.keys(formData).map(
        (key) =>
          key !== "imageUrl" &&
          key !== "currentPassword" &&
          key !== "newPassword" && (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>
                {key.replace(/([A-Z])/g, " $1").trim()}
              </Text>
              <TextInput
                style={[styles.input, errors[key] && styles.inputError]}
                value={formData[key]}
                onChangeText={(text) => handleChange(key, text)}
              />
              {errors[key] && (
                <Text style={styles.errorText}>{errors[key]}</Text>
              )}
            </View>
          )
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: "#f0f0f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 15,
    textAlign: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: "#08422d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#08422d",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputError: {
    borderColor: "red",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginTop: 2,
  },
  saveButton: {
    backgroundColor: "#08422d",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
});

export default EditProfileScreen;
