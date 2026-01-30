import { X } from 'lucide-react-native';
import React, { useRef } from 'react';
import { Animated, Image, PanResponder, StyleSheet, TouchableOpacity } from 'react-native';
import { STAMPS } from '../../constants/ThemeRegistry';
import { Stamp } from '../../context/PoemContext';

interface DraggableStampProps {
  stamp: Stamp;
  containerWidth: number;
  containerHeight: number;
  onUpdate: (id: string, updates: Partial<Stamp>) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string | null) => void;
  isSelected: boolean;
  isEditing: boolean;
}

export default function DraggableStamp({ 
  stamp, 
  containerWidth, 
  containerHeight, 
  onUpdate, 
  onRemove,
  onSelect,
  isSelected,
  isEditing 
}: DraggableStampProps) {
  const stampSource = STAMPS[stamp.assetId as keyof typeof STAMPS];
  
  // Position refs for gesture handling
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
  // Entry animation values
  const scaleAnim = useRef(new Animated.Value(1.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Run entry animation on mount
  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true, // Native driver for better performance
      }),
      Animated.timing(opacityAnim, {
        toValue: stamp.opacity,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  // We need to track the current percentage position to update it on release
  const currentPos = useRef({ x: stamp.x, y: stamp.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditing,
      onMoveShouldSetPanResponder: () => isEditing,
      onPanResponderGrant: () => {
        onSelect(stamp.id);
        // Initialize offset with current animated value
        position.extractOffset();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: position.x, dy: position.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        position.flattenOffset();
        
        // Calculate new percentage position based on drag delta
        // We start from the render position logic:
        // Render X = (percentX / 100) * containerWidth - (stampSize / 2)
        // Delta X (gestureState.dx) is in pixels.
        // New Pixel X = Old Pixel X + gestureState.dx
        
        // Simpler approach:
        // 1. Calculate the pixel delta in percentage
        const deltaXPercent = (gestureState.dx / containerWidth) * 100;
        const deltaYPercent = (gestureState.dy / containerHeight) * 100;
        
        // 2. Update current stored pos
        currentPos.current.x = Math.max(0, Math.min(100, currentPos.current.x + deltaXPercent));
        currentPos.current.y = Math.max(0, Math.min(100, currentPos.current.y + deltaYPercent));
        
        // 3. Update parent state
        onUpdate(stamp.id, {
          x: currentPos.current.x,
          y: currentPos.current.y
        });
        
        // 4. Reset animated value since we updated the base position via props/state re-render
        // Actually, since we update the state, the component will re-render with new top/left styles.
        // We should reset the animated value to 0 so it doesn't double-apply the offset.
        position.setValue({ x: 0, y: 0 });
      },
    })
  ).current;

  // Sync ref if props change externally (though usually driven by this component)
  if (stamp.x !== currentPos.current.x || stamp.y !== currentPos.current.y) {
    currentPos.current = { x: stamp.x, y: stamp.y };
  }

  // Calculate pixel position from percentage
  // Stamp size is fixed for now (e.g. 80px)
  const STAMP_SIZE = 100 * stamp.scale;
  
  const left = (stamp.x / 100) * containerWidth - (STAMP_SIZE / 2);
  const top = (stamp.y / 100) * containerHeight - (STAMP_SIZE / 2);

  // If we are dragging, we add the animated value.
  // But wait, if we reset animated value on release and update state,
  // we can just use `transform: position.getTranslateTransform()` combined with `left/top`.
  
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        left,
        top,
        width: STAMP_SIZE,
        height: STAMP_SIZE,
        zIndex: 25, // Above decorations
        elevation: 25, // For Android
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: `${stamp.rotation}deg` },
          { scale: scaleAnim } // Add scale animation
        ],
        opacity: opacityAnim, // Use animated opacity
        // backgroundColor: 'rgba(255, 0, 0, 0.3)', // DEBUG: Visible hit box
      }}
    >
      <TouchableOpacity 
        activeOpacity={1} 
        style={{ width: '100%', height: '100%' }}
        onPress={(e) => {
          e.stopPropagation();
          onSelect(isSelected ? null : stamp.id);
        }}
        onLongPress={() => onRemove(stamp.id)}
        delayLongPress={500}
      >
        <Image 
          source={stampSource} 
          style={styles.image} 
          resizeMode="contain" 
        />
        
        {isSelected && isEditing && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => onRemove(stamp.id)}
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
  }
});
