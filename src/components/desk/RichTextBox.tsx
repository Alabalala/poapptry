import { TextBox } from '@/context/PoemContext';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (shouldFocus) {
      inputRef.current?.focus();
    } else if (shouldFocus === false) {
      inputRef.current?.blur();
    }
  }, [shouldFocus]);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    }
  }));

  // Native fallback: Plain text input
  // Rich text on native requires a complex library (e.g. react-native-pell) 
  // which is out of scope for a single file change without adding dependencies.
  
  return (
    <View style={styles.container}>
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          {
            padding: 8 * scale,
            fontFamily: textBox.style.fontFamily,
            fontSize: textBox.style.fontSize * scale,
              lineHeight: textBox.style.lineHeight ? textBox.style.lineHeight * scale : undefined,
              textAlign: textBox.style.textAlign,
            color: textBox.style.color,
            fontWeight: textBox.style.fontWeight,
            fontStyle: textBox.style.fontStyle,
            textDecorationLine: textBox.style.textDecorationLine,
          }
        ]}
        value={textBox.content.replace(/<[^>]*>/g, '')} // Strip HTML for native display
        onChangeText={onUpdate}
        multiline
        onFocus={onFocus}
        editable={isEditing}
        placeholder={isEditing ? "Write here..." : ""}
        placeholderTextColor="rgba(0,0,0,0.3)"
      />
      {isEditing && (
        <Text style={styles.hint}>Rich text editing is available on Web</Text>
      )}
    </View>
  );
});

RichTextBox.displayName = 'RichTextBox';

export default RichTextBox;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  input: {
    flex: 1,
    padding: 8,
    textAlignVertical: 'top',
  },
  hint: {
    position: 'absolute',
    bottom: -20,
    left: 0,
    fontSize: 10,
    color: '#999',
  }
});