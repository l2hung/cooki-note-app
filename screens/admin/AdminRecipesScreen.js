import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../../apiClient';

export default function AdminRecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/recipe');
      setRecipes(res.data.data || []);
    } catch (err) { 
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipes(); }, []);

  const handleBlock = (recipe) => {
    // 1. Xác định trạng thái hiện tại (Mặc định null là ACTIVE)
    const currentStatus = recipe.status || 'ACTIVE';
    const isBlocked = currentStatus === 'BLOCKED'; // Hoặc trạng thái server trả về (ví dụ: BANNED)
    
    const actionText = isBlocked ? 'MỞ KHÓA' : 'KHÓA';
    
    Alert.alert(
      `Xác nhận ${actionText}`, 
      `Bạn có chắc chắn muốn ${actionText} công thức "${recipe.title}"?`, 
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          style: isBlocked ? 'default' : 'destructive', 
          onPress: async () => {
            try {
              // 2. Gọi API Backend
              await apiClient.patch(`/admin/recipe/${recipe.id}/block`);
              
              // 3. QUAN TRỌNG: Cập nhật giao diện NGAY LẬP TỨC (Không gọi fetchRecipes lại)
              setRecipes(prevList => prevList.map(item => {
                if (item.id === recipe.id) {
                    // Đảo ngược trạng thái hiện tại
                    const newStatus = isBlocked ? 'ACTIVE' : 'BLOCKED';
                    return { ...item, status: newStatus };
                }
                return item;
              }));

              Alert.alert('Thành công', `Đã ${actionText} thành công.`);
            } catch(err) { 
              Alert.alert('Lỗi', 'Thao tác thất bại. Vui lòng thử lại.'); 
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const recipeImage = item.medias?.[0]?.media?.url;
    
    // Xử lý hiển thị trạng thái
    const currentStatus = item.status || 'ACTIVE';
    const isActive = currentStatus === 'ACTIVE';

    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: recipeImage || 'https://via.placeholder.com/80' }} 
          style={styles.image} 
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.author}>Bởi: {item.user?.username || 'Ẩn danh'}</Text>
          
          {/* Badge hiển thị trạng thái */}
          <View style={[styles.badge, isActive ? styles.activeBadge : styles.blockedBadge]}>
            <Text style={[styles.badgeText, isActive ? styles.activeText : styles.blockedText]}>
              {currentStatus}
            </Text>
          </View>
        </View>

        {/* Nút Hành động: Đỏ (Khóa) / Xanh (Mở) */}
        <TouchableOpacity 
          onPress={() => handleBlock(item)} 
          style={[styles.actionBtn, isActive ? styles.blockBtn : styles.activeBtn]}
        >
          {/* Icon: Lock (để khóa) / Unlock (để mở) */}
          <Feather 
            name={isActive ? "lock" : "unlock"} 
            size={18} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Công thức</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList 
        data={recipes} 
        renderItem={renderItem} 
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchRecipes}
        ListEmptyComponent={
            <Text style={{textAlign: 'center', marginTop: 20, color: '#888'}}>
                Không có công thức nào.
            </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  
  list: { padding: 16 },

  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 12, 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  image: { 
    width: 60, 
    height: 60, 
    borderRadius: 8, 
    marginRight: 12, 
    backgroundColor: '#eee' 
  },
  info: { flex: 1 },
  title: { 
    fontWeight: '600', 
    fontSize: 15, 
    color: '#333', 
    marginBottom: 4 
  },
  author: { color: '#666', fontSize: 12, marginBottom: 4 },
  
  // Badge Styles
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 4, 
    alignSelf: 'flex-start' 
  },
  activeBadge: { backgroundColor: '#dcfce7' }, 
  blockedBadge: { backgroundColor: '#fee2e2' }, 
  
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  activeText: { color: '#166534' }, 
  blockedText: { color: '#991b1b' }, 

  // Button Styles
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginLeft: 8 
  },
  blockBtn: { backgroundColor: '#ef4444' }, 
  activeBtn: { backgroundColor: '#10b981' }, 
});