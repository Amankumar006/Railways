import React, { memo } from 'react';
import { InspectionActivity, type InspectionActivityProps } from './InspectionActivity';

/**
 * Memoized version of InspectionActivity component to prevent unnecessary re-renders
 * This improves performance when there are many activities in the list
 */
export const MemoizedInspectionActivity = memo<InspectionActivityProps>(
  InspectionActivity,
  (prevProps, nextProps) => {
    // Only re-render if these props change
    return (
      prevProps.activity.id === nextProps.activity.id &&
      prevProps.activity.checkStatus === nextProps.activity.checkStatus &&
      prevProps.activity.remarks === nextProps.activity.remarks
    );
  }
);
