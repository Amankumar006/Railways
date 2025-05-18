import React from 'react';
import { StyleSheet, View, TouchableOpacity, useColorScheme } from 'react-native';
import { StyledText } from './themed/StyledText';
import { Notification } from '@/types';
import { Bell, Calendar, Megaphone, Clock } from 'lucide-react-native';
import { colors, colorScheme } from '@/constants/Colors';
import Animated, { FadeIn } from 'react-native-reanimated';

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
}

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const theme = useColorScheme() ?? 'light';
  const themeColors = colorScheme[theme];
  
  // Format timestamp to readable format
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + 
           ', ' + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
  
  // Get icon based on notification type
  const getIcon = () => {
    const iconColor = getIconColor();
    const iconSize = 20;
    
    switch (notification.type) {
      case 'schedule':
        return <Calendar size={iconSize} color={iconColor} />;
      case 'assignment':
        return <Calendar size={iconSize} color={iconColor} />;
      case 'reminder':
        return <Clock size={iconSize} color={iconColor} />;
      case 'system':
        return <Megaphone size={iconSize} color={iconColor} />;
      default:
        return <Bell size={iconSize} color={iconColor} />;
    }
  };
  
  // Get color based on notification type
  const getIconColor = () => {
    switch (notification.type) {
      case 'schedule':
        return colors.primary[500];
      case 'assignment':
        return colors.secondary[500];
      case 'reminder':
        return colors.warning[500];
      case 'system':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };
  
  return (
    <Animated.View entering={FadeIn.duration(300)}>
      <TouchableOpacity
        style={[
          styles.container,
          {
            backgroundColor: notification.read 
              ? 'transparent' 
              : theme === 'dark' 
                ? colors.primary[900] + '30'
                : colors.primary[50] + '80',
          },
        ]}
        onPress={() => onPress(notification)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
          {getIcon()}
        </View>
        
        <View style={styles.contentContainer}>
          <StyledText weight="medium" size="md" numberOfLines={1}>
            {notification.title}
          </StyledText>
          
          <StyledText 
            size="sm" 
            color={themeColors.textSecondary} 
            numberOfLines={2}
            style={styles.message}
          >
            {notification.message}
          </StyledText>
          
          <StyledText 
            size="xs" 
            color={themeColors.textSecondary}
            style={styles.timestamp}
          >
            {formatTimestamp(notification.timestamp)}
          </StyledText>
        </View>
        
        {!notification.read && (
          <View style={[styles.unreadIndicator, { backgroundColor: colors.primary[500] }]} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    marginTop: 4,
  },
  timestamp: {
    marginTop: 6,
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
});