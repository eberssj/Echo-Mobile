import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { format, parseISO } from 'date-fns';

interface Tag {
  tag: string;
  value: number;
  type?: 'income' | 'expense';
}

interface TagListProps {
  tags: { [key: string]: Tag[] };
  currentDate: Date;
}

const TagList: React.FC<TagListProps> = ({ tags, currentDate }) => {
  const currentMonth = format(currentDate, 'yyyy-MM');

  const filteredEntries = Object.entries(tags).filter(([day]) => {
    try {
      const tagDate = parseISO(day);
      return format(tagDate, 'yyyy-MM') === currentMonth;
    } catch (error) {
      console.error(`Erro ao processar a data: ${day}`, error);
      return false;
    }
  });

  const getTotalByTag = (tagType: string) => {
    return filteredEntries.reduce((total, [, tagList]) => {
      const tagTotal = tagList
        .filter((tag) => tag.type?.toLowerCase() === tagType.toLowerCase())
        .reduce((sum, tag) => sum + tag.value, 0);
      return total + tagTotal;
    }, 0);
  };

  const totalIncome = getTotalByTag('income');
  const totalExpense = getTotalByTag('expense');

  const renderItem = ({ item }: { item: [string, Tag[]] }) => {
    const [day, tagList] = item;
    return (
      <View style={styles.listItem}>
        <View style={styles.dot} />
        <Text style={styles.dayText}>{format(parseISO(day), 'dd')}:</Text>
        {tagList.map((t, i) => (
          <Text
            key={`${day}-${i}`}
            style={[
              styles.tagText,
              t.type?.toLowerCase() === 'income' ? styles.income : styles.expense,
            ]}
          >
            {t.tag} - ${t.value}
          </Text>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.tagList}>
      <Text style={styles.title}>
        Transactions for {format(currentDate, 'MMMM yyyy')}:
      </Text>
      {filteredEntries.length === 0 ? (
        <Text style={styles.noTransactions}>No transactions this month.</Text>
      ) : (
        <FlatList
          data={filteredEntries}
          renderItem={renderItem}
          keyExtractor={(item) => item[0]}
          contentContainerStyle={styles.listContainer}
        />
      )}
      <View style={styles.totals}>
        <Text style={styles.totalText}>
          <Text style={styles.bold}>Total Income: </Text>${totalIncome}
        </Text>
        <Text style={styles.totalText}>
          <Text style={styles.bold}>Total Expenses: </Text>${totalExpense}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tagList: {
    padding: 20,
    backgroundColor: '#FAFFFA',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    color: '#3D9F44',
    marginBottom: 10,
    fontFamily: 'LexendDeca_400Regular', // Atualizado
  },
  noTransactions: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'LexendDeca_400Regular', // Atualizado
  },
  listContainer: {
    paddingVertical: 5,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    flexWrap: 'wrap',
    gap: 8,
  },
  dot: {
    width: 4,
    height: 4,
    backgroundColor: 'black',
    borderRadius: 2,
  },
  dayText: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'LexendDeca_400Regular', // Atualizado
  },
  tagText: {
    fontSize: 16,
    fontFamily: 'LexendDeca_400Regular', // Atualizado
  },
  income: {
    color: '#3D9F44',
  },
  expense: {
    color: '#DF2F2F',
  },
  totals: {
    marginTop: 10,
  },
  totalText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'LexendDeca_400Regular', // Atualizado
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default TagList;