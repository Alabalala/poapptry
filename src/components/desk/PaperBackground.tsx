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
      <View style={styles.shadowContainer}>
        {/* 
           Using absolute positioned Image instead of ImageBackground for better control 
           over resizeMode on Web. 'stretch' ensures it fits the container exactly 
           without zooming or cropping.
        */}
        <Image
          source={paperSource}
          style={[StyleSheet.absoluteFill, styles.paperImage]}
          resizeMode="stretch"
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
  shadowContainer: {
    width: '90%',
    maxWidth: 800, // Limit width on large screens
    aspectRatio: 0.7, // A4-ish ratio
    backgroundColor: 'white', // Fallback color
    borderRadius: 2, // Sharpish corners for paper
    // Shadow props
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.2)',
      },
    }),
  },
  paperImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    overflow: 'hidden', // Ensure content doesn't bleed
    borderRadius: 2,
  }
});
