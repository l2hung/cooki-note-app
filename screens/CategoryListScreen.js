import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 
import apiClient from '../apiClient';

export default function CategoryListScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/category')
      .then(res => setCategories(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      // Điều hướng đến CategoryScreen, truyền params id và name
      onPress={() => navigation.navigate('Category', { id: item.id, name: item.name })}
    >
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header giống Web: Back Icon - Title - Placeholder */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Tất cả danh mục</Text>
        <View style={{ width: 26 }} /> 
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={categories}
          numColumns={2}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.columnWrapper} // Gap giữa 2 cột
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f7f8fa' // Giống .category-list-page bg
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header Styles
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    // Web không có border bottom rõ ràng ở header này, nhưng thêm vào cho đẹp
    // background transparent hoặc trắng tùy thích
  },
  backBtn: { 
    padding: 4,
    borderRadius: 20, 
  },
  title: { 
    fontSize: 19, // ~1.2rem
    fontWeight: '600', 
    color: '#333' 
  },

  // Grid Styles
  gridContent: { 
    padding: 20, // padding: 1.25rem
    paddingBottom: 40,
  },
  columnWrapper: { 
    justifyContent: 'space-between', // Đẩy ra 2 bên
    marginBottom: 16, // gap: 1rem
  },

  // Card Styles (Giống .category-card)
  card: { 
    width: '47%', // Chia 2 cột có gap (khoảng 48% hoặc tính toán width - gap)
    backgroundColor: '#fff', 
    borderRadius: 12, 
    paddingVertical: 24, // min-height ~120px
    paddingHorizontal: 16,
    alignItems: 'center', 
    justifyContent: 'center',
    
    // Box Shadow giống CSS box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2, // Android shadow
    
    minHeight: 120, // Giống Web
  },
  name: { 
    fontSize: 16, 
    fontWeight: '500', 
    color: '#333', 
    textAlign: 'center' 
  },
});