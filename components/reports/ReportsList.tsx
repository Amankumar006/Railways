import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { StyledText, EmptyState } from '@/components/themed';
import { ReportCard } from './ReportCard';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';

interface ReportsListProps {
  reports: any[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onDelete: (reportId: string) => Promise<void>;
  showInspectorName?: boolean;
}

export const ReportsList: React.FC<ReportsListProps> = ({
  reports,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRefresh,
  refreshing,
  onDelete,
  showInspectorName = false,
}) => {
  const { colors } = useTheme();

  // Loading state
  if (isLoading && !isFetchingNextPage && reports.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0056b3" />
        <StyledText style={styles.loadingText}>Loading reports...</StyledText>
      </View>
    );
  }

  // Error state
  if (isError && reports.length === 0) {
    return (
      <EmptyState
        icon={<Ionicons name="alert-circle-outline" size={40} color="#d32f2f" />}
        title="Error Loading Reports"
        description="We couldn't load your reports. Please try again."
        actionLabel="Retry"
        onAction={onRefresh}
      />
    );
  }

  // Empty state
  if (reports.length === 0) {
    return (
      <EmptyState
        icon={<Ionicons name="document-outline" size={40} color="#0056b3" />}
        title="No Reports Found"
        description="You don't have any reports yet. Start a new inspection to create one."
        actionLabel="Refresh"
        onAction={onRefresh}
      />
    );
  }

  // Render footer with loading indicator when fetching more
  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#0056b3" />
        <StyledText style={styles.footerText}>Loading more reports...</StyledText>
      </View>
    );
  };

  return (
    <FlatList
      data={reports}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ReportCard 
          report={item} 
          onDelete={onDelete} 
          showInspectorName={showInspectorName}
        />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#0056b3"]}
          tintColor="#0056b3"
        />
      }
      onEndReached={() => {
        if (hasNextPage && !isFetchingNextPage) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    marginLeft: 8,
    fontSize: 14,
  },
});
