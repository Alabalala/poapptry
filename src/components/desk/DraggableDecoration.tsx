import { ArrowDownRight, RotateCw, X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
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

  // Base dimensions before user scaling
  // We use these to calculate the center point consistently
  
  // Current dimensions including user scale
  const finalWidth = baseWidth * decoration.scale;
  const finalHeight = baseHeight * decoration.scale;

  // Calculate pixel position from percentage
  // decoration.x/y is the percentage position of the CENTER of the element
  const getPixelPos = (xPercent: number, yPercent: number, scale: number) => {
    const currentW = baseWidth * scale;
    const currentH = baseHeight * scale;
    const safeH = Math.max(containerHeight, 1);
    const x = (xPercent / 100) * safeWidth - (currentW / 2);
    const y = (yPercent / 100) * safeH - (currentH / 2);
    return { x, y };
  };

  const initialPos = getPixelPos(decoration.x, decoration.y, decoration.scale);

  // Local state for smooth interaction (replaces Animated.ValueXY for position)
  // We keep rotation and scale here too for immediate feedback
  const [layout, setLayout] = useState({
    x: initialPos.x,
    y: initialPos.y,
    rotation: decoration.rotation,
    scale: decoration.scale
  });
  
  const isDraggingRef = useRef(false);
  const initialGesture = useRef({ x: 0, y: 0, rotation: 0, scale: 1 });

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
        useNativeDriver: false, 
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
    if (!isDraggingRef.current) {
      const newPos = getPixelPos(decoration.x, decoration.y, decoration.scale);
      setLayout({
        x: newPos.x,
        y: newPos.y,
        rotation: decoration.rotation,
        scale: decoration.scale
      });
    }
  }, [decoration.x, decoration.y, decoration.rotation, decoration.scale, containerWidth, containerHeight]);

  // Main Drag Handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        if (!isEditing) return false;
        return true;
      },
      onMoveShouldSetPanResponder: (e) => {
        if (!isEditing) return false;
        return true;
      },
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        onSelect(decoration.id);
        initialGesture.current = { ...layout };
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        setLayout(prev => ({
          ...prev,
          x: initialGesture.current.x + dx,
          y: initialGesture.current.y + dy
        }));
      },
      onPanResponderRelease: (_, gestureState) => {
        isDraggingRef.current = false;
        
        const newX = initialGesture.current.x + gestureState.dx;
        const newY = initialGesture.current.y + gestureState.dy;
        
        // Calculate dimensions for this specific interaction state
        const currentW = baseWidth * layout.scale;
        const currentH = baseHeight * layout.scale;

        // Calculate center point in pixels
        let centerX = newX + (currentW / 2);
        let centerY = newY + (currentH / 2);
        
        const safeH = Math.max(containerHeight, 1);

        // Apply clamping logic
        if (decoration.type !== 'bookmark') {
           const minX = currentW / 2;
           const maxX = safeWidth - (currentW / 2);
           if (currentW > safeWidth) {
             centerX = safeWidth / 2;
           } else {
             centerX = Math.max(minX, Math.min(maxX, centerX));
           }

           const minY = currentH / 2;
           const maxY = safeH - (currentH / 2);
           if (currentH > safeH) {
             centerY = safeH / 2;
           } else {
             centerY = Math.max(minY, Math.min(maxY, centerY));
           }
        } else {
           // Bookmark clamping
           const overlapBuffer = 20;
           const minX = -(currentW / 2) + overlapBuffer;
           const maxX = safeWidth + (currentW / 2) - overlapBuffer;
           const minY = -(currentH / 2) + overlapBuffer;
           const maxY = safeH + (currentH / 2) - overlapBuffer;
           
           centerX = Math.max(minX, Math.min(maxX, centerX));
           centerY = Math.max(minY, Math.min(maxY, centerY));
        }
        
        // Convert back to percentage
        const newXPercent = (centerX / safeWidth) * 100;
        const newYPercent = (centerY / safeH) * 100;
        
        // Snap visual position
        const clampedX = centerX - (currentW / 2);
        const clampedY = centerY - (currentH / 2);
        
        setLayout(prev => ({ ...prev, x: clampedX, y: clampedY }));

        onUpdate(decoration.id, {
          x: newXPercent,
          y: newYPercent
        });
      },
    })
  ).current;

  // Rotation Handle
  const rotatePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, 
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        initialGesture.current = { ...layout };
      },
      onPanResponderMove: (_, gestureState) => {
        // Linear mapping: Drag right to rotate CW
        const delta = gestureState.dx * 0.8; 
        const newRotation = (initialGesture.current.rotation + delta) % 360;
        setLayout(prev => ({ ...prev, rotation: newRotation }));
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        onUpdate(decoration.id, { rotation: layout.rotation });
      },
      onPanResponderTerminate: (e) => e.stopPropagation(),
    })
  ).current;

  // Resize Handle
  const resizePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, 
      onPanResponderGrant: (e) => {
        e.stopPropagation();
        isDraggingRef.current = true;
        initialGesture.current = { ...layout };
      },
      onPanResponderMove: (_, gestureState) => {
         // Dragging bottom-right corner
         // +dx increases size
         const growth = gestureState.dx; 
         // Calculate relative growth based on current width
         // We use the initial width at the start of THIS drag for smoother scaling
         const startWidth = baseWidth * initialGesture.current.scale;
         const relativeGrowth = growth / startWidth;
         
         // Limit scale between 0.2x and 3x
         const newScale = Math.max(0.2, Math.min(3, initialGesture.current.scale * (1 + relativeGrowth)));
         
         setLayout(prev => ({ ...prev, scale: newScale }));
      },
      onPanResponderRelease: () => {
         isDraggingRef.current = false;
         onUpdate(decoration.id, { scale: layout.scale });
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
        left: layout.x,
        top: layout.y,
        width: baseWidth * layout.scale,
        height: baseHeight * layout.scale,
        
        zIndex: decoration.type === 'stamp' ? 25 : 20,
        elevation: decoration.type === 'stamp' ? 25 : 20,
        transform: [
          { rotate: `${layout.rotation}deg` },
          { scale: scaleAnim }
        ],
        opacity: opacityAnim,
        cursor: isDraggingRef.current ? 'move' : (isSelected ? 'move' : 'default'),
      } as any}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        style={{ 
          width: '100%', 
          height: '100%',
          borderWidth: isSelected && isEditing ? 1 : 0,
          borderColor: '#9CA3AF',
          borderStyle: 'dashed',
          borderRadius: 4,
          touchAction: 'none', // Prevent browser gestures
        } as any}
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