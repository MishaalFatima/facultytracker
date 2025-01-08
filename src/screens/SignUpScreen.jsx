import React, { useEffect , useState } from "react";
import { ImageBackground, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, SafeAreaView, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { firestore, storage } from "./firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import LoadingScreen from "./LoadingScreen";
import NetInfo from "@react-native-community/netinfo"; 

const SignUpScreen = ({ navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [campusName, setCampusName] = useState("");
  const [programName, setProgramName] = useState("");
  const [session, setSession] = useState("");
  const [password, setPassword] = useState("");
  const [gender, setGender] = useState("");
  const [FacultyType, setFacultyType] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  const handleSignUp = async () => {
    setLoading(true);
    const requiredFields = [
      name,
      email,
      registrationNumber,
      phoneNumber,
      campusName,
      gender,
      role,
    ];
    if (role === "Principal") {
      requiredFields.push(image);
    } else if (role === "Faculty") {
      requiredFields.push(FacultyType, designation, image);
    } else if (role === "CR/GR") {
      requiredFields.push(department, programName, session);
    }

    const phoneRegex = /^\+923\d{9}$/;
    const sessionRegex = /^\d{4}-\d{4}$/;
    if(!isConnected) {
          Alert.alert("No Internet Connection", "Please check your internet connection.");
          setLoading(false); 
          return;
        } 

    else if (requiredFields.includes("")) {
      Alert.alert("Error", "Please fill in all required fields.");
      setLoading(false);
      return;
    }
  
    else if (!email.endsWith("@gmail.com")) {
      Alert.alert("Error", "Email must end with @gmail.com.");
      setLoading(false);
      return;
    }
  
    else if (!phoneRegex.test(phoneNumber)) {
      Alert.alert("Error", "Phone number must start with +923 and have 13 digits.");
      setLoading(false);
      return;
    }
  
    else if (role === "CR/GR") {
      if (!sessionRegex.test(session)) {
        Alert.alert("Error", "Session must be in the format YYYY-YYYY (e.g., 2021-2025).");
        setLoading(false);
        return;
      }
    }
  
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      await updateProfile(user, {
        displayName: name,
      });
  
      await addData(user.uid);
      Alert.alert("Sign Up Successful", `Welcome ${name}`);
    } catch (error) {
      console.log("Error signing up: ", error);
      Alert.alert("Error", error.message);
    }finally{
      resetForm();
      setLoading(false);
    }
  };
  
  
  // Reset form fields
  const resetForm = () => {
    setName("");
    setEmail("");
    setRole("");
    setPhoneNumber("");
    setRegistrationNumber("");
    setDesignation("");
    setDepartment("");
    setCampusName("");
    setProgramName("");
    setSession("");
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
      console.log("Image selected:", result.assets[0].uri);
    } else {
      console.log("User cancelled image selection");
    }
  };

  // Function to add data to Firestore with a custom document ID
  const addData = async (userId) => {
    try {
      const userDocRef = doc(firestore, "users", userId); // Use `userId` as the document name
      let imageUrl = "";

      // Upload image if it exists
      if (image) {
        const imageRef = ref(
          storage,
          `images/${Date.now()}_${name}_profile.jpg`
        );
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

      // Add role-specific data
      if (role === "Faculty") {
        userData.FacultyType = FacultyType;
        userData.department = department;
        userData.designation = designation;
        userData.imageUrl = imageUrl;
      } else if (role === "Principal") {
        userData.imageUrl = imageUrl;
      } else if (role === "CR/GR") {
        userData.department = department;
        userData.programName = programName;
        userData.session = session;
      }

      // Save data to Firestore with custom document ID
      await setDoc(userDocRef, userData);

      console.log("Data added to Firestore with custom document ID!");


    } catch (error) {
      console.log("Error adding document: ", error);
      Alert.alert("Error", "Failed to save data. Please try again.");
    }
  };

  while (loading) {
    return <LoadingScreen />; // Show the loading screen when loading state is true
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

          <TouchableOpacity onPress={handleLogin}>
            <Text style={styles.loginText}>
              Already have an account? Log In
            </Text>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Name</Text>
            <View style={styles.inputContainer}>
              <Icon
                name="person"
                size={24}
                color="#08422d"
                style={styles.icon}
              />
              <TextInput
                style={styles.input}
                placeholder="Name"
                value={name}
                onChangeText={setName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Enter Email</Text>
            <View style={styles.inputContainer}>
              <Icon
                name="email"
                size={24}
                color="#08422d"
                style={styles.icon}
              />
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

          <Text style={styles.label}>Registration Number</Text>
          <View style={styles.inputContainer}>
            <Icon
              name="assignment"
              size={24}
              color="#08422d"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Registration Number"
              value={registrationNumber}
              onChangeText={setRegistrationNumber}
            />
          </View>

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

          <Text style={styles.label}>Campus Name</Text>
          <View style={styles.inputContainer}>
            <Icon
              name="location-city"
              size={24}
              color="#08422d"
              style={styles.icon}
            />
            <TextInput
              style={styles.input}
              placeholder="Campus Name"
              value={campusName}
              onChangeText={setCampusName}
            />
          </View>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.inputContainer}>
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

          {/* Principal Fields */}
          {role === "Principal" && (
            <View style={styles.roleFields}>
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
            </View>
          )}

          {/* Faculty Fields */}
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
              <View style={styles.inputContainer}>
                <Icon
                  name="business"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Department"
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>

              <Text style={styles.label}>Designation</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="work"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
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
            </View>
          )}

          {/* CR/GR Fields */}
          {role === "CR/GR" && (
            <View style={styles.roleFields}>
              <Text style={styles.label}>Department</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="business"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Department"
                  value={department}
                  onChangeText={setDepartment}
                />
              </View>

              <Text style={styles.label}>Program Name</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="school"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Program Name"
                  value={programName}
                  onChangeText={setProgramName}
                />
              </View>

              <Text style={styles.label}>Session</Text>
              <View style={styles.inputContainer}>
                <Icon
                  name="date-range"
                  size={24}
                  color="#08422d"
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Session (e.g., 2023-2024)"
                  value={session}
                  onChangeText={(text) => setSession(text)}
                />
              </View>
            </View>
          )}

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#08422d" style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
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
  loginText: {
    marginTop: 10,
    marginBottom: 25,
    textAlign: "center",
    color: 'red',
    fontWeight: "bold",
  },
  icon: {
    marginRight: 5,
    size:24,
    color:"#08422d"
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
