import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Keyboard 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import apiClient from '../../apiClient';

export default function AdminCategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  
  const [categoryName, setCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null); 
  
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [showInput, setShowInput] = useState(false);

  // --- FETCH CATEGORIES ---
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/category');
      const data = res.data.data || [];
      const sortedData = data.sort((a, b) => (a.isDeleted === b.isDeleted ? 0 : a.isDeleted ? 1 : -1));
      setCategories(sortedData);
      setFilteredCategories(sortedData);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // --- SEARCH ---
  const handleSearch = (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setFilteredCategories(categories);
    } else {
      const lowerText = text.toLowerCase();
      const filtered = categories.filter(item => item.name && item.name.toLowerCase().includes(lowerText));
      setFilteredCategories(filtered);
    }
  };

  // --- SUBMIT ADD/EDIT ---
  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }

    Keyboard.dismiss();
    setLoading(true);

    try {
      if (editingId) {
        // EDIT
        await apiClient.patch(`/admin/category/${editingId}`, { name: categoryName });
        const updatedList = categories.map(item => item.id === editingId ? { ...item, name: categoryName } : item);
        setCategories(updatedList);
        setFilteredCategories(updatedList);
        Alert.alert('Thành công', 'Cập nhật danh mục thành công');
      } else {
        // ADD
        const res = await apiClient.post('/admin/category', { name: categoryName });
        const newCat = res.data.data; 
        if (newCat) {
          const newList = [newCat, ...categories];
          setCategories(newList);
          setFilteredCategories(newList);
        }
        Alert.alert('Thành công', 'Thêm danh mục mới thành công');
      }

      setCategoryName('');
      setEditingId(null);
      setShowInput(false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Thao tác thất bại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  // --- DELETE / RESTORE ---
  const handleToggleStatus = (item) => {
    const isDeleted = item.isDeleted;
    const actionText = isDeleted ? 'KHÔI PHỤC' : 'XÓA';
    const confirmMsg = isDeleted 
      ? `Bạn có muốn khôi phục danh mục "${item.name}"?`
      : `Bạn có chắc chắn muốn xóa danh mục "${item.name}"?`;

    Alert.alert(
      `Xác nhận ${actionText}`,
      confirmMsg,
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Đồng ý',
          style: isDeleted ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (isDeleted) {
                await apiClient.patch(`/admin/category/${item.id}/restore`);
              } else {
                await apiClient.delete(`/admin/category/${item.id}`);
              }

              const updateList = list => list
                .map(cat => cat.id === item.id ? { ...cat, isDeleted: !isDeleted } : cat)
                .sort((a, b) => (a.isDeleted === b.isDeleted ? 0 : a.isDeleted ? 1 : -1));

              setCategories(prev => updateList(prev));
              setFilteredCategories(prev => updateList(prev));

              Alert.alert('Thành công', `Đã ${actionText.toLowerCase()} danh mục.`);
            } catch (err) {
              const msg = err.response?.data?.message || 'Thao tác thất bại';
              Alert.alert('Lỗi', msg);
            }
          }
        }
      ]
    );
  };

  // --- UI HANDLERS ---
  const handleAddPress = () => {
    setCategoryName('');
    setEditingId(null);
    setShowInput(true);
  };

  const handleEdit = (item) => {
    setCategoryName(item.name);
    setEditingId(item.id);
    setShowInput(true);
  };

  const handleCancelInput = () => {
    setCategoryName('');
    setEditingId(null);
    setShowInput(false);
    Keyboard.dismiss();
  };

  // --- RENDER ITEM ---
  const renderItem = ({ item }) => {
    const isDeleted = item.isDeleted;

    return (
      <TouchableOpacity 
        style={[styles.item, isDeleted && styles.itemDeleted]}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Main', {
          screen: 'HomeTab',
          params: {
            screen: 'Category',
            params: { id: item.id, name: item.name },
          },
        })}
      >
        <View style={styles.info}>
          <Text style={[styles.name, isDeleted && styles.textDeleted]}>
            {item.name}
          </Text>
          {isDeleted && <Text style={styles.deletedBadge}>Đã khóa</Text>}
        </View>

        <View style={styles.actions}>
          {!isDeleted && (
            <TouchableOpacity onPress={() => handleEdit(item)} style={[styles.iconBtn, styles.editBtn]}>
              <Feather name="edit-2" size={18} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => handleToggleStatus(item)} style={[styles.iconBtn, isDeleted ? styles.restoreBtn : styles.deleteBtn]}>
            <Feather name={isDeleted ? "unlock" : "lock"} size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Feather name="search" size={18} color="#888" />
          <TextInput 
            placeholder="Tìm danh mục..." 
            style={styles.searchInput} 
            value={searchText}
            onChangeText={handleSearch}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Feather name="x" size={18} color="#888" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={handleAddPress}>
          <Feather name="plus-circle" size={28} color="#007bff" />
        </TouchableOpacity>
      </View>

      {/* FORM INPUT */}
      {showInput && (
        <View style={styles.inputContainer}>
          <TextInput 
            style={[styles.input, editingId && styles.inputEditing]} 
            placeholder={editingId ? "Sửa tên danh mục..." : "Tên danh mục mới..."} 
            value={categoryName}
            onChangeText={setCategoryName}
            autoFocus
          />

          <TouchableOpacity 
            style={[styles.submitBtn, editingId ? styles.updateBtn : styles.addBtn]} 
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Feather name={editingId ? "check" : "plus"} size={24} color="#fff" />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelInput}>
            <Feather name="x" size={24} color="#555" />
          </TouchableOpacity>
        </View>
      )}

      {/* LIST */}
      <FlatList 
        data={filteredCategories}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchCategories}
        ListEmptyComponent={<Text style={styles.emptyText}>{searchText ? 'Không tìm thấy danh mục nào.' : 'Chưa có danh mục.'}</Text>}
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
    borderBottomWidth: 1, 
    borderColor: '#eee',
    gap: 12
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
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#333' },

  inputContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 10, 
    alignItems: 'center', 
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#f0f0f0'
  },
  input: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#ddd' },
  inputEditing: { borderColor: '#007bff', backgroundColor: '#f0f7ff' },

  submitBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: '#10b981' },
  updateBtn: { backgroundColor: '#007bff' },
  cancelBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e0e0' },

  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  emptyText: { textAlign: 'center', marginTop: 30, color: '#888' },

  item: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, elevation: 1 },
  itemDeleted: { backgroundColor: '#f0f0f0', opacity: 0.8 },

  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500', color: '#333' },
  textDeleted: { color: '#999', textDecorationLine: 'line-through' },
  deletedBadge: { fontSize: 11, color: '#ef4444', marginTop: 2, fontWeight: 'bold' },

  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  editBtn: { backgroundColor: '#007bff' },
  deleteBtn: { backgroundColor: '#ef4444' }, 
  restoreBtn: { backgroundColor: '#f59e0b' }, 
});
