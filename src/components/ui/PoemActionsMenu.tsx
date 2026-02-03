import { useToast } from '@/context/ToastContext';
import { Download, Eraser, Share2, Trash2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Platform, Share, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePoem } from '../../context/PoemContext';
import ConfirmationModal from './ConfirmationModal';

interface PoemActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  onShareImage?: () => void;
  anchorPosition?: { x: number; y: number }; // Optional for precise positioning if needed
}

export default function PoemActionsMenu({ visible, onClose, onShareImage }: PoemActionsMenuProps) {
  const { removeAllDecorations, resetPoem, title, pages } = usePoem();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText: string;
    variant: 'default' | 'destructive';
  }>({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: t('common.confirm'),
    variant: 'default',
  });

  if (!visible && !confirmModal.visible) return null;

  const handleShare = async () => {
    try {
      // Basic text share for now
      const poemContent = pages.map(p => 
        p.textBoxes?.map(t => t.content).join('\n') || ''
      ).join('\n\n');
      const message = `${title}\n\n${poemContent}`;
      
      await Share.share({
        message,
        title: title,
      });
      onClose();
    } catch (error) {
      console.error('Error sharing:', error);
      showToast(t('editor.shareError'), 'error');
    }
  };

  const handleDeleteStationery = () => {
    setConfirmModal({
      visible: true,
      title: t('modals.deleteStationery.title'),
      message: t('modals.deleteStationery.message'),
      confirmText: t('modals.deleteStationery.confirm'),
      variant: 'destructive',
      onConfirm: () => {
        removeAllDecorations();
        setConfirmModal(prev => ({ ...prev, visible: false }));
        onClose();
      }
    });
  };

  const handleDeletePoem = () => {
    setConfirmModal({
      visible: true,
      title: t('modals.deletePoem.title'),
      message: t('modals.deletePoem.message'),
      confirmText: t('modals.deletePoem.confirm'),
      variant: 'destructive',
      onConfirm: () => {
        resetPoem();
        setConfirmModal(prev => ({ ...prev, visible: false }));
        onClose();
      }
    });
  };

  return (
    <>
      <Modal
        transparent
        visible={visible && !confirmModal.visible} // Hide menu when confirmation is shown to avoid stacking issues/visual clutter
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
              <View 
                style={[
                  styles.menuContainer, 
                  { top: insets.top + 56 } // Position below top bar
                ]}
              >
                <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                  <Share2 size={20} color="#374151" />
                  <Text style={styles.menuItemText}>{t('actions.shareText')}</Text>
                </TouchableOpacity>

                {onShareImage && (
                  <TouchableOpacity style={styles.menuItem} onPress={() => {
                    onShareImage();
                    onClose();
                  }}>
                    <Download size={20} color="#374151" />
                    <Text style={styles.menuItemText}>{t('actions.savePng')}</Text>
                  </TouchableOpacity>
                )}

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={handleDeleteStationery}>
                  <Eraser size={20} color="#374151" />
                  <Text style={styles.menuItemText}>{t('actions.clearStationery')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleDeletePoem}>
                  <Trash2 size={20} color="#EF4444" />
                  <Text style={[styles.menuItemText, styles.destructiveText]}>{t('actions.deletePoem')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ConfirmationModal
        visible={confirmModal.visible}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        variant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, visible: false }))}
      />
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'flex-end', // Align to right
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
      },
    }),
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  destructiveText: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
});
