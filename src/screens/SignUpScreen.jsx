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
import * as ImagePicker from "expo-image-picker";
import { firestore, storage } from "./firebaseConfig";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import LoadingScreen from "./LoadingScreen";
import NetInfo from "@react-native-community/netinfo";

const SignUpScreen = ({ navigation }) => {
  // Basic form states
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
  const [isConnected, setIsConnected] = useState(false);

  // Dropdown data for CR/GR and Faculty roles
  const [department, setDepartment] = useState("");
  const [program, setProgram] = useState("");
  // New field: CR/GR Semester
  const [crgrSemester, setCrgrSemester] = useState("");

  const [departmentsList, setDepartmentsList] = useState([]);
  const [programsList, setProgramsList] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  // Monitor internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Fetch departments from Firestore
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentQuery = collection(firestore, "departments");
        const departmentSnapshot = await getDocs(departmentQuery);
        const deptData = departmentSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setDepartmentsList(deptData);
      } catch (error) {
        console.log("Error fetching departments: ", error);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch programs when a department is selected and role is "CR/GR"
  useEffect(() => {
    const fetchPrograms = async () => {
      if (!department) {
        setProgramsList([]);
        return;
      }
      setLoadingPrograms(true);
      try {
        const programQuery = query(
          collection(firestore, "programs"),
          where("departmentId", "==", department)
        );
        const programSnapshot = await getDocs(programQuery);
        const progData = programSnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setProgramsList(progData);
      } catch (error) {
        console.log("Error fetching programs: ", error);
      } finally {
        setLoadingPrograms(false);
      }
    };
    if (role === "CR/GR") {
      fetchPrograms();
    }
  }, [department, role]);

  const handleSignUp = async () => {
    setLoading(true);
    // Collect required fields depending on role
    const requiredFields = [name, email, registrationNumber, phoneNumber, campusName, gender, role];
    if (role === "Principal") {
      requiredFields.push(image);
    } else if (role === "Faculty") {
      requiredFields.push(FacultyType, designation, image, department);
    } else if (role === "CR/GR") {
      requiredFields.push(department, program, session, crgrSemester);
    }

    const phoneRegex = /^\+923\d{9}$/;
    const sessionRegex = /^\d{4}-\d{4}$/;

    if (!isConnected) {
      Alert.alert("No Internet Connection", "Please check your internet connection.");
      setLoading(false);
      return;
    }
    if (requiredFields.includes("")) {
      Alert.alert("Error", "Please fill in all required fields.");
      setLoading(false);
      return;
    }
    if (!email.endsWith("@gmail.com")) {
      Alert.alert("Error", "Email must end with @gmail.com.");
      setLoading(false);
      return;
    }
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert("Error", "Phone number must start with +923 and have 13 digits.");
      setLoading(false);
      return;
    }
    if (role === "CR/GR" && !sessionRegex.test(session)) {
      Alert.alert("Error", "Session must be in the format YYYY-YYYY (e.g., 2021-2025).");
      setLoading(false);
      return;
    }
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      await addData(user.uid);
      Alert.alert("Sign Up Successful", `Welcome ${name}`);
      resetForm();
    } catch (error) {
      console.log("Error signing up: ", error);
      Alert.alert("Error", "Error signing up. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Reset form fields after successful sign up
  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("");
    setPhoneNumber("");
    setRegistrationNumber("");
    setDesignation("");
    setDepartment("");
    setCampusName("");
    setProgram("");
    setSession("");
    setCrgrSemester("");
    setPassword("");
    setGender("");
    setFacultyType("");
    setImage(null);
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

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

  // Save user data to Firestore
  const addData = async (userId) => {
    try {
      const userDocRef = doc(firestore, "users", userId);
      let imageUrl = "";
      if (image) {
        const imageRef = ref(storage, `images/${Date.now()}_${name}_profile.jpg`);
        const img = await fetch(image);
        const bytes = await img.blob();
        await uploadBytes(imageRef, bytes);
        imageUrl = await getDownloadURL(imageRef);
      }
      const userData = {
        uid: userId,
        name,
        email,
        registrationNumber,
        phoneNumber,
        campusName,
        gender,
        role,
        password,
      };
      if (role === "Faculty") {
        userData.FacultyType = FacultyType;
        userData.department = department;
        userData.designation = designation;
        userData.imageUrl = imageUrl;
      } else if (role === "Principal") {
        userData.imageUrl = imageUrl;
      } else if (role === "CR/GR") {
        userData.department = department;
        userData.program = program;
        userData.session = session;
        userData.semester = crgrSemester;
      }
      await setDoc(userDocRef, userData);
    } catch (error) {
      console.log("Error adding document: ", error);
      Alert.alert("Error", "Failed to save data. Please try again.");
    }
  };

  if (loading) {
    return <LoadingScreen />;
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
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginLink}>Login</Text>
            </TouchableOpacity>
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Name</Text>
            <View style={styles.inputContainer}>
              <Icon name="person" size={24} color="#08422d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Email</Text>
            <View style={styles.inputContainer}>
              <Icon name="email" size={24} color="#08422d" style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="University Assigned Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Registration Number */}
          <Text style={styles.label}>Registration Number</Text>
          <View style={styles.inputContainer}>
            <Icon name="assignment" size={24} color="#08422d" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Registration Number"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />
          </View>

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.inputContainer}>
            <Icon name="phone" size={24} color="#08422d" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>

          {/* Campus Name */}
          <Text style={styles.label}>Campus Name</Text>
          <View style={styles.inputContainer}>
            <Icon name="location-city" size={24} color="#08422d" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Campus Name"
              value={campusName}
              onChangeText={setCampusName}
            />
          </View>

          {/* Gender */}
          <Text style={styles.label}>Gender</Text>
          <View style={styles.inputContainer}>
            <Icon name="people" size={24} color="#08422d" style={styles.icon} />
            <Picker
              selectedValue={gender}
              style={styles.picker}
              onValueChange={(itemValue) => setGender(itemValue)}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="Male" />
              <Picker.Item label="Female" value="Female" />
              <Picker.Item label="Other" value="Other" />
            </Picker>
          </View>

          {/* Role */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Role</Text>
            <View style={styles.inputContainer}>
              <Icon name="work" size={24} color="#08422d" style={styles.icon} />
              <Picker
                selectedValue={role}
                style={styles.picker}
                onValueChange={(itemValue) => setRole(itemValue)}
              >
                <Picker.Item label="Select Role" value="" />
                <Picker.Item label="Principal" value="Principal" />
                <Picker.Item label="Faculty" value="Faculty" />
                <Picker.Item label="CR/GR" value="CR/GR" />
              </Picker>
            </View>
          </View>

          {/* Role-specific Fields */}
          {role === "Principal" && (
            <View style={styles.roleFields}>
              <Text style={styles.label}>Upload Image</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Text style={styles.uploadButtonText}>
                  {image ? "Change Image" : "Upload Image"}
                </Text>
              </TouchableOpacity>
              {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
            </View>
          )}

          {role === "Faculty" && (
            <View style={styles.roleFields}>
              <Text style={styles.label}>Select Faculty Type</Text>
              <View style={styles.inputContainer}>
                <Picker
                  selectedValue={FacultyType}
                  style={styles.picker}
                  onValueChange={(itemValue) => setFacultyType(itemValue)}
                >
                  <Picker.Item label="Select Faculty Type" value="" />
                  <Picker.Item label="Visiting" value="Visiting" />
                  <Picker.Item label="Permanent" value="Permanent" />
                </Picker>
              </View>
              <Text style={styles.label}>Department</Text>
              {loadingDepartments ? (
                <ActivityIndicator size="small" color="#08422d" />
              ) : (
                <Picker
                  selectedValue={department}
                  style={styles.picker}
                  onValueChange={(itemValue) => setDepartment(itemValue)}
                >
                  <Picker.Item label="Select Department" value="" />
                  {departmentsList.map((dept) => (
                    <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                  ))}
                </Picker>
              )}
              <Text style={styles.label}>Designation</Text>
              <View style={styles.inputContainer}>
                <Icon name="work" size={24} color="#08422d" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Designation"
                  value={designation}
                  onChangeText={setDesignation}
                />
              </View>
              <Text style={styles.label}>Upload Image</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={handleImagePick}>
                <Text style={styles.uploadButtonText}>
                  {image ? "Change Image" : "Upload Image"}
                </Text>
              </TouchableOpacity>
              {image && <Image source={{ uri: image }} style={styles.imagePreview} />}
            </View>
          )}

          {role === "CR/GR" && (
            <View style={styles.roleFields}>
              <Text style={styles.label}>Department</Text>
              {loadingDepartments ? (
                <ActivityIndicator size="small" color="#08422d" />
              ) : (
                <Picker
                  selectedValue={department}
                  style={styles.picker}
                  onValueChange={(itemValue) => setDepartment(itemValue)}
                >
                  <Picker.Item label="Select Department" value="" />
                  {departmentsList.map((dept) => (
                    <Picker.Item key={dept.id} label={dept.name} value={dept.id} />
                  ))}
                </Picker>
              )}
              <Text style={styles.label}>Program</Text>
              {loadingPrograms ? (
                <ActivityIndicator size="small" color="#08422d" />
              ) : (
                <Picker
                  selectedValue={program}
                  style={styles.picker}
                  onValueChange={(itemValue) => setProgram(itemValue)}
                >
                  <Picker.Item label="Select Program" value="" />
                  {programsList.map((prog) => (
                    <Picker.Item key={prog.id} label={prog.name} value={prog.id} />
                  ))}
                </Picker>
              )}
              <Text style={styles.label}>Session</Text>
              <View style={styles.inputContainer}>
                <Icon name="date-range" size={24} color="#08422d" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Session (e.g., 2021-2025)"
                  value={session}
                  onChangeText={setSession}
                />
              </View>
              <Text style={styles.label}>Semester</Text>
              <Picker
                selectedValue={crgrSemester}
                style={styles.picker}
                onValueChange={(itemValue) => setCrgrSemester(itemValue)}
              >
                <Picker.Item label="Select Semester" value="" />
                {[...Array(8).keys()].map((num) => (
                  <Picker.Item
                    key={num + 1}
                    label={`Semester ${num + 1}`}
                    value={(num + 1).toString()}
                  />
                ))}
              </Picker>
            </View>
          )}

          {/* Password */}
          <Text style={styles.label}>Enter Password</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#08422d" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible}
            />
            <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
              <Icon
                name={isPasswordVisible ? "visibility-off" : "visibility"}
                size={24}
                color="#08422d"
                style={styles.icon}
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
  safeArea: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  container: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    color: "#08422d",
    marginBottom: 10,
    marginTop: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: "#08422d",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 40,
    marginLeft: 5,
    color: "#08422d",
  },
  picker: {
    height: 40,
    width: "100%",
  },
  roleFields: {
    marginVertical: 15,
  },
  button: {
    backgroundColor: "#08422d",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  loginText: {
    color: "#000",
  },
  loginLink: {
    textDecorationLine: "underline",
    color: "red",
    fontWeight: "bold",
  },
  icon: {
    marginRight: 5,
  },
  uploadButton: {
    backgroundColor: "#08422d",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginVertical: 10,
  },
  uploadButtonText: {
    color: "#fff",
  },
  imagePreview: {
    width: 100,
    height: 100,
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default SignUpScreen;
