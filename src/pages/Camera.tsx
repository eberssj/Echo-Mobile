import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, Dimensions, Modal, FlatList } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMonths, subMonths } from 'date-fns';

const { width, height } = Dimensions.get('window');
const SCAN_RECT_WIDTH = width * 0.9;
const SCAN_RECT_HEIGHT = height * 0.15;

// Function to extract and format the bank slip value
const extractBankSlipValue = (code: string): { isValid: boolean; value: string | null; numericValue: number | null } => {
  console.log('Raw code:', code);

  // Clean non-numeric characters (spaces, dots, dashes)
  const cleanCode = code.replace(/[^0-9]/g, '');
  console.log('Cleaned code:', cleanCode);

  // Validate length (44 or 47 digits for bank slips)
  if (cleanCode.length !== 44 && cleanCode.length !== 47) {
    console.log('Invalid length:', cleanCode.length);
    return { isValid: false, value: null, numericValue: null };
  }

  // Extract last 10 digits (value in cents)
  const valueInCents = parseInt(cleanCode.slice(-10), 10);
  if (isNaN(valueInCents) || valueInCents === 0) {
    console.log('Invalid value:', valueInCents);
    return { isValid: false, value: null, numericValue: null };
  }

  // Convert to reais and format
  const valueInReais = valueInCents / 100;
  const formattedValue = `R$ ${valueInReais.toFixed(2).replace('.', ',')}`;
  console.log('Formatted value:', formattedValue);

  return { isValid: true, value: formattedValue, numericValue: valueInReais };
};

