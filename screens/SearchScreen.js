import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; // 🔹 Import Icon
import apiClient from '../apiClient';

export default function SearchScreen() {
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('recipe'); // 'recipe' | 'user'
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Logic tìm kiếm (Debounce 500ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const endpoint = type === 'recipe'
          ? `/recipes/search?keyword=${encodeURIComponent(query)}`
          : `/users/search?keyword=${encodeURIComponent(query)}`;
        
        const res = await apiClient.get(endpoint);
        setResults(res.data.data || []);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, type]);

  const toggleType = () => {
    setType(type === 'recipe' ? 'user' : 'recipe');
    setResults([]); // Reset kết quả khi chuyển tab
  };

  // Card hiển thị Công thức
  const renderRecipeItem = (item) => (
    <TouchableOpacity 
      style={styles.resultCard} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
    >
      <Image 
        source={{ uri: item.medias?.[0]?.media?.url || 'https://via.placeholder.com/300' }} 
        style={styles.cardImage} 
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.cardSubtext}>bởi {item.user?.username || 'Ẩn danh'}</Text>
      </View>
    </TouchableOpacity>
  );
 
  // Card hiển thị Người dùng
  const renderUserItem = (item) => {
    const avatar = item.medias?.slice().reverse().find(m => m.type === 'AVATAR')?.media?.url;
    return (
      <TouchableOpacity 
        style={styles.resultCard} 
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Profile', { userId: item.id })}
      >
        <Image 
          source={{ uri: avatar || 'https://via.placeholder.com/150' }} 
          style={styles.cardImage} 
        />
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>@{item.username}</Text>
          <Text style={styles.cardSubtext}>{item.firstName} {item.lastName}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      
      {/* HEADER: Back Btn + Search Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Feather name="arrow-left" size={26} color="#555" />
        </TouchableOpacity>

        <View style={styles.searchBar}>
          <Feather name="search" size={20} color="#94a3b8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.input}
            placeholder={type === 'recipe' ? "Gõ vào tên các nguyên liệu..." : "Gõ vào tên bạn bếp..."}
            placeholderTextColor="#94a3b8"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      </View>

      {/* NÚT CHUYỂN ĐỔI LOẠI TÌM KIẾM */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity style={styles.toggleButton} onPress={toggleType} activeOpacity={0.8}>
          <Feather name="user" size={20} color="#475569" style={{ marginRight: 8 }} />
          <Text style={styles.toggleText}>
            {type === 'recipe' ? 'Tìm bạn bếp' : 'Tìm công thức'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* KẾT QUẢ TÌM KIẾM */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Đang tìm kiếm...</Text>
        </View>
      ) : results.length === 0 && query.trim() ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Không tìm thấy kết quả nào.</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => type === 'recipe' ? renderRecipeItem(item) : renderUserItem(item)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  // --- HEADER ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  iconButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30, 
    paddingHorizontal: 16,
    height: 46,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    // Shadow nhẹ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 0, 
  },

  // --- TOGGLE BUTTON ---
  toggleContainer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },

  // --- RESULT LIST ---
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 16,
    // Shadow Card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardImage: {
    width: 68,  // Giống CSS .result-card img
    height: 68,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17, // ~1.12rem
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardSubtext: {
    fontSize: 14, // ~0.92rem
    color: '#64748b',
  },

  // --- EMPTY & LOADING ---
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
  },
});