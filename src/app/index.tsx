import DraggableTextBox from '@/components/desk/DraggableTextBox';
import PaperBackground from '@/components/desk/PaperBackground';
import DragOverlay from '@/components/ui/DragOverlay';
import DrawerScreen from '@/components/ui/DrawerScreen';
import SidePanel from '@/components/ui/SidePanel';
import SignUpPrompt from '@/components/ui/SignUpPrompt';
import { FONT_CAPABILITIES } from '@/constants/ThemeRegistry';
import { useTheme } from '@/context/ThemeContext';
import * as Sharing from 'expo-sharing';
import html2canvas from 'html2canvas';
import { Edit2, Menu } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import BottomToolbar from '../components/ui/BottomToolbar';
import TopBar from '../components/ui/TopBar';
import { usePoem } from '../context/PoemContext';

export default function Desk() {
  const { colors } = useTheme();
  const { 
    isEditing, 
    toggleEditMode, 
    activeConfig, 
    pages, 
    updateTextBox, 
    removeTextBox,
    duplicateTextBox,
    addTextBox,
    selectedTextBoxId,
    setSelectedTextBoxId,
    setSelectedStampId 
  } = usePoem();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeToolbar, setActiveToolbar] = useState<'none' | 'font' | 'stationery'>('none');
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const isLargeScreen = windowWidth >= 1024;
  const availableWidth = isLargeScreen && isEditing ? windowWidth * 0.5 : windowWidth;
  
  // Ref for PaperBackground to get its dimensions for boundary checking
  const [paperLayout, setPaperLayout] = useState({ width: 0, height: 0 });
  const [actualPaperSize, setActualPaperSize] = useState({ width: 0, height: 0 });
  const viewShotRef = useRef<View>(null);
  const { t } = useTranslation();

  const fontCaps = FONT_CAPABILITIES[activeConfig.fontId] || { supportsBold: false, supportsItalic: false };
  const shouldUseBold = activeConfig.isBold && fontCaps.supportsBold;
  const shouldUseItalic = activeConfig.isItalic && fontCaps.supportsItalic;

  const handleBackgroundPress = () => {
    Keyboard.dismiss();
    setSelectedStampId(null);
    setSelectedTextBoxId(null);
    setActiveToolbar('none');
    // Only edit when clicking button as per request
    // toggleEditMode();
  };

  const activePage = pages[0];

  if (!activePage) return null;

  const handleShareImage = async () => {
    console.log('handleShareImage initiated');
    try {
      if (Platform.OS === 'web') {
        // Add a small delay to ensure content is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const poemElement = document.getElementById('poem-view');
        if (!poemElement) {
          throw new Error('Poem view not found (nativeID mismatch)');
        }
        
        const canvas = await html2canvas(poemElement, {
          backgroundColor: null,
          scale: 2, // Higher quality
        });
        
        const uri = canvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = uri;
        link.download = 'poem.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (viewShotRef.current) {
        console.log('viewShotRef found, preparing capture...');
        console.log('Capturing view...');
        const uri = await captureRef(viewShotRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile'
        });
        console.log('Capture successful, URI generated');

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: t('editor.sharePoem'),
          UTI: 'public.png'
        });
      } else {
        console.error('viewShotRef is null');
        alert(t('editor.shareError'));
      }
    } catch (error) {
      console.error('Failed to capture or share image:', error);
      alert(t('editor.shareError') + ': ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const handlePaste = async () => {
    if (Platform.OS === 'web') {
      try {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (selectedTextBoxId) {
            const currentBox = activePage.textBoxes.find(b => b.id === selectedTextBoxId);
            if (currentBox) {
              // Append text to existing content
              const newContent = currentBox.content 
                ? `${currentBox.content} ${text}`
                : text;
              updateTextBox(activePage.id, selectedTextBoxId, { content: newContent });
            }
          } else {
            addTextBox(activePage.id, text);
          }
        } else {
          // Clipboard is empty
          // We could show a toast here if we had access to showToast directly, 
          // but we are inside Desk component which uses usePoem.
          // PoemContext handles toasts for limits, but here we might want one.
          // Since we don't have showToast here, we can ignore or console.warn.
          console.warn(t('editor.clipboardEmpty'));
        }
      } catch (e) {
        console.warn('Paste failed', e);
        // This usually happens if permission is denied or context is insecure
        alert(t('editor.pasteError'));
      }
    } else {
      // Native fallback
      // Since we couldn't install expo-clipboard, we show a message
      alert(t('editor.pasteWebOnly'));
    }
  };

  // Calculate dynamic padding for Edit Mode centering
  // We want Visual Top Space = Visual Bottom Space
  // Top Space = TopBarHeight + PaddingTop(40)
  // Bottom Space = PaddingBottom - BottomToolbarHeight
  // PaddingBottom = TopBarHeight + BottomToolbarHeight + PaddingTop(40)
  const topBarHeight = insets.top + 56;
  const bottomBarHeight = Math.max(insets.bottom, 20) + 50; // Approx pill height + padding
  const editModePaddingBottom = topBarHeight + bottomBarHeight + 40;

  return (
    <View style={[styles.container, { backgroundColor: colors.backdrop }]}>
      <DrawerScreen isVisible={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Top Bar (Visible in Edit Mode) */}
      <TopBar 
        onBack={() => setIsDrawerOpen(true)} 
        isLargeScreen={isLargeScreen}
        onShareImage={handleShareImage}
      />

      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          {/* Main Workspace */}
          <View style={styles.workspace}>
            <View
              style={{ flex: 1, overflow: 'hidden' }}
            >
              {/* Background click handler - wraps content to detect taps outside paper */}
              <Pressable 
                style={[
                  styles.scrollContentPressable,
                  isEditing && { paddingBottom: editModePaddingBottom },
                  Platform.OS === 'web' && { cursor: 'default' } as any
                ]} 
                onPress={handleBackgroundPress}
              >
                {/* Paper Content - Single Page View */}
                <View 
                  ref={viewShotRef}
                  nativeID="poem-view"
                  collapsable={false}
                  key={activePage.id} 
                  style={styles.paperContainer}
                  onLayout={(e) => setPaperLayout(e.nativeEvent.layout)}
                >
                  <PaperBackground 
                    availableWidth={availableWidth}
                    onSizeChange={(w, h) => setActualPaperSize({ width: w, height: h })}
                  >
                    <View style={{ flex: 1, width: '100%', height: '100%' }} pointerEvents="box-none">
                      {activePage?.textBoxes?.map((textBox) => (
                        <DraggableTextBox
                          key={textBox.id}
                          textBox={textBox}
                          isSelected={selectedTextBoxId === textBox.id}
                          onSelect={() => {
                            setSelectedTextBoxId(textBox.id);
                            setSelectedStampId(null);
                          }}
                          onUpdate={(updates) => updateTextBox(activePage.id, textBox.id, updates)}
                          onRemove={() => removeTextBox(activePage.id, textBox.id)}
                          onDuplicate={() => duplicateTextBox(activePage.id, textBox.id)}
                          onStyle={() => setActiveToolbar('font')}
                          onPaste={handlePaste}
                          isEditing={isEditing}
                          paperSize={actualPaperSize.width > 0 ? actualPaperSize : paperLayout}
                        />
                      ))}
                    </View>
                  </PaperBackground>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Bottom Toolbar (Visible in Edit Mode) */}
          <BottomToolbar 
            onOpenDrawer={() => setIsDrawerOpen(true)} 
            isLargeScreen={isLargeScreen} 
            activeToolbar={activeToolbar}
            setActiveToolbar={setActiveToolbar}
          />

          {/* View Mode Controls */}
          {!isEditing && (
            <View style={[styles.viewModeControls, { bottom: Math.max(insets.bottom, 20) }]}>
               <TouchableOpacity 
                 style={[styles.viewModeButton, { backgroundColor: colors.surface }]} 
                 onPress={() => setIsDrawerOpen(true)}
               >
                 <Menu size={24} color={colors.textSecondary} />
               </TouchableOpacity>
               
               <TouchableOpacity 
                 style={[styles.viewModeButton, styles.editButton, { backgroundColor: colors.primary }]} 
                 onPress={() => toggleEditMode()}
               >
                 <Edit2 size={24} color="#FFF" />
                 <Text style={styles.editButtonText}>{t('common.edit')}</Text>
               </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Side Panel for Large Screens */}
        {isLargeScreen && isEditing && <SidePanel />}
      </View>
      
      {/* Sign Up Prompt */}
      <SignUpPrompt />

      {/* Global Drag Overlay */}
      <DragOverlay />
    </View>
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
  viewModeControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 16,
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  viewModeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButton: {
    width: 'auto',
    paddingHorizontal: 20,
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    gap: 8,
  },
  editButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
