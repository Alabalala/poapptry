import PaperBackground from '@/components/desk/PaperBackground';
import DragOverlay from '@/components/ui/DragOverlay';
import React, { useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, TextStyle, View } from 'react-native';
import BottomToolbar from '../components/ui/BottomToolbar';
import TopBar from '../components/ui/TopBar';
import { PoemConfig, usePoem } from '../context/PoemContext';

const FONT_CAPABILITIES: Record<string, { supportsBold: boolean; supportsItalic: boolean }> = {
  'Crimson Text': { supportsBold: true, supportsItalic: true },
  'Playfair Display': { supportsBold: true, supportsItalic: false },
  'Courier Prime': { supportsBold: true, supportsItalic: true },
  'PressStart2P': { supportsBold: false, supportsItalic: false },
  'VT323': { supportsBold: false, supportsItalic: false },
  'Caveat': { supportsBold: true, supportsItalic: false },
};

export default function Desk() {
  const { isEditing, toggleEditMode, activeConfig, pages, updatePageContent, setSelectedStampId } = usePoem();

  const fontCaps = FONT_CAPABILITIES[activeConfig.fontId] || { supportsBold: false, supportsItalic: false };
  const shouldUseBold = activeConfig.isBold && fontCaps.supportsBold;
  const shouldUseItalic = activeConfig.isItalic && fontCaps.supportsItalic;

  const handleBackgroundPress = () => {
    Keyboard.dismiss();
    setSelectedStampId(null);
    // If we were just deselecting a stamp, maybe we shouldn't toggle edit mode? 
    // But for now, let's keep the existing behavior of toggling edit mode on background tap
    // as that seems to be the primary function of the desk background.
    toggleEditMode();
  };

  const activePage = pages[0];

  return (
    <View style={styles.container}>
      {/* Top Bar (Visible in Edit Mode) */}
      <TopBar />

      {/* Main Workspace */}
        <View style={styles.workspace}>
          {/* Background click handler - sits behind the paper */}
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackgroundPress} />
          
          {/* Paper Content - Single Page View */}
          <View style={styles.centerContent} pointerEvents="box-none">
            <View key={activePage.id} style={styles.paperContainer}>
              <PaperBackground>
                <PageInput 
                  content={activePage.content}
                  onUpdate={(text: string) => updatePageContent(activePage.id, text)}
                  activeConfig={activeConfig}
                  isEditing={isEditing}
                  shouldUseBold={shouldUseBold}
                  shouldUseItalic={shouldUseItalic}
                />
              </PaperBackground>
            </View>
          </View>
        </View>

      {/* Bottom Toolbar (Visible in Edit Mode) */}
      <BottomToolbar />
      
      {/* Global Drag Overlay */}
      <DragOverlay />
    </View>
  );
}

interface PageInputProps {
  content: string;
  onUpdate: (text: string) => void;
  activeConfig: PoemConfig;
  isEditing: boolean;
  shouldUseBold: boolean;
  shouldUseItalic: boolean;
}

function PageInput({ 
  content, 
  onUpdate, 
  activeConfig, 
  isEditing, 
  shouldUseBold, 
  shouldUseItalic,
}: PageInputProps) {
  const { setSelectedStampId } = usePoem();
  const inputRef = useRef<TextInput>(null);
  const [paperHeight, setPaperHeight] = useState(0);

  // Constants
  const VERTICAL_PADDING = 40;
  // If we haven't measured paper height yet, default to a reasonable height
  const MAX_TEXT_HEIGHT = paperHeight > 0 ? paperHeight : 600;

  // We need to estimate content height for vertical alignment since we removed ghost text measurement.
  // We can use onContentSizeChange from TextInput to get the height of the content.
  const [contentHeight, setContentHeight] = useState(0);

  const getJustifyContent = () => {
    // If content overflows the safe area, always align to top so we can see the start
    const safeHeight = Math.max(0, paperHeight - (VERTICAL_PADDING * 2));
    if (contentHeight > safeHeight) return 'flex-start';

    switch (activeConfig.verticalAlign) {
      case 'center': return 'center';
      case 'bottom': return 'flex-end';
      default: return 'flex-start';
    }
  };

  const textStyle: TextStyle = { 
    fontFamily: activeConfig.fontId,
    color: activeConfig.inkColor,
    fontSize: activeConfig.fontSize === 'small' ? 16 : activeConfig.fontSize === 'medium' ? 18 : 22,
    textAlign: activeConfig.textAlign,
    lineHeight: (activeConfig.fontSize === 'small' ? 16 : activeConfig.fontSize === 'medium' ? 18 : 22) * activeConfig.lineSpacing,
    fontWeight: shouldUseBold ? 'bold' : 'normal',
    fontStyle: shouldUseItalic ? 'italic' : 'normal',
    textDecorationLine: activeConfig.isUnderline ? 'underline' : 'none',
  };

  return (
    <Pressable 
      style={{ 
        flex: 1, 
        width: '100%', 
        overflow: 'hidden',
        paddingVertical: VERTICAL_PADDING,
        justifyContent: getJustifyContent() as any
      }} 
      onLayout={(e) => setPaperHeight(e.nativeEvent.layout.height)}
      onPress={() => {
        setSelectedStampId(null);
        inputRef.current?.focus();
      }}
    >
      {/* Actual Input */}
      <TextInput
        ref={inputRef}
        value={content}
        onChangeText={onUpdate}
        onFocus={() => setSelectedStampId(null)}
        onContentSizeChange={(e) => setContentHeight(e.nativeEvent.contentSize.height)}
        style={[
          styles.input, 
          textStyle,
          {
            height: undefined, // Let it grow to fit content
            paddingTop: 0,
            paddingBottom: 0,
            textAlignVertical: 'top', 
          }
        ]}
        multiline
        scrollEnabled={false}
        placeholder={isEditing ? "Write your poem..." : ""}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="sentences"
        autoCorrect={false}
        editable={isEditing}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        overflowX: 'hidden',
        maxWidth: '100vw',
      } as any,
    }),
  },
  workspace: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  navContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
    width: 60,
    alignItems: 'center',
  },
  navButton: {
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pageIndicator: {
    marginTop: 16,
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paperContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  input: {
    width: '100%',
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