const Camera: React.FC = () => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [manualInput, setManualInput] = useState(false);
  const [bankSlipCode, setBankSlipCode] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const navigation = useNavigation();
  const scanLinePosition = useSharedValue(0);

  // Configurar dias do mês para o modal de seleção de data
  const startOfCurrentMonth = startOfMonth(pickerDate);
  const endOfCurrentMonth = endOfMonth(pickerDate);
  const startDayOfWeek = startOfCurrentMonth.getDay();
  const daysInMonth = eachDayOfInterval({ start: startOfCurrentMonth, end: endOfCurrentMonth });
  const emptyDaysStart = Array(startDayOfWeek).fill(null);
  const totalCells = Math.ceil((daysInMonth.length + startDayOfWeek) / 7) * 7;
  const emptyDaysEnd = Array(totalCells - emptyDaysStart.length - daysInMonth.length).fill(null);
  const calendarDays = [...emptyDaysStart, ...daysInMonth, ...emptyDaysEnd];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthName = format(pickerDate, 'MMMM yyyy');

  // Debug: Log the calendarDays array
  console.log('Calendar days:', calendarDays.map(d => d ? format(d, 'd') : 'null'));

  useEffect(() => {
    requestPermission();
    scanLinePosition.value = withRepeat(
      withTiming(SCAN_RECT_HEIGHT - 10, { duration: 2000 }),
      -1,
      true
    );
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    console.log('Scanned - Type:', type, 'Data:', data);

    const cleanData = data.replace(/[^0-9]/g, '');
    if ((type !== 'itf' && type !== 'itf14' && type !== 'code128') || (cleanData.length !== 44 && cleanData.length !== 47)) {
      let errorMessage = `Invalid barcode. Use a bank slip barcode (Interleaved 2 of 5 or code128, 44 or 47 digits). Detected ${type} barcode with ${cleanData.length} digits.`;
      errorMessage += ' Try adjusting lighting, camera distance, or aligning the barcode fully within the green rectangle.';
      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Enter Manually', onPress: () => setManualInput(true) },
        ],
        { cancelable: true }
      );
      return;
    }

    const { isValid, value, numericValue } = extractBankSlipValue(data);
    if (isValid && value && numericValue) {
      setSelectedValue(numericValue);
      setShowDatePicker(true);
    } else {
      Alert.alert(
        'Error',
        'Unable to extract the bank slip value. Ensure the barcode is clear or enter manually.',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Enter Manually', onPress: () => setManualInput(true) },
        ],
        { cancelable: true }
      );
    }
  };

  const handleManualSubmit = () => {
    if (!bankSlipCode.trim()) {
      Alert.alert('Error', 'Please enter the bank slip code.', [{ text: 'OK' }]);
      return;
    }

    const { isValid, value, numericValue } = extractBankSlipValue(bankSlipCode);
    if (isValid && value && numericValue) {
      setSelectedValue(numericValue);
      setShowDatePicker(true);
    } else {
      Alert.alert(
        'Error',
        'Invalid code. Enter a bank slip code with 44 or 47 digits (e.g., 75590.00331 89850.769673 71015.349740 1 11070000007990).',
        [{ text: 'OK' }],
        { cancelable: true }
      );
    }
  };

  const handleDateSelect = (day: Date) => {
    if (selectedValue) {
      navigation.navigate('Home', { 
        scannedValue: selectedValue, 
        selectedDate: day.toISOString(), 
        scanId: Date.now().toString() 
      });
      setShowDatePicker(false);
      setScanned(false);
      setManualInput(false);
      setBankSlipCode('');
      setSelectedValue(null);
      setPickerDate(new Date());
    }
  };

  const goToPreviousMonth = () => setPickerDate(subMonths(pickerDate, 1));
  const goToNextMonth = () => setPickerDate(addMonths(pickerDate, 1));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLinePosition.value }],
  }));

  if (permission === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }
  if (permission?.status !== 'granted') {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please allow camera access in settings.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {manualInput ? (
        <View style={styles.manualContainer}>
          <Text style={styles.instructionText}>Enter the bank slip code</Text>
          <TextInput
            style={styles.input}
            value={bankSlipCode}
            onChangeText={setBankSlipCode}
            placeholder="E.g., 75590.00331 89850.769673..."
            placeholderTextColor="#888"
            keyboardType="default"
            maxLength={50}
            autoFocus
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
              <Text style={styles.buttonText}>Validate</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => setManualInput(false)}>
              <Text style={styles.buttonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <CameraView
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ['itf', 'itf14', 'code128'] }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleOverlay}>
              <View style={styles.sideOverlay} />
              <View style={styles.scanRect}>
                <Animated.View style={[styles.scanLine, animatedStyle]} />
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay}>
              <Text style={styles.instructionText}>Align the barcode with the green rectangle</Text>
              <View style={styles.buttonContainer}>
                {scanned && (
                  <TouchableOpacity style={styles.scanButton} onPress={() => setScanned(false)}>
                    <Text style={styles.buttonText}>Scan Again</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.manualButton} onPress={() => setManualInput(true)}>
                  <Text style={styles.buttonText}>Enter Manually</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </>
      )}

      {/* Modal para seleção de data */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.datePickerContainer}>
            <View style={styles.calendarHeader}>
              <TouchableOpacity onPress={goToPreviousMonth}>
                <View style={styles.arrowLeft}><Text style={styles.arrowText}>‹</Text></View>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{monthName}</Text>
              <TouchableOpacity onPress={goToNextMonth}>
                <View style={styles.arrowRight}><Text style={styles.arrowText}>›</Text></View>
              </TouchableOpacity>
            </View>
            <View style={styles.calendarWeekdays}>
              {daysOfWeek.map((day, index) => (
                <Text key={index} style={styles.calendarWeekday}>{day}</Text>
              ))}
            </View>
            <FlatList
              data={calendarDays}
              renderItem={({ item: day, index }) => (
                day ? (
                  <TouchableOpacity
                    style={[styles.calendarDay, isToday(day) && styles.today]}
                    onPress={() => handleDateSelect(day)}
                  >
                    <Text style={styles.dayText}>{format(day, 'd')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.calendarDayEmpty} />
                )
              )}
              keyExtractor={(item, index) => item ? item.toISOString() : `empty-${index}`}
              numColumns={7}
              contentContainerStyle={styles.calendarGrid}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setShowDatePicker(false);
                setScanned(false);
              }}
            >
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    padding: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  topOverlay: {
    flex: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  middleOverlay: {
    flexDirection: 'row',
    height: SCAN_RECT_HEIGHT,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0)',
  },
  scanRect: {
    width: SCAN_RECT_WIDTH,
    height: SCAN_RECT_HEIGHT,
    borderWidth: 2,
    borderColor: '#3d9f44',
    borderRadius: 0,
    backgroundColor: 'transparent',
    position: 'relative',
  },
  scanLine: {
    height: 2,
    backgroundColor: '#3d9f44',
    width: '100%',
  },
  corner: {
    width: 20,
    height: 20,
    borderColor: '#3d9f44',
    backgroundColor: 'transparent',
    position: 'absolute',
  },
  topLeft: {
    borderTopWidth: 4,
    borderLeftWidth: 4,
    top: -2,
    left: -2,
  },
  topRight: {
    borderTopWidth: 4,
    borderRightWidth: 4,
    top: -2,
    right: -2,
  },
  bottomLeft: {
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    bottom: -2,
    left: -2,
  },
  bottomRight: {
    borderBottomWidth: 4,
    borderRightWidth: 4,
    bottom: -2,
    right: -2,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  manualContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  input: {
    width: 300,
    height: 48,
    borderWidth: 2,
    borderColor: '#3d9f44',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    gap: 10,
  },
  submitButton: {
    backgroundColor: '#3d9f44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  backButton: {
    backgroundColor: '#555',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  scanButton: {
    backgroundColor: '#3d9f44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  manualButton: {
    backgroundColor: '#3d9f44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  datePickerContainer: {
    width: 320,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  arrowLeft: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowRight: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 24,
    color: '#3d9f44',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  calendarWeekdays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
  },
  calendarWeekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3d9f44',
  },
  calendarGrid: {
    width: '100%',
    paddingVertical: 10,
  },
  calendarDay: {
    width: 36,
    height: 36,
    margin: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayEmpty: {
    width: 36,
    height: 36,
    margin: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  today: {
    backgroundColor: '#b7e4c7',
    borderColor: '#3d9f44',
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#555',
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default Camera;