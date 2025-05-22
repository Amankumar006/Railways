import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StyledText } from './StyledText';
import { useTheme } from '@/hooks/useTheme';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

interface TabBarProps {
  tabs: {
    key: string;
    label: string;
    icon: React.ReactNode;
    activeIcon: React.ReactNode;
  }[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

export function TabBar({ tabs, activeTab, onTabPress }: TabBarProps) {
  const { colors, theme } = useTheme();
  const windowWidth = Dimensions.get('window').width;
  const tabWidth = windowWidth / tabs.length;
  
  // Calculate the position of the active indicator
  const activeIndex = tabs.findIndex(tab => tab.key === activeTab);
  
  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: withTiming(activeIndex * tabWidth, {
            duration: 250,
          }),
        },
      ],
    };
  });
  
  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <Animated.View 
        style={[
          styles.activeIndicator, 
          { 
            width: tabWidth,
            backgroundColor: theme.brand.primary,
          },
          indicatorStyle,
        ]} 
      />
      
      {tabs.map(tab => {
        const isActive = tab.key === activeTab;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={styles.tabContent}>
              {isActive ? tab.activeIcon : tab.icon}
              <StyledText
                size="xs"
                weight={isActive ? 'semibold' : 'regular'}
                color={isActive ? theme.brand.primary : colors.textSecondary}
                style={styles.tabLabel}
              >
                {tab.label}
              </StyledText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 60,
    borderTopWidth: 1,
    position: 'relative',
  },
  activeIndicator: {
    height: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  tab: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    marginTop: 4,
  },
});

export default TabBar;
