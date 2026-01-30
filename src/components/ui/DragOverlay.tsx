import React, { useEffect, useRef } from 'react';
import { Animated, DeviceEventEmitter, Image, StyleSheet } from 'react-native';
import { STAMPS } from '../../constants/ThemeRegistry';
import { usePoem } from '../../context/PoemContext';

export default function DragOverlay() {
  const { draggedStamp } = usePoem();
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  useEffect(() => {
    if (draggedStamp) {
      position.setValue({ x: draggedStamp.x, y: draggedStamp.y });
      
      const subscription = DeviceEventEmitter.addListener('DRAG_MOVE', ({ x, y }) => {
        position.setValue({ x, y });
      });

      return () => {
        subscription.remove();
      };
    }
  }, [draggedStamp]);

  if (!draggedStamp) return null;

  const source = STAMPS[draggedStamp.assetId as keyof typeof STAMPS];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: 0,
          top: 0,
          transform: position.getTranslateTransform(),
        },
      ]}
      pointerEvents="none"
    >
      <Image source={source} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 100,
    height: 100,
    zIndex: 9999,
    elevation: 9999,
    marginTop: -50, // Center on finger
    marginLeft: -50,
  },
  image: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
});
