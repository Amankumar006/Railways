/**
 * Utility functions for handling colors in the application
 * Provides safe access to color values from the theme
 */

type ColorObject = {
  [key: string]: string | ColorObject;
};

/**
 * Safely extracts a color value from a potentially nested color object
 * If the color is a string, returns it directly
 * If the color is an object, returns the 500 shade (main color) or a fallback
 * 
 * @param color - The color value or object
 * @param fallback - Optional fallback color if extraction fails
 * @returns A valid color string
 */
export const getColorValue = (
  color: string | ColorObject | undefined,
  fallback: string = '#000000'
): string => {
  try {
    // If color is undefined or null, return fallback
    if (color === undefined || color === null) return fallback;
    
    // If color is already a string, return it directly
    if (typeof color === 'string') return color;
    
    // If color is an array (which can happen with some theme objects), prevent the error
    if (Array.isArray(color)) {
      console.warn('Color is an array, returning fallback');
      return fallback;
    }
    
    // If color is an object, safely extract the 500 shade (main color)
    if (typeof color === 'object') {
      // First try to get the '500' key as a string
      if ('500' in color && typeof color['500'] === 'string') {
        return color['500'];
      }
      
      // Then try numeric key access if available
      if (color[500] && typeof color[500] === 'string') {
        return color[500];
      }
      
      // If we have a PRIMARY key, use that
      if ('PRIMARY' in color && typeof color['PRIMARY'] === 'string') {
        return color['PRIMARY'];
      }
      
      // Last resort - try to find any string value in the object
      for (const key in color) {
        if (typeof color[key] === 'string') {
          return color[key] as string;
        }
      }
    }
    
    // If all else fails, return the fallback color
    return fallback;
  } catch (error) {
    // Log the error but don't crash
    console.error('Error processing color value:', error);
    console.error('Problematic color value:', JSON.stringify(color));
    return fallback;
  }
};

/**
 * Color constants for the application
 * These are direct string values for commonly used colors
 */
export const COLORS = {
  // Primary colors
  PRIMARY: '#0055AF',
  SECONDARY: '#FF8000',
  SUCCESS: '#138808',
  ERROR: '#FF453A',
  WARNING: '#FFD60A',
  INFO: '#0A99FF',
  
  // Neutral colors
  WHITE: '#FFFFFF',
  BLACK: '#000000',
  LIGHT_GRAY: '#E6E6E6',
  MEDIUM_GRAY: '#8C8C8C',
  DARK_GRAY: '#444444',
  
  // Background colors
  BACKGROUND: '#FFFFFF',
  CARD_BACKGROUND: '#F9F9F9',
  
  // Text colors
  TEXT: '#222222',
  TEXT_SECONDARY: '#666666',
  
  // Border colors
  BORDER: '#E6E6E6',
};
