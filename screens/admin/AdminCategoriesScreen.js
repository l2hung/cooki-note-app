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
  const [categoryName, setCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null); 
  const [loading, setLoading] = useState(true);

  // 1. Lấy danh sách tất cả danh mục (bao gồm đã xóa)
  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Gọi API dành cho Admin
      const res = await apiClient.get('/admin/category');
      
      // Sắp xếp: Danh mục đang hoạt động lên trên, đã xóa xuống dưới
      const data = res.data.data || [];
      const sortedData = data.sort((a, b) => {
          if (a.isDeleted === b.isDeleted) return 0;
          return a.isDeleted ? 1 : -1;
      });
      
      setCategories(sortedData);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải danh sách danh mục');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  // 2. Xử lý Thêm / Sửa
  const handleSubmit = async () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return;
    }
    
    Keyboard.dismiss();
    setLoading(true);

    try {
      if (editingId) {
        // Cập nhật
        await apiClient.patch(`/admin/category/${editingId}`, { name: categoryName });
        
        // Cập nhật UI
        setCategories(prev => prev.map(item => 
            item.id === editingId ? { ...item, name: categoryName } : item
        ));
        Alert.alert('Thành công', 'Cập nhật danh mục thành công');
      } else {
        // Thêm mới
        const res = await apiClient.post('/admin/category', { name: categoryName });
        
        // Thêm vào đầu danh sách
        const newCat = res.data.data; 
        if (newCat) setCategories(prev => [newCat, ...prev]);
        
        Alert.alert('Thành công', 'Thêm danh mục mới thành công');
      }
      
      setCategoryName('');
      setEditingId(null);
    } catch (err) {
      const msg = err.response?.data?.message || 'Thao tác thất bại';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. LOGIC QUAN TRỌNG: XÓA HOẶC KHÔI PHỤC
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
                  // API Khôi phục
                  await apiClient.patch(`/admin/category/${item.id}/restore`);
              } else {
                  // API Xóa
                  await apiClient.delete(`/admin/category/${item.id}`);
              }
              
              // Cập nhật UI ngay lập tức (Optimistic Update)
              setCategories(prev => prev.map(cat => {
                  if (cat.id === item.id) {
                      // Đảo ngược trạng thái isDeleted
                      return { ...cat, isDeleted: !isDeleted };
                  }
                  return cat;
              }));

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

  const handleEdit = (item) => {
    setCategoryName(item.name);
    setEditingId(item.id);
  };

  const handleCancelEdit = () => {
    setCategoryName('');
    setEditingId(null);
    Keyboard.dismiss();
  };

  const renderItem = ({ item }) => {
  const isDeleted = item.isDeleted;

  return (
    <View style={[styles.item, isDeleted && styles.itemDeleted]}>
      <View style={styles.info}>
          <Text style={[styles.name, isDeleted && styles.textDeleted]}>
              {item.name}
          </Text>
          {isDeleted && <Text style={styles.deletedBadge}>Đã khóa</Text>}
      </View>
      
      <View style={styles.actions}>
        {/* Chỉ cho sửa khi chưa bị khóa */}
        {!isDeleted && (
            <TouchableOpacity 
              onPress={() => handleEdit(item)} 
              style={[styles.iconBtn, styles.editBtn]}
            >
              <Feather name="edit-2" size={18} color="#fff" />
            </TouchableOpacity>
        )}

        {/* Nút toggle trạng thái: lock = khóa, unlock = khôi phục */}
        <TouchableOpacity 
          onPress={() => handleToggleStatus(item)} 
          style={[styles.iconBtn, isDeleted ? styles.restoreBtn : styles.deleteBtn]}
        >
          <Feather 
            name={isDeleted ? "unlock" : "lock"} 
            size={18} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};


  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý Danh mục</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Form Nhập liệu */}
      <View style={styles.inputContainer}>
        <TextInput 
          style={[styles.input, editingId && styles.inputEditing]} 
          placeholder={editingId ? "Sửa tên danh mục..." : "Tên danh mục mới..."} 
          value={categoryName}
          onChangeText={setCategoryName}
        />
        
        <TouchableOpacity 
            style={[styles.submitBtn, editingId ? styles.updateBtn : styles.addBtn]} 
            onPress={handleSubmit}
            disabled={loading}
        >
          {loading ? (
              <ActivityIndicator color="#fff" size="small" />
          ) : (
              <Feather name={editingId ? "check" : "plus"} size={24} color="#fff" />
          )}
        </TouchableOpacity>

        {editingId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Feather name="x" size={24} color="#555" />
            </TouchableOpacity>
        )}
      </View>

      <FlatList 
        data={categories}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={fetchCategories}
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
    borderColor: '#eee' 
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  
  inputContainer: { 
    flexDirection: 'row', 
    padding: 16, 
    gap: 10, 
    alignItems: 'center', 
    backgroundColor: '#f4f6f8' 
  },
  input: { 
    flex: 1, 
    backgroundColor: '#fff', 
    borderRadius: 8, 
    paddingHorizontal: 12, 
    height: 44, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  inputEditing: { borderColor: '#007bff', backgroundColor: '#f0f7ff' },
  
  submitBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  addBtn: { backgroundColor: '#10b981' }, // Xanh lá
  updateBtn: { backgroundColor: '#007bff' }, // Xanh dương
  cancelBtn: { width: 44, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0e0e0' },

  list: { paddingHorizontal: 16, paddingBottom: 20 },
  
  // Item Styles
  item: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8, 
    elevation: 1 
  },
  itemDeleted: { backgroundColor: '#f0f0f0' }, // Màu xám khi đã khóa
  
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500', color: '#333' },
  textDeleted: { color: '#999', textDecorationLine: 'line-through' },
  deletedBadge: { fontSize: 11, color: '#ef4444', marginTop: 2, fontWeight: 'bold' },

  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  editBtn: { backgroundColor: '#007bff' },
  deleteBtn: { backgroundColor: '#ef4444' }, // Đỏ
  restoreBtn: { backgroundColor: '#f59e0b' }, // Vàng cam
});
