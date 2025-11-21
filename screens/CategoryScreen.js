import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../apiClient';

export default function CategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, name } = route.params; // Nhận id và tên từ tham số

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Gọi API lấy công thức theo danh mục
    apiClient.get(`/recipes/category/${id}`)
      .then(res => setRecipes(res.data.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('RecipeDetail', { id: item.id })}
    >
      <Image source={{ uri: item.medias?.[0]?.media?.url }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.author}>bởi {item.user?.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{name}</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={recipes}
          numColumns={2}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          ListEmptyComponent={<Text style={styles.empty}>Chưa có công thức nào.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, borderWidth: 1, borderColor: '#f0f0f0' },
  image: { width: '100%', height: 140, backgroundColor: '#eee' },
  info: { padding: 10 },
  title: { fontWeight: '600', fontSize: 14, color: '#333', marginBottom: 4 },
  author: { color: '#777', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 50, color: '#777' },
});