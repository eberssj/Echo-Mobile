import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useFonts, LexendDeca_400Regular, LexendDeca_700Bold } from '@expo-google-fonts/lexend-deca';
import AppLoading from 'expo-app-loading';
import Home from './src/pages/Home';
import AuthScreen from './src/pages/AuthScreen';
import ProfilePage from './src/pages/ProfilePage';
import Chart from './src/pages/Chart';
import History from './src/pages/History';
import Camera from './src/pages/Camera';
import NewGoal from './src/pages/NewGoal'; 

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState<any | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return <AppLoading />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Auth">
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Home"
          options={{ headerShown: false }}
        >
          {(props) => <Home {...props} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen
          name="Profile"
          options={{ headerShown: false }}
        >
          {(props) => <ProfilePage {...props} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen
          name="Chart"
          options={{ headerShown: false }}
        >
          {(props) => <Chart {...props} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen
          name="History"
          options={{ headerShown: false }}
        >
          {(props) => <History {...props} setUser={setUser} />}
        </Stack.Screen>
        <Stack.Screen
          name="Camera"
          component={Camera}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="NewGoal"
          component={NewGoal}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}