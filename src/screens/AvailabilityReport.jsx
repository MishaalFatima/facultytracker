import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Button,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from './firebaseConfig';
import EditAvailabilityModal from './AdminDashboard/EditAvailabilityModal';

const AvailabilityReport = ({ route }) => {
  const facultyUid = route.params.uid;
  const auth = getAuth();
  const currentUid = auth.currentUser.uid;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPermanent, setIsPermanent] = useState(true);
  const [userRole, setUserRole] = useState(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Date filter state
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Load current user role & faculty type
  useEffect(() => {
    (async () => {
      try {
        const currDoc = await getDoc(doc(firestore, 'users', currentUid));
        setUserRole(currDoc.data().role);

        const facDoc = await getDoc(doc(firestore, 'users', facultyUid));
        if (facDoc.data().FacultyType !== 'Permanent') {
          setIsPermanent(false);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentUid, facultyUid]);

  // Fetch availability within date range
  const fetchData = useCallback(async () => {
    if (!isPermanent) return setLoading(false);
    setLoading(true);
    try {
      const constraints = [
        where('userId', '==', facultyUid),
        where('creationTime', '>=', startDate),
        where('creationTime', '<=', endDate),
      ];
      const availQ = query(
        collection(firestore, 'facultyAvailability'),
        ...constraints,
        orderBy('creationTime', 'desc')
      );
      const snap = await getDocs(availQ);

      // Fetch faculty info once
      const facDoc = await getDoc(doc(firestore, 'users', facultyUid));
      const facData = facDoc.data();

      const arr = snap.docs.map((d) => ({
        id: d.id,
        availability: d.data().availability,
        from: d.data().creationTime?.toDate(),
        to: d.data().endTime?.toDate(),
        location: d.data().location || '',
        userName: facData.name,
      }));

      setData(arr);
    } catch (e) {
      console.error('Error fetching availability:', e);
    } finally {
      setLoading(false);
    }
  }, [facultyUid, isPermanent, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Edit / Delete handlers
  const handleEdit = (record) => {
    setSelectedRecord(record);
    setEditModalVisible(true);
  };
  const handleSaveEdit = async (updatedData) => {
    try {
      await updateDoc(
        doc(firestore, 'facultyAvailability', selectedRecord.id),
        updatedData
      );
      setData((prev) =>
        prev.map((r) =>
          r.id === selectedRecord.id ? { ...r, ...updatedData } : r
        )
      );
    } catch (error) {
      console.error('Error updating record:', error);
    } finally {
      setEditModalVisible(false);
      setSelectedRecord(null);
    }
  };
  const handleDelete = async (recordId) => {
    try {
      await deleteDoc(doc(firestore, 'facultyAvailability', recordId));
      setData((prev) => prev.filter((r) => r.id !== recordId));
    } catch (error) {
      console.error('Error deleting record:', error);
    }
  };

  // Generate & share PDF
  const generatePdf = async () => {
    const html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h1 { color: #08422d; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          th { background: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Availability Report</h1>
        <p>From: ${startDate.toLocaleDateString()}</p>
        <p>To: ${endDate.toLocaleDateString()}</p>
        <table>
          <tr>
            <th>#</th><th>From</th><th>To</th><th>Status</th><th>Location</th>
          </tr>
          ${data
            .map(
              (r, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${r.from?.toLocaleString() || 'N/A'}</td>
              <td>${r.to?.toLocaleString() || 'Active'}</td>
              <td>${r.availability}</td>
              <td>${r.location}</td>
            </tr>
          `
            )
            .join('')}
        </table>
      </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loader} />;
  }
  if (!isPermanent) {
    return (
      <Text style={styles.message}>
        Availability is only tracked for permanent faculty.
      </Text>
    );
  }

  const isAdmin =
    typeof userRole === 'string' &&
    userRole.trim().toLowerCase() === 'admin';

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header & PDF button */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>Availability History</Text>
          <TouchableOpacity
            onPress={generatePdf}
            style={styles.pdfButton}
          >
            <Icon name="picture-as-pdf" size={24} color="white" />
            <Text style={styles.pdfButtonText}>Download PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Date Filter */}
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
                onChange={(_, d) => {
                  setShowStartPicker(Platform.OS === 'ios');
                  if (d) setStartDate(d);
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
                onChange={(_, d) => {
                  setShowEndPicker(Platform.OS === 'ios');
                  if (d) setEndDate(d);
                }}
              />
            )}
          </View>
        </View>

        {/* Records */}
        {data.length === 0 ? (
          <Text style={styles.message}>
            No availability records found
          </Text>
        ) : (
          data.map((record, idx) => (
            <View key={record.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    styles.status,
                    record.availability === 'Available'
                      ? styles.available
                      : styles.unavailable,
                  ]}
                >
                  {record.availability}
                </Text>
                <View style={styles.headerRight}>
                  <Text style={styles.duration}>{idx + 1}</Text>
                  {isAdmin && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleEdit(record)}
                        style={styles.iconTouchable}
                      >
                        <Icon name="edit" size={24} color="#1E90FF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(record.id)}
                        style={styles.iconTouchable}
                      >
                        <Icon name="delete" size={24} color="#FF4500" />
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.timeContainer}>
                <View style={styles.timeBlock}>
                  <Text style={styles.label}>From:</Text>
                  <Text>
                    {record.from?.toLocaleString() || 'N/A'}
                  </Text>
                </View>
                <View style={styles.timeBlock}>
                  <Text style={styles.label}>To:</Text>
                  <Text>
                    {record.to?.toLocaleString() || 'Active'}
                  </Text>
                </View>
              </View>
              {record.location ? (
                <View style={styles.locationBlock}>
                  <Text style={styles.label}>Location:</Text>
                  <Text>{record.location}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      {/* Edit Modal */}
      {selectedRecord && (
        <EditAvailabilityModal
          visible={editModalVisible}
          record={selectedRecord}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedRecord(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#08422d' },
  pdfButton: {
    flexDirection: 'row',
    backgroundColor: '#e53e3e',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  pdfButtonText: { color: 'white', marginLeft: 6 },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePicker: { flex: 1, marginHorizontal: 5 },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  status: { fontWeight: 'bold', fontSize: 16 },
  available: { color: 'green' },
  unavailable: { color: 'red' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  duration: { color: '#666', marginRight: 8 },
  iconTouchable: { marginHorizontal: 6, padding: 4 },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  timeBlock: { flex: 1 },
  label: { fontWeight: 'bold', color: '#08422d', marginBottom: 4 },
  locationBlock: { marginTop: 8 },
  message: { textAlign: 'center', color: '#666', marginTop: 20 },
});

export default AvailabilityReport;
