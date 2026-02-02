import React, { useState } from 'react';
import { Image, LayoutChangeEvent, Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { PAPERS } from '../../constants/ThemeRegistry';
import { usePoem } from '../../context/PoemContext';
import DraggableDecoration from './DraggableDecoration';

interface PaperBackgroundProps {
  children: React.ReactNode;
  availableWidth?: number;
  onSizeChange?: (width: number, height: number) => void;
}

export default function PaperBackground({ children, availableWidth, onSizeChange }: PaperBackgroundProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const effectiveWidth = availableWidth ?? windowWidth;
  const { 
    activeConfig, 
    stamps, 
    washiTapes,
    bookmarks,
    updateDecoration, 
    removeDecoration, 
    isEditing,
    selectedDecorationId,
    setSelectedDecorationId,
    setPaperBounds
  } = usePoem();
  const [paperLayout, setPaperLayout] = useState({ width: 0, height: 0 });
  const containerRef = React.useRef<View>(null);
  
  // A4 Ratio Logic
  const A4_RATIO = 0.707; // Width / Height
  // Reduce height ratio in edit mode to fit between top/bottom bars without scrolling
  const MAX_HEIGHT_RATIO = isEditing ? 0.65 : 0.82; 
  const MAX_WIDTH_RATIO = 0.90; // Max 90% of screen width

  const maxAllowedHeight = windowHeight * MAX_HEIGHT_RATIO;
  const maxAllowedWidth = effectiveWidth * MAX_WIDTH_RATIO;

  let paperHeight = maxAllowedHeight;
  let paperWidth = paperHeight * A4_RATIO;

  // If calculated width is too wide, constrain width and recalculate height
  if (paperWidth > maxAllowedWidth) {
    paperWidth = maxAllowedWidth;
    paperHeight = paperWidth / A4_RATIO;
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setPaperLayout({ width, height });
    
    containerRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
      setPaperBounds({ x: pageX, y: pageY, width: w || width, height: h || height });
      onSizeChange?.(w || width, h || height);
    });
  };

  // Fallback to classic if id not found
  const paperSource = PAPERS[activeConfig.paperId as keyof typeof PAPERS] || PAPERS.paper_classic;

  return (
    <View style={styles.container}>
        <View style={[styles.stackLayer, { width: paperWidth, height: paperHeight, transform: [{ rotate: '-1.5deg' }] }]} />
        <View style={[styles.stackLayer, { width: paperWidth, height: paperHeight, transform: [{ rotate: '1deg' }] }]} />

        <View 
          ref={containerRef}
          style={[
            styles.shadowContainer,
            { 
              width: paperWidth,
              height: paperHeight,
              maxHeight: undefined, // Override default styles
              maxWidth: undefined,
              aspectRatio: undefined // We handle ratio manually
            }
          ]}
          onLayout={handleLayout}
        >
          <Image
            source={paperSource}
            style={[StyleSheet.absoluteFill, styles.paperImage]}
            resizeMode="cover"
          />

          {/* Layer 1: Stamps (Bottom) */}
          <View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                overflow: 'hidden', 
                borderRadius: 2,
                zIndex: 10,
                elevation: 10 
              }
            ]} 
            pointerEvents="box-none"
          >
            {stamps.map((decoration) => (
              <DraggableDecoration
                key={decoration.id}
                decoration={decoration}
                containerWidth={paperLayout.width || 100} 
                containerHeight={paperLayout.height || 100}
                onUpdate={updateDecoration}
                onRemove={removeDecoration}
                onSelect={setSelectedDecorationId}
                isSelected={selectedDecorationId === decoration.id}
                isEditing={isEditing}
                zIndex={10}
              />
            ))}
          </View>

          {/* Layer 2: Content (TextBoxes) */}
          <View 
            style={[
              styles.content,
              { zIndex: 20, elevation: 20 } 
            ]} 
            pointerEvents="box-none"
          >
            {children}
          </View>

          {/* Layer 3: Washi Tapes */}
          <View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                overflow: 'hidden', 
                borderRadius: 2,
                zIndex: 30,
                elevation: 30 
              }
            ]} 
            pointerEvents="box-none"
          >
            {washiTapes.map((decoration) => (
              <DraggableDecoration
                key={decoration.id}
                decoration={decoration}
                containerWidth={paperLayout.width || 100} 
                containerHeight={paperLayout.height || 100}
                onUpdate={updateDecoration}
                onRemove={removeDecoration}
                onSelect={setSelectedDecorationId}
                isSelected={selectedDecorationId === decoration.id}
                isEditing={isEditing}
                zIndex={30}
              />
            ))}
          </View>

          {/* Layer 4: Bookmarks (Top) */}
          <View 
            style={[
              StyleSheet.absoluteFill, 
              { 
                overflow: 'visible', // Bookmarks can hang off
                borderRadius: 2,
                zIndex: 40,
                elevation: 40
              }
            ]} 
            pointerEvents="box-none"
          >
            {bookmarks.map((decoration) => (
              <DraggableDecoration
                key={decoration.id}
                decoration={decoration}
                containerWidth={paperLayout.width || 100} 
                containerHeight={paperLayout.height || 100}
                onUpdate={updateDecoration}
                onRemove={removeDecoration}
                onSelect={setSelectedDecorationId}
                isSelected={selectedDecorationId === decoration.id}
                isEditing={isEditing}
                zIndex={40}
              />
            ))}
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
    maxHeight: '100%',
    backgroundColor: '#FBFBFB',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)', // Darker border for stack layers
  },
  shadowContainer: {
    width: '90%',
    maxWidth: 800, // Limit width on large screens
    aspectRatio: 0.7,
    maxHeight: '100%',
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
      } as any,
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
    width: '100%',
    overflow: 'visible', // Allow menus to extend beyond paper bounds
    borderRadius: 2,
  },
});
