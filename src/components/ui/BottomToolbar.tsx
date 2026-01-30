import { FolderOpen, Palette, Type } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';
import FontToolbar from './FontToolbar';
import StationeryToolbar from './StationeryToolbar';

export default function BottomToolbar() {
  const { isEditing } = usePoem();
  const insets = useSafeAreaInsets();
  const [activeToolbar, setActiveToolbar] = useState<'none' | 'font' | 'stationery'>('none');

  if (!isEditing) return null;

  const toggleToolbar = (toolbar: 'font' | 'stationery') => {
    setActiveToolbar(current => current === toolbar ? 'none' : toolbar);
  };

  return (
    <>
      <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <View style={styles.pill}>
          <ToolbarButton 
            icon={<FolderOpen size={18} color="#4B5563" />} 
            label="Drawer" 
            onPress={() => console.log('Drawer')} 
          />
          <ToolbarButton 
            icon={<Palette size={18} color={activeToolbar === 'stationery' ? "#3B82F6" : "#4B5563"} />} 
            label="Stationery" 
            isActive={activeToolbar === 'stationery'}
            onPress={() => toggleToolbar('stationery')} 
          />
          <ToolbarButton 
            icon={<Type size={18} color={activeToolbar === 'font' ? "#3B82F6" : "#4B5563"} />} 
            label="Font" 
            isActive={activeToolbar === 'font'}
            onPress={() => toggleToolbar('font')} 
          />
        </View>
      </View>
      
      <FontToolbar visible={activeToolbar === 'font'} onClose={() => setActiveToolbar('none')} />
      <StationeryToolbar visible={activeToolbar === 'stationery'} onClose={() => setActiveToolbar('none')} />
    </>
  );
}

function ToolbarButton({ icon, label, onPress, isActive }: { icon: React.ReactNode, label: string, onPress: () => void, isActive?: boolean }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.button} activeOpacity={0.7}>
      {icon}
      <Text style={[styles.label, isActive && styles.activeLabel]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'box-none', // Allow clicks through container area
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.08)',
      },
    }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    borderRadius: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
  },
  activeLabel: {
    color: '#3B82F6',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
});
