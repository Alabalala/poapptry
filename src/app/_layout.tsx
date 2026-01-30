import { PoemProvider } from '@/context/PoemContext';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import {
  CourierPrime_400Regular,
  CourierPrime_400Regular_Italic,
  CourierPrime_700Bold,
  CourierPrime_700Bold_Italic
} from '@expo-google-fonts/courier-prime';
import {
  CrimsonText_400Regular,
  CrimsonText_400Regular_Italic,
  CrimsonText_600SemiBold,
  useFonts
} from '@expo-google-fonts/crimson-text';
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold
} from '@expo-google-fonts/playfair-display';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Crimson Text': CrimsonText_400Regular,
    'Crimson Text Italic': CrimsonText_400Regular_Italic,
    'Crimson Text Bold': CrimsonText_600SemiBold,
    'Playfair Display': PlayfairDisplay_400Regular,
    'Playfair Display Bold': PlayfairDisplay_700Bold,
    'PressStart2P': PressStart2P_400Regular,
    'Courier Prime': CourierPrime_400Regular,
    'Courier Prime Italic': CourierPrime_400Regular_Italic,
    'Courier Prime Bold': CourierPrime_700Bold,
    'Courier Prime Bold Italic': CourierPrime_700Bold_Italic,
    'VT323': VT323_400Regular,
    'Caveat': Caveat_400Regular,
    'Caveat Bold': Caveat_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <PoemProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </SafeAreaProvider>
    </PoemProvider>
  );
}
