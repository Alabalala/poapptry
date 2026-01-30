import React from 'react';
import { View, ImageBackground, StyleSheet, Platform } from 'react-native';
import { usePoem } from '../../context/PoemContext';
import { PAPERS } from '../../constants/ThemeRegistry';

interface PaperBackgroundProps {
  children?: React.ReactNode;
}

export default function PaperBackground({ children }: PaperBackgroundProps) {
  const { activeConfig } = usePoem();
  
  // Resolve the paper image source
  const paperSource = PAPERS[activeConfig.paperId as keyof typeof PAPERS] || PAPERS.paper_classic;

  return (
    <View style={styles.container}>
      <View style={styles.shadowContainer}>
        <ImageBackground
          source={paperSource}
          style={styles.paper}
          imageStyle={styles.image}
          resizeMode="cover"
        >
          {children}
        </ImageBackground>
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
    aspectRatio: 0.7,
    backgroundColor: 'white', // Fallback for shadow
    borderRadius: 4, // Slight rounding for paper
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
  paper: {
    flex: 1,
    overflow: 'hidden', // Ensure content/image respects border radius
    borderRadius: 4,
  },
  image: {
    borderRadius: 4,
  },
});
