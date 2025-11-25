import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../../apiClient';

export default function AdminUsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [keyword, setKeyword] = useState('');

  const fetchUsers = async (search = '') => {
    try {
      const endpoint = search ? `/admin/user/search?keyword=${search}` : '/admin/user?size=50';
      const res = await apiClient.get(endpoint);
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleStatus = async (user) => {
    const action = user.status === 'ACTIVE' ? 'ban' : 'activate';
    const actionText = user.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa';
    
    Alert.alert('Xác nhận', `Bạn có chắc muốn ${actionText} người dùng này?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            await apiClient.patch(`/admin/user/${user.id}/${action}`);
            fetchUsers(keyword); // Reload
            Alert.alert('Thành công', `Đã ${actionText} thành công`);
          } catch (err) {
            Alert.alert('Lỗi', 'Thao tác thất bại');
          }
        }
      }
    ]);
  };

  const renderItem = ({ item }) => {
    // 1. Fix Logic Avatar: Tìm đúng ảnh có type là AVATAR
    // (Dùng slice().reverse() để ưu tiên ảnh mới nhất nếu có nhiều ảnh avatar)
    const avatarMedia = item.medias?.slice().reverse().find(m => m.type === 'AVATAR');
    const avatarUrl = avatarMedia?.media?.url;
    
    // Avatar chữ cái (Fallback nếu không có ảnh)
    const avatarLetter = (item.firstName?.[0] || item.username?.[0] || '?').toUpperCase();

    return (
      <View style={styles.card}>
        {/* Hiển thị Avatar */}
        {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarLetter}>{avatarLetter}</Text>
            </View>
        )}

        <View style={styles.info}>
          {/* Tên thật */}
          <Text style={styles.name} numberOfLines={1}>
            {item.firstName} {item.lastName}
          </Text>
          
          {/* 2. Thêm Username và User ID */}
          <Text style={styles.username}>
            @{item.username} <Text style={styles.userId}></Text>
          </Text>

          <Text style={styles.email} numberOfLines={1}>{item.email}</Text>

          <View style={[styles.badge, item.status === 'ACTIVE' ? styles.activeBadge : styles.bannedBadge]}>
            <Text style={styles.badgeText}>{item.status}</Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => toggleStatus(item)}
          style={[styles.actionBtn, item.status === 'ACTIVE' ? styles.banBtn : styles.activeBtn]}
        >
          <Feather name={item.status === 'ACTIVE' ? 'slash' : 'check'} size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={24} color="#333" /></TouchableOpacity>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#888" />
          <TextInput 
            placeholder="Tìm người dùng bằng userID..." 
            style={styles.input} 
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => fetchUsers(keyword)}
          />
        </View>
      </View>
      <FlatList
        data={users}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#fff', gap: 12 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f6f8', borderRadius: 8, paddingHorizontal: 12, height: 40 },
  input: { flex: 1, marginLeft: 8 },
  list: { padding: 16 },
  
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, elevation: 1 },
  
  // Avatar Styles
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 20, fontWeight: 'bold', color: '#555' },

  info: { flex: 1 },
  name: { fontWeight: '600', fontSize: 16, color: '#333' },
  
  // Style mới cho Username & ID
  username: { fontSize: 13, color: '#007bff', fontWeight: '500', marginBottom: 2 },
  userId: { color: '#888', fontSize: 12 },

  email: { fontSize: 12, color: '#666', marginBottom: 6 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  activeBadge: { backgroundColor: '#dcfce7' }, bannedBadge: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  banBtn: { backgroundColor: '#ef4444' }, activeBtn: { backgroundColor: '#10b981' }
});