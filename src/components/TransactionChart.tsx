import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Picker } from '@react-native-picker/picker';
import CalendarWeekIcon from '../assets/calendar-week.svg';

interface Tag {
  tag: string;
  value: number;
  type: 'income' | 'expense';
}

interface TransactionChartProps {
  tags: { [key: string]: Tag[] } | null;
  mode: 'general' | 'incomes' | 'expenses';
  setMode: (mode: 'general' | 'incomes' | 'expenses') => void;
  month: string;
  setMonth: (month: string) => void;
}

const screenWidth = Dimensions.get('window').width;

const TransactionChart: React.FC<TransactionChartProps> = ({ tags, mode, setMode, month, setMonth }) => {
  // Generate month options (from Jan 2024 to Dec 2026)
  const generateMonthOptions = () => {
    const options = [{ label: 'Overall', value: 'Overall' }];
    const startDate = new Date(2024, 0, 1); // January 2024
    const endDate = new Date(2026, 11, 31); // December 2026
    let current = startDate;

    while (current <= endDate) {
      const value = current.toISOString().slice(0, 7); // YYYY-MM
      const label = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      options.push({ label, value });
      current.setMonth(current.getMonth() + 1);
    }

    return options;
  };

  const monthOptions = useMemo(() => generateMonthOptions(), []);

  // Aggregate data for the charts with single month filtering
  const aggregateData = () => {
    const tagMap: { [key: string]: { value: number; type: 'income' | 'expense' } } = {};

    if (!tags) return tagMap;

    Object.entries(tags).forEach(([date, dayTags]) => {
      // Filter by selected month
      if (month !== 'Overall') {
        const entryDate = date.slice(0, 7); // YYYY-MM
        if (entryDate !== month) {
          return;
        }
      }

      dayTags.forEach(({ tag, value, type }) => {
        if (!tagMap[tag]) {
          tagMap[tag] = { value: 0, type };
        }
        // Use parseFloat e toFixed para evitar problemas de precisão de ponto flutuante
        tagMap[tag].value = parseFloat((tagMap[tag].value + value).toFixed(2));
      });
    });

    return tagMap;
  };

  const tagMap = aggregateData();

  // Prepare chart data based on mode
  const getChartData = () => {
    const data = Object.entries(tagMap)
      .filter(([_, { type }]) => {
        if (mode === 'general') return true;
        return type === mode.slice(0, -1) as 'income' | 'expense'; // Remove 's' for comparison
      })
      .map(([tag, { value, type }], index) => {
        const formattedValue = value.toFixed(2).replace('.', ',');
        return {
          name: tag,
          value, // Valor bruto para o gráfico
          formattedValue, // Valor formatado para a legenda
          color: type === 'income' ? `hsl(120, 50%, ${70 - index * 10}%)` : `hsl(0, 50%, ${70 - index * 10}%)`,
          legendFontColor: '#333',
          legendFontSize: 14,
        };
      });

    // Log para depuração
    console.log('Chart Data:', data);

    return data.length > 0
      ? data
      : [{ name: 'No Data', value: 1, formattedValue: '0,00', color: '#ccc', legendFontColor: '#333', legendFontSize: 14 }];
  };

  const chartData = getChartData();

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartPageTitle}>Transaction Charts</Text>
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Chart Type:</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={mode}
            onValueChange={(value) => setMode(value)}
            style={styles.picker}
            itemStyle={styles.pickerItem}
          >
            <Picker.Item label="General" value="general" />
            <Picker.Item label="Incomes" value="incomes" />
            <Picker.Item label="Expenses" value="expenses" />
          </Picker>
        </View>
      </View>
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Select Month:</Text>
        <View style={styles.monthPickerContainer}>
          <CalendarWeekIcon width={26} height={24} style={styles.calendarIcon} />
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={month}
              onValueChange={(value) => setMonth(value)}
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {monthOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>
      </View>
      <View style={styles.chartContentContainer}>
        <View style={styles.chartWrapper}>
          <PieChart
            data={chartData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
          <View style={styles.legend}>
            {chartData.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText}>{`${item.name}: R$ ${item.formattedValue}`}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    flexDirection: 'column',
    padding: 20,
    flex: 1,
  },
  chartPageTitle: {
    fontSize: 24,
    marginBottom: 20,
    fontFamily: 'LexendDeca_400Regular',
  },
  selectorContainer: {
    marginBottom: 20,
  },
  selectorLabel: {
    fontSize: 16,
    fontFamily: 'LexendDeca_400Regular',
    marginBottom: 10,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#3d9f44',
    borderRadius: 5,
    overflow: 'hidden',
    flex: 1,
    minWidth: 200,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  pickerItem: {
    fontSize: 12,
    fontFamily: 'LexendDeca_400Regular',
    color: '#333',
    textAlign: 'left',
  },
  monthPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  calendarIcon: {
    marginRight: 10,
  },
  chartContentContainer: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 1200,
    alignItems: 'flex-start',
    marginTop: 40,
  },
  chartWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legend: {
    marginLeft: 20,
    flexDirection: 'column',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'LexendDeca_400Regular',
    color: '#333',
  },
});

export default TransactionChart;