import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';

export default function TopBar() {
  const { title, setTitle, isEditing } = usePoem();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  if (!isEditing) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.barContent}>
        <TouchableOpacity 
          onPress={() => router.back()} 
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
        
        <View style={styles.placeholder} />
      </View>
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
  },
  titleInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginHorizontal: 16,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  placeholder: {
    width: 40,
  },
});
