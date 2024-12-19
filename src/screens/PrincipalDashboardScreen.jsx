import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Logout from './Logout';

const PrincipalDashboardScreen = () => {
    const navigation = useNavigation();

    const handleAvailabilityReport = () => {
        navigation.navigate("Availability");
      };
    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Principal Dashboard</Text>
            <View style={styles.header}>
            <Logout/>
            </View>

            {/* Faculty Availability Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Faculty Availability</Text>
                <TouchableOpacity style={styles.button} onPress={handleAvailabilityReport}>
                    <Ionicons name="eye" size={20} color="white" />
                    <Text style={styles.buttonText}>View Real-Time Availability</Text>
                </TouchableOpacity>
            </View>

            {/* Attendance Reporting Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attendance Reporting</Text>
                <TouchableOpacity style={styles.button} onPress={() => { /* Add functionality here */ }}>
                    <MaterialIcons name="list" size={20} color="white" />
                    <Text style={styles.buttonText}>View Attendance Reports</Text>
                </TouchableOpacity>
            </View>

            {/* Absent Report Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Absent Report</Text>
                <TouchableOpacity style={styles.button} onPress={() => { /* Add functionality here */ }}>
                    <Ionicons name="document-text" size={20} color="white" />
                    <Text style={styles.buttonText}>Daily Absent Report</Text>
                </TouchableOpacity>
            </View>

            {/* Faculty Search Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Faculty Search</Text>
                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search faculty by name or department"
                        placeholderTextColor="#a9a9a9"
                    />
                    <TouchableOpacity style={styles.searchButton} onPress={() => { /* Add functionality here */ }}>
                        <Ionicons name="search" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Profile Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>View All User's Profile</Text>
                <TouchableOpacity style={styles.button} onPress={() => { /* Add functionality here */ }}>
                    <FontAwesome name="edit" size={20} color="white" />
                    <Text style={styles.buttonText}>View Profile</Text>
                </TouchableOpacity>
            </View>

            {/* Timetable Management Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Timetable</Text>
                <TouchableOpacity style={styles.button} onPress={() => { /* Add functionality here */ }}>
                    <MaterialIcons name="schedule" size={20} color="white" />
                    <Text style={styles.buttonText}>View Timetable</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 20,
        backgroundColor: '#ffffff',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#08422d',
        marginBottom: 30,
        textAlign: 'center',
        letterSpacing: 1.2,
    },
    section: {
        marginBottom: 25,
        backgroundColor: '#f0f0f0',
        padding: 20,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#08422d',
        marginBottom: 15,
        textAlign: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#08422d',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        padding: 10,
        fontSize: 16,
        color: '#08422d',
    },
    searchButton: {
        padding: 10,
        backgroundColor: '#08422d',
        borderTopRightRadius: 8,
        borderBottomRightRadius: 8,
    },
    header: {
        paddingTop: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
      },
});

export default PrincipalDashboardScreen;