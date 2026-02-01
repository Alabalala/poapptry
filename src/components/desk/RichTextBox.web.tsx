import { TextBox } from '@/context/PoemContext';
import React, { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

interface RichTextBoxProps {
  textBox: TextBox;
  onUpdate: (content: string) => void;
  onFocus: () => void;
  isEditing: boolean;
  shouldFocus?: boolean;
  scale?: number;
}

export interface RichTextBoxRef {
  focus: () => void;
}

const RichTextBox = forwardRef<RichTextBoxRef, RichTextBoxProps>(({ textBox, onUpdate, onFocus, isEditing, shouldFocus, scale = 1 }, ref) => {
  const divRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  useImperativeHandle(ref, () => ({
    focus: () => {
      if (divRef.current) {
        divRef.current.focus();
      }
    }
  }));

  useEffect(() => {
    if (shouldFocus && divRef.current) {
      divRef.current.focus();
    }
  }, [shouldFocus]);

  useEffect(() => {
    if (divRef.current && !isInternalUpdate.current) {
      if (divRef.current.innerHTML !== textBox.content) {
        divRef.current.innerHTML = textBox.content;
      }
    }
    isInternalUpdate.current = false;
  }, [textBox.content]);

  const handleInput = (e: any) => {
    isInternalUpdate.current = true;
    const content = e.target.innerHTML;
    onUpdate(content);
  };

  return (
    <View style={styles.container}>
      {/* @ts-ignore - React Native Web supports HTML elements but TS might complain */}
      <div
        ref={divRef}
        contentEditable={isEditing}
        onInput={handleInput}
        onFocus={onFocus}
        onClick={(e) => e.stopPropagation()} // Stop propagation to prevent unselecting
        style={{
          width: '100%',
          height: '100%',
          outline: 'none',
          overflow: 'auto',
          padding: '8px',
          fontFamily: textBox.style.fontFamily,
          fontSize: `${textBox.style.fontSize * scale}px`,
          lineHeight: textBox.style.lineHeight ? `${textBox.style.lineHeight * scale}px` : undefined,
          textAlign: textBox.style.textAlign,
          color: textBox.style.color,
          fontWeight: textBox.style.fontWeight,
          fontStyle: textBox.style.fontStyle,
          textDecoration: textBox.style.textDecorationLine,
          cursor: isEditing ? 'text' : 'default',
          whiteSpace: 'pre-wrap', // Preserve line breaks
          wordBreak: 'break-word',
        }}
        suppressContentEditableWarning={true}
      />
      
      {/* Placeholder */}
      {!textBox.content && isEditing && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            right: 8,
            color: 'rgba(156, 163, 175, 0.6)', // Gray-400 with opacity
            pointerEvents: 'none', // Allow clicking through to the editor
            fontFamily: textBox.style.fontFamily,
            fontSize: `${textBox.style.fontSize * scale}px`,
            lineHeight: textBox.style.lineHeight ? `${textBox.style.lineHeight * scale}px` : undefined,
            textAlign: textBox.style.textAlign,
            fontStyle: 'italic',
          }}
        >
          Type your poem here...
        </div>
      )}
    </View>
  );
});

RichTextBox.displayName = 'RichTextBox';

// Memoize to prevent re-renders during parent drag
export default memo(RichTextBox, (prev, next) => {
  return (
    prev.isEditing === next.isEditing &&
    prev.scale === next.scale &&
    prev.textBox.content === next.textBox.content &&
    prev.textBox.style.fontFamily === next.textBox.style.fontFamily &&
    prev.textBox.style.fontSize === next.textBox.style.fontSize &&
    prev.textBox.style.textAlign === next.textBox.style.textAlign &&
    prev.textBox.style.color === next.textBox.style.color
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});