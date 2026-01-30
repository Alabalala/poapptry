import '../global.css';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts, 
  CrimsonText_400Regular, 
  CrimsonText_400Regular_Italic, 
  CrimsonText_600SemiBold 
} from '@expo-google-fonts/crimson-text';
import { 
  PlayfairDisplay_400Regular, 
  PlayfairDisplay_700Bold 
} from '@expo-google-fonts/playfair-display';
import { PressStart2P_400Regular } from '@expo-google-fonts/press-start-2p';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Crimson Text': CrimsonText_400Regular,
    'Crimson Text Italic': CrimsonText_400Regular_Italic,
    'Crimson Text Bold': CrimsonText_600SemiBold,
    'Playfair Display': PlayfairDisplay_400Regular,
    'Playfair Display Bold': PlayfairDisplay_700Bold,
    'Press Start 2P': PressStart2P_400Regular,
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
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
