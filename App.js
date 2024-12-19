import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/screens/firebaseConfig";

import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import CRGRDashboard from "./src/screens/CRGRDashboardScreen";
import FacultyDashboard from "./src/screens/FacultyDashboard/FacultyDashboard";
import AdminDashboard from "./src/screens/AdminDashboard";
import PrincipalDashboard from "./src/screens/PrincipalDashboardScreen";
import Availability from "./src/screens/Availability";

const Stack = createStackNavigator();

export default function App() {
  const [initialScreen, setInitialScreen] = useState("SignUp"); // Default screen

  useEffect(() => {
    const checkAuthState = async () => {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User is logged in, get their role from AsyncStorage
          const storedRole = await AsyncStorage.getItem("userRole");
          if (storedRole) {
            switch (storedRole) {
              case "Faculty":
                setInitialScreen("FacultyDashboard");
                break;
              case "CR/GR":
                setInitialScreen("CRGRDashboard");
                break;
              case "Principal":
                setInitialScreen("PrincipalDashboard");
                break;
              case "Admin":
                setInitialScreen("AdminDashboard");
                break;
              default:
                setInitialScreen("SignUp"); // Fallback if role is unknown
            }
          } else {
            setInitialScreen("SignUp"); // If role not found, show login
          }
        } else {
          setInitialScreen("SignUp"); // If no user, show login
        }
      });
    };

    checkAuthState();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialScreen}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="FacultyDashboard" component={FacultyDashboard} />
        <Stack.Screen name="CRGRDashboard" component={CRGRDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="PrincipalDashboard" component={PrincipalDashboard} />
        <Stack.Screen name="Availability" component={Availability} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
