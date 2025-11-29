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

  const handleNotificationPress = async (item) => {
    if (!item.isRead) {
      try {
        await apiClient.patch(`/notification/mark-as-read/${item.id}`);
        setNotifications(prev => prev.map(n => 
          n.id === item.id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error("Lỗi đánh dấu đã đọc:", error);
      }
    }

    if (item.targetId) {
        navigation.navigate('RecipeDetail', { id: item.targetId });
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      await apiClient.patch('/notification/mark-all-as-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      Alert.alert("Thành công", "Đã đánh dấu tất cả là đã đọc.");
    } catch (err) {
      Alert.alert("Lỗi", "Không thể thao tác lúc này.");
    } finally {
      setMarkingAll(false);
    }
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    
    // Thêm 'Z' vào cuối nếu chưa có để báo hiệu đây là giờ UTC
    // Giúp điện thoại tự động cộng thêm 7 tiếng (Giờ VN)
    const timeString = iso.endsWith('Z') ? iso : iso + 'Z';
    
    const date = new Date(timeString);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000; // tính ra giây

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`; // Thêm hiển thị ngày
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  const renderItem = ({ item }) => {
    const senderAvatar = item.sender?.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;

    return (
      <TouchableOpacity 
        style={[styles.itemContainer, !item.isRead && styles.unreadContainer]} 
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarContainer}>
            {senderAvatar ? (
                <Image source={{ uri: senderAvatar }} style={styles.avatar} />
            ) : (
                <View style={styles.iconPlaceholder}>
                    <Feather name="bell" size={20} color="#fff" />
                </View>
            )}
            <View style={styles.typeIconBadge}>
                <Feather name="message-circle" size={10} color="#fff" />
            </View>
        </View>

        <View style={styles.contentContainer}>
            <Text style={[styles.message, !item.isRead && styles.unreadText]}>
                {item.message}
            </Text>
            <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>

        {!item.isRead && <View style={styles.blueDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông báo</Text>
        
        <TouchableOpacity onPress={handleMarkAllRead} disabled={markingAll}>
            {markingAll ? (
                <ActivityIndicator size="small" color="#007bff" />
            ) : (
                <Feather name="check-square" size={24} color="#007bff" />
            )}
        </TouchableOpacity>
      </View>

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

  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    backgroundColor: '#fff'
  },
  unreadContainer: {
    backgroundColor: '#f0f9ff' 
  },
  
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eee' },
  iconPlaceholder: { 
    width: 48, height: 48, borderRadius: 24, 
    backgroundColor: '#ff7e21', 
    justifyContent: 'center', alignItems: 'center' 
  },
  typeIconBadge: {
    position: 'absolute', bottom: -2, right: -2,
    backgroundColor: '#007bff', borderRadius: 10,
    width: 18, height: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#fff'
  },

  contentContainer: { flex: 1 },
  message: { fontSize: 15, color: '#444', lineHeight: 20 },
  unreadText: { fontWeight: '600', color: '#000' }, 
  time: { fontSize: 12, color: '#888', marginTop: 4 },

  blueDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#007bff',
    marginLeft: 8
  },

  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#888' },
});
