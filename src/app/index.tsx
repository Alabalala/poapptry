import PaperBackground from '@/components/desk/PaperBackground';
import React from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import BottomToolbar from '../components/ui/BottomToolbar';
import TopBar from '../components/ui/TopBar';
import { usePoem } from '../context/PoemContext';

const FONT_CAPABILITIES: Record<string, { supportsBold: boolean; supportsItalic: boolean }> = {
  'Crimson Text': { supportsBold: true, supportsItalic: true },
  'Playfair Display': { supportsBold: true, supportsItalic: false },
  'Courier Prime': { supportsBold: true, supportsItalic: true },
  'PressStart2P': { supportsBold: false, supportsItalic: false },
  'VT323': { supportsBold: false, supportsItalic: false },
  'Caveat': { supportsBold: true, supportsItalic: false },
};

export default function Desk() {
  const { isEditing, toggleEditMode, activeConfig } = usePoem();

  const fontCaps = FONT_CAPABILITIES[activeConfig.fontId] || { supportsBold: false, supportsItalic: false };
  const shouldUseBold = activeConfig.isBold && fontCaps.supportsBold;
  const shouldUseItalic = activeConfig.isItalic && fontCaps.supportsItalic;

  const handleBackgroundPress = () => {
    Keyboard.dismiss();
    toggleEditMode();
  };

  return (
    <View style={styles.container}>
      {/* Top Bar (Visible in Edit Mode) */}
      <TopBar />

      {/* Main Workspace */}
      <View style={styles.workspace}>
        {/* Background click handler - sits behind the paper */}
        <Pressable style={StyleSheet.absoluteFill} onPress={handleBackgroundPress} />
        
        {/* Paper Content - sits on top, clicks here won't trigger background press */}
        <View style={styles.paperContainer} pointerEvents="box-none">
          <PaperBackground>
            <View style={{ flex: 1, justifyContent: activeConfig.verticalAlign === 'top' ? 'flex-start' : activeConfig.verticalAlign === 'center' ? 'center' : 'flex-end' }}>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    fontFamily: activeConfig.fontId,
                    color: activeConfig.inkColor,
                    fontSize: activeConfig.fontSize === 'small' ? 16 : activeConfig.fontSize === 'medium' ? 18 : 22,
                    textAlign: activeConfig.textAlign,
                    lineHeight: (activeConfig.fontSize === 'small' ? 16 : activeConfig.fontSize === 'medium' ? 18 : 22) * activeConfig.lineSpacing,
                    fontWeight: shouldUseBold ? 'bold' : 'normal',
                    fontStyle: shouldUseItalic ? 'italic' : 'normal',
                    textDecorationLine: activeConfig.isUnderline ? 'underline' : 'none',
                  }
                ]}
                multiline
                placeholder={isEditing ? "Write your poem..." : ""}
                placeholderTextColor="#9CA3AF"
                autoCapitalize="sentences"
                autoCorrect={false}
                editable={isEditing}
              />
            </View>
          </PaperBackground>
        </View>
      </View>

      {/* Bottom Toolbar (Visible in Edit Mode) */}
      <BottomToolbar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB', // Slightly darker gray (Gray-200) for contrast
  },
  workspace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paperContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80, // Space for bottom toolbar
  },
  input: {
    flex: 1,
    fontSize: 18,
    lineHeight: 28,
    padding: 40,
    textAlignVertical: 'top',
    backgroundColor: 'transparent',
    borderWidth: 0,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
});
