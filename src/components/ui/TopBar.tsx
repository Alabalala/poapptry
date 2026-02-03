import { useRouter } from 'expo-router';
import { FolderOpen, MoreVertical, UserPlus } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';
import { useTheme } from '../../context/ThemeContext';
import PoemActionsMenu from './PoemActionsMenu';

export default function TopBar({ onBack, isLargeScreen, onShareImage }: { onBack?: () => void; isLargeScreen?: boolean; onShareImage?: () => void }) {
  const { title, setTitle, isEditing, isGuest } = usePoem();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const { t } = useTranslation();

  if (!isEditing) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.barContent}>
        {isLargeScreen && (
          <TouchableOpacity 
            onPress={onBack || (() => router.back())} 
            style={[styles.backButton, { backgroundColor: colors.surfaceHighlight }]}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <FolderOpen size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={[styles.titleInput, { color: colors.text }]}
          placeholder={t('editor.untitledPoem')}
          placeholderTextColor={colors.textMuted}
        />
        
        <View style={styles.rightActions}>
          {isGuest && (
            <TouchableOpacity 
              style={[styles.signupButton, { backgroundColor: colors.primaryLight }]}
              onPress={() => router.push('/auth')}
            >
              <UserPlus size={20} color={colors.primary} />
              <Text style={[styles.signupText, { color: colors.primary }]}>{t('common.save')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={[styles.menuButton, { backgroundColor: colors.surfaceHighlight }]}
            onPress={() => setMenuVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <PoemActionsMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)}
        onShareImage={onShareImage}
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
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  signupText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
  },
  menuButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});
