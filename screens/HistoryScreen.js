import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  StyleSheet, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; // Import Icon
import apiClient from '../apiClient';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await apiClient.get('/recipes/recent-views');
        const data = res.data.data || [];
        
        // Lọc trùng ID giống logic bản Web
        const uniqueRecipes = Array.from(
            new Map(data.map((r) => [r.id, r])).values()
        );
        
        setHistory(uniqueRecipes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.9}
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
    >
      <Image 
        source={{ uri: item.medias?.[0]?.media?.url || 'https://via.placeholder.com/150' }} 
        style={styles.img} 
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.author}>bởi {item.user?.username || 'Ẩn danh'}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Món đã xem gần đây</Text>
        <View style={{ width: 26 }} /> 
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Bạn chưa xem công thức nào gần đây.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },

  // List & Card
  listContent: { padding: 16 },
  card: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    marginBottom: 12, 
    padding: 12,
    borderRadius: 12,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  img: { 
    width: 60, 
    height: 60, 
    borderRadius: 8, 
    marginRight: 16,
    backgroundColor: '#f0f0f0'
  },
  info: { flex: 1, justifyContent: 'center' },
  title: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 4 
  },
  author: { 
    fontSize: 14, 
    color: '#666' 
  },
  
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    color: '#888',
    fontSize: 16
  }
});