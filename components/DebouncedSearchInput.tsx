import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface DebouncedSearchInputProps {
  onSearch: (text: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceTime?: number;
  style?: any;
}

/**
 * A search input component with debounce functionality to prevent excessive search operations
 * while the user is still typing. This improves performance for search operations.
 */
export function DebouncedSearchInput({
  onSearch,
  placeholder = 'Search...',
  initialValue = '',
  debounceTime = 500,
  style,
}: DebouncedSearchInputProps) {
  const { colors } = useTheme();
  const [searchText, setSearchText] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);

  // Debounced search handler
  const debouncedSearch = useCallback(
    (value: string) => {
      const handler = setTimeout(() => {
        onSearch(value);
      }, debounceTime);

      return () => {
        clearTimeout(handler);
      };
    },
    [onSearch, debounceTime]
  );

  // Effect to handle debounced search
  useEffect(() => {
    const cleanup = debouncedSearch(searchText);
    return cleanup;
  }, [searchText, debouncedSearch]);

  // Clear search text
  const handleClear = () => {
    setSearchText('');
    onSearch('');
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: isFocused ? colors.primary : colors.border,
        },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={searchText}
        onChangeText={setSearchText}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        returnKeyType="search"
        clearButtonMode="while-editing"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {searchText.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    height: 40,
  },
  clearButton: {
    padding: 4,
  },
});
