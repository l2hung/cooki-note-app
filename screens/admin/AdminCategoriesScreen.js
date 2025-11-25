import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../../apiClient';

export default function AdminCategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [newCat, setNewCat] = useState('');

  const fetchCats = async () => {
    const res = await apiClient.get('/category');
    setCategories(res.data.data || []);
  };

  useEffect(() => { fetchCats(); }, []);

  const handleAdd = async () => {
    if (!newCat.trim()) return;
    try {
      await apiClient.post('/admin/category', { name: newCat });
      setNewCat('');
      fetchCats();
      Alert.alert('Thành công', 'Đã thêm danh mục');
    } catch (err) { Alert.alert('Lỗi', err.response?.data?.message || 'Lỗi'); }
  };

  const handleDelete = (id) => {
    Alert.alert('Xóa', 'Bạn chắc chắn?', [
      { text: 'Hủy' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
          try {
            await apiClient.delete(`/admin/category/${id}`);
            fetchCats();
          } catch (err) { Alert.alert('Lỗi', 'Không thể xóa danh mục đang dùng'); }
      }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Feather name="arrow-left" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.title}>Quản lý Danh mục</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Tên danh mục mới..." 
          value={newCat}
          onChangeText={setNewCat}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList 
        data={categories}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.name}</Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Feather name="trash-2" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: 'bold' },
  inputContainer: { flexDirection: 'row', padding: 16, gap: 10 },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ddd' },
  addBtn: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16 },
  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 8 }
});