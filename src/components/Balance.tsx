import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';

interface BalanceProps {
  tags: { [key: string]: { tag: string; value: number; type: 'income' | 'expense' }[] };
  currentDate: Date;
}

const Balance: React.FC<BalanceProps> = ({ tags, currentDate }) => {
  const [monthlyProfit, setMonthlyProfit] = useState<{ [key: string]: number }>({});

  const calculateMonthlyProfit = (date: Date) => {
    const monthKey = format(date, 'yyyy-MM');
    const startOfMonthDate = startOfMonth(date);
    const endOfMonthDate = endOfMonth(date);
    const daysInMonth = eachDayOfInterval({ start: startOfMonthDate, end: endOfMonthDate });

    const totalIncome = daysInMonth.reduce((total, day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const tagList = tags[dayKey] || [];
      const income = tagList
        .filter((tag) => tag.type.toLowerCase() === 'income')
        .reduce((sum, tag) => sum + tag.value, 0);
      return total + income;
    }, 0);

    const totalExpense = daysInMonth.reduce((total, day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const tagList = tags[dayKey] || [];
      const expense = tagList
        .filter((tag) => tag.type.toLowerCase() === 'expense')
        .reduce((sum, tag) => sum + tag.value, 0);
      return total + expense;
    }, 0);

    return totalIncome - totalExpense;
  };

  useEffect(() => {
    const months = Object.keys(tags).map((day) => format(parseISO(day), 'yyyy-MM'));
    const uniqueMonths = Array.from(new Set(months));

    const newMonthlyProfit: { [key: string]: number } = {};
    uniqueMonths.forEach((month) => {
      const date = parseISO(`${month}-01`);
      newMonthlyProfit[month] = calculateMonthlyProfit(date);
    });

    setMonthlyProfit(newMonthlyProfit);
  }, [tags]);

  const calculateTotalBalance = () => {
    return Object.values(monthlyProfit).reduce((total, profit) => total + profit, 0);
  };

  const currentMonthProfit = calculateMonthlyProfit(currentDate);

  return (
    <View style={styles.balanceContainer}>
      <View style={styles.balanceTotal}>
        <Text style={styles.balanceTotalText}>${calculateTotalBalance()}</Text>
      </View>
      <Text style={styles.monthTotal}>
        Total for {format(currentDate, 'MMMM')}: ${currentMonthProfit}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  balanceContainer: {
    marginTop: 4,
    flexDirection: 'column',
    gap: 10,
    alignSelf: 'flex-start',
  },
  balanceTotal: {
    backgroundColor: '#3D9F44',
    padding: 12,
    borderRadius: 16,
    width: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceTotalText: {
    color: 'white',
    fontSize: 24,
    textAlign: 'left',
    fontFamily: 'LexendDeca_400Regular', // Atualizado
  },
  monthTotal: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'LexendDeca_400Regular', // Atualizado
    marginBottom: 20,
  },
});

export default Balance;