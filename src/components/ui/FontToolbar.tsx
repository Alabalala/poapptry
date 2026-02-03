import { FONT_CAPABILITIES } from '@/constants/ThemeRegistry';
import { LinearGradient } from 'expo-linear-gradient';
import { AlignCenter, AlignLeft, AlignRight, Bold, Check, ChevronLeft, ChevronRight, Italic, Plus, Underline } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';
import { useTheme } from '../../context/ThemeContext';

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
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { colors } = useTheme();
  
  if (!visible) return null;

  const isWideScreen = width > 768;
  const containerStyle: ViewStyle = isWideScreen 
    ? { 
        width: '50%', 
        left: '25%', 
        right: 'auto',
        borderTopLeftRadius: 24, 
        borderTopRightRadius: 24,
      } 
    : { left: 0, right: 0 };

  return (
    <View style={[styles.container, containerStyle, { backgroundColor: colors.surface }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('editor.textStyle')}</Text>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.closeButton, { color: colors.primary }]}>{t('common.done')}</Text>
        </TouchableOpacity>
      </View>
      <FontPanelContent onClose={onClose} />
    </View>
  );
}

export function FontPanelContent({ scrollContentStyle, onClose }: { scrollContentStyle?: any, onClose?: () => void }) {
  const { width } = useWindowDimensions();
  const { activeConfig, updateConfig, addTextBox, pages, selectedTextBoxId, updateTextBox } = usePoem();
  const { colors, theme } = useTheme();
  
  // Determine if arrows are needed
  // On wide screens > 768, panel is 50% width. Otherwise full width.
  const panelWidth = width > 768 ? width * 0.5 : width;
  // Font list is approx 600px. If panel is narrower, show arrows.
  const showArrows = panelWidth < 650;

  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const fontScrollViewRef = useRef<ScrollView>(null);
  const [fontScrollX, setFontScrollX] = useState(0);
  const insets = useSafeAreaInsets(); // Only needed for gradient overlay
  const fontCaps = FONT_CAPABILITIES[activeConfig.fontId] || { supportsBold: false, supportsItalic: false };
  const activePageId = pages[0]?.id || '1'; // Assuming single page or active page logic

  const handleFontScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    setFontScrollX(event.nativeEvent.contentOffset.x);
  };

  const scrollFonts = (direction: 'left' | 'right') => {
    const scrollAmount = 150;
    if (direction === 'left') {
      fontScrollViewRef.current?.scrollTo({ x: Math.max(0, fontScrollX - scrollAmount), animated: true });
    } else {
      fontScrollViewRef.current?.scrollTo({ x: fontScrollX + scrollAmount, animated: true });
    }
  };

  // Helper to safely execute commands despite deprecation
  const safeExecCommand = (command: string, value?: string) => {
    if (typeof document !== 'undefined') {
      (document as any).execCommand(command, false, value);
    }
  };

  // Helper to update either selected text box or global config
  const handleUpdate = (updates: any) => {
    Keyboard.dismiss();
    
    if (selectedTextBoxId) {
      // Special handling for Web rich text commands
      if (Platform.OS === 'web') {
        const selection = window.getSelection();
        const shouldSelectAll = selection && selection.isCollapsed;

        if (shouldSelectAll) {
          safeExecCommand('selectAll');
        }

        if (updates.isBold !== undefined) safeExecCommand('bold');
        if (updates.isItalic !== undefined) safeExecCommand('italic');
        if (updates.isUnderline !== undefined) safeExecCommand('underline');
        
        if (updates.fontId) safeExecCommand('fontName', updates.fontId);
        if (updates.inkColor) safeExecCommand('foreColor', updates.inkColor);
        if (updates.textAlign) {
            const align = updates.textAlign === 'left' ? 'justifyLeft' : updates.textAlign === 'center' ? 'justifyCenter' : 'justifyRight';
            safeExecCommand(align);
        }
        if (updates.fontSize) {
            const size = updates.fontSize === 'small' ? '3' : updates.fontSize === 'medium' ? '4' : '5';
            safeExecCommand('fontSize', size);
            
            const currentFont = updates.fontId || activeConfig.fontId;
            if (currentFont) {
              safeExecCommand('fontName', currentFont);
            }
        }

        if (shouldSelectAll) {
          selection?.collapseToEnd();
        }
      }

      // Map config updates to text box style updates
      const styleUpdates: any = {};
      if (updates.fontId) styleUpdates.fontFamily = updates.fontId;
      if (updates.fontSize) {
        styleUpdates.fontSize = updates.fontSize === 'small' ? 16 : updates.fontSize === 'medium' ? 18 : 22;
      }
      if (updates.textAlign) styleUpdates.textAlign = updates.textAlign;
      if (updates.inkColor) styleUpdates.color = updates.inkColor;
      
      if (updates.isBold !== undefined) styleUpdates.fontWeight = updates.isBold ? 'bold' : 'normal';
      if (updates.isItalic !== undefined) styleUpdates.fontStyle = updates.isItalic ? 'italic' : 'normal';
      if (updates.isUnderline !== undefined) styleUpdates.textDecorationLine = updates.isUnderline ? 'underline' : 'none';
      
      if (Object.keys(styleUpdates).length > 0) {
        updateTextBox(activePageId, selectedTextBoxId, { style: styleUpdates });
      }
      updateConfig(updates);
    } else {
      updateConfig(updates);
    }
  };

  const paddingBottom = scrollContentStyle?.paddingBottom ?? 0;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsScrolledToBottom(isCloseToBottom);
  };

  const handleAddTextBox = () => {
    addTextBox(activePageId);
    if (onClose) onClose();
  };

  if (!selectedTextBoxId) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <Text style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 20 }}>Select a text box to edit style</Text>
        <TouchableOpacity
            style={[styles.actionButton, { width: 'auto', paddingHorizontal: 24, backgroundColor: colors.primary }]}
            onPress={handleAddTextBox}
          >
            <Plus size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Add New Text Box</Text>
          </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={true} 
        contentContainerStyle={[styles.scrollContent, scrollContentStyle || { paddingBottom }, { flexGrow: 1 }]}
        indicatorStyle={theme === 'dark' ? 'white' : 'black'}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* Actions */}
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTextBox}
          >
            <Plus size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Add Text Box</Text>
          </TouchableOpacity>
        </View>

        {/* Font Family */}
        <SectionLabel label="Font" color={colors.textSecondary} />
        <View style={styles.fontScrollContainer}>
          {showArrows && (
            <TouchableOpacity onPress={() => scrollFonts('left')} style={[styles.scrollArrow, { backgroundColor: colors.surfaceHighlight }]}>
              <ChevronLeft size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <ScrollView 
            ref={fontScrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.horizontalScroll}
            onScroll={handleFontScroll}
            scrollEventThrottle={16}
          >
            {FONTS.map((font) => (
              <TouchableOpacity
                key={font}
                onPress={() => handleUpdate({ fontId: font })}
                // @ts-ignore - Web specific prop
                onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
                style={[
                  styles.fontOption,
                  { borderColor: colors.border, backgroundColor: colors.surface },
                  activeConfig.fontId === font && { borderColor: colors.primary, backgroundColor: colors.surfaceHighlight }
                ]}
              >
                <Text style={[styles.fontPreview, { fontFamily: font === 'PressStart2P' ? 'PressStart2P' : font, color: colors.text }]}>Ag</Text>
                <Text style={[styles.fontName, { color: colors.textSecondary }]}>{font === 'PressStart2P' ? 'Press Start 2P' : font}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {showArrows && (
            <TouchableOpacity onPress={() => scrollFonts('right')} style={[styles.scrollArrow, { backgroundColor: colors.surfaceHighlight }]}>
              <ChevronRight size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Font Size & Line Spacing */}
        <View style={styles.row}>
          <View style={styles.halfCol}>
            <SectionLabel label="Size" color={colors.textSecondary} />
            <View style={styles.buttonGroup}>
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => handleUpdate({ fontSize: size })}
                  // @ts-ignore - Web specific prop
                  onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
                  style={[
                    styles.groupButton,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    activeConfig.fontSize === size && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text style={[
                    styles.groupButtonText, 
                    { color: colors.text },
                    activeConfig.fontSize === size && { color: '#FFF' },
                    { fontSize: size === 'small' ? 12 : size === 'medium' ? 16 : 20 }
                  ]}>A</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.halfCol}>
            <SectionLabel label="Spacing" color={colors.textSecondary} />
            <View style={styles.buttonGroup}>
              {[1.0, 1.5, 1.8].map((spacing) => (
                <TouchableOpacity
                  key={spacing}
                  onPress={() => handleUpdate({ lineSpacing: spacing })}
                  // @ts-ignore - Web specific prop
                  onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
                  style={[
                    styles.groupButton,
                    { borderColor: colors.border, backgroundColor: colors.surface },
                    activeConfig.lineSpacing === spacing && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                >
                  <Text style={[
                    styles.groupButtonText,
                    { color: colors.text },
                    activeConfig.lineSpacing === spacing && { color: '#FFF' }
                  ]}>{spacing === 1.0 ? '1.0' : spacing === 1.5 ? '1.5' : '2.0'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Alignment Horizontal */}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <SectionLabel label="Horizontal Align" color={colors.textSecondary} />
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                onPress={() => handleUpdate({ textAlign: 'left' })}
                // @ts-ignore - Web specific prop
                onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
                style={[styles.groupButton, { borderColor: colors.border, backgroundColor: colors.surface }, activeConfig.textAlign === 'left' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <AlignLeft size={18} color={activeConfig.textAlign === 'left' ? '#FFF' : colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUpdate({ textAlign: 'center' })}
                // @ts-ignore - Web specific prop
                onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
                style={[styles.groupButton, { borderColor: colors.border, backgroundColor: colors.surface }, activeConfig.textAlign === 'center' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <AlignCenter size={18} color={activeConfig.textAlign === 'center' ? '#FFF' : colors.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUpdate({ textAlign: 'right' })}
                // @ts-ignore - Web specific prop
                onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
                style={[styles.groupButton, { borderColor: colors.border, backgroundColor: colors.surface }, activeConfig.textAlign === 'right' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              >
                <AlignRight size={18} color={activeConfig.textAlign === 'right' ? '#FFF' : colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Style */}
        <SectionLabel label="Style" color={colors.textSecondary} />
        <View style={[styles.buttonGroup, { marginBottom: 20 }]}>
          {fontCaps.supportsBold && (
            <TouchableOpacity
              onPress={() => handleUpdate({ isBold: !activeConfig.isBold })}
              // @ts-ignore - Web specific prop
              onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
              style={[styles.groupButton, { borderColor: colors.border, backgroundColor: colors.surface }, activeConfig.isBold && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Bold size={18} color={activeConfig.isBold ? '#FFF' : colors.text} />
            </TouchableOpacity>
          )}
          {fontCaps.supportsItalic && (
            <TouchableOpacity
              onPress={() => handleUpdate({ isItalic: !activeConfig.isItalic })}
              // @ts-ignore - Web specific prop
              onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
              style={[styles.groupButton, { borderColor: colors.border, backgroundColor: colors.surface }, activeConfig.isItalic && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            >
              <Italic size={18} color={activeConfig.isItalic ? '#FFF' : colors.text} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleUpdate({ isUnderline: !activeConfig.isUnderline })}
            // @ts-ignore - Web specific prop
            onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
            style={[styles.groupButton, { borderColor: colors.border, backgroundColor: colors.surface }, activeConfig.isUnderline && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          >
            <Underline size={18} color={activeConfig.isUnderline ? '#FFF' : colors.text} />
          </TouchableOpacity>
        </View>

        {/* Colors */}
        <SectionLabel label="Color" color={colors.textSecondary} />
        <View style={styles.colorRow}>
          {COLORS.map((color) => {
            const isLight = ['#FFFFFF', '#FEF3C7', '#33FF33'].includes(color);
            return (
              <TouchableOpacity
                key={color}
                onPress={() => handleUpdate({ inkColor: color })}
                // @ts-ignore - Web specific prop
                onMouseDown={Platform.OS === 'web' ? (e) => e.preventDefault() : undefined}
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
          colors={theme === 'dark' ? ['rgba(31,41,55,0)', 'rgba(31,41,55,1)'] : ['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
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

function SectionLabel({ label, color }: { label: string, color?: string }) {
  return <Text style={[styles.sectionLabel, color && { color }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    // left/right handled dynamically
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        height: '55%', // Fixed height for iOS scrolling stability
      },
      android: {
        elevation: 20,
        height: '55%', // Fixed height for Android scrolling stability
      },
      web: {
        boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.1)',
        maxHeight: '60%',
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
  fontScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  scrollArrow: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalScroll: {
    flex: 1,
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
    height: 44,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
