import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../../apiClient';

export default function AdminRecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/recipe');
      const data = res.data.data || [];
      setRecipes(data);
      setFilteredRecipes(data); 
    } catch (err) { 
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecipes(); }, []);


  useEffect(() => {
    const lower = searchText.toLowerCase();

    const filtered = recipes.filter(item => {
      const title = item.title?.toLowerCase() || "";
      const username = item.user?.username?.toLowerCase() || "";
      return title.includes(lower) || username.includes(lower);
    });

    setFilteredRecipes(filtered);
  }, [searchText, recipes]);


  // --- LOGIC KHÓA / MỞ KHÓA ---
  const handleToggleStatus = (recipe) => {
    const currentStatus = recipe.isPublic === false ? 'BLOCKED' : 'ACTIVE';
    const isBlocked = currentStatus === 'BLOCKED';
    
    const actionText = isBlocked ? 'MỞ KHÓA' : 'KHÓA';
    const confirmMessage = isBlocked 
        ? `Bạn có muốn kích hoạt lại công thức "${recipe.title}"?` 
        : `Bạn có chắc chắn muốn khóa công thức "${recipe.title}"?`;

    Alert.alert(
      `Xác nhận ${actionText}`, 
      confirmMessage,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý', 
          style: isBlocked ? 'default' : 'destructive', 
          onPress: async () => {
            try {
              if (isBlocked) {
                  await apiClient.patch(`/admin/recipe/${recipe.id}/unblock`);
              } else {
                  await apiClient.patch(`/admin/recipe/${recipe.id}/block`);
              }
              
              // Cập nhật UI
              setRecipes(prev => prev.map(item => {
                if (item.id === recipe.id) {
                    return { 
                        ...item, 
                        status: isBlocked ? 'ACTIVE' : 'BLOCKED',
                        isPublic: !item.isPublic 
                    };
                }
                return item;
              }));

              Alert.alert('Thành công', `Đã ${actionText} thành công.`);
            } catch(err) { 
              console.log(err);
              Alert.alert('Lỗi', 'Thao tác thất bại. Vui lòng thử lại.'); 
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => {
    const recipeImage = item.medias?.[0]?.media?.url;
    const isBlocked = item.isPublic === false || item.status === 'BLOCKED';
    const displayStatus = isBlocked ? 'BLOCKED' : 'ACTIVE';

    return (
      <View style={styles.card}>
        <Image 
          source={{ uri: recipeImage || 'https://via.placeholder.com/80' }} 
          style={styles.image} 
        />

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          
          <View style={styles.authorRow}>
            <Feather name="user" size={12} color="#666" />
            <Text style={styles.author}> {item.user?.username || 'Ẩn danh'}</Text>
          </View>

          <View style={[styles.badge, !isBlocked ? styles.activeBadge : styles.blockedBadge]}>
            <Text style={[styles.badgeText, !isBlocked ? styles.activeText : styles.blockedText]}>
              {displayStatus}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => handleToggleStatus(item)} 
          style={[styles.actionBtn, !isBlocked ? styles.blockBtn : styles.activeBtn]}
        >
          <Feather 
            name={!isBlocked ? "lock" : "unlock"} 
            size={18} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý Công thức</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 🔍 SEARCH BAR */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={18} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm công thức..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {/* LIST */}
      <FlatList 
        data={filteredRecipes}
        renderItem={renderItem} 
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchRecipes}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Không có công thức nào.</Text>
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

  // 🔍 SEARCH
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 12,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd'
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 15
  },

  list: { padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888' },

  card: { 
    flexDirection: 'row', 
    backgroundColor: '#fff', 
    padding: 12, 
    borderRadius: 12, 
    marginBottom: 12, 
    alignItems: 'center',
    elevation: 2,
  },
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  info: { flex: 1 },

  title: { fontWeight: '600', fontSize: 15, color: '#333', marginBottom: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  author: { color: '#666', fontSize: 12 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' },
  activeBadge: { backgroundColor: '#dcfce7' }, 
  blockedBadge: { backgroundColor: '#fee2e2' }, 
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  activeText: { color: '#166534' }, 
  blockedText: { color: '#991b1b' }, 

  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginLeft: 8 },
  blockBtn: { backgroundColor: '#ef4444' },
  activeBtn: { backgroundColor: '#10b981' },
});
