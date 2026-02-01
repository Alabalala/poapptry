import React, { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onHide: () => void;
  duration?: number;
}

export default function Toast({ message, type = 'info', onHide, duration = 3000 }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(duration),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -20,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onHide());
  }, [duration, onHide, opacity, translateY]);

  const backgroundColor = 
    type === 'error' ? '#EF4444' : 
    type === 'success' ? '#10B981' : 
    type === 'warning' ? '#F59E0B' :
    '#3B82F6';

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          opacity, 
          transform: [{ translateY }],
          backgroundColor
        }
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    zIndex: 9999,
    maxWidth: 400,
    alignSelf: 'center',
  },
  text: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
});
