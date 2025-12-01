import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  BarcodeScanningResult,
} from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import * as ScreenOrientation from "expo-screen-orientation";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function Camera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [boletoValor, setBoletoValor] = useState<string | null>(null); // "number as string"
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [cameraSelectedDate, setCameraSelectedDate] = useState<Date>(new Date());
  const navigation = useNavigation();

  useEffect(() => {
    // trava em landscape ao entrar
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);

    return () => {
      // volta pro vertical quando sair da tela
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    };
  }, []);

  useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "white" }}>preciso da permissão da câmera, mana 😭</Text>
      </View>
    );
  }

  const handleBarCodeScanned = (result: BarcodeScanningResult) => {
    if (scanned) return;

    const codigo = result.data;
    if (!codigo || codigo.length < 30) {
      console.log("Código não reconhecido ou muito curto:", codigo);
      return;
    }

    setScanned(true);
    console.log("Boleto lido:", codigo);

    const valor = extrairValorBoleto(codigo);

    if (valor) {
      const numericValue = Number(valor.replace("R$ ", "").replace(",", "."));
      setBoletoValor(String(numericValue));
    } else {
      setBoletoValor(null);
    }

    // antes de abrir modal, deixe em portrait para o usuário ver o modal vertical
    // (não await aqui para não bloquear UI pesado — mas podemos await)
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).then(() => {
      setModalVisible(true);
    });
  };

  // quando o usuário clicar em "Add to calendar" abrimos o DatePicker
  const onPressAddToCalendar = async () => {
    // garante modo vertical antes de abrir
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    // show native date picker
    setShowDatePicker(true);
  };

  // handler do DateTimePicker
  const handleDateChange = (event: any, selected?: Date | undefined) => {
    // Android: event.type === 'dismissed' quando cancelou
    if (Platform.OS === "android") {
      if (event?.type === "dismissed") {
        setShowDatePicker(false);
        return;
      }
    }

    const date = selected || cameraSelectedDate;
    setShowDatePicker(false);
    setCameraSelectedDate(date);

    // confirmar e navegar (usa o boletoValor atual)
    const numeric = boletoValor ? Number(boletoValor) : NaN;
    if (isNaN(numeric)) {
      // se não tem valor, fecha modal e volta para scanner
      setModalVisible(false);
      setScanned(false);
      return;
    }

    // Navega pra Home passando os params
    navigation.navigate("Home" as never, {
      scannedValue: numeric,
      selectedDate: date.toISOString(),
      scanId: Date.now().toString(),
    } as never);

    // fecha modal e reseta scanner
    setModalVisible(false);
    setScanned(false);
    setBoletoValor(null);
  };

  const handleScanAgain = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    setScanned(false);
    setModalVisible(false);
    setBoletoValor(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["code128", "itf14", "ean13"],
        }}
        onBarcodeScanned={handleBarCodeScanned}
      />

      {/* Modal com valor */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Boleto scanned!</Text>

            {boletoValor ? (
              <Text style={styles.modalValue}>Value: R$ {Number(boletoValor).toFixed(2)}</Text>
            ) : (
              <Text style={styles.modalValue}>Valor não encontrado</Text>
            )}

            <TouchableOpacity style={styles.scanAgainBtn} onPress={handleScanAgain}>
              <Text style={styles.scanAgainText}>Scan again</Text>
            </TouchableOpacity>

            <Text style={styles.orText}>or</Text>

            <TouchableOpacity style={styles.addCalendarBtn} onPress={onPressAddToCalendar}>
              <Text style={styles.addCalendarText}>Add to calendar</Text>
            </TouchableOpacity>

            {/* Se o DatePicker for iOS, renderizamos inline aqui */}
            {Platform.OS === "ios" && showDatePicker && (
              <View style={{ marginTop: 16, width: "100%" }}>
                <DateTimePicker
                  value={cameraSelectedDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Date picker nativo no Android aparece como modal quando showDatePicker true */}
      {Platform.OS === "android" && showDatePicker && (
        <DateTimePicker
          value={cameraSelectedDate}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
        />
      )}

      {/* overlay de enquadramento */}
      <View style={styles.overlayContainer}>
        <View style={styles.frameBox} />
      </View>
    </View>
  );
}

// -------------------------
// Extrair valor do boleto
// -------------------------

function extrairValorBoleto(codigo: string): string | null {
  const onlyNumbers = codigo.replace(/\D/g, "");

  // Procura 6 zeros primeiro (regra: depois de 6 zeros = dezena -> 2 dígitos de valor)
  const idx6 = onlyNumbers.indexOf("000000");
  if (idx6 !== -1) {
    const start = idx6 + 6;
    // precisa ter pelo menos 2 (valor) + 2 (centavos)
    if (onlyNumbers.length < start + 4) return null;

    const valorParte = onlyNumbers.substr(start, 2); // 2 dígitos (dezena)
    const centavos = onlyNumbers.substr(start + 2, 2); // 2 dígitos de centavos

    const valorNum = parseInt(valorParte, 10);
    if (isNaN(valorNum)) return null;

    // Formata: R$ 62,90  (sem notação científica)
    return `R$ ${valorNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${centavos}`;
  }

  // Se não tiver 6 zeros, procura por 5 zeros (regra: depois de 5 zeros = centena -> 3 dígitos de valor)
  const idx5 = onlyNumbers.indexOf("00000");
  if (idx5 !== -1) {
    const start = idx5 + 5;
    // precisa ter pelo menos 3 (valor) + 2 (centavos)
    if (onlyNumbers.length < start + 5) return null;

    const valorParte = onlyNumbers.substr(start, 3); // 3 dígitos (centena)
    const centavos = onlyNumbers.substr(start + 3, 2); // 2 dígitos de centavos

    const valorNum = parseInt(valorParte, 10);
    if (isNaN(valorNum)) return null;

    return `R$ ${valorNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")},${centavos}`;
  }

  // nenhum padrão encontrado
  return null;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  overlayContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  frameBox: {
    width: "80%",
    height: 120,
    borderWidth: 4,
    borderColor: "#3D9F44",
    borderRadius: 12,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "84%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTitle: {
    color: "black",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalValue: {
    color: "black",
    fontSize: 20,
    marginBottom: 12,
  },
  scanAgainBtn: {
    backgroundColor: "#3D9F44",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginBottom: 8,
  },
  scanAgainText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  orText: {
    color: "black",
    marginVertical: 8,
    fontSize: 14,
  },
  addCalendarBtn: {
    borderColor: "#3D9F44",
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  addCalendarText: {
    color: "#3D9F44",
    fontSize: 16,
    fontWeight: "600",
  },
});
