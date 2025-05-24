import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '@/lib/supabase';

/**
 * Utility for handling offline data synchronization
 * This allows the app to work offline and sync changes when connectivity is restored
 */

// Queue for storing pending operations
interface PendingOperation {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

// Keys for AsyncStorage
const PENDING_OPERATIONS_KEY = 'railway_app_pending_operations';
const OFFLINE_DATA_KEY_PREFIX = 'railway_app_offline_data_';

/**
 * Add a pending operation to the queue
 * @param operation Operation details
 */
export async function queueOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<string> {
  try {
    // Generate a unique ID for the operation
    const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get existing pending operations
    const existingOperations = await getPendingOperations();
    
    // Add the new operation
    const newOperation: PendingOperation = {
      ...operation,
      id: operationId,
      timestamp: Date.now()
    };
    
    // Save the updated queue
    await AsyncStorage.setItem(
      PENDING_OPERATIONS_KEY,
      JSON.stringify([...existingOperations, newOperation])
    );
    
    // If we're inserting or updating, also save the data locally
    if (operation.operation === 'insert' || operation.operation === 'update') {
      await saveOfflineData(operation.table, operation.data);
    }
    
    // Try to sync immediately if we're online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && netInfo.isInternetReachable) {
      syncPendingOperations().catch(console.error);
    }
    
    return operationId;
  } catch (error) {
    console.error('Error queueing operation:', error);
    throw error;
  }
}

/**
 * Get all pending operations from the queue
 */
export async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const operationsJson = await AsyncStorage.getItem(PENDING_OPERATIONS_KEY);
    return operationsJson ? JSON.parse(operationsJson) : [];
  } catch (error) {
    console.error('Error getting pending operations:', error);
    return [];
  }
}

/**
 * Save data for offline access
 * @param table Table name
 * @param data Data to save
 */
export async function saveOfflineData(table: string, data: any): Promise<void> {
  try {
    // Generate a key for this table's data
    const key = `${OFFLINE_DATA_KEY_PREFIX}${table}`;
    
    // Get existing data for this table
    const existingDataJson = await AsyncStorage.getItem(key);
    let existingData = existingDataJson ? JSON.parse(existingDataJson) : [];
    
    // If data has an ID, update the existing item or add it
    if (data.id) {
      const index = existingData.findIndex((item: any) => item.id === data.id);
      if (index >= 0) {
        existingData[index] = { ...existingData[index], ...data };
      } else {
        existingData.push(data);
      }
    } else {
      // No ID, just add it as a new item
      existingData.push(data);
    }
    
    // Save the updated data
    await AsyncStorage.setItem(key, JSON.stringify(existingData));
  } catch (error) {
    console.error('Error saving offline data:', error);
    throw error;
  }
}

/**
 * Get offline data for a specific table
 * @param table Table name
 */
export async function getOfflineData(table: string): Promise<any[]> {
  try {
    const key = `${OFFLINE_DATA_KEY_PREFIX}${table}`;
    const dataJson = await AsyncStorage.getItem(key);
    return dataJson ? JSON.parse(dataJson) : [];
  } catch (error) {
    console.error('Error getting offline data:', error);
    return [];
  }
}

/**
 * Synchronize all pending operations with the server
 */
export async function syncPendingOperations(): Promise<{
  success: boolean;
  synced: number;
  failed: number;
  errors?: any[];
}> {
  // Check if we're online
  const netInfo = await NetInfo.fetch();
  if (!netInfo.isConnected || !netInfo.isInternetReachable) {
    return { success: false, synced: 0, failed: 0 };
  }
  
  try {
    // Get all pending operations
    const operations = await getPendingOperations();
    
    if (operations.length === 0) {
      return { success: true, synced: 0, failed: 0 };
    }
    
    console.log(`Syncing ${operations.length} pending operations...`);
    
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];
    const completedOperationIds: string[] = [];
    
    // Process each operation
    for (const operation of operations) {
      try {
        switch (operation.operation) {
          case 'insert': {
            const { error } = await supabase
              .from(operation.table)
              .insert(operation.data);
              
            if (error) throw error;
            break;
          }
          case 'update': {
            const { error } = await supabase
              .from(operation.table)
              .update(operation.data)
              .eq('id', operation.data.id);
              
            if (error) throw error;
            break;
          }
          case 'delete': {
            const { error } = await supabase
              .from(operation.table)
              .delete()
              .eq('id', operation.data.id);
              
            if (error) throw error;
            break;
          }
        }
        
        // Mark as completed
        completedOperationIds.push(operation.id);
        synced++;
      } catch (error) {
        console.error(`Error syncing operation ${operation.id}:`, error);
        errors.push({ operation, error });
        failed++;
      }
    }
    
    // Remove completed operations from the queue
    if (completedOperationIds.length > 0) {
      const remainingOperations = operations.filter(
        op => !completedOperationIds.includes(op.id)
      );
      await AsyncStorage.setItem(
        PENDING_OPERATIONS_KEY,
        JSON.stringify(remainingOperations)
      );
    }
    
    return {
      success: failed === 0,
      synced,
      failed,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Error syncing pending operations:', error);
    return { success: false, synced: 0, failed: 0, errors: [error] };
  }
}

/**
 * Set up a listener to automatically sync when the device comes online
 */
export function setupAutoSync(syncInterval: number = 60000): () => void {
  // Set up a listener for network state changes
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      console.log('Device is online, attempting to sync pending operations...');
      syncPendingOperations().catch(console.error);
    }
  });
  
  // Also set up a periodic sync attempt
  const intervalId = setInterval(() => {
    syncPendingOperations().catch(console.error);
  }, syncInterval);
  
  // Return a cleanup function
  return () => {
    unsubscribe();
    clearInterval(intervalId);
  };
}

/**
 * Clear all offline data and pending operations
 * Use with caution!
 */
export async function clearOfflineData(): Promise<void> {
  try {
    // Get all keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys related to our app
    const appKeys = allKeys.filter(key => 
      key === PENDING_OPERATIONS_KEY || key.startsWith(OFFLINE_DATA_KEY_PREFIX)
    );
    
    // Remove all keys
    if (appKeys.length > 0) {
      await AsyncStorage.multiRemove(appKeys);
    }
  } catch (error) {
    console.error('Error clearing offline data:', error);
    throw error;
  }
}
