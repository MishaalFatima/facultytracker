import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ImageBackground,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { firestore, auth } from "./firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import NetInfo from "@react-native-community/netinfo"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingScreen from "./LoadingScreen";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, [isConnected]);

  const handleLogin = () => {
    setLoading(true); 
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      setLoading(false); 
      return;
    } else if (!isConnected) {
      Alert.alert("No Internet Connection", "Please check your internet connection.");
      setLoading(false); 
      return;
    } else {
      if (!email.endsWith("@gmail.com")) {
            Alert.alert("Error", "Email must end with @gmail.com.");
            setLoading(false); 
            return;
          }
          else{
            loginUser();
          }
        }
  };

  const handleSignUp = () => {
    navigation.navigate("SignUp");
  };
  
  const loginUser = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const usersCollectionRef = collection(firestore, "users");
      const q = query(usersCollectionRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
  
      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          const userData = doc.data();
  
          if (!userData.role) {
            Alert.alert("User role not defined. Contact administrator.");
            setLoading(false); 
            return;
          }
  
          // Store user role in AsyncStorage
          await AsyncStorage.setItem("userRole", userData.role);
  
          // Navigate based on role
          switch (userData.role) {
            case "Faculty":
              if (userData.FacultyType === "Permanent") {
                navigation.reset({ index: 0, routes: [{ name: "FacultyDashboard" }] });
              }
              Alert.alert("Login Successful", `Welcome Respected ${userData.role}`);
              setLoading(false); 
              break;
            case "CR/GR":
              navigation.reset({ index: 0, routes: [{ name: "CRGRDashboard" }] });
              Alert.alert("Login Successful", `Welcome Respected ${userData.role}`);
              setLoading(false); 
              break;
            case "Principal":
              navigation.reset({ index: 0, routes: [{ name: "PrincipalDashboard" }] });
              Alert.alert("Login Successful", `Welcome Respected ${userData.role}`);
              setLoading(false); 
              break;
            case "Admin":
              navigation.reset({ index: 0, routes: [{ name: "AdminDashboard" }] });
              Alert.alert("Login Successful", `Welcome Respected ${userData.role}`);
              setLoading(false); 
              break;
            default:
              Alert.alert("Error", "Unknown user type.");
              setLoading(false); 
              break;
          }
  
          
        });
      } else {
        Alert.alert("Error", "Invalid email or password");
        setLoading(false); 
      }
    } catch (error) {
      console.log("Error logging in: ", error);
      Alert.alert("Login Failed", error.message);
      setLoading(false); 
    }finally {
      setEmail("");
      setPassword("");
    }
  };

  while (loading) {
    return <LoadingScreen />;
  }

  return (
    <ImageBackground
      source={require("../../assets/ss.jpg")}
      style={styles.background}
      imageStyle={{ resizeMode: "cover" }}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>

        <Text style={styles.label}>Enter Email</Text>
        <View style={styles.inputContainer}>
          <Icon name="email" size={24} color="#08422d" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="University Assigned Email"
            value={email}
            onChangeText={(text) => setEmail(text)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <Text style={styles.label}>Enter Password</Text>
        <View style={styles.inputContainer}>
          <Icon name="lock" size={24} color="#08422d" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={(text) => setPassword(text)}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign in</Text>
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    borderRadius: 10,
    margin: 20,
    width: "90%",
  },
  title: {
    color: "#08422d",
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "800",
    color: "#08422d",
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: "100%",
  },
  button: {
    backgroundColor: "#08422d",
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  signUpText: {
    color: "#000",
  },
  signUpLink: {
    textDecorationLine: "underline",
    color: "#08422d",
    fontWeight: "bold",
  },
});

export default LoginScreen;
