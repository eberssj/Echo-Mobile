import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Navbar from '../components/Navbar';

interface AboutUsProps {
  setUser: (user: any | null) => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ setUser }) => {
  const navigation = useNavigation();

  const handleGetStarted = () => {
    navigation.navigate('Home');
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@echoapp.com?subject=Feedback%20sobre%20o%20Echo');
  };

  return (
    <View style={styles.container}>
      <Navbar setUser={setUser} />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.aboutContainer}>
          <Text style={styles.pageTitle}>
            This is <Text style={styles.echoText}>Echo</Text>.
          </Text>
          <View style={styles.content}>
            <Text style={styles.contentText}>
              Echo is a personal financial management application designed to help you track your incomes and expenses throughout the month. With Echo, you can easily add your financial transactions day by day and monitor your balance in real-time.
            </Text>
            <Text style={styles.contentText}>
              Developed by a passionate individual, Echo is continuously being improved to provide a better user experience. Whether you're managing daily expenses or planning your budget, Echo is here to simplify your financial life.
            </Text>
            <Text style={styles.contentText}>
              Thank you for choosing Echo as your personal finance companion. We hope it helps you achieve your financial goals!
            </Text>
          </View>
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>How it works?</Text>
          <View style={styles.howItWorksContainer}>
            <View style={styles.imageContainer}>
              <Image
                source={require('../assets/calendar-example.png')}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.contentText}>
                The Echo calendar is designed to help you easily manage your financial transactions. To add incomes or expenses, simply click on the day when the transaction occurred. Once you select the day, you can choose whether it's an income or an expense. Additionally, you can add tags to categorize the type of spending or income, such as "Groceries," "Salary," or "Utilities." This tagging system allows you to organize and analyze your finances more effectively.
              </Text>
            </View>
          </View>
          <Text style={styles.pageTitle}>Contact Us</Text>
          <View style={styles.content}>
            <Text style={styles.contentText}>
              Have suggestions or feedback? We'd love to hear from you! Reach out to us at{' '}
              <Text style={styles.contactLink} onPress={handleContact}>
                support@echoapp.com
              </Text>
              .
            </Text>
          </View>
          <View style={styles.footerSpacer} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5', // Fundo suave para contraste
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  aboutContainer: {
    flexDirection: 'column',
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pageTitle: {
    fontSize: 28,
    marginBottom: 20,
    color: '#333',
    fontFamily: 'LexendDeca_400Regular',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  echoText: {
    color: '#3d9f44',
    fontFamily: 'LexendDeca_700Bold',
  },
  content: {
    width: '100%',
    maxWidth: 800,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  contentText: {
    fontSize: 16,
    color: '#444',
    lineHeight: 26,
    marginBottom: 15,
    fontFamily: 'LexendDeca_400Regular',
    textAlign: 'justify',
  },
  getStartedButton: {
    backgroundColor: '#3d9f44',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 30,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  getStartedText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'LexendDeca_400Regular',
    textAlign: 'center',
  },
  howItWorksContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 800,
    marginTop: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: 380,
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contactLink: {
    color: '#3d9f44',
    textDecorationLine: 'underline',
    fontFamily: 'LexendDeca_400Regular',
  },
  footerSpacer: {
    height: 40,
  },
});

export default AboutUs;