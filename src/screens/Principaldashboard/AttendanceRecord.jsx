import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  ScrollView,
  Button,
  Platform,
} from "react-native";
import {
  useRoute,
  useNavigation,
  useIsFocused,
} from "@react-navigation/native";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  orderBy,
} from "firebase/firestore";
import DateTimePicker from "@react-native-community/datetimepicker";
import { getAuth } from "firebase/auth";
import { firestore } from "../firebaseConfig";
import { DataTable, IconButton } from "react-native-paper";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import Icon from 'react-native-vector-icons/MaterialIcons';

const AttendanceRecord = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { uid, deptValue } = route.params || {};

  // Auth & role
  const auth = getAuth();
  const currentUid = auth.currentUser.uid;
  const [userRole, setUserRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  // attendance data + loading
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // date filter state
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ); // default one week ago
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // fetch user role
  useEffect(() => {
    (async () => {
      try {
        const userDoc = await getDoc(doc(firestore, "users", currentUid));
        setUserRole(userDoc.data()?.role?.trim().toLowerCase() || "");
      } catch (err) {
        console.error("Error fetching user role:", err);
      } finally {
        setLoadingRole(false);
      }
    })();
  }, [currentUid]);

  // fetch attendance with filters
  const fetchAttendance = useCallback(async () => {
    if (!uid) {
      console.error("No faculty ID provided.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const constraints = [
        where("facultyId", "==", uid),
        where("timestamp", ">=", startDate),
        where("timestamp", "<=", endDate),
      ];
      if (deptValue) {
        constraints.push(where("departmentId", "==", deptValue));
      }
      const attendanceQuery = query(
        collection(firestore, "attendance"),
        ...constraints,
        orderBy("timestamp", "desc")
      );
      const snap = await getDocs(attendanceQuery);
      setAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching attendance:", error);
    } finally {
      setLoading(false);
    }
  }, [uid, deptValue, startDate, endDate]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    if (isFocused) fetchAttendance();
  }, [isFocused, fetchAttendance]);

  const handleDelete = async recordId => {
    try {
      await deleteDoc(doc(firestore, "attendance", recordId));
      setAttendance(prev => prev.filter(r => r.id !== recordId));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const handleUpdate = record => {
    navigation.navigate("UpdateAttendance", { record });
  };

  // Generate PDF and share
  const generatePdf = async () => {
    // Build HTML table
    const html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #08422d; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Attendance Report</h1>
        <p>From: ${startDate.toLocaleDateString()}</p>
        <p>To: ${endDate.toLocaleDateString()}</p>
        <table>
          <tr>
            <th>Course</th><th>Day</th><th>Start</th><th>End</th><th>Status</th>
          </tr>
          ${attendance
            .map(
              r => `
            <tr>
              <td>${r.course || ""}</td>
              <td>${r.day || ""}</td>
              <td>${r.startTime || ""}</td>
              <td>${r.endTime || ""}</td>
              <td>${r.status || ""}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Share Attendance PDF",
        UTI: "com.adobe.pdf",
      });
    } catch (err) {
      console.error("PDF generation error:", err);
    }
  };

  if (loading || loadingRole) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!uid) {
    return (
      <View style={styles.center}>
        <Text>No faculty selected.</Text>
        <TouchableOpacity onPress={() => navigation.navigate("FacultyList")}>
          <Text style={styles.link}>Go to Faculty List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isAdmin = userRole === "admin";

  return (
    <ScrollView>
      <View style={styles.container}>

        {/* PDF Download Button */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={generatePdf} style={styles.pdfButton}>
            <Icon name="picture-as-pdf" size={24} color="white" />
            <Text style={styles.pdfText}>Download PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter Row */}
        <View style={styles.dateFilterRow}>
          <View style={styles.datePicker}>
            <Button
              title={`From: ${startDate.toLocaleDateString()}`}
              onPress={() => setShowStartPicker(true)}
            />
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowStartPicker(Platform.OS === "ios");
                  if (date) setStartDate(date);
                }}
              />
            )}
          </View>
          <View style={styles.datePicker}>
            <Button
              title={`To: ${endDate.toLocaleDateString()}`}
              onPress={() => setShowEndPicker(true)}
            />
            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(_, date) => {
                  setShowEndPicker(Platform.OS === "ios");
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>
        </View>

        {/* Attendance Table */}
        <ScrollView horizontal>
          <DataTable style={styles.table}>
            <DataTable.Header>
              <DataTable.Title style={styles.cell}>Course</DataTable.Title>
              <DataTable.Title style={styles.cell}>Day</DataTable.Title>
              <DataTable.Title style={styles.cell}>Start Time</DataTable.Title>
              <DataTable.Title style={styles.cell}>End Time</DataTable.Title>
              <DataTable.Title style={styles.cell}>Status</DataTable.Title>
              {isAdmin && (
                <DataTable.Title style={styles.actionsCell}>
                  Actions
                </DataTable.Title>
              )}
            </DataTable.Header>

            {attendance.length > 0 ? (
              attendance.map(record => (
                <DataTable.Row key={record.id}>
                  <DataTable.Cell style={styles.cell}>
                    {record.course}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    {record.day}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    {record.startTime}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    {record.endTime}
                  </DataTable.Cell>
                  <DataTable.Cell style={styles.cell}>
                    {record.status}
                  </DataTable.Cell>
                  {isAdmin && (
                    <DataTable.Cell style={styles.actionsCell}>
                      <IconButton
                        icon="pencil"
                        size={20}
                        onPress={() => handleUpdate(record)}
                      />
                      <IconButton
                        icon="delete"
                        size={20}
                        onPress={() => handleDelete(record.id)}
                      />
                    </DataTable.Cell>
                  )}
                </DataTable.Row>
              ))
            ) : (
              <DataTable.Row>
                <DataTable.Cell>
                  <Text>No attendance records found</Text>
                </DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#08422d",
  },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#e53e3e",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  pdfText: {
    color: "white",
    marginLeft: 6,
    fontWeight: "500",
  },
  dateFilterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  datePicker: {
    flex: 1,
    marginHorizontal: 5,
  },
  table: {
    width: "100%",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  link: {
    marginTop: 10,
    color: "blue",
    textDecorationLine: "underline",
  },
  cell: {
    flex: 1,
    minWidth: 120,
  },
  actionsCell: {
    minWidth: 140,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
});

export default AttendanceRecord;
