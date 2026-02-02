import { ArrowDownRight, RotateCw, X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, TouchableOpacity, View } from 'react-native';
import { BOOKMARKS, STAMPS, WASHI } from '../../constants/ThemeRegistry';
import { Decoration } from '../../context/PoemContext';

interface DraggableDecorationProps {
  decoration: Decoration;
  containerWidth: number;
  containerHeight: number;
  onUpdate: (id: string, updates: Partial<Decoration>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string | null) => void;
  isSelected: boolean;
  isEditing: boolean;
}

export default function DraggableDecoration({ 
  decoration, 
  containerWidth, 
  containerHeight, 
  onUpdate, 
  onRemove,
  onSelect,
  isSelected,
  isEditing 
}: DraggableDecorationProps) {
  
  // Resolve source based on type/assetId
  let source;
  if (decoration.type === 'washi') {
    source = WASHI[decoration.assetId as keyof typeof WASHI];
  } else if (decoration.type === 'bookmark') {
    source = BOOKMARKS[decoration.assetId as keyof typeof BOOKMARKS];
  } else {
    source = STAMPS[decoration.assetId as keyof typeof STAMPS];
  }
  
  // Determine size relative to page width
  // This ensures assets scale with the page
  const safeWidth = Math.max(containerWidth, 1);
  let baseWidth = 100;
  let baseHeight = 100;
  
  if (decoration.type === 'washi') {
    // Washi tapes are about 55% of page width
    baseWidth = safeWidth * 0.55;
    baseHeight = baseWidth * (74 / 220); // Maintain aspect ratio
  } else if (decoration.type === 'bookmark') {
    // Bookmarks are about 40% of page width
    baseWidth = safeWidth * 0.40;
    baseHeight = baseWidth * (600 / 160); // Maintain aspect ratio
  } else {
    // Stamps are about 25% of page width
    baseWidth = safeWidth * 0.25;
    baseHeight = baseWidth; // Square
  }

  const finalWidth = baseWidth * decoration.scale;
  const finalHeight = baseHeight * decoration.scale;

  // Calculate pixel position from percentage
  // decoration.x/y is the percentage position of the CENTER of the element
  const getPixelPos = (xPercent: number, yPercent: number) => {
    const safeH = Math.max(containerHeight, 1);
    const x = (xPercent / 100) * safeWidth - (finalWidth / 2);
    const y = (yPercent / 100) * safeH - (finalHeight / 2);
    return { x, y };
  };

  const initialPos = getPixelPos(decoration.x, decoration.y);

  // Main position value - stores absolute pixels (relative to container top-left)
  const position = useRef(new Animated.ValueXY({ x: initialPos.x, y: initialPos.y })).current;
  
  // Track drag offset
  const isDragging = useRef(false);
  const initialRotation = useRef(0);
  const initialScale = useRef(1);

  // Entry animation
  const scaleAnim = useRef(new Animated.Value(1.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Run entry animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: false, // Changed to false to support web/transforms properly
      }),
      Animated.timing(opacityAnim, {
        toValue: decoration.opacity,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);
  
  // Sync position with props when not dragging
  useEffect(() => {
    if (!isDragging.current) {
      const newPos = getPixelPos(decoration.x, decoration.y);
      position.setValue(newPos);
    }
  }, [decoration.x, decoration.y, containerWidth, containerHeight, finalWidth, finalHeight]);

  // Main Drag Handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        if (!isEditing) return false;
        // Don't capture if touching handles (handled by their own responders)
        return true;
      },
      onMoveShouldSetPanResponder: (e) => {
        if (!isEditing) return false;
        return true;
      },
      onPanResponderGrant: (e) => {
        isDragging.current = true;
        onSelect(decoration.id);
        position.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        position.flattenOffset();
        
        const currentX = (position.x as any)._value;
        const currentY = (position.y as any)._value;
        
        // Calculate center point in pixels
        let centerX = currentX + (finalWidth / 2);
        let centerY = currentY + (finalHeight / 2);
        
        const safeH = Math.max(containerHeight, 1);

        // Apply clamping logic
        if (decoration.type !== 'bookmark') {
           const minX = finalWidth / 2;
           const maxX = safeWidth - (finalWidth / 2);
           if (finalWidth > safeWidth) {
             centerX = safeWidth / 2;
           } else {
             centerX = Math.max(minX, Math.min(maxX, centerX));
           }

           const minY = finalHeight / 2;
           const maxY = safeH - (finalHeight / 2);
           if (finalHeight > safeH) {
             centerY = safeH / 2;
           } else {
             centerY = Math.max(minY, Math.min(maxY, centerY));
           }
        } else {
           // Bookmark clamping
           const overlapBuffer = 20;
           const minX = -(finalWidth / 2) + overlapBuffer;
           const maxX = safeWidth + (finalWidth / 2) - overlapBuffer;
           const minY = -(finalHeight / 2) + overlapBuffer;
           const maxY = safeH + (finalHeight / 2) - overlapBuffer;
           
           centerX = Math.max(minX, Math.min(maxX, centerX));
           centerY = Math.max(minY, Math.min(maxY, centerY));
        }
        
        // Convert back to percentage
        const newXPercent = (centerX / safeWidth) * 100;
        const newYPercent = (centerY / safeH) * 100;
        
        // Snap visual position
        const clampedX = centerX - (finalWidth / 2);
        const clampedY = centerY - (finalHeight / 2);
        position.setValue({ x: clampedX, y: clampedY });

        onUpdate(decoration.id, {
          x: newXPercent,
          y: newYPercent
        });
        
        isDragging.current = false;
      },
    })
  ).current;

  // Rotation Handle
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // Prevent parent from stealing
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        initialRotation.current = decoration.rotation;
      },
      onPanResponderMove: (e, gestureState) => {
        // Linear mapping: Drag right to rotate CW
        const delta = gestureState.dx * 0.8; 
        const newRotation = (initialRotation.current + delta) % 360;
        onUpdate(decoration.id, { rotation: newRotation });
      },
      onPanResponderTerminate: (e) => e.stopPropagation(),
    })
  ).current;

  // Resize Handle
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // Prevent parent from stealing
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        initialScale.current = decoration.scale;
      },
      onPanResponderMove: (e, gestureState) => {
         // Dragging bottom-right corner
         // +dx increases size
         const growth = gestureState.dx; 
         // Calculate relative growth based on current width
         const relativeGrowth = growth / finalWidth;
         // Limit scale between 0.2x and 3x
         const newScale = Math.max(0.2, Math.min(3, initialScale.current * (1 + relativeGrowth)));
         
         onUpdate(decoration.id, { scale: newScale });
      },
      onPanResponderTerminate: (e) => e.stopPropagation(),
    })
  ).current;

  // Delete Handle
  const deletePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        e.stopPropagation();
      },
      onPanResponderRelease: (e, gestureState) => {
        // Tap detection
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
           onRemove(decoration.id);
        }
      },
      onPanResponderTerminate: (e) => e.stopPropagation(),
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        touchAction: 'none',
        position: 'absolute',
        left: 0,
        top: 0,
        width: finalWidth,
        height: finalHeight,
        zIndex: decoration.type === 'stamp' ? 25 : 20,
        elevation: decoration.type === 'stamp' ? 25 : 20,
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: `${decoration.rotation}deg` },
          { scale: scaleAnim }
        ],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderWidth: isSelected && isEditing ? 1 : 0,
          borderColor: '#9CA3AF',
          borderStyle: 'dashed',
          borderRadius: 4
        }}
        onPress={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : decoration.id);
        }}
      >
        <Image 
          source={source} 
          style={styles.image} 
          resizeMode="contain" 
        />
        
        {/* Controls Overlay */}
        {isSelected && isEditing && (
          <>
            {/* Delete Button (Top Right) */}
            <View 
              {...deletePanResponder.panHandlers}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={[
                styles.controlButton,
                styles.deleteButton,
                { touchAction: 'none' } as any,
                decoration.type === 'bookmark' && {
                  top: '10%',
                  right: '15%',
                }
              ]}
            >
              <X size={12} color="white" />
            </View>

            {/* Rotate Handle (Top Center) */}
            <View
              {...rotatePanResponder.panHandlers}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={[
                styles.controlButton,
                styles.rotateButton,
                { touchAction: 'none' } as any,
                decoration.type === 'bookmark' && { top: '5%' }
              ]}
            >
              <RotateCw size={12} color="#374151" />
            </View>

            {/* Resize Handle (Bottom Right) */}
            <View
              {...resizePanResponder.panHandlers}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={[
                styles.controlButton,
                styles.resizeButton,
                { touchAction: 'none' } as any,
                decoration.type === 'bookmark' && {
                  bottom: '10%',
                  right: '15%',
                }
              ]}
            >
              <ArrowDownRight size={12} color="#374151" />
            </View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  controlButton: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 100,
  },
  deleteButton: {
    top: -10,
    right: -10,
    backgroundColor: '#EF4444',
    borderColor: 'white',
  },
  rotateButton: {
    top: -25,
    left: '50%',
    marginLeft: -12,
    backgroundColor: 'white',
  },
  resizeButton: {
    bottom: -10,
    right: -10,
    backgroundColor: 'white',
  }
});