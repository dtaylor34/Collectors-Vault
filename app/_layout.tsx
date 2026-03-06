import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Roboto_100Thin,
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
  Roboto_800ExtraBold,
  Roboto_900Black,
} from '@expo-google-fonts/roboto';
import { ThemeProvider, useTheme } from '../hooks/useTheme';

// Keep splash visible while fonts load
SplashScreen.preventAutoHideAsync();

function InnerLayout() {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={colors.statusBar === 'light' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Roboto_100Thin,
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
    Roboto_800ExtraBold,
    Roboto_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#06060F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD600" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <InnerLayout />
    </ThemeProvider>
  );
}
