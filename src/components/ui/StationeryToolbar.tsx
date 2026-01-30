import { LinearGradient } from 'expo-linear-gradient';
import { Check, Image as ImageIcon, Sparkles, Stamp as StampIcon, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { DeviceEventEmitter, Image, PanResponder, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BOOKMARKS, PAPERS, STAMPS, WASHI } from '../../constants/ThemeRegistry';
import { usePoem } from '../../context/PoemContext';

type Tab = 'paper' | 'decor' | 'stamps';

export default function StationeryToolbar({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { activeConfig, updateConfig, fixedDecorations, updateFixedDecorations, addStamp, setDraggedStamp, paperBounds } = usePoem();
  const [activeTab, setActiveTab] = useState<Tab>('paper');
  const insets = useSafeAreaInsets();
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  if (!visible) return null;

  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
    setIsScrolledToBottom(isCloseToBottom);
  };

  const renderPaperTab = () => (
    <View style={styles.grid}>
      {Object.entries(PAPERS).map(([id, source]) => (
        <TouchableOpacity
          key={id}
          style={[styles.paperOption, activeConfig.paperId === id && styles.activeOption]}
          onPress={() => updateConfig({ paperId: id })}
        >
          <Image source={source} style={styles.paperPreview} resizeMode="cover" />
          {activeConfig.paperId === id && (
            <View style={styles.checkOverlay}>
              <Check size={20} color="#FFF" />
            </View>
          )}
          <Text style={styles.optionLabel}>{id.replace('paper_', '').replace('_', ' ')}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDecorTab = () => (
    <View>
      <View style={styles.sectionHeader}>
        <SectionLabel label="Washi Tape" />
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, fixedDecorations.washiPosition === 'top' && styles.toggleButtonActive]}
            onPress={() => updateFixedDecorations({ washiPosition: 'top' })}
          >
            <Text style={[styles.toggleText, fixedDecorations.washiPosition === 'top' && styles.toggleTextActive]}>Top</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, fixedDecorations.washiPosition === 'bottom' && styles.toggleButtonActive]}
            onPress={() => updateFixedDecorations({ washiPosition: 'bottom' })}
          >
            <Text style={[styles.toggleText, fixedDecorations.washiPosition === 'bottom' && styles.toggleTextActive]}>Bottom</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.decorOption, !fixedDecorations.washiId && styles.activeOption]}
          onPress={() => updateFixedDecorations({ washiId: null })}
        >
          <View style={[styles.decorPreview, styles.nonePreview]}>
            <X size={24} color="#9CA3AF" />
          </View>
          <Text style={styles.optionLabel}>None</Text>
        </TouchableOpacity>
        {Object.entries(WASHI).map(([id, source]) => (
          <TouchableOpacity
            key={id}
            style={[styles.decorOption, fixedDecorations.washiId === id && styles.activeOption]}
            onPress={() => updateFixedDecorations({ washiId: id })}
          >
            <Image source={source} style={styles.decorPreview} resizeMode="cover" />
            {fixedDecorations.washiId === id && (
              <View style={styles.checkOverlay}>
                <Check size={20} color="#FFF" />
              </View>
            )}
            <Text style={styles.optionLabel}>{id.replace('washi_', '').replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <SectionLabel label="Bookmarks" />
        <View style={styles.toggleContainer}>
          <TouchableOpacity 
            style={[styles.toggleButton, fixedDecorations.bookmarkSide === 'left' && styles.toggleButtonActive]}
            onPress={() => updateFixedDecorations({ bookmarkSide: 'left' })}
          >
            <Text style={[styles.toggleText, fixedDecorations.bookmarkSide === 'left' && styles.toggleTextActive]}>Left</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.toggleButton, fixedDecorations.bookmarkSide === 'right' && styles.toggleButtonActive]}
            onPress={() => updateFixedDecorations({ bookmarkSide: 'right' })}
          >
            <Text style={[styles.toggleText, fixedDecorations.bookmarkSide === 'right' && styles.toggleTextActive]}>Right</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.grid}>
        <TouchableOpacity
          style={[styles.decorOption, !fixedDecorations.bookmarkId && styles.activeOption]}
          onPress={() => updateFixedDecorations({ bookmarkId: null })}
        >
          <View style={[styles.decorPreview, styles.nonePreview]}>
            <X size={24} color="#9CA3AF" />
          </View>
          <Text style={styles.optionLabel}>None</Text>
        </TouchableOpacity>
        {Object.entries(BOOKMARKS).map(([id, source]) => (
          <TouchableOpacity
            key={id}
            style={[styles.decorOption, fixedDecorations.bookmarkId === id && styles.activeOption]}
            onPress={() => updateFixedDecorations({ bookmarkId: id })}
          >
            <Image source={source} style={styles.decorPreview} resizeMode="cover" />
            {fixedDecorations.bookmarkId === id && (
              <View style={styles.checkOverlay}>
                <Check size={20} color="#FFF" />
              </View>
            )}
            <Text style={styles.optionLabel}>{id.replace('bookmark_', '').replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const handleAddStamp = (id: string) => {
    const success = addStamp(id);
    if (success) {
      onClose();
    }
  };

  const renderStampsTab = () => (
    <View style={styles.grid}>
      {Object.entries(STAMPS).map(([id, source]) => (
        <DraggableStampOption
          key={id}
          id={id}
          source={source}
          onPress={() => handleAddStamp(id)}
          onClose={onClose}
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'paper' && styles.activeTab]}
            onPress={() => setActiveTab('paper')}
          >
            <ImageIcon size={16} color={activeTab === 'paper' ? '#111827' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'paper' && styles.activeTabText]}>Paper</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'decor' && styles.activeTab]}
            onPress={() => setActiveTab('decor')}
          >
            <Sparkles size={16} color={activeTab === 'decor' ? '#111827' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'decor' && styles.activeTabText]}>Decor</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'stamps' && styles.activeTab]}
            onPress={() => setActiveTab('stamps')}
          >
            <StampIcon size={16} color={activeTab === 'stamps' ? '#111827' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'stamps' && styles.activeTabText]}>Stamps</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeButton}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={true} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 60 }]}
        indicatorStyle="black"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {activeTab === 'paper' && renderPaperTab()}
        {activeTab === 'decor' && renderDecorTab()}
        {activeTab === 'stamps' && renderStampsTab()}
      </ScrollView>

      {!isScrolledToBottom && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
          style={[
            styles.gradientOverlay, 
            { bottom: 0, height: Math.max(insets.bottom, 20) + 40 }
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function DraggableStampOption({ id, source, onPress, onClose }: { id: string, source: any, onPress: () => void, onClose: () => void }) {
  const { addStamp, setDraggedStamp, paperBounds } = usePoem();
  const isDraggingRef = useRef(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start drag if moved significantly (> 10px)
        return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: (_, gestureState) => {
        isDraggingRef.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        // If we haven't started dragging yet (draggedStamp is null), start now
        // We use a small threshold to distinguish tap from drag
        const isDragging = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        
        if (isDragging) {
           // We need absolute coordinates. 
           // gestureState.moveX/moveY are absolute screen coordinates.
           DeviceEventEmitter.emit('DRAG_MOVE', { x: gestureState.moveX, y: gestureState.moveY });
           
           if (!isDraggingRef.current) {
             setDraggedStamp({ assetId: id, x: gestureState.moveX, y: gestureState.moveY });
             isDraggingRef.current = true;
           }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        setDraggedStamp(null);
        isDraggingRef.current = false;
        
        // Check if dropped on paper
        if (paperBounds) {
          const { x, y, width, height } = paperBounds;
          const dropX = gestureState.moveX;
          const dropY = gestureState.moveY;
          
          if (
            dropX >= x && 
            dropX <= x + width && 
            dropY >= y && 
            dropY <= y + height
          ) {
            // Calculate relative percentage position
            const relX = ((dropX - x) / width) * 100;
            const relY = ((dropY - y) / height) * 100;
            
            const success = addStamp(id, { x: relX, y: relY });
            if (success) {
              onClose(); // Close menu on successful drop
            }
          }
        }
      },
      onPanResponderTerminate: () => {
        setDraggedStamp(null);
      },
    })
  ).current;

  return (
    <View 
      {...panResponder.panHandlers}
      style={styles.stampOption}
    >
      <TouchableOpacity
        style={{ flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center' }}
        onPress={onPress}
        // Important: activeOpacity needs to be handled carefully with PanResponder
        // But since we use onMoveShouldSetPanResponder, touchable handles taps first.
      >
        <Image source={source} style={styles.stampPreview} resizeMode="contain" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.1)',
      },
    }),
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 12,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    marginTop: 8,
    paddingRight: 4,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  toggleText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#111827',
    fontWeight: '600',
  },
  paperOption: {
    width: '47%',
    aspectRatio: 1.4,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
  },
  decorOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  stampOption: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    padding: 8,
  },
  activeOption: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  paperPreview: {
    width: '100%',
    height: '100%',
  },
  decorPreview: {
    width: '100%',
    height: '100%',
  },
  stampPreview: {
    width: '100%',
    height: '80%',
  },
  nonePreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    fontSize: 10,
    padding: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
  },
});