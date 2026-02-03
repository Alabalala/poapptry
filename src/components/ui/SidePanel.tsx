import { Stamp, Type } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { FontPanelContent } from './FontToolbar';
import { StationeryPanelContent } from './StationeryToolbar';

export default function SidePanel() {
  const [activeTool, setActiveTool] = useState<'font' | 'stationery'>('font');
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const isLargeScreen = width >= 1024;
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderLeftColor: colors.border }, isLargeScreen && { width: '50%' }]}>
      {/* Top Switcher */}
      <View style={[styles.switcher, { borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTool === 'font' && { borderBottomColor: colors.text }]} 
          onPress={() => setActiveTool('font')}
        >
          <Type size={18} color={activeTool === 'font' ? colors.text : colors.textSecondary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTool === 'font' && { color: colors.text }]}>{t('editor.text')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTool === 'stationery' && { borderBottomColor: colors.text }]} 
          onPress={() => setActiveTool('stationery')}
        >
          <Stamp size={18} color={activeTool === 'stationery' ? colors.text : colors.textSecondary} />
          <Text style={[styles.tabText, { color: colors.textSecondary }, activeTool === 'stationery' && { color: colors.text }]}>{t('editor.stationery')}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={[styles.content, { backgroundColor: colors.surface }]}>
         {activeTool === 'font' ? (
           <FontPanelContent scrollContentStyle={{ paddingBottom: 20 }} />
         ) : (
           <StationeryPanelContent onClose={() => {}} scrollContentStyle={{ paddingBottom: 20 }} />
         )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 320,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  switcher: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  }
});
