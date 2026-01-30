import { LinearGradient } from 'expo-linear-gradient';
import { AlignCenter, AlignLeft, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, AlignVerticalJustifyStart, Bold, Check, Italic, Underline } from 'lucide-react-native';
import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';

const FONTS = [
  'Crimson Text',
  'Playfair Display',
  'Courier Prime',
  'PressStart2P',
  'VT323',
  'Caveat',
];

const COLORS = [
  '#000000', // Black
  '#4B5563', // Charcoal
  '#1D4ED8', // Royal Blue
  '#047857', // Emerald
  '#B91C1C', // Ruby
  '#7C3AED', // Violet
  '#FFFFFF', // White
  '#FEF3C7', // Cream
  '#33FF33', // Retro Green
];

export default function FontToolbar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { activeConfig, updateConfig } = usePoem();
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsScrolledToBottom(isCloseToBottom);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Text Style</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeButton}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={true} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 60 }]}
        indicatorStyle="black"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* Font Family */}
        <SectionLabel label="Font" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {FONTS.map((font) => (
            <TouchableOpacity
              key={font}
              onPress={() => updateConfig({ fontId: font })}
              style={[
                styles.fontOption,
                activeConfig.fontId === font && styles.activeOption
              ]}
            >
              <Text style={[styles.fontPreview, { fontFamily: font === 'PressStart2P' ? 'PressStart2P' : font }]}>Ag</Text>
              <Text style={styles.fontName}>{font === 'PressStart2P' ? 'Press Start 2P' : font}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Font Size & Line Spacing */}
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <SectionLabel label="Size" />
            <View style={styles.buttonGroup}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => updateConfig({ fontSize: size })}
                  style={[
                    styles.groupButton,
                    activeConfig.fontSize === size && styles.activeGroupButton
                  ]}
                >
                  <Text style={[
                    styles.groupButtonText, 
                    activeConfig.fontSize === size && styles.activeGroupButtonText,
                    { fontSize: size === 'small' ? 12 : size === 'medium' ? 16 : 20 }
                  ]}>A</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.halfCol}>
            <SectionLabel label="Spacing" />
            <View style={styles.buttonGroup}>
              {[1.0, 1.5, 1.8].map((spacing) => (
                <TouchableOpacity
                  key={spacing}
                  onPress={() => updateConfig({ lineSpacing: spacing })}
                  style={[
                    styles.groupButton,
                    activeConfig.lineSpacing === spacing && styles.activeGroupButton
                  ]}
                >
                  <Text style={[
                    styles.groupButtonText,
                    activeConfig.lineSpacing === spacing && styles.activeGroupButtonText
                  ]}>{spacing === 1.0 ? '1.0' : spacing === 1.5 ? '1.5' : '2.0'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Alignment Horizontal & Vertical */}
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <SectionLabel label="Horizontal Align" />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={() => updateConfig({ textAlign: 'left' })}
                style={[styles.groupButton, activeConfig.textAlign === 'left' && styles.activeGroupButton]}
              >
                <AlignLeft size={18} color={activeConfig.textAlign === 'left' ? '#FFF' : '#374151'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateConfig({ textAlign: 'center' })}
                style={[styles.groupButton, activeConfig.textAlign === 'center' && styles.activeGroupButton]}
              >
                <AlignCenter size={18} color={activeConfig.textAlign === 'center' ? '#FFF' : '#374151'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateConfig({ textAlign: 'right' })}
                style={[styles.groupButton, activeConfig.textAlign === 'right' && styles.activeGroupButton]}
              >
                <AlignRight size={18} color={activeConfig.textAlign === 'right' ? '#FFF' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.halfCol}>
            <SectionLabel label="Vertical Align" />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={() => updateConfig({ verticalAlign: 'top' })}
                style={[styles.groupButton, activeConfig.verticalAlign === 'top' && styles.activeGroupButton]}
              >
                <AlignVerticalJustifyStart size={18} color={activeConfig.verticalAlign === 'top' ? '#FFF' : '#374151'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateConfig({ verticalAlign: 'center' })}
                style={[styles.groupButton, activeConfig.verticalAlign === 'center' && styles.activeGroupButton]}
              >
                <AlignVerticalJustifyCenter size={18} color={activeConfig.verticalAlign === 'center' ? '#FFF' : '#374151'} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateConfig({ verticalAlign: 'bottom' })}
                style={[styles.groupButton, activeConfig.verticalAlign === 'bottom' && styles.activeGroupButton]}
              >
                <AlignVerticalJustifyEnd size={18} color={activeConfig.verticalAlign === 'bottom' ? '#FFF' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Style */}
        <SectionLabel label="Style" />
        <View style={[styles.buttonGroup, { marginBottom: 20 }]}>
          <TouchableOpacity
            onPress={() => updateConfig({ isBold: !activeConfig.isBold })}
            style={[styles.groupButton, activeConfig.isBold && styles.activeGroupButton]}
          >
            <Bold size={18} color={activeConfig.isBold ? '#FFF' : '#374151'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateConfig({ isItalic: !activeConfig.isItalic })}
            style={[styles.groupButton, activeConfig.isItalic && styles.activeGroupButton]}
          >
            <Italic size={18} color={activeConfig.isItalic ? '#FFF' : '#374151'} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => updateConfig({ isUnderline: !activeConfig.isUnderline })}
            style={[styles.groupButton, activeConfig.isUnderline && styles.activeGroupButton]}
          >
            <Underline size={18} color={activeConfig.isUnderline ? '#FFF' : '#374151'} />
          </TouchableOpacity>
        </View>

        {/* Colors */}
        <SectionLabel label="Color" />
        <View style={styles.colorRow}>
          {COLORS.map((color) => {
            const isLight = ['#FFFFFF', '#FEF3C7', '#33FF33'].includes(color);
            return (
              <TouchableOpacity
                key={color}
                onPress={() => updateConfig({ inkColor: color })}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color },
                  color === '#FFFFFF' && { borderWidth: 1, borderColor: '#E5E7EB' },
                  activeConfig.inkColor === color && styles.activeColorCircle
                ]}
              >
                {activeConfig.inkColor === color && (
                  <Check size={16} color={isLight ? '#000' : '#FFF'} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {!isScrolledToBottom && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={[
            styles.gradientOverlay, 
            { bottom: 0, height: Math.max(insets.bottom, 20) + 40 }
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.1)',
      },
    }),
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  horizontalScroll: {
    marginBottom: 20,
  },
  fontOption: {
    alignItems: 'center',
    marginRight: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  activeOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  fontPreview: {
    fontSize: 24,
    marginBottom: 4,
    color: '#1F2937',
  },
  fontName: {
    fontSize: 10,
    color: '#6B7280',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  halfCol: {
    flex: 1,
  },
  buttonGroup: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  groupButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activeGroupButton: {
    backgroundColor: '#3B82F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  groupButtonText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  activeGroupButtonText: {
    color: 'white',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeColorCircle: {
    borderColor: '#E5E7EB',
    transform: [{ scale: 1.1 }],
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
  },
});
