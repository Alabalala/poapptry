import React, { useState } from 'react';
import { Image, Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { BOOKMARKS, PAPERS, WASHI } from '../../constants/ThemeRegistry';
import { usePoem } from '../../context/PoemContext';
import DraggableStamp from './DraggableStamp';

interface PaperBackgroundProps {
  children: React.ReactNode;
}

export default function PaperBackground({ children }: PaperBackgroundProps) {
  const { 
    activeConfig, 
    fixedDecorations, 
    stamps, 
    updateStamp, 
    removeStamp, 
    isEditing,
    selectedStampId,
    setSelectedStampId,
    setPaperBounds
  } = usePoem();
  const [paperLayout, setPaperLayout] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<View>(null);
  
  const handleLayout = () => {
    containerRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setPaperBounds({ x: pageX, y: pageY, width, height });
      setPaperLayout({ width, height });
    });
  };

  // Fallback to classic if id not found
  const paperSource = PAPERS[activeConfig.paperId as keyof typeof PAPERS] || PAPERS.paper_classic;
  
  // Resolve decoration sources
  const washiSource = fixedDecorations.washiId ? WASHI[fixedDecorations.washiId as keyof typeof WASHI] : null;
  const bookmarkSource = fixedDecorations.bookmarkId ? BOOKMARKS[fixedDecorations.bookmarkId as keyof typeof BOOKMARKS] : null;

  // Dynamic Styles for Positioning
  const washiStyle = {
    top: fixedDecorations.washiPosition === 'top' ? -20 : undefined,
    bottom: fixedDecorations.washiPosition === 'bottom' ? -20 : undefined,
  };

  const bookmarkStyle = {
    right: fixedDecorations.bookmarkSide === 'right' ? -40 : undefined,
    left: fixedDecorations.bookmarkSide === 'left' ? -40 : undefined,
    transform: fixedDecorations.bookmarkSide === 'left' ? [{ scaleX: -1 }] : undefined, // Mirror for left side
  };

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedStampId(null)}>
      <View style={styles.container}>
        {/* Stack Effect: A second sheet behind the main one */}
        <View style={[styles.stackLayer, { transform: [{ rotate: '-1.5deg' }] }]} />
        <View style={[styles.stackLayer, { transform: [{ rotate: '1deg' }] }]} />

        <View 
          ref={containerRef}
          style={styles.shadowContainer}
          onLayout={handleLayout}
        >
          <Image
            source={paperSource}
            style={[StyleSheet.absoluteFill, styles.paperImage]}
            resizeMode="cover"
          />
          <View style={styles.content}>
            {children}
          </View>

          {/* Decorations Layer - Renders on top of paper content */}
          {washiSource && (
            <View style={[styles.washiContainer, washiStyle]} pointerEvents="none">
              <Image 
                source={washiSource} 
                style={styles.washiImage} 
                resizeMode="contain" 
              />
            </View>
          )}
          
          {bookmarkSource && (
            <View style={[styles.bookmarkContainer, bookmarkStyle]} pointerEvents="none">
              <Image 
                source={bookmarkSource} 
                style={styles.bookmarkImage} 
                resizeMode="contain" 
              />
            </View>
          )}

          {/* Stamps Layer - Renders last to be on top */}
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: 2 }]} pointerEvents="box-none">
            {stamps.map((stamp) => (
              <DraggableStamp
                key={stamp.id}
                stamp={stamp}
                containerWidth={paperLayout.width || 100} 
                containerHeight={paperLayout.height || 100}
                onUpdate={updateStamp}
                onRemove={removeStamp}
                onSelect={setSelectedStampId}
                isSelected={selectedStampId === stamp.id}
                isEditing={isEditing}
              />
            ))}
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
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
    position: 'relative', // For absolute positioning of decorations
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
  },
  washiContainer: {
    position: 'absolute',
    alignSelf: 'center',
    width: 180, // Bigger (was 130)
    height: 60, // Bigger (was 45)
    zIndex: 20,
    ...Platform.select({
      web: { filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.1))' }
    })
  },
  washiImage: {
    width: '100%',
    height: '100%',
  },
  bookmarkContainer: {
    position: 'absolute',
    top: -40, // Higher up to balance length
    width: '40%', // Even Bigger
    height: '110%', // Longer than page
    zIndex: 15,
    ...Platform.select({
      web: { filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.2))' }
    })
  },
  bookmarkImage: {
    width: '100%',
    height: '100%',
  },
});


