import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert, 
  TextInput 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../../apiClient';

export default function AdminRecipesScreen({ navigation }) {
  const [recipes, setRecipes] = useState([]);
  const [filteredRecipes, setFilteredRecipes] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(''); 

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/recipe?page=0&size=9999');

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

  // --- LOGIC TÌM KIẾM ---
  const handleSearch = (text) => {
    setSearchText(text);
    if (text.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = recipes.filter(item => 
        (item.title && item.title.toLowerCase().includes(lowerText)) || 
        (item.user?.username && item.user.username.toLowerCase().includes(lowerText))
      );
      setFilteredRecipes(filtered);
    }
  };

  // --- LOGIC KHÓA / MỞ KHÓA ---
  const handleToggleStatus = (recipe) => {
    // (Giữ nguyên logic khóa/mở khóa như cũ)
    const currentStatus = recipe.isPublic === false ? 'BLOCKED' : 'ACTIVE'; 
    const isBlocked = currentStatus === 'BLOCKED';
    const actionText = isBlocked ? 'MỞ KHÓA' : 'KHÓA';
    const confirmMessage = isBlocked 
        ? `Bạn có muốn kích hoạt lại công thức "${recipe.title}"?` 
        : `Bạn có chắc chắn muốn CHẶN hiển thị công thức "${recipe.title}"?`;

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
              
              const updateList = (list) => list.map(item => {
                if (item.id === recipe.id) {
                    return { 
                        ...item, 
                        status: isBlocked ? 'ACTIVE' : 'BLOCKED',
                        isPublic: !item.isPublic 
                    };
                }
                return item;
              });

              setRecipes(prev => updateList(prev));
              setFilteredRecipes(prev => updateList(prev));

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
    const isBlocked = item.isPublic === false || item.status === 'BLOCKED';
    const displayStatus = isBlocked ? 'BLOCKED' : 'ACTIVE';

    return (
      // 🔹 THAY ĐỔI Ở ĐÂY: Chuyển View thành TouchableOpacity để bấm vào được
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
      >
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

        {/* Nút khóa vẫn hoạt động riêng biệt */}
        <TouchableOpacity 
          onPress={() => handleToggleStatus(item)} 
          style={[styles.actionBtn, !isBlocked ? styles.blockBtn : styles.activeBtn]}
        >
          <Feather name={!isBlocked ? "lock" : "unlock"} size={18} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#888" />
          <TextInput 
            placeholder="Tìm công thức, tác giả..." 
            style={styles.input} 
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
               <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList 
        data={filteredRecipes} 
        renderItem={renderItem} 
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchRecipes}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searchText ? 'Không tìm thấy kết quả nào.' : 'Không có công thức nào.'}
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
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#fff',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  
  searchBox: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f4f6f8', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 40 
  },
  input: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },
  
  list: { padding: 16 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888' },

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
  image: { width: 70, height: 70, borderRadius: 8, marginRight: 12, backgroundColor: '#eee' },
  info: { flex: 1, justifyContent: 'center' },
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
