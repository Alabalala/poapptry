import PaperBackground from '@/components/desk/PaperBackground';
import DragOverlay from '@/components/ui/DragOverlay';
import React, { useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
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
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
          >
            {/* Background click handler - wraps content to detect taps outside paper */}
            <Pressable 
              style={styles.scrollContentPressable} 
              onPress={handleBackgroundPress}
            >
              {/* Paper Content - Single Page View */}
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
            </Pressable>
          </ScrollView>
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
  const [contentHeight, setContentHeight] = useState(0);

  // Constants
  const VERTICAL_PADDING = 40;
  
  // Padding state for Web vertical alignment simulation
  const [paddingTop, setPaddingTop] = useState(0);
  const isWeb = Platform.OS === 'web';

  const calculateWebPadding = (contentH: number, paperH: number) => {
    if (!isWeb) return 0;
    if (paperH <= 0) return 0;

    const availableHeight = Math.max(0, paperH - (VERTICAL_PADDING * 2));
    
    if (contentH >= availableHeight) return 0;

    switch (activeConfig.verticalAlign) {
      case 'center': 
        return Math.max(0, (availableHeight - contentH) / 2);
      case 'bottom': 
        return Math.max(0, availableHeight - contentH);
      default: 
        return 0;
    }
  };

  const handleGhostLayout = (e: any) => {
    const h = e.nativeEvent.layout.height;
    setContentHeight(h);
    
    if (isWeb) {
      const newPadding = calculateWebPadding(h, paperHeight);
      if (Math.abs(newPadding - paddingTop) > 1) {
        setPaddingTop(newPadding);
      }
    }
  };

  // Recalculate padding when config or paper height changes
  React.useEffect(() => {
    if (isWeb && paperHeight > 0) {
      const newPadding = calculateWebPadding(contentHeight, paperHeight);
      if (Math.abs(newPadding - paddingTop) > 1) {
        setPaddingTop(newPadding);
      }
    }
  }, [activeConfig.verticalAlign, paperHeight]);

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
        ...Platform.select({
          web: { cursor: 'text' } as any
        })
      }} 
      onLayout={(e) => setPaperHeight(e.nativeEvent.layout.height)}
      onPress={(e) => {
        e.stopPropagation();
        setSelectedStampId(null);
        inputRef.current?.focus();
      }}
    >
      {/* Ghost Text for Web Measurement */}
      {isWeb && (
        <Text
          style={[
            styles.input,
            textStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: 'none',
              paddingTop: 0,
              paddingBottom: 0,
              height: undefined, // Allow it to grow naturally
            }
          ]}
          onLayout={handleGhostLayout}
        >
          {content || ' '} 
          {/* Add space to measure empty line height if needed, though mostly we care about existing text */}
        </Text>
      )}

      {/* Actual Input */}
      <TextInput
        ref={inputRef}
        value={content}
        onChangeText={onUpdate}
        onFocus={() => setSelectedStampId(null)}
        onContentSizeChange={!isWeb ? (e) => setContentHeight(e.nativeEvent.contentSize.height) : undefined}
        style={[
          styles.input, 
          textStyle,
          {
            flex: 1,
            minHeight: '100%',
            paddingTop: isWeb ? paddingTop : 0,
            paddingBottom: 0,
            textAlignVertical: isWeb ? 'top' : (activeConfig.verticalAlign || 'top') as any, 
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
    overflow: 'hidden', // Ensure workspace also clips content
  },
  scrollContentPressable: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40, // Add some breathing room
    minHeight: '100%',
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
