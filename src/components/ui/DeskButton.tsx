import { Check, Circle, FolderOpen, LucideIcon, Palette, Plus, Share, Trash2, X } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';


const ICON_MAP: Record<string, LucideIcon> = {
  drawer: FolderOpen,
  stationery: Palette,
  share: Share,
  plus: Plus,
  trash: Trash2,
  close: X,
  check: Check,
  default: Circle,
};

interface DeskButtonProps {
  iconName: string;
  label?: string;
  onPress: () => void;
}

export default function DeskButton({ iconName, label, onPress }: DeskButtonProps) {
  const IconComponent = ICON_MAP[iconName.toLowerCase()] || ICON_MAP.default;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      className="items-center justify-center p-4"
      activeOpacity={0.7}
    >
      <View className="bg-black/5 p-4 rounded-full border border-black/5 items-center justify-center">
        <IconComponent size={24} color="#333" />
      </View>
      {label && (
        <Text className="mt-2 text-xs font-medium text-gray-600 font-['Crimson_Text']">
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}
