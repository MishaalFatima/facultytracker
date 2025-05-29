import React, { useEffect, useState } from "react";
import {
  ImageBackground,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import DropDownPicker from "react-native-dropdown-picker";
import * as ImagePicker from "expo-image-picker";
import NetInfo from "@react-native-community/netinfo";

import { firestore, storage } from "./firebaseConfig";
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const SignUpScreen = ({ navigation }) => {
  // --- Form state ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [campusName, setCampusName] = useState("");
  const [session, setSession] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [gender, setGender] = useState("");
  const [FacultyType, setFacultyType] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // --- Dropdown data ---
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  const [crgrSemester, setCrgrSemester] = useState("");
  const [openDept, setOpenDept] = useState(false);
  const [openProg, setOpenProg] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Monitor connectivity
  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) =>
      setIsConnected(state.isConnected)
    );
    return () => unsub();
  }, []);

  // Fetch departments
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDocs(collection(firestore, "departments"));
        setDepartmentsList(
          snap.docs.map((d) => ({
            label: d.data().name,
            value: d.id,
          }))
        );
      } catch (e) {
        console.error("Error fetching departments:", e);
      } finally {
        setLoadingDepartments(false);
      }
    })();
  }, []);

  // Fetch programs only when CR/GR and department selected
  useEffect(() => {
    if (role !== "CR/GR" || department === "") {
      setProgramsList([]);
      return;
    }
    setLoadingPrograms(true);
    (async () => {
      try {
        const q = query(
          collection(firestore, "programs"),
          where("departmentId", "==", department)
        );
        const snap = await getDocs(q);
        setProgramsList(
          snap.docs.map((d) => ({
            label: d.data().name,
            value: d.id,
          }))
        );
      } catch (e) {
        console.error("Error fetching programs:", e);
      } finally {
        setLoadingPrograms(false);
      }
    })();
  }, [department, role]);

  // Image picker
  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("");
    setPhoneNumber("");
    setRegistrationNumber("");
    setDesignation("");
    setCampusName("");
    setSession("");
    setPassword("");
    setGender("");
    setFacultyType("");
    setImage(null);
    setDepartment("");
    setProgram("");
    setCrgrSemester("");
  };

  // Sign-up handler
  const handleSignUp = async () => {
    setLoading(true);

    // 1️⃣ Check connectivity
    if (!isConnected) {
      Alert.alert("No Internet", "Please connect and try again.");
      setLoading(false);
      return;
    }

    // 2️⃣ Basic validation
    if (
      !name ||
      !email ||
      !registrationNumber ||
      !phoneNumber ||
      !campusName ||
      !gender ||
      !role ||
      !password
    ) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      setLoading(false);
      return;
    }
    if (!email.endsWith("@gmail.com")) {
      Alert.alert("Invalid Email", "Must end with @gmail.com");
      setLoading(false);
      return;
    }
    if (!/^\+923\d{9}$/.test(phoneNumber)) {
      Alert.alert("Invalid Phone", "Use +923 followed by 9 digits.");
      setLoading(false);
      return;
    }
    if (role === "CR/GR" && !/^\d{4}-\d{4}$/.test(session)) {
      Alert.alert("Invalid Session", "Format: YYYY-YYYY");
      setLoading(false);
      return;
    }

    // 3️⃣ NEW: Check if this email already exists in "users" collection
    try {
      const userQuery = query(
        collection(firestore, "users"),
        where("email", "==", email)
      );
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        Alert.alert(
          "Email Taken",
          "A user already exists with this email address."
        );
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Error checking existing users:", err);
      // we can continue; or optionally bail out here:
      setLoading(false);
      Alert.alert("Error", "Could not verify email uniqueness.");
      return;
    }

    // 4️⃣ Upload image if present
    let imageUrl = "";
    if (image) {
      try {
        const blob = await (await fetch(image)).blob();
        const imageRef = ref(
          storage,
          `pending/${Date.now()}_${registrationNumber}.jpg`
        );
        await uploadBytes(imageRef, blob);
        imageUrl = await getDownloadURL(imageRef);
      } catch (err) {
        console.error("Image upload failed:", err);
        Alert.alert("Upload Error", "Could not upload image.");
        setLoading(false);
        return;
      }
    }

    // 5️⃣ Build payload & submit to pendingRequests
    const payload = {
      name,
      email,
      registrationNumber,
      phoneNumber,
      campusName,
      gender,
      role,
      imageUrl,
      requestedAt: new Date().toISOString(),
      password,
      ...(role === "Faculty" && {
        FacultyType,
        designation,
        department,
      }),
      ...(role === "CR/GR" && {
        department,
        program,
        session,
        semester: crgrSemester,
      }),
    };

    try {
      await setDoc(doc(firestore, "pendingRequests", email), payload);
      Alert.alert(
        "Request Sent",
        "Your sign-up request is pending admin approval."
      );
      resetForm();
    } catch (err) {
      console.error("Sign-up error:", err);
      Alert.alert("Error", err.message || "Could not send request.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#08422d" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require("../../assets/ss.jpg")}
        style={styles.background}
        imageStyle={{ resizeMode: "cover" }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Sign Up</Text>

          {/* Login link */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* --- Common Fields --- */}
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputContainer}>
            <Icon name="person" size={24} color="#08422d" />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Icon name="email" size={24} color="#08422d" />
            <TextInput
              style={styles.input}
              placeholder="you@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Text style={styles.label}>Registration No.</Text>
          <View style={styles.inputContainer}>
            <Icon name="assignment" size={24} color="#08422d" />
            <TextInput
              style={styles.input}
              placeholder="Reg#"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />
          </View>

          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputContainer}>
            <Icon name="phone" size={24} color="#08422d" />
            <TextInput
              style={styles.input}
              placeholder="+923XXXXXXXXX"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          <Text style={styles.label}>Campus</Text>
          <View style={styles.inputContainer}>
            <Icon name="location-city" size={24} color="#08422d" />
            <TextInput
              style={styles.input}
              placeholder="Campus Name"
              value={campusName}
              onChangeText={setCampusName}
            />
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.inputContainer}>
            <Icon name="people" size={24} color="#08422d" />
            <Picker
              selectedValue={gender}
              style={styles.picker}
              onValueChange={setGender}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          <Text style={styles.label}>Role</Text>
          <View style={styles.inputContainer}>
            <Icon name="work" size={24} color="#08422d" />
            <Picker
              selectedValue={role}
              style={styles.picker}
              onValueChange={setRole}
            >
              <Picker.Item label="Select Role" value="" />
              <Picker.Item label="Principal" value="Principal" />
              <Picker.Item label="Faculty" value="Faculty" />
              <Picker.Item label="CR/GR" value="CR/GR" />
            </Picker>
          </View>

          {/* Principal image */}
          {role === "Principal" && (
            <>
              <Text style={styles.label}>Upload Image</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePick}
              >
                <Text style={styles.uploadButtonText}>
                  {image ? "Change Image" : "Upload Image"}
                </Text>
              </TouchableOpacity>
              {image && (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              )}
            </>
          )}

          {/* Department dropdown for Faculty & CR/GR */}
          {(role === "Faculty" || role === "CR/GR") && (
            <>
              <Text style={styles.label}>Department</Text>
              {loadingDepartments ? (
                <ActivityIndicator />
              ) : (
                <DropDownPicker
                  open={openDept}
                  value={department}
                  items={departmentsList}
                  setOpen={setOpenDept}
                  setValue={setDepartment}
                  searchable={true}
                  placeholder="Select Department..."
                  listMode="MODAL"
                  zIndex={3000}
                  zIndexInverse={1000}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
              )}
            </>
          )}

          {/* Program & session/semester only for CR/GR */}
          {role === "CR/GR" && (
            <>
              <Text style={styles.label}>Program</Text>
              {loadingPrograms ? (
                <ActivityIndicator />
              ) : (
                <DropDownPicker
                  open={openProg}
                  value={program}
                  items={programsList}
                  setOpen={setOpenProg}
                  setValue={setProgram}
                  searchable={true}
                  placeholder="Select Program..."
                  listMode="MODAL"
                  disabled={!department}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropdownContainer}
                />
              )}

              <Text style={styles.label}>Session</Text>
              <View style={styles.inputContainer}>
                <Icon name="date-range" size={24} color="#08422d" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 2021-2025"
                  value={session}
                  onChangeText={setSession}
                />
              </View>

              <Text style={styles.label}>Semester</Text>
              <Picker
                selectedValue={crgrSemester}
                style={styles.picker}
                onValueChange={setCrgrSemester}
              >
                <Picker.Item label="Select Sem." value="" />
                {[...Array(8)].map((_, i) => (
                  <Picker.Item
                    key={i + 1}
                    label={`Semester ${i + 1}`}
                    value={`${i + 1}`}
                  />
                ))}
              </Picker>
            </>
          )}

          {/* Faculty-only fields */}
          {role === "Faculty" && (
            <>
              <Text style={styles.label}>Faculty Type</Text>
              <Picker
                selectedValue={FacultyType}
                style={styles.picker}
                onValueChange={setFacultyType}
              >
                <Picker.Item label="Select Type" value="" />
                <Picker.Item label="Visiting" value="Visiting" />
                <Picker.Item label="Permanent" value="Permanent" />
              </Picker>

              <Text style={styles.label}>Designation</Text>
              <View style={styles.inputContainer}>
                <Icon name="work" size={24} color="#08422d" />
                <TextInput
                  style={styles.input}
                  placeholder="Designation"
                  value={designation}
                  onChangeText={setDesignation}
                />
              </View>

              <Text style={styles.label}>Upload Image</Text>
              <TouchableOpacity
                style={styles.uploadButton}
                onPress={handleImagePick}
              >
                <Text style={styles.uploadButtonText}>
                  {image ? "Change Image" : "Upload Image"}
                </Text>
              </TouchableOpacity>
              {image && (
                <Image source={{ uri: image }} style={styles.imagePreview} />
              )}
            </>
          )}

          {/* Password & submit */}
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#08422d" />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              secureTextEntry={!isPasswordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible((v) => !v)}
            >
              <Icon
                name={isPasswordVisible ? "visibility-off" : "visibility"}
                size={24}
                color="#08422d"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSignUp}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  background: { flex: 1 },
  container: { padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#08422d",
    marginVertical: 10,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginText: { color: "#000" },
  loginLink: {
    color: "red",
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  label: { fontSize: 16, color: "#08422d", marginTop: 12 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  input: { flex: 1, height: 40, marginLeft: 5, color: "#08422d" },
  picker: { flex: 1, height: 40 },
  dropdown: { borderColor: "#ccc", height: 50 },
  dropdownContainer: { borderColor: "#ccc", maxHeight: 200 },
  uploadButton: {
    backgroundColor: "#08422d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 8,
  },
  uploadButtonText: { color: "#fff" },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginTop: 8,
  },
  button: {
    backgroundColor: "#08422d",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 20,
  },
  buttonText: { color: "#fff", fontSize: 16 },
});

export default SignUpScreen;
