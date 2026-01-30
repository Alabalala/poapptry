import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { PAPERS } from '../../constants/ThemeRegistry';
import { usePoem } from '../../context/PoemContext';

interface PaperBackgroundProps {
  children: React.ReactNode;
}

export default function PaperBackground({ children }: PaperBackgroundProps) {
  const { activeConfig } = usePoem();
  
  // Fallback to classic if id not found
  const paperSource = PAPERS[activeConfig.paperId as keyof typeof PAPERS] || PAPERS.paper_classic;

  return (
    <View style={styles.container}>
      {/* Stack Effect: A second sheet behind the main one */}
      <View style={[styles.stackLayer, { transform: [{ rotate: '-1.5deg' }] }]} />
      <View style={[styles.stackLayer, { transform: [{ rotate: '1deg' }] }]} />

      <View style={styles.shadowContainer}>
        {/* 
           Using 'repeat' to tile the texture. This ensures high quality 
           regardless of the container size (no blur from stretching).
        */}
        <Image
          source={paperSource}
          style={[StyleSheet.absoluteFill, styles.paperImage]}
          resizeMode="repeat"
        />
        <View style={styles.content}>
          {children}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  stackLayer: {
    position: 'absolute',
    width: '90%',
    maxWidth: 800,
    aspectRatio: 0.7,
    backgroundColor: '#FBFBFB',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Darker border for stack layers
  },
  shadowContainer: {
    width: '90%',
    maxWidth: 800, // Limit width on large screens
    aspectRatio: 0.7, // A4-ish ratio
    backgroundColor: 'white', // Fallback color
    borderRadius: 2, // Sharpish corners for paper
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Clearer border definition
    // Modern Shadow props (Sharper, Darker, More Lifted)
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2, // Increased opacity
        shadowRadius: 18, // Slightly tighter radius
      },
      android: {
        elevation: 15, // Higher elevation
      },
      web: {
        boxShadow: '0px 15px 35px rgba(0, 0, 0, 0.2)', // Darker, substantial shadow
      },
    }),
  },
  paperImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
    opacity: 0.95, // Blend slightly with white background for brightness
  },
  content: {
    flex: 1,
    overflow: 'hidden', // Ensure content doesn't bleed
    borderRadius: 2,
  }
});
