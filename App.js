import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./src/screens/firebaseConfig";

// Import Notifications and set the notification handler.
import * as Notifications from "expo-notifications";

// Configure notifications to display alerts even in the foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

import LoginScreen from "./src/screens/LoginScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import CRGRDashboard from "./src/screens/crgr_dashboard/CRGRDashboardScreen";
import FacultyDashboard from "./src/screens/FacultyDashboard/FacultyDashboard";
import AdminDashboard from "./src/screens/AdminDashboard/AdminDashboard";
import PrincipalDashboard from "./src/screens/Principaldashboard/PrincipalDashboardScreen";
import FacultyList from "./src/screens/Principaldashboard/FacultyList";
import FacultyTimetable from "./src/screens/FacultyDashboard/FacultyTimetable";
import AvailabilityReport from "./src/screens/AvailabilityReport";
import QRScannerScreen from "./src/screens/FacultyDashboard/QRScannerScreen";
import DepaertmentList from "./src/screens/AdminDashboard/DepartmentsList";
import CourseList from "./src/screens/AdminDashboard/CourseList";
import ProgramList from "./src/screens/AdminDashboard/ProgramsList";
import ProfileScreen from "./src/screens/ProfileScreen";
import EditProfileScreen from "./src/screens/EditProfileScreen";
import TimetableForm from "./src/screens/crgr_dashboard/TimetableForm";
import AttendanceRecord from "./src/screens/Principaldashboard/AttendanceRecord";
import Timetable from "./src/screens/Principaldashboard/Timetable";
import DailyAttendaceReport from "./src/screens/Principaldashboard/DailyAttendaceReport";
import AllUsers from "./src/screens/Principaldashboard/AllUsers";
import UpdateAttendance from "./src/screens/AdminDashboard/UpdateAttendance";
import UpdateUserList from "./src/screens/AdminDashboard/UpdateUserList";
import EditAvailabilityModal from "./src/screens/AdminDashboard/EditAvailabilityModal";
import RoomList from "./src/screens/AdminDashboard/RoomList";

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
        <Stack.Screen name="AvailabilityReport" component={AvailabilityReport} />
        <Stack.Screen name="FacultyList" component={FacultyList} />        
        <Stack.Screen name="QRScannerScreen" component={QRScannerScreen} />        
        <Stack.Screen name="TimetableForm" component={TimetableForm} />        
        <Stack.Screen name="DepaertmentList" component={DepaertmentList} />    
        <Stack.Screen name="ProgramList" component={ProgramList} />    
        <Stack.Screen name="CourseList" component={CourseList} />    
        <Stack.Screen name="FacultyTimetable" component={FacultyTimetable} />    
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />    
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />   
        <Stack.Screen name="AttendanceRecord" component={AttendanceRecord} />
        <Stack.Screen name="Timetable" component={Timetable} /> 
        <Stack.Screen name="DailyAttendaceReport" component={DailyAttendaceReport} />
        <Stack.Screen name="AllUsers" component={AllUsers} />
        <Stack.Screen name="UpdateAttendance" component={UpdateAttendance} />
        <Stack.Screen name="UpdateUserList" component={UpdateUserList} />
        <Stack.Screen name="EditAvailabilityModal" component={EditAvailabilityModal} />
        <Stack.Screen name="RoomList" component={RoomList} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
