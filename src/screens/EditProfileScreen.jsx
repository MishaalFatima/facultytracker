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
import { Picker } from "@react-native-picker/picker";
import {
  getFirestore,
  doc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  getAuth,
  updateEmail,
  EmailAuthProvider,
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
      "name","email","currentPassword","newPassword","gender",
      "registrationNumber","campusName","phoneNumber","designation","imageUrl",
    ],
    Faculty: [
      "name","email","currentPassword","newPassword","gender",
      "registrationNumber","campusName","phoneNumber","designation",
      "FacultyType","department","imageUrl",
    ],
    "CR/GR": [
      "name","email","currentPassword","newPassword","gender",
      "registrationNumber","campusName","phoneNumber",
      "department","program","session",
    ],
    Admin: [
      "name","email","currentPassword","newPassword","gender",
      "registrationNumber","phoneNumber","imageUrl",
    ],
  };

  const genderOptions = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  const [formData, setFormData] = useState({
    ...profile,
    currentPassword: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [programs, setPrograms] = useState([]);

  // Keep only role‐specific fields in formData
  useEffect(() => {
    if (!profile.role) return;
    const allowed = roleFields[profile.role] || [];
    setFormData(prev => {
      const trimmed = {};
      allowed.forEach(f => {
        trimmed[f] = prev[f] ?? "";
      });
      return trimmed;
    });
  }, [profile.role]);

  // Load departments for dropdown
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, "departments"));
      setDepartments(
        snap.docs.map(d => ({ label: d.data().name, value: d.id }))
      );
    })();
  }, []);

  // Load programs for selected department (top‐level "programs" collection)
  useEffect(() => {
    if (profile.role !== "CR/GR" || !formData.department) {
      setPrograms([]);
      return;
    }
    (async () => {
      try {
        const q = query(
          collection(db, "programs"),
          where("departmentId", "==", formData.department)
        );
        const snap = await getDocs(q);
        setPrograms(
          snap.docs.map(d => ({
            label: d.data().name,
            value: d.id,
          }))
        );
      } catch (err) {
        console.error("Error fetching programs:", err);
        setPrograms([]);
      }
    })();
  }, [formData.department, profile.role]);

  const validateFields = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (!formData[key]?.toString().trim() && key !== "newPassword") {
        newErrors[key] = "This field is required";
      }
    });
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    }
    if (formData.phoneNumber && !/^\+923\d{9}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone must start with +923 and have 13 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key, value) =>
    setFormData(prev => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!validateFields()) {
      Alert.alert("Validation Error", "Please fix the errors before saving.");
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not found!");
      return;
    }
    try {
      if (formData.currentPassword) {
        const cred = EmailAuthProvider.credential(
          user.email,
          formData.currentPassword
        );
        await reauthenticateWithCredential(user, cred);
      }
      if (formData.newPassword) {
        await updatePassword(user, formData.newPassword);
      }
      if (formData.email !== user.email) {
        await updateEmail(user, formData.email);
      }
      const { currentPassword, newPassword, ...toUpdate } = formData;
      if (newPassword) toUpdate.password = newPassword;
      await updateDoc(doc(db, "users", user.uid), toUpdate);

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (err) {
      console.error(err);
      Alert.alert("Error", err.message);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      try {
        const resp = await fetch(result.assets[0].uri);
        const blob = await resp.blob();
        const imgRef = ref(storage, `profile_images/${auth.currentUser.uid}.jpg`);
        await uploadBytes(imgRef, blob);
        const url = await getDownloadURL(imgRef);
        setFormData(prev => ({ ...prev, imageUrl: url }));
        Alert.alert("Success", "Image uploaded successfully");
      } catch {
        Alert.alert("Error", "Failed to upload image");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {["Faculty", "Principal", "Admin"].includes(profile.role) && (
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

      {/* Current & New Password */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Current Password</Text>
        <TextInput
          style={[styles.input, errors.currentPassword && styles.inputError]}
          value={formData.currentPassword}
          secureTextEntry
          onChangeText={t => handleChange("currentPassword", t)}
        />
        {errors.currentPassword && (
          <Text style={styles.errorText}>{errors.currentPassword}</Text>
        )}
      </View>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <TextInput
          style={[styles.input, errors.newPassword && styles.inputError]}
          value={formData.newPassword}
          secureTextEntry
          onChangeText={t => handleChange("newPassword", t)}
        />
        {errors.newPassword && (
          <Text style={styles.errorText}>{errors.newPassword}</Text>
        )}
      </View>

      {roleFields[profile.role]?.map(key => {
        if (["imageUrl","currentPassword","newPassword"].includes(key)) return null;

        if (key === "department") {
          return (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>Department</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.department}
                  onValueChange={val => handleChange("department", val)}
                >
                  <Picker.Item label="Select department..." value="" />
                  {departments.map(dep => (
                    <Picker.Item
                      key={dep.value}
                      label={dep.label}
                      value={dep.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.department && (
                <Text style={styles.errorText}>{errors.department}</Text>
              )}
            </View>
          );
        }

        if (key === "program") {
          return (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>Program</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.program}
                  onValueChange={val => handleChange("program", val)}
                >
                  <Picker.Item label="Select program..." value="" />
                  {programs.map(p => (
                    <Picker.Item
                      key={p.value}
                      label={p.label}
                      value={p.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.program && (
                <Text style={styles.errorText}>{errors.program}</Text>
              )}
            </View>
          );
        }

        if (key === "gender") {
          return (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={formData.gender}
                  onValueChange={val => handleChange("gender", val)}
                >
                  <Picker.Item label="Select gender..." value="" />
                  {genderOptions.map(g => (
                    <Picker.Item
                      key={g.value}
                      label={g.label}
                      value={g.value}
                    />
                  ))}
                </Picker>
              </View>
              {errors.gender && (
                <Text style={styles.errorText}>{errors.gender}</Text>
              )}
            </View>
          );
        }

        // All other fields
        return (
          <View key={key} style={styles.inputContainer}>
            <Text style={styles.label}>
              {key.replace(/([A-Z])/g, " $1").trim()}
            </Text>
            <TextInput
              style={[styles.input, errors[key] && styles.inputError]}
              value={formData[key]}
              onChangeText={t => handleChange(key, t)}
            />
            {errors[key] && (
              <Text style={styles.errorText}>{errors[key]}</Text>
            )}
          </View>
        );
      })}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, backgroundColor: "#f0f0f0" },
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
  uploadButtonText: { color: "#fff", fontWeight: "bold" },
  inputContainer: { marginBottom: 12 },
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
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  inputError: { borderColor: "red" },
  errorText: { color: "red", fontSize: 12, marginTop: 2 },
  saveButton: {
    backgroundColor: "#08422d",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: { fontSize: 18, color: "#fff", fontWeight: "bold" },
});

export default EditProfileScreen;
