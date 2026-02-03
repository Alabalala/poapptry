import { useAuth } from '@/context/AuthContext';
import { useLibrary } from '@/context/LibraryContext';
import { usePoem } from '@/context/PoemContext';
import { PoemData, poemService } from '@/services/poemService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Check, Globe, LogOut, Plus, Trash2, User, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Alert,
    Animated,
    Dimensions,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PoemThumbnail from './PoemThumbnail';

const SkeletonItem = ({ width }: { width: number }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const A4_RATIO = 0.707;
  const height = width / A4_RATIO;

  return (
    <View style={{ width, marginBottom: 15 }}>
      <Animated.View style={{ width, height, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 12, opacity }} />
      <Animated.View style={{ width: '80%', height: 14, backgroundColor: '#E5E7EB', borderRadius: 4, marginBottom: 6, opacity }} />
      <Animated.View style={{ width: '40%', height: 12, backgroundColor: '#E5E7EB', borderRadius: 4, opacity }} />
    </View>
  );
};

const { width: INITIAL_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH_INITIAL = INITIAL_WIDTH; // Full Screen

interface DrawerScreenProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function DrawerScreen({ isVisible, onClose }: DrawerScreenProps) {
  const { t, i18n } = useTranslation();
  const [showLanguages, setShowLanguages] = useState(false);

  const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
  ];

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    await AsyncStorage.setItem('user-language', lang);
    setShowLanguages(false);
  };

  const { width } = useWindowDimensions();
  const DRAWER_WIDTH = width; // Full Screen
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { loadPoem, createNewPoem, poemId } = usePoem();
  const { poems, loading } = useLibrary();
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH_INITIAL)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const prevWidth = useRef(width);
  useEffect(() => {
    if (width !== prevWidth.current) {
      prevWidth.current = width;
      if (!isVisible) {
        slideAnim.setValue(-width);
      }
    }
  }, [width, isVisible, slideAnim]);

  useEffect(() => {
    if (isVisible) {
      // Slide in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handlePoemSelect = (poem: PoemData) => {
    loadPoem(poem);
    onClose();
  };

  const handleNewPoem = () => {
    createNewPoem();
    onClose();
  };
  
  const handleDeletePoem = async (id: string, e: any) => {
    e.stopPropagation();
    Alert.alert(
      t('drawer.deletePoem'),
      t('drawer.deletePoemConfirm'),
      [
        { text: t('common.cancel'), style: "cancel" },
        { 
          text: t('common.delete'), 
          style: "destructive",
          onPress: async () => {
            try {
              await poemService.deletePoem(id);
              // List updates automatically via context
              if (poemId === id) {
                createNewPoem();
              }
            } catch (error) {
              Alert.alert(t('common.error'), t('drawer.deleteFailed'));
            }
          }
        }
      ]
    );
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Calculate thumbnail size
  // Dynamic columns based on screen width
  const getNumColumns = (w: number) => {
    if (w < 600) return 3; // Mobile
    if (w < 900) return 4; // Tablet Portrait / Large Phone
    if (w < 1200) return 5; // Tablet Landscape / Laptop
    return 6; // Desktop
  };

  const NUM_COLUMNS = getNumColumns(width);
  const CONTAINER_PADDING = 20;
  const GAP = 15; // Slightly tighter gap for 3 columns
  const itemWidth = (width - (CONTAINER_PADDING * 2) - (GAP * (NUM_COLUMNS - 1))) / NUM_COLUMNS;


  return (
    <View style={[styles.overlay, { pointerEvents: isVisible ? 'auto' : 'none' }]}>
      {/* Backdrop (Solid background for full screen) */}
      <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />

      {/* Drawer */}
      <Animated.View 
        style={[
          styles.drawer, 
          { 
            transform: [{ translateX: slideAnim }],
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('drawer.title')}</Text>
          <TouchableOpacity 
            onPress={onClose} 
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
            style={styles.closeButton}
          >
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {!user ? (
          <View style={styles.guestContainer}>
            <View style={styles.guestIconCircle}>
              <User size={60} color="#3B82F6" />
            </View>
            <Text style={styles.guestTitle}>{t('drawer.guestTitle')}</Text>
            <Text style={styles.guestMessage}>
              {t('drawer.guestMessage')}
            </Text>
            <TouchableOpacity 
              style={styles.authButton}
              onPress={() => {
                onClose();
                router.push('/auth');
              }}
            >
              <Text style={styles.authButtonText}>{t('drawer.signInOrSignUp')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.userInfo}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitials}>
                  {user.email ? user.email.substring(0, 2).toUpperCase() : 'ME'}
                </Text>
              </View>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
              
              <TouchableOpacity style={styles.settingsButton} onPress={() => setShowLanguages(true)}>
                <Globe size={18} color="#374151" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.signOutButtonSmall} onPress={handleSignOut}>
                <LogOut size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>

            <View style={styles.poemsListContainer}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{t('drawer.myPoems')} ({poems.length})</Text>
                <TouchableOpacity onPress={handleNewPoem} style={styles.newPoemButton}>
                  <Plus size={16} color="#FFF" />
                  <Text style={styles.newPoemText}>{t('drawer.newPoem')}</Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingTop: 10 }}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <SkeletonItem key={i} width={itemWidth} />
                  ))}
                </View>
              ) : poems.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>{t('drawer.emptyState')}</Text>
                </View>
              ) : (
                <FlatList
                  key={NUM_COLUMNS} // Force re-render when columns change
                  data={poems}
                  keyExtractor={(item) => item.id}
                  numColumns={NUM_COLUMNS}
                  columnWrapperStyle={{ gap: GAP }}
                  contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[
                        styles.poemItem, 
                        { width: itemWidth },
                        poemId === item.id && styles.activePoemItem
                      ]}
                      onPress={() => handlePoemSelect(item)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.thumbnailContainer}>
                        <PoemThumbnail poem={item} width={itemWidth} />
                        
                        {/* Overlay Gradient or Tint if active? */}
                        {poemId === item.id && (
                          <View style={styles.activeOverlay}>
                             <View style={styles.activeBadge}>
                               <Text style={styles.activeBadgeText}>{t('drawer.open')}</Text>
                             </View>
                          </View>
                        )}

                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={(e) => handleDeletePoem(item.id, e)}
                          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                        >
                          <View style={styles.deleteButtonBg}>
                             <Trash2 size={14} color="#EF4444" />
                          </View>
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.poemInfo}>
                        <Text style={styles.poemTitle} numberOfLines={1}>
                          {item.title || t('drawer.untitledPoem')}
                        </Text>
                        <Text style={styles.poemDate}>
                          {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </View>
          </>
        )}
      </Animated.View>

      {/* Language Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLanguages}
        onRequestClose={() => setShowLanguages(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLanguages(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('drawer.language')}</Text>
              <TouchableOpacity onPress={() => setShowLanguages(false)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            {LANGUAGES.map((lang) => (
              <TouchableOpacity 
                key={lang.code} 
                style={[
                  styles.languageOption,
                  i18n.language === lang.code && styles.languageOptionActive
                ]}
                onPress={() => changeLanguage(lang.code)}
              >
                <Text style={[
                  styles.languageText,
                  i18n.language === lang.code && styles.languageTextActive
                ]}>
                  {lang.label}
                </Text>
                {i18n.language === lang.code && <Check size={20} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F3F4F6', // Solid light gray background
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center', // Center title
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFF',
    position: 'relative',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'Crimson Text Bold',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 16,
    padding: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
  },
  guestContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  guestIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  guestMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    maxWidth: 300,
  },
  authButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  authButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userInitials: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  userEmail: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  settingsButton: {
    padding: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  signOutButtonSmall: {
    padding: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
  },
  poemsListContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  newPoemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  newPoemText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  poemItem: {
    marginBottom: 4,
  },
  activePoemItem: {
    // Styles for active item container if needed
  },
  thumbnailContainer: {
    position: 'relative',
    borderRadius: 4, // Paper usually has sharp corners, but let's do slight
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  deleteButtonBg: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  poemInfo: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  poemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  poemDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  languageOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  languageText: {
    fontSize: 16,
    color: '#374151',
  },
  languageTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
});
