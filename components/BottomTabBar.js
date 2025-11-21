import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BottomTabBar({ state, navigation }) {

  const insets = useSafeAreaInsets();

  // Mỗi tab pop về màn hình gốc của stack tương ứng
  const defaultScreens = {
    HomeTab: 'Home',
    SearchTab: 'Search',
    LikedTab: 'Liked',
  };

  const tabs = [
    { name: 'HomeTab', icon: 'home', label: 'Trang chủ' },
    { name: 'SearchTab', icon: 'search', label: 'Tìm kiếm' },
    { name: 'LikedTab', icon: 'book', label: 'Đã lưu' },
  ];

  return (
    <View style={[
      styles.container, 
      { paddingBottom: insets.bottom > 0 ? insets.bottom : 15 }
    ]}>

      {tabs.map((tab, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: tab.name,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigation.navigate(tab.name, {
              screen: defaultScreens[tab.name],  // ⭐ QUAN TRỌNG: quay về màn chính
            });
          }
        };

        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.item}
            onPress={onPress}
            activeOpacity={0.7}
          >
            <Feather
              name={tab.icon}
              size={24}
              color={isFocused ? '#007bff' : '#888'}
              style={{ marginBottom: 4 }}
            />
            <Text style={[styles.label, isFocused && styles.activeLabel]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,

    borderTopWidth: 1,
    borderColor: '#e2e4e8',

    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  item: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  label: { 
    fontSize: 11, 
    color: '#888',
    fontWeight: '500' 
  },
  activeLabel: { 
    color: '#007bff',
    fontWeight: '600' 
  },
});
