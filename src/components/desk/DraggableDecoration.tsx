import { X } from 'lucide-react-native';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
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
  
  // Determine size
  let width = 100;
  let height = 100;
  
  if (decoration.type === 'washi') {
    width = 220;
    height = 74;
  } else if (decoration.type === 'bookmark') {
    width = 160;
    height = 600;
  }

  const finalWidth = width * decoration.scale;
  const finalHeight = height * decoration.scale;

  // Calculate pixel position from percentage
  // decoration.x/y is the percentage position of the CENTER of the element
  const getPixelPos = (xPercent: number, yPercent: number) => {
    const safeWidth = Math.max(containerWidth, 1);
    const safeHeight = Math.max(containerHeight, 1);
    const x = (xPercent / 100) * safeWidth - (finalWidth / 2);
    const y = (yPercent / 100) * safeHeight - (finalHeight / 2);
    return { x, y };
  };

  const initialPos = getPixelPos(decoration.x, decoration.y);

  // Main position value - stores absolute pixels (relative to container top-left)
  const position = useRef(new Animated.ValueXY({ x: initialPos.x, y: initialPos.y })).current;
  
  // Track drag offset
  const dragOffset = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);

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
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: decoration.opacity,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // Sync position with props when not dragging
  // This ensures that if the parent updates the position (e.g. undo/redo, or initial load), we reflect it
  // We ignore updates while dragging to prevent fighting
  useEffect(() => {
    if (!isDragging.current) {
      const newPos = getPixelPos(decoration.x, decoration.y);
      // We can use setValue here because we aren't dragging
      position.setValue(newPos);
    }
  }, [decoration.x, decoration.y, containerWidth, containerHeight, finalWidth, finalHeight]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditing,
      onMoveShouldSetPanResponder: () => isEditing,
      onPanResponderGrant: () => {
        isDragging.current = true;
        onSelect(decoration.id);
        
        // Capture where we are starting the drag
        // position contains the current absolute coordinates
        // We want to add the gesture delta to this
        // So we set the offset to the current value, and reset value to 0
        position.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        // Flatten offset so position.x/y now contains the final absolute coordinates
        position.flattenOffset();
        
        const currentX = (position.x as any)._value;
        const currentY = (position.y as any)._value;
        
        // Calculate center point in pixels
        let centerX = currentX + (finalWidth / 2);
        let centerY = currentY + (finalHeight / 2);
        
        const safeWidth = Math.max(containerWidth, 1);
        const safeHeight = Math.max(containerHeight, 1);

        // Apply clamping logic based on type
        if (decoration.type !== 'bookmark') {
           // For stamps/washi: ensure the ENTIRE element is inside
           // Left edge >= 0 -> centerX - w/2 >= 0 -> centerX >= w/2
           // Right edge <= W -> centerX + w/2 <= W -> centerX <= W - w/2
           
           const minX = finalWidth / 2;
           const maxX = safeWidth - (finalWidth / 2);
           
           // If element is wider than container, center it
           if (finalWidth > safeWidth) {
             centerX = safeWidth / 2;
           } else {
             centerX = Math.max(minX, Math.min(maxX, centerX));
           }

           const minY = finalHeight / 2;
           const maxY = safeHeight - (finalHeight / 2);
           
           if (finalHeight > safeHeight) {
             centerY = safeHeight / 2;
           } else {
             centerY = Math.max(minY, Math.min(maxY, centerY));
           }
        } else {
           // For bookmarks: allow them to hang off, but ensure they at least TOUCH the paper
           // We enforce at least 20px overlap so it doesn't disappear completely
           const overlapBuffer = 20;
           
           // Min X: Right edge of bookmark touches Left edge of paper (+buffer)
           // Right edge = centerX + w/2. So centerX + w/2 > 0 + buffer
           const minX = -(finalWidth / 2) + overlapBuffer;
           
           // Max X: Left edge of bookmark touches Right edge of paper (-buffer)
           // Left edge = centerX - w/2. So centerX - w/2 < safeWidth - buffer
           const maxX = safeWidth + (finalWidth / 2) - overlapBuffer;
           
           // Min Y: Bottom edge of bookmark touches Top edge of paper (+buffer)
           // Bottom edge = centerY + h/2. So centerY + h/2 > 0 + buffer
           const minY = -(finalHeight / 2) + overlapBuffer;
           
           // Max Y: Top edge of bookmark touches Bottom edge of paper (-buffer)
           // Top edge = centerY - h/2. So centerY - h/2 < safeHeight - buffer
           const maxY = safeHeight + (finalHeight / 2) - overlapBuffer;
           
           centerX = Math.max(minX, Math.min(maxX, centerX));
           centerY = Math.max(minY, Math.min(maxY, centerY));
        }
        
        // Convert back to percentage
        const newXPercent = (centerX / safeWidth) * 100;
        const newYPercent = (centerY / safeHeight) * 100;
        
        // If we clamped, we need to snap the visual position back
        // We do this by setting the position value to the clamped coordinate
        const clampedX = centerX - (finalWidth / 2);
        const clampedY = centerY - (finalHeight / 2);
        
        position.setValue({ x: clampedX, y: clampedY });

        // Update parent state
        onUpdate(decoration.id, {
          x: newXPercent,
          y: newYPercent
        });
        
        isDragging.current = false;
      },
    })
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }} // Easier to grab
      style={{
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
        style={{ width: '100%', height: '100%' }}
        onPress={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : decoration.id);
        }}
        onLongPress={() => onRemove(decoration.id)}
        delayLongPress={500}
      >
        <Image 
          source={source} 
          style={styles.image} 
          resizeMode="contain" 
        />
        
        {isSelected && isEditing && (
          <TouchableOpacity 
            style={[
              styles.deleteButton,
              decoration.type === 'bookmark' && {
                top: '10%', // Move down to avoid string area
                right: '15%', // Move in to hug the bookmark body
              }
            ]}
            onPress={() => onRemove(decoration.id)}
          >
            <X size={12} color="white" />
          </TouchableOpacity>
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
  deleteButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 100,
  }
});