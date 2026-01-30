import React from 'react';
import { View, TextInput, ImageBackground, StyleSheet, SafeAreaView } from 'react-native';
import { PAPERS } from '../constants/ThemeRegistry';

export default function Desk() {
  return (
    <ImageBackground 
      source={PAPERS.paper_classic} 
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <TextInput
            style={styles.input}
            multiline
            placeholder="Write your poem..."
            placeholderTextColor="#555"
            autoCapitalize="sentences"
            autoCorrect={false}
          />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontFamily: 'Crimson Text',
    fontSize: 18,
    lineHeight: 28,
    color: '#000',
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    borderWidth: 0,
    // Ensure no outline on web
    outlineStyle: 'none',
  } as any, // Cast to any to suppress TypeScript error for web-only 'outlineStyle' if needed, though React Native types might allow it or ignore it.
});
