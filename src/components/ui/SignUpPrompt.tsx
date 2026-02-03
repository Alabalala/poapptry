import { router } from 'expo-router';
import { Save, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';
import { useTheme } from '../../context/ThemeContext';

export default function SignUpPrompt() {
  const { isGuest } = usePoem();
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  useEffect(() => {
    if (!isGuest) return;

    // Timer to show prompt after 45 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 6,
        tension: 40,
      }).start(() => {
        // Start shaking loop after entrance
        startShaking();
      });
    }, 45000); 

    return () => clearTimeout(timer);
  }, [isGuest]);

  const startShaking = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.delay(3000) // Wait 3 seconds before next shake
      ])
    ).start();
  };

  const handleClose = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setIsVisible(false));
  };

  const shakeRotate = shakeAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-15deg', '15deg']
  });

  if (!isVisible || !isGuest) return null;

  return (
    <Animated.View style={[
      styles.container, 
      { 
        transform: [{ scale: scaleAnim }],
        bottom: insets.bottom + 90,
        right: 16,
      }
    ]}>
      <TouchableOpacity 
        style={[styles.content, { backgroundColor: colors.surface, borderColor: colors.border }]} 
        onPress={() => {
          handleClose();
          router.push('/auth');
        }}
        activeOpacity={0.9}
      >
        <Animated.View style={[styles.iconContainer, { backgroundColor: colors.primary, transform: [{ rotate: shakeRotate }] }]}>
          <Save size={20} color="#FFF" />
        </Animated.View>
        <View style={styles.textContainer}>
          <Text style={[styles.text, { color: colors.text }]}>
            {t('auth.saveProgressPrompt')}
          </Text>
        </View>
        <TouchableOpacity 
          style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]} 
          onPress={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    maxWidth: 300,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Light theme
    borderRadius: 16,
    padding: 10,
    paddingRight: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6', // Brand blue
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingVertical: 2,
    marginRight: 8,
  },
  text: {
    color: '#1F2937', // Dark gray text
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  }
});
