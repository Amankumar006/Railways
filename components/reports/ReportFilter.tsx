import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { StyledText } from '@/components/themed';
import { useTheme } from '@/hooks/useTheme';

interface ReportFilterProps {
  currentFilter: string | null;
  onFilterChange: (filter: string | null) => void;
}

export const ReportFilter: React.FC<ReportFilterProps> = ({
  currentFilter,
  onFilterChange,
}) => {
  const { colors } = useTheme();

  const filters = [
    { value: null, label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' },
  ];

  return (
    <View style={styles.container}>
      <StyledText style={styles.label}>Filter by status:</StyledText>
      <View style={styles.filtersRow}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter.label}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  currentFilter === filter.value ? colors.primary : colors.card,
                borderColor: colors.border,
              },
            ]}
            onPress={() => onFilterChange(filter.value)}
          >
            <StyledText
              style={[
                styles.filterText,
                {
                  color:
                    currentFilter === filter.value
                      ? colors.white
                      : colors.text,
                },
              ]}
            >
              {filter.label}
            </StyledText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
  },
});
