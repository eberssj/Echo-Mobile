import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import Navbar from '../components/Navbar';
import BottomNavbar from '../components/BottomNavbar';
import TransactionChart from '../components/TransactionChart';
import FinancialGoals from '../components/FinancialGoals';

interface ChartProps {
  setUser: (user: any | null) => void;
}

interface Tag {
  tag: string;
  value: number;
  type: 'income' | 'expense';
}

const Chart: React.FC<ChartProps> = ({ setUser }) => {
  const [tags, setTags] = useState<{ [key: string]: Tag[] } | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [mode, setMode] = useState<'general' | 'incomes' | 'expenses'>('general');
  const [month, setMonth] = useState<string>('Overall');
  const navigation = useNavigation();
  const stableNavigation = useMemo(() => navigation, []);

  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setTags(null);
        setUser(null);
        stableNavigation.navigate('Auth');
      } else {
        setUser(user);
      }
    });

    return () => unsubscribeAuth();
  }, [stableNavigation, setUser]);

  useEffect(() => {
    if (!auth?.currentUser) {
      setTags({});
      return;
    }

    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const newTags = data.tags || {};
        console.log('Firestore Tags:', JSON.stringify(newTags, null, 2));
        setTags(newTags);
      } else {
        setTags({});
      }
    });

    return () => unsubscribeFirestore();
  }, [auth?.currentUser]);

  const calculateTotalBalance = () => {
    if (!tags) return 0;

    const months = Object.keys(tags).map((day) => {
      try {
        return format(parseISO(day), 'yyyy-MM');
      } catch (error) {
        console.log('Invalid date format:', day);
        return null;
      }
    }).filter((month) => month !== null);
    const uniqueMonths = Array.from(new Set(months));

    console.log('Unique Months:', uniqueMonths);

    let balance = 0;
    uniqueMonths.forEach((month) => {
      const date = parseISO(`${month}-01`);
      const startOfMonthDate = startOfMonth(date);
      const endOfMonthDate = endOfMonth(date);
      const daysInMonth = eachDayOfInterval({ start: startOfMonthDate, end: endOfMonthDate });

      const totalIncome = daysInMonth.reduce((total, day) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const tagList = tags[dayKey] || [];
        const income = tagList
          .filter((tag) => tag.type.toLowerCase() === 'income')
          .reduce((sum, tag) => sum + Number(tag.value), 0);
        console.log(`Income for ${dayKey}:`, income);
        return total + income;
      }, 0);

      const totalExpense = daysInMonth.reduce((total, day) => {
        const dayKey = format(day, 'yyyy-MM-dd');
        const tagList = tags[dayKey] || [];
        const expense = tagList
          .filter((tag) => tag.type.toLowerCase() === 'expense')
          .reduce((sum, tag) => sum + Number(tag.value), 0);
        console.log(`Expense for ${dayKey}:`, expense);
        return total + expense;
      }, 0);

      balance += totalIncome - totalExpense;
      console.log(`Balance for ${month}:`, totalIncome - totalExpense);
    });

    console.log('Total Balance:', balance);
    return balance;
  };

  useEffect(() => {
    setTotalBalance(calculateTotalBalance());
  }, [tags]);

  if (tags === null) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderHeader = () => (
    <View>
      <TransactionChart
        tags={tags}
        mode={mode}
        setMode={setMode}
        month={month}
        setMonth={setMonth}
      />
      <FinancialGoals totalBalance={totalBalance} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Navbar setUser={setUser} />
      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.contentContainer}
      />
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
    flexGrow: 1,
    paddingBottom: 80, // Espaço para a navbar fixa
  },
});

export default Chart;