import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Animated,
  Dimensions,
  Platform,
  ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather'; // 🔹 Import Icon

const { width, height } = Dimensions.get('window');
const MENU_WIDTH = Math.min(width * 0.8, 300); // Max width 300px giống CSS

export default function ProfileMenu({ visible, onClose, user }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  // Animation slide từ trái sang (-MENU_WIDTH -> 0)
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300, // Khớp với animation: slideIn 0.3s
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -MENU_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['jwt_token', 'user_id']);
    handleClose();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleClose = () => {
    // Slide out trước khi tắt modal
    Animated.timing(slideAnim, {
      toValue: -MENU_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleNavigate = (screen, params = {}) => {
    handleClose();
    navigation.navigate(screen, params);
  };

  if (!visible && !user) return null; // Giữ logic cũ, nhưng Modal cần visible prop để render animation

  // Logic lấy Avatar giống hệt Web
  const displayUser = user || { firstName: "Guest", lastName: "User", username: "guest", medias: [] };
  const avatarLetter = (displayUser.firstName?.[0] || displayUser.username?.[0] || '?').toUpperCase();
  const latestAvatar = displayUser.medias?.slice().reverse().find(m => m.type === 'AVATAR');
  const avatarUrl = latestAvatar ? `${latestAvatar.media.url}?t=${Date.now()}` : null;

  // Component Item con để tái sử dụng
  const MenuItem = ({ icon, label, onPress, isLogout = false, isDivider = false }) => {
    if (isDivider) return <View style={styles.divider} />;
    
    return (
      <TouchableOpacity 
        style={[styles.menuItem, isLogout && styles.menuItemLogout]} 
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Feather 
          name={icon} 
          size={20} 
          color={isLogout ? '#d9534f' : '#555'} 
          style={styles.menuIcon} 
        />
        <Text style={[styles.menuText, isLogout && { color: '#d9534f' }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={handleClose}>
      {/* Overlay (Click ra ngoài để đóng) */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        
        {/* Menu Container (Slide Animation) */}
        <Animated.View 
          style={[
            styles.menuContainer, 
            { transform: [{ translateX: slideAnim }], paddingTop: insets.top + 20 }
          ]}
          onStartShouldSetResponder={() => true} // Ngăn click xuyên qua menu
        >
          {/* 1. User Info Section */}
          <View style={styles.userInfoSection}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.profileAvatarPlaceholder}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            )}
            
            <View style={styles.userDetails}>
              <Text style={styles.userName} numberOfLines={1}>
                {displayUser.firstName} {displayUser.lastName}
              </Text>
              <Text style={styles.userUsername} numberOfLines={1}>@{displayUser.username}</Text>
              <View style={styles.userStats}>
                <Text style={styles.statsText}>
                  {displayUser.followers?.length || 0} Quan tâm · {displayUser.followings?.length || 0} Bạn bếp
                </Text>
              </View>
            </View>
          </View>

          {/* 2. Menu Options (Scrollable) */}
          <ScrollView style={styles.menuOptions} showsVerticalScrollIndicator={false}>
            
            {/* Nhóm 1: Cá nhân */}
            <MenuItem 
              icon="user" 
              label="Bếp Cá Nhân" 
              onPress={() => handleNavigate('Profile', { userId: user?.id || 'me' })} 
            />
            <MenuItem 
              icon="users" 
              label="Các Bạn Bếp" 
              onPress={() => handleNavigate('Friends')} 
            />
            <MenuItem 
              icon="bar-chart-2" 
              label="Thống Kê Bếp" 
              onPress={() => handleNavigate('Stats')} 
            />
            <MenuItem 
              icon="clock" 
              label="Món đã xem gần đây" 
              onPress={() => handleNavigate('History')} 
            />

            <MenuItem isDivider />

            {/* Nhóm 2: Tiện ích */}
            <MenuItem 
              icon="settings" 
              label="Cài Đặt" 
              onPress={() => handleNavigate('Settings')} 
            />
            <MenuItem 
              icon="shopping-cart" 
              label="Danh sách đi chợ" 
              onPress={() => handleNavigate('ShoppingList')} 
            />
            {/* Dùng icon Star hoặc Zap cho AI */}
            <MenuItem 
              icon="star" 
              label="AI Gợi ý món ăn" 
              onPress={() => handleNavigate('AISuggest')} 
            />

            <MenuItem isDivider />

            {/* Nhóm 3: Đăng xuất */}
            <MenuItem 
              icon="log-out" 
              label="Đăng xuất" 
              isLogout 
              onPress={handleLogout} 
            />
            
            {/* Padding bottom để không bị sát đáy trên iPhone X */}
            <View style={{ height: insets.bottom + 20 }} />
          </ScrollView>

        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // .profile-menu-overlay
    justifyContent: 'flex-start',
  },
  menuContainer: {
    width: MENU_WIDTH,
    height: '100%',
    backgroundColor: '#ffffff', // .profile-menu-container
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  
  // User Info Section
  userInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0', // .user-info-section
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  profileAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#eee', // .profile-avatar bg
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#555',
  },
  userDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 17, // ~1.1rem
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 14, // ~0.9rem
    color: '#777',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
  },
  statsText: {
    fontSize: 12, // ~0.85rem
    color: '#555',
  },

  // Menu Options
  menuOptions: {
    flex: 1,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24, // .menu-item padding
  },
  menuItemLogout: {
    // Có thể thêm background màu đỏ nhạt nếu muốn giống hover web: backgroundColor: '#fdf7f7'
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  menuText: {
    fontSize: 16, // ~1rem
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 12,
  },
});