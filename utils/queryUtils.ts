import { supabase } from '@/lib/supabase';

/**
 * Utility functions for optimized data fetching
 */

/**
 * Fetch data with pagination and filtering
 * @param tableName The name of the table to fetch from
 * @param options Query options including pagination, filters, and select columns
 * @returns Paginated data and metadata
 */
export async function fetchPaginatedData(
  tableName: string,
  options: {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    select?: string;
    orderBy?: { column: string; ascending?: boolean };
    relationships?: string[];
  } = {}
) {
  try {
    const {
      page = 0,
      pageSize = 10,
      filters = {},
      select = '*',
      orderBy,
      relationships = [],
    } = options;

    // Start building the query
    let query = supabase
      .from(tableName)
      .select(select)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === 'object') {
          // Handle range filters like { gte: 100, lte: 200 }
          Object.entries(value).forEach(([operator, operatorValue]) => {
            switch (operator) {
              case 'eq':
                query = query.eq(key, operatorValue);
                break;
              case 'neq':
                query = query.neq(key, operatorValue);
                break;
              case 'gt':
                query = query.gt(key, operatorValue);
                break;
              case 'gte':
                query = query.gte(key, operatorValue);
                break;
              case 'lt':
                query = query.lt(key, operatorValue);
                break;
              case 'lte':
                query = query.lte(key, operatorValue);
                break;
              case 'like':
                query = query.like(key, `%${operatorValue}%`);
                break;
              case 'ilike':
                query = query.ilike(key, `%${operatorValue}%`);
                break;
              default:
                break;
            }
          });
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, {
        ascending: orderBy.ascending !== false,
      });
    }

    // Execute the query
    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching paginated data:', error);
      throw error;
    }

    // Calculate pagination metadata
    const hasNextPage = data?.length === pageSize;
    const totalPages = count ? Math.ceil(count / pageSize) : undefined;

    return {
      data: data || [],
      metadata: {
        page,
        pageSize,
        hasNextPage,
        totalPages,
        totalCount: count,
      },
    };
  } catch (error) {
    console.error('Error in fetchPaginatedData:', error);
    throw error;
  }
}

/**
 * Batch update multiple records in a transaction
 * @param tableName The name of the table to update
 * @param records Array of records to update
 * @param keyField Primary key field name (default: 'id')
 * @returns Result of the batch update
 */
export async function batchUpdate(
  tableName: string,
  records: Record<string, any>[],
  keyField: string = 'id'
) {
  try {
    if (!records.length) return { success: true, count: 0 };

    // Start a transaction
    const { error } = await supabase.rpc('begin_transaction');
    if (error) throw error;

    let successCount = 0;
    let errors: any[] = [];

    // Process each record in the batch
    for (const record of records) {
      const { error: updateError } = await supabase
        .from(tableName)
        .update(record)
        .eq(keyField, record[keyField]);

      if (updateError) {
        errors.push({ record, error: updateError });
      } else {
        successCount++;
      }
    }

    // Commit or rollback based on success
    if (errors.length === 0) {
      await supabase.rpc('commit_transaction');
      return { success: true, count: successCount };
    } else {
      await supabase.rpc('rollback_transaction');
      return { success: false, errors, count: successCount };
    }
  } catch (error) {
    console.error('Error in batchUpdate:', error);
    await supabase.rpc('rollback_transaction').catch(console.error);
    throw error;
  }
}

/**
 * Fetch data with efficient caching based on query parameters
 * @param key Unique key for caching
 * @param fetcher Function to fetch data if not cached
 * @param ttl Time-to-live in milliseconds for cache (default: 5 minutes)
 * @returns Cached or freshly fetched data
 */
export async function cachedFetch(
  key: string,
  fetcher: () => Promise<any>,
  ttl: number = 5 * 60 * 1000
) {
  const cacheKey = `cache:${key}`;
  
  try {
    // Check if we have a cached version
    const { data: cachedData } = await supabase
      .from('app_cache')
      .select('data, updated_at')
      .eq('key', cacheKey)
      .single();
    
    if (cachedData) {
      const cacheAge = Date.now() - new Date(cachedData.updated_at).getTime();
      
      // If cache is still valid, return it
      if (cacheAge < ttl) {
        return cachedData.data;
      }
    }
    
    // Cache miss or expired, fetch fresh data
    const freshData = await fetcher();
    
    // Update cache
    await supabase
      .from('app_cache')
      .upsert(
        {
          key: cacheKey,
          data: freshData,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );
    
    return freshData;
  } catch (error) {
    console.error('Error in cachedFetch:', error);
    // On error, fall back to direct fetch
    return fetcher();
  }
}
