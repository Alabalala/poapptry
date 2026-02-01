import { TextBox } from '@/context/PoemContext';
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

interface RichTextBoxProps {
  textBox: TextBox;
  onUpdate: (content: string) => void;
  onFocus: () => void;
  isEditing: boolean;
  shouldFocus?: boolean;
}

export default function RichTextBox({ textBox, onUpdate, onFocus, isEditing, shouldFocus }: RichTextBoxProps) {
  // Native fallback: Plain text input
  // Rich text on native requires a complex library (e.g. react-native-pell) 
  // which is out of scope for a single file change without adding dependencies.
  
  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.input,
          {
            fontFamily: textBox.style.fontFamily,
            fontSize: textBox.style.fontSize,
            textAlign: textBox.style.textAlign,
            color: textBox.style.color,
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
}

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