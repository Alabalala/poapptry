import { GripHorizontal } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { PanResponder, Platform, StyleSheet, Text, View, ViewStyle } from 'react-native';

interface DraggableMenuProps {
  initialX?: number;
  initialY?: number;
  children?: React.ReactNode;
  title?: string;
  style?: ViewStyle;
  onPositionChange?: (x: number, y: number) => void;
}

export default function DraggableMenu({ 
  initialX = 20, 
  initialY = 20, 
  children, 
  title, 
  style,
  onPositionChange 
}: DraggableMenuProps) {
  const [position, setPosition] = useState({ x: initialX, y: initialY });
  const initialGesture = useRef({ x: initialX, y: initialY });
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        initialGesture.current = { ...position };
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = initialGesture.current.x + gestureState.dx;
        const newY = initialGesture.current.y + gestureState.dy;
        
        setPosition({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gestureState) => {
        const finalX = initialGesture.current.x + gestureState.dx;
        const finalY = initialGesture.current.y + gestureState.dy;
        if (onPositionChange) {
          onPositionChange(finalX, finalY);
        }
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.container,
        { left: position.x, top: position.y },
        Platform.OS === 'web' ? ({ touchAction: 'none' } as any) : {},
        style,
      ]}
    >
      <View 
        style={styles.header as any}
        {...panResponder.panHandlers}
      >
        {title ? <Text style={styles.title}>{title}</Text> : <View />}
        <GripHorizontal size={20} color="#9CA3AF" />
      </View>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 200,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    cursor: 'grab',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  content: {
    padding: 12,
  },
});
