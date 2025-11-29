import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../apiClient';

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  // 1. Fetch Notifications
  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notification/me');
      setNotifications(res.data.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 2. Handle Mark as Read & Navigate
  const handleNotificationPress = async (item) => {
    // Nếu chưa đọc -> Gọi API đánh dấu đã đọc
    if (!item.isRead) {
      try {
        await apiClient.patch(`/notification/mark-as-read/${item.id}`);
        // Cập nhật UI ngay lập tức
        setNotifications(prev => prev.map(n => 
          n.id === item.id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
      }
    }

    // Điều hướng dựa trên loại thông báo 
    if (item.targetId) {
        navigation.navigate('RecipeDetail', { id: item.targetId });
    }
  };

  // 3. Handle Mark All as Read
  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await apiClient.patch('/notification/mark-all-as-read');
      // Cập nhật tất cả thành đã đọc trên UI
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Alert.alert("Thành công", "Đã đánh dấu tất cả là đã đọc.");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể thao tác lúc này.");
    } finally {
      setMarkingAll(false);
    }
  };

  // Helper: Format Time
  const formatTime = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = (now - date) / 1000; 

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  // Render Item
  const renderItem = ({ item }) => {
    // Nếu backend chưa trả về sender, dùng icon mặc định
    const senderAvatar = item.sender?.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, !item.isRead && styles.unreadContainer]} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        {/* Avatar người gửi hoặc Icon hệ thống */}
        <View style={styles.avatarContainer}>
            {senderAvatar ? (
                <Image source={{ uri: senderAvatar }} style={styles.avatar} />
            ) : (
                <View style={styles.iconPlaceholder}>
                    <Feather name="bell" size={20} color="#fff" />
                </View>
            )}
            {/* Loại thông báo icon nhỏ */}
            <View style={styles.typeIconBadge}>
                <Feather name="message-circle" size={10} color="#fff" />
            </View>
        </View>

        {/* Nội dung */}
        <View style={styles.contentContainer}>
            <Text style={[styles.message, !item.isRead && styles.unreadText]}>
                {item.message}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        {/* Chấm xanh nếu chưa đọc */}
        {!item.isRead && <View style={styles.blueDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        
        {/* Nút Đọc tất cả */}
        <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? (
                <ActivityIndicator size="small" color="#007bff" />
            ) : (
                <Feather name="check-square" size={24} color="#007bff" />
            )}
        </TouchableOpacity>
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#f97316" />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
            <Feather name="bell-off" size={60} color="#ddd" />
            <Text style={styles.emptyText}>Bạn không có thông báo nào.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={loading}
          onRefresh={fetchNotifications}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  backBtn: { padding: 4 },

  listContent: { paddingBottom: 20 },

  // Item Styles
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff'
  },
  unreadContainer: {
    backgroundColor: '#f0f9ff' // Xanh rất nhạt cho tin chưa đọc
  },
  
  // Avatar / Icon
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  iconPlaceholder: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: '#ff7e21', // Màu cam chủ đạo
    justifyContent: 'center', alignItems: 'center' 
  },
  typeIconBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#007bff', borderRadius: 10,
    width: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff'
  },

  // Content
  contentContainer: { flex: 1 },
  message: { fontSize: 15, color: '#444', lineHeight: 20 },
  unreadText: { fontWeight: '600', color: '#000' }, // Chữ đậm nếu chưa đọc
  time: { fontSize: 12, color: '#888', marginTop: 4 },

  // Blue Dot Indicator
  blueDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#007bff',
    marginLeft: 8
  },

  // Empty State
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' },
});
