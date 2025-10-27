import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { auth, db } from '../config/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import BottomNavbar from '../components/BottomNavbar';
import { format, parseISO, parse } from 'date-fns';
import CalendarWeekIcon from '../assets/calendar-week.svg';

interface HistoryProps {
  setUser: (user: any | null) => void;
}

interface Tag {
  tag: string;
  value: number;
  type: 'income' | 'expense';
  registeredAt?: string;
  createdAt?: string;
}

const History: React.FC<HistoryProps> = ({ setUser }) => {
  const [tags, setTags] = useState<{ [key: string]: Tag[] } | null>(null);
  const navigation = useNavigation();
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (!auth) {
      return;
    }

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!isMounted.current) return;

      if (!user) {
        if (isMounted.current) {
          navigation.navigate('Auth');
          setTags(null);
        }
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
        if (!isMounted.current) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          const updatedTags = Object.entries(data.tags || {}).reduce((acc, [date, tagList]) => {
            acc[date] = tagList.map((tag: Tag) => ({
              ...tag,
              createdAt: tag.createdAt || tag.registeredAt || parse(date, 'yyyy-MM-dd', new Date()).toISOString(),
            }));
            return acc;
          }, {} as { [key: string]: Tag[] });
          setTags((prevTags) => {
            if (JSON.stringify(prevTags) !== JSON.stringify(updatedTags)) {
              return updatedTags;
            }
            return prevTags;
          });
        } else {
          setTags({});
        }
      });

      return () => unsubscribeFirestore();
    });

    return () => {
      isMounted.current = false;
      unsubscribeAuth();
    };
  }, [navigation]);

  if (tags === null) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  const transactionList = Object.entries(tags)
    .flatMap(([date, tagList]) =>
      tagList.map((tag) => ({
        date,
        tag,
        createdAt: tag.createdAt,
      }))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const renderTransaction = ({ item, index }: { item: { date: string; tag: Tag; createdAt: string }; index: number }) => {
    const { date, tag, createdAt } = item;
    const showSeparator = index === 0 || format(parseISO(transactionList[index - 1].createdAt), 'MM/dd/yyyy') !== format(parseISO(createdAt), 'MM/dd/yyyy');

    return (
      <>
        {showSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>
              {format(parseISO(createdAt), 'MM/dd/yyyy')}
            </Text>
            <View style={styles.separatorLine} />
          </View>
        )}
        <View style={styles.transactionItem}>
          <View style={styles.transactionTitleContainer}>
            <Text style={styles.transactionTitle}>{tag.tag}</Text>
            <CalendarWeekIcon width={16} height={16} fill="#666" style={styles.calendarIcon} />
            <Text style={styles.transactionRefDate}>
              {format(parseISO(tag.registeredAt || date), 'MM/dd/yyyy')}
            </Text>
          </View>
          <Text style={[styles.amountText, tag.type === 'income' ? styles.income : styles.expense]}>
            {tag.type === 'income' ? '+' : '-'} ${tag.value.toFixed(2)}
          </Text>
        </View>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Navbar setUser={setUser} />
      <View style={styles.content}>
        <Text style={styles.historyPageTitle}>Transaction History</Text>
        {transactionList.length === 0 ? (
          <View style={styles.noTransactionsContainer}>
            <Text style={styles.noTransactions}>No transactions recorded.</Text>
            <Text style={styles.noTransactionsSubtext}>
              Register your income and expenses in the Calendar to track them here.
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactionList}
            renderItem={renderTransaction}
            keyExtractor={(item, index) => `${item.date}-${item.tag.tag}-${index}`}
            contentContainerStyle={styles.transactionList}
          />
        )}
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
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Espaço para a navbar fixa
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyPageTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'LexendDeca_400Regular',
    color: '#000',
  },
  transactionList: {
    paddingBottom: 20,
  },
  transactionItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  transactionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontFamily: 'LexendDeca_400Regular',
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
  calendarIcon: {
    marginRight: 6,
  },
  transactionRefDate: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'LexendDeca_400Regular',
  },
  amountText: {
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    fontWeight: 'bold',
  },
  income: {
    color: '#3D9F44',
  },
  expense: {
    color: '#DF2F2F',
  },
  noTransactionsContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  noTransactions: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'LexendDeca_400Regular',
  },
  noTransactionsSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'LexendDeca_400Regular',
  },
  dateSeparator: {
    marginVertical: 10,
  },
  dateSeparatorText: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 4,
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#ccc',
  },
});

export default History;