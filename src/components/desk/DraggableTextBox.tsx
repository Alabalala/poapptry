import { TextBox } from '@/context/PoemContext';
import { Clipboard, Copy, Trash2, Type } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RichTextBox from './RichTextBox';

interface DraggableTextBoxProps {
  textBox: TextBox;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<TextBox>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onStyle: () => void;
  onPaste: () => void;
  isEditing: boolean; // Global edit mode
  paperSize: { width: number; height: number };
}

// Helper to convert pixels to percentages and back
const REFERENCE_WIDTH = 375; // Standard mobile width for relative font scaling

export default function DraggableTextBox({
  textBox,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
  onDuplicate,
  onStyle,
  onPaste,
  isEditing,
  paperSize,
}: DraggableTextBoxProps) {
  // Determine if stored values are percentages (legacy support)
  // Heuristic: If x is small (< 100) and width is reasonable for %, it's likely %, 
  // but if width > 100 (e.g. 200px), it's definitely pixels.
  // We'll migrate on the fly by calculating pixel values here.
  
  const isPercentage = textBox.x <= 100 && textBox.width <= 100 && textBox.y <= 100;
  
  const getPixelValues = () => {
    if (isPercentage) {
      return {
        x: (textBox.x / 100) * paperSize.width,
        y: (textBox.y / 100) * paperSize.height,
        width: (textBox.width / 100) * paperSize.width,
        height: (textBox.height / 100) * paperSize.height,
      };
    }
    return {
      x: textBox.x,
      y: textBox.y,
      width: textBox.width,
      height: textBox.height,
    };
  };

  const pixelValues = getPixelValues();
  const fontScale = paperSize.width / REFERENCE_WIDTH;

  // Local layout state for smooth interactions (in pixels)
  const [localLayout, setLocalLayout] = useState(pixelValues);

  // Typing state: If true, user is editing text. If false, user is moving box.
  const [isTyping, setIsTyping] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Track actual rendered size for accurate resizing start
  const actualSizeRef = useRef({ width: 0, height: 0 });

  // Sync with prop updates when not interacting
  useEffect(() => {
    const newPixels = getPixelValues();
    setLocalLayout(newPixels);
  }, [textBox.x, textBox.y, textBox.width, textBox.height, paperSize.width, paperSize.height]);

  // Helper to save as percentages
  const updateAsPercentage = (layout: { x: number; y: number; width: number; height: number }) => {
    onUpdate({
      x: (layout.x / paperSize.width) * 100,
      y: (layout.y / paperSize.height) * 100,
      width: (layout.width / paperSize.width) * 100,
      height: (layout.height / paperSize.height) * 100,
    });
  };


  // Reset typing state when selection is lost
  useEffect(() => {
    if (!isSelected) {
      setIsTyping(false);
    }
  }, [isSelected]);

  // Refs for gesture handling
  const currentLayoutRef = useRef(localLayout);
  const paperSizeRef = useRef(paperSize);
  const wasSelectedRef = useRef(isSelected);
  const interactionRef = useRef({ wasSelectedOnGrant: false });
  const isDraggingRef = useRef(false);
  const richTextBoxRef = useRef<any>(null);

  useEffect(() => { currentLayoutRef.current = localLayout; }, [localLayout]);
  useEffect(() => { paperSizeRef.current = paperSize; }, [paperSize]);
  useEffect(() => { wasSelectedRef.current = isSelected; }, [isSelected]);

  const initialGesture = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Update actual size on layout
  const handleLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    actualSizeRef.current = { width, height };
  };

  // Move Responder (Attached to Overlay)
  const moveResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        e.stopPropagation?.();
        interactionRef.current.wasSelectedOnGrant = wasSelectedRef.current;
        isDraggingRef.current = false;
        onSelect();
        initialGesture.current = { ...currentLayoutRef.current };
      },
      onPanResponderMove: (_, gestureState) => {
        const { dx, dy } = gestureState;
        if (!isDraggingRef.current && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
           isDraggingRef.current = true;
           setIsDragging(true);
        }

        if (isDraggingRef.current || Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          const newX = initialGesture.current.x + dx;
          const newY = initialGesture.current.y + dy;
          setLocalLayout(prev => ({ ...prev, x: newX, y: newY }));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const wasDragging = isDraggingRef.current;
        setIsDragging(false);
        isDraggingRef.current = false;
        
        const { dx, dy } = gestureState;
        const isTap = !wasDragging && Math.abs(dx) < 5 && Math.abs(dy) < 5;

        if (isTap) {
          setIsTyping(true);
          // Force focus on the underlying input
          // Use setTimeout to allow render cycle to complete and overlay to unmount
          setTimeout(() => {
             if (richTextBoxRef.current) {
                richTextBoxRef.current.focus();
             }
          }, 0);
        } else {
          // Commit move
          const { width: pWidth, height: pHeight } = paperSizeRef.current;
          const newX = initialGesture.current.x + dx;
          const newY = initialGesture.current.y + dy;
          const width = initialGesture.current.width;
          const height = initialGesture.current.height;
          
          // Check if fully outside (Drag to Delete)
          const isFullyOutside = (newX + width < 0) || (newX > pWidth) || (newY + height < 0) || (newY > pHeight);
          
          if (isFullyOutside) {
            onRemove();
          } else {
            updateAsPercentage({
              x: newX,
              y: newY,
              width: initialGesture.current.width,
              height: initialGesture.current.height
            });
          }
        }
      },
    })
  ).current;

  // Resize Responder Factory
  const createResizeResponder = (type: 'tl' | 'tr' | 'bl' | 'br' | 'l' | 'r') => 
    PanResponder.create({
      onStartShouldSetPanResponder: (e) => {
        e.stopPropagation?.();
        return true;
      },
      onMoveShouldSetPanResponder: (e) => {
        e.stopPropagation?.();
        return true;
      },
      onPanResponderGrant: (e) => {
        e.stopPropagation?.();
        onSelect();
        initialGesture.current = { 
          ...localLayout,
          height: Math.max(localLayout.height, actualSizeRef.current.height)
        };
      },
      onPanResponderMove: (_, gestureState) => {
        const { x, y, width, height } = initialGesture.current;
        const { dx, dy } = gestureState;
        
        let newX = x;
        let newY = y;
        let newWidth = width;
        let newHeight = height;

        // Horizontal Resize
        if (type === 'l' || type === 'tl' || type === 'bl') {
          newWidth = Math.max(50, width - dx);
          newX = x + (width - newWidth);
        } else if (type === 'r' || type === 'tr' || type === 'br') {
          newWidth = Math.max(50, width + dx);
        }

        // Vertical Resize (Only for corners)
        if (['tl', 'tr', 'bl', 'br'].includes(type)) {
          if (type === 'tl' || type === 'tr') {
            newHeight = Math.max(40, height - dy);
            newY = y + (height - newHeight);
          } else {
            newHeight = Math.max(40, height + dy);
          }
        }

        setLocalLayout({
          x: newX,
          y: newY,
          width: newWidth,
          height: newHeight,
        });
      },
      onPanResponderRelease: () => {
        updateAsPercentage({
          x: currentLayoutRef.current.x,
          y: currentLayoutRef.current.y,
          width: currentLayoutRef.current.width,
          height: currentLayoutRef.current.height,
        });
      },
    });

  // Create responders once
  const tlResponder = useRef(createResizeResponder('tl')).current;
  const trResponder = useRef(createResizeResponder('tr')).current;
  const blResponder = useRef(createResizeResponder('bl')).current;
  const brResponder = useRef(createResizeResponder('br')).current;
  const lResponder = useRef(createResizeResponder('l')).current;
  const rResponder = useRef(createResizeResponder('r')).current;

  // View Mode
  if (!isEditing) {
    return (
      <View
        style={{
          position: 'absolute',
          left: localLayout.x,
          top: localLayout.y,
          width: localLayout.width,
          minHeight: localLayout.height,
          zIndex: textBox.zIndex,
        }}
      >
        <RichTextBox
          textBox={textBox}
          onUpdate={() => {}}
          onFocus={() => {}}
          isEditing={false}
          scale={fontScale}
        />
      </View>
    );
  }

  // Determine menu position (above or below if too close to top)
  const menuOnBottom = localLayout.y < 60;

  return (
    <View
      style={[
        styles.container,
        {
          left: localLayout.x,
          top: localLayout.y,
          width: localLayout.width,
          minHeight: localLayout.height,
          zIndex: isSelected ? 100 : textBox.zIndex,
          borderWidth: isSelected ? 1 : 0,
          borderColor: '#3B82F6',
          cursor: isDragging ? 'move' : (isSelected && !isTyping ? 'move' : 'default'),
        } as any,
      ]}
      onLayout={handleLayout}
      // @ts-ignore - Web only click handling to prevent unselection
      onClick={(e: any) => e.stopPropagation()}
    >
      {/* Drag Overlay - Only active when NOT typing */}
      {!isTyping && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { zIndex: 1, backgroundColor: 'transparent' }
          ]}
          {...moveResponder.panHandlers}
        />
      )}

      {/* Floating Toolbar */}
      {isSelected && isEditing && (
        <View 
          style={[
            styles.floatingToolbar, 
            menuOnBottom ? { top: '100%', marginTop: 10 } : { bottom: '100%', marginBottom: 10 }
          ]}
        >
          <TouchableOpacity onPress={onRemove} style={styles.toolbarButton}>
            <Trash2 size={16} color="#374151" />
            <Text style={styles.toolbarText}>Delete</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onDuplicate} style={styles.toolbarButton}>
            <Copy size={16} color="#374151" />
            <Text style={styles.toolbarText}>Duplicate</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity onPress={onPaste} style={styles.toolbarButton}>
            <Clipboard size={16} color="#374151" />
            <Text style={styles.toolbarText}>Paste</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity 
            onPress={() => {
              Keyboard.dismiss();
              setIsTyping(false);
              onStyle();
            }} 
            style={styles.toolbarButton}
          >
            <Type size={16} color="#374151" />
            <Text style={styles.toolbarText}>Style</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <View style={{ flex: 1, cursor: 'text' } as any}>
        <RichTextBox
          ref={richTextBoxRef}
          textBox={textBox}
          onUpdate={(content) => onUpdate({ content })}
          onFocus={() => {
            onSelect();
            setIsTyping(true);
          }}
          isEditing={isEditing}
          shouldFocus={isTyping}
          scale={fontScale}
        />
      </View>

      {/* Handles & Controls (Always on top) */}
      {isSelected && isEditing && (
        <>
          {/* Corner Handles */}
          <View style={[styles.resizeHandle, styles.tl, { touchAction: 'none' } as any]} {...tlResponder.panHandlers} />
          <View style={[styles.resizeHandle, styles.tr, { touchAction: 'none' } as any]} {...trResponder.panHandlers} />
          <View style={[styles.resizeHandle, styles.bl, { touchAction: 'none' } as any]} {...blResponder.panHandlers} />
          <View style={[styles.resizeHandle, styles.br, { touchAction: 'none' } as any]} {...brResponder.panHandlers} />

          {/* Side Pill Handles */}
          <View style={[styles.sideHandle, styles.l, { touchAction: 'none' } as any]} {...lResponder.panHandlers}>
            <View style={styles.pill} />
          </View>
          <View style={[styles.sideHandle, styles.r, { touchAction: 'none' } as any]} {...rResponder.panHandlers}>
            <View style={styles.pill} />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
  resizeHandle: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 6,
    zIndex: 10,
  },
  tl: { top: -6, left: -6 },
  tr: { top: -6, right: -6 },
  bl: { bottom: -6, left: -6 },
  br: { bottom: -6, right: -6 },
  
  sideHandle: {
    position: 'absolute',
    width: 20,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9,
  },
  l: { left: -10, top: 0 },
  r: { right: -10, top: 0 },
  pill: {
    width: 6,
    height: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 3,
  },
  floatingToolbar: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 200,
    alignItems: 'center',
    minWidth: 240,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  toolbarButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  toolbarText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 2,
  }
});