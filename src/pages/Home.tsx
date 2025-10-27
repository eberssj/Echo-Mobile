import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { auth, db } from '../config/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import Calendar from '../components/Calendar';
import Balance from '../components/Balance';
import BottomNavbar from '../components/BottomNavbar';

interface HomeProps {
  setUser: (user: any | null) => void;
}

const Home: React.FC<HomeProps> = ({ setUser }) => {
  const [tags, setTags] = useState<{ [key: string]: { tag: string; value: number; type: 'income' | 'expense' }[] } | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const navigation = useNavigation();
  const route = useRoute();
  const { scannedValue, selectedDate, scanId } = route.params || {};

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigation.navigate('Auth');
        setTags(null);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setTags(data.tags || {});
        } else {
          setTags({});
        }
      });

      return () => unsubscribeFirestore();
    });

    return () => unsubscribeAuth();
  }, [navigation]);

  if (tags === null) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Navbar setUser={setUser} />
      <View style={styles.contentContainer}>
        <Text style={styles.homePageTitle}>
          Hello, Welcome to <Text style={styles.homeEcho}>Echo</Text>.
        </Text>
        <Balance tags={tags} currentDate={currentDate} />
        <View style={styles.homeContentContainer}>
          <View style={styles.homeCalendarContainer}>
            <Calendar
              onTagsUpdate={(newTags) => setTags(newTags)}
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              scannedValue={scannedValue}
              selectedDate={selectedDate ? new Date(selectedDate) : undefined}
              scanId={scanId}
            />
          </View>
        </View>
      </View>
      <BottomNavbar />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Espaço para a navbar fixa
  },
  homePageTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'LexendDeca_400Regular',
  },
  homeEcho: {
    color: '#3d9f44',
  },
  homeContentContainer: {
    flexDirection: 'column',
    width: '100%',
    maxWidth: 1200,
    alignItems: 'flex-start',
    marginTop: 40,
  },
  homeCalendarContainer: {
    width: '100%',
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
});

export default Home;