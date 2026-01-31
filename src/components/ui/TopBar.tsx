import { useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';
import PoemActionsMenu from './PoemActionsMenu';

export default function TopBar({ onBack }: { onBack?: () => void }) {
  const { title, setTitle, isEditing, isGuest } = usePoem();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  if (!isEditing) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.barContent}>
        <TouchableOpacity 
          onPress={onBack || (() => router.back())} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.titleInput }
          placeholder="Untitled Poem"
          placeholderTextColor="#9CA3AF"
        />
        
        <View style={styles.rightActions}>
          {isGuest && (
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => router.push('/auth')}
            >
              <UserPlus size={20} color="#3B82F6" />
              <Text style={styles.signupText}>Save</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.menuButton}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <PoemActionsMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB', // Matches modern app background
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    zIndex: 10,
  },
  barContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
    flexShrink: 0, // Prevent shrinking
  },
  titleInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 8, // Reduced margin to give more space to button
    minWidth: 0, // Allow shrinking below content size
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 40, // Ensure space is reserved
    justifyContent: 'flex-end',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF', // Light blue bg
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    flexShrink: 0, // Ensure button doesn't shrink or get pushed out
  },
  signupText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  menuButton: {
    width: 32,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
