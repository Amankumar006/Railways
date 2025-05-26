import { Platform, Alert } from 'react-native';

export interface ErrorOptions {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

/**
 * Enhanced error handling utility that works across platforms
 */
export class ErrorHandler {
  /**
   * Show an error message with proper platform handling
   */
  static showError(options: ErrorOptions) {
    const {
      title = 'Error',
      message,
      onConfirm,
      onCancel,
      confirmText = 'OK',
      cancelText = 'Cancel'
    } = options;

    if (Platform.OS === 'web') {
      // For web, use browser confirm/alert
      if (onCancel) {
        const result = window.confirm(`${title}\n\n${message}`);
        if (result && onConfirm) {
          onConfirm();
        } else if (!result && onCancel) {
          onCancel();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
        if (onConfirm) onConfirm();
      }
    } else {
      // For mobile, use React Native Alert
      const buttons = [];
      
      if (onCancel) {
        buttons.push({
          text: cancelText,
          style: 'cancel' as const,
          onPress: onCancel
        });
      }
      
      buttons.push({
        text: confirmText,
        onPress: onConfirm
      });

      Alert.alert(title, message, buttons);
    }
  }

  /**
   * Show a success message
   */
  static showSuccess(message: string, onConfirm?: () => void) {
    this.showError({
      title: 'Success',
      message,
      type: 'success',
      onConfirm
    });
  }

  /**
   * Show a warning message
   */
  static showWarning(message: string, onConfirm?: () => void) {
    this.showError({
      title: 'Warning',
      message,
      type: 'warning',
      onConfirm
    });
  }

  /**
   * Show an info message
   */
  static showInfo(message: string, onConfirm?: () => void) {
    this.showError({
      title: 'Information',
      message,
      type: 'info',
      onConfirm
    });
  }

  /**
   * Show a confirmation dialog
   */
  static showConfirmation(
    message: string,
    onConfirm: () => void,
    onCancel?: () => void,
    title = 'Confirm'
  ) {
    this.showError({
      title,
      message,
      onConfirm,
      onCancel,
      confirmText: 'Yes',
      cancelText: 'No'
    });
  }

  /**
   * Log error to console in development, show user-friendly message in production
   */
  static handleError(error: any, userMessage?: string) {
    if (__DEV__) {
      console.error('Error details:', error);
    }
    
    const message = userMessage || 'An unexpected error occurred. Please try again.';
    this.showError({ message });
  }
}

// Convenience exports
export const showError = ErrorHandler.showError;
export const showSuccess = ErrorHandler.showSuccess;
export const showWarning = ErrorHandler.showWarning;
export const showInfo = ErrorHandler.showInfo;
export const showConfirmation = ErrorHandler.showConfirmation;
export const handleError = ErrorHandler.handleError; 