import React from 'react';
import { View, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { SvgProps } from 'react-native-svg';

// Importação dos arquivos SVG locais
import CalendarWeekIcon from '../assets/calendar-week.svg'; // Novo ícone
import ChartIcon from '../assets/chart-pie.svg';
import CameraIcon from '../assets/camera.svg';
import HistoryIcon from '../assets/history-toggle.svg';
import ProfileIcon from '../assets/user.svg';

const BottomNavbar: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.navbar}>
        {/* Ícone de Home */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => navigation.navigate('Home')} // Alterado de AboutUs para Home
          activeOpacity={0.7}
        >
          <CalendarWeekIcon width={24} height={24} /> {/* Alterado de HelpIcon para CalendarWeekIcon */}
        </TouchableOpacity>

        {/* Ícone de Gráfico */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => navigation.navigate('Chart')}
          activeOpacity={0.7}
        >
          <ChartIcon width={24} height={24} />
        </TouchableOpacity>

        {/* Ícone Central de Câmera */}
        <TouchableOpacity
          style={styles.centerIconContainer}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.7}
        >
          <CameraIcon width={32} height={32} fill="#3D9F44" />
        </TouchableOpacity>

        {/* Ícone de Histórico */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.7}
        >
          <HistoryIcon width={24} height={24} />
        </TouchableOpacity>

        {/* Ícone de Perfil */}
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <ProfileIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: 'white',
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingHorizontal: 10,
    paddingBottom: 0,
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    padding: 8,
  },
  centerIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 52,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#3D9F44',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
});

export default BottomNavbar;