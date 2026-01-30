import PaperBackground from '@/components/desk/PaperBackground';
import React from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DeskButton from '../components/ui/DeskButton';
import { usePoem } from '../context/PoemContext';

export default function Desk() {
  const { isEditing, toggleEditMode, activeConfig } = usePoem();

  const handleBackgroundPress = () => {
    // Dismiss keyboard if visible, otherwise toggle edit mode
    // Or just toggle edit mode?
    // "Edit Mode: Full UI visible. User can type... View Mode: UI is hidden."
    // "Toggle: Tapping the paper background toggles between modes."
    // The user said "Wrap the Root View in <TouchableWithoutFeedback> to handle the 'Tap Background to Toggle UI' logic."
    
    // If keyboard is up, tapping background usually dismisses it.
    // I'll check keyboard state or just dismiss it and toggle.
    // If I'm typing, I might want to just dismiss keyboard first?
    // Let's simple toggle for now, but usually you want to dismiss keyboard.
    Keyboard.dismiss();
    toggleEditMode();
  };

  return (
    <Pressable style={styles.deskContainer} onPress={handleBackgroundPress}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.contentContainer}>
          {/* The Paper */}
          <PaperBackground>
            <TextInput
              style={[
                styles.input, 
                { 
                  fontFamily: activeConfig.fontId,
                  color: activeConfig.inkColor 
                }
              ]}
              multiline
              placeholder={isEditing ? "Write your poem..." : ""}
              placeholderTextColor="#555"
              autoCapitalize="sentences"
              autoCorrect={false}
              editable={isEditing}
              // Stop propagation if tapping input? 
              // In RN, TextInput handles touch, so it shouldn't trigger parent onPress if handled?
              // Actually, if editable=false (View mode), tapping it might trigger parent (good).
              // If editable=true, tapping it focuses input (good).
            />
          </PaperBackground>

          {/* The UI (Buttons) */}
          {isEditing && (
            <View style={styles.uiContainer}>
              <DeskButton 
                iconName="drawer" 
                label="Drawer" 
                onPress={() => console.log('Open Drawer')} 
              />
              <View style={{ width: 40 }} />
              <DeskButton 
                iconName="stationery" 
                label="Stationery" 
                onPress={() => console.log('Open Stationery')} 
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  deskContainer: {
    flex: 1,
    backgroundColor: '#F5F5DC', // Beige/Cream desk color
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  uiContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
