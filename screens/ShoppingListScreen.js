import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; 
import apiClient from '../apiClient';

export default function ShoppingListScreen() {
  const navigation = useNavigation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = async () => {
    try {
      const res = await apiClient.get('/shopping-list/me');
      setLists(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // --- HANDLERS ---

  const handleDeleteList = async (listId) => {
    Alert.alert(
        'Xác nhận xóa',
        'Bạn có chắc muốn xóa danh sách này?',
        [
            { text: 'Hủy', style: 'cancel' },
            { 
                text: 'Xóa', 
                style: 'destructive',
                onPress: async () => {
                    // Optimistic UI update
                    const prevLists = [...lists];
                    setLists(lists.filter(l => l.id !== listId));
                    
                    try {
                        await apiClient.delete(`/shopping-list/${listId}`);
                    } catch (err) {
                        setLists(prevLists); // Rollback
                        Alert.alert('Lỗi', 'Không thể xóa danh sách');
                    }
                }
            }
        ]
    );
  };

  const handleToggleItem = async (item, listId) => {
    const newCheckedState = !item.purchased;

    // 1. Optimistic UI Update
    setLists(currentLists => 
        currentLists.map(list => {
            if (list.id === listId) {
                return {
                    ...list,
                    items: list.items.map(i => 
                        i.ingredient.id === item.ingredient.id 
                        ? { ...i, purchased: newCheckedState } 
                        : i
                    )
                };
            }
            return list;
        })
    );

    // 2. Call API
    try {
        const payload = {
            shoppingList: { id: listId },
            ingredient: { id: item.ingredient.id },
            quantity: item.quantity,
            unit: item.unit,
            purchased: newCheckedState
        };
        await apiClient.patch('/shopping-items', payload);
    } catch (err) {
        console.error("Update error:", err);
        // Nếu lỗi thì load lại data để đồng bộ
        fetchLists();
        Alert.alert('Lỗi', 'Cập nhật thất bại');
    }
  };

  // --- RENDER ITEM ---
  const renderShoppingList = ({ item: list }) => {
    const pendingItems = list.items.filter(i => !i.purchased);
    const purchasedItems = list.items.filter(i => i.purchased);

    return (
      <View style={styles.card}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
            <View>
                <Text style={styles.cardTitle}>{list.title || 'Danh sách mua sắm'}</Text>
                <Text style={styles.cardDate}>
                    {new Date(list.plannedDate).toLocaleDateString('vi-VN')}
                </Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteList(list.id)} style={styles.deleteBtn}>
                <Feather name="trash-2" size={20} color="#ff4757" />
            </TouchableOpacity>
        </View>

        {/* Items List */}
        <View style={styles.itemsContainer}>
            {/* Chưa mua */}
            {pendingItems.map(i => (
                <TouchableOpacity 
                    key={i.ingredient.id} 
                    style={styles.itemRow} 
                    onPress={() => handleToggleItem(i, list.id)}
                    activeOpacity={0.7}
                >
                    <Feather name="square" size={22} color="#ccc" />
                    <View style={styles.itemTextContainer}>
                        <Text style={styles.itemName}>{i.ingredient.name}</Text>
                        <Text style={styles.itemQty}>{i.quantity} {i.unit}</Text>
                    </View>
                </TouchableOpacity>
            ))}

            {/* Đã mua */}
            {purchasedItems.length > 0 && (
                <>
                    <View style={styles.divider} />
                    <Text style={styles.purchasedHeader}>ĐÃ MUA ({purchasedItems.length})</Text>
                    {purchasedItems.map(i => (
                        <TouchableOpacity 
                            key={i.ingredient.id} 
                            style={styles.itemRow} 
                            onPress={() => handleToggleItem(i, list.id)}
                            activeOpacity={0.7}
                        >
                            <Feather name="check-square" size={22} color="#4CAF50" />
                            <View style={styles.itemTextContainer}>
                                <Text style={[styles.itemName, styles.strikethrough]}>{i.ingredient.name}</Text>
                                <Text style={[styles.itemQty, styles.strikethrough]}>{i.quantity} {i.unit}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </>
            )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Danh sách đi chợ</Text>
        <View style={{ width: 26 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#007bff" />
        </View>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={item => item.id.toString()}
          renderItem={renderShoppingList}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Bạn chưa có danh sách đi chợ nào.</Text>
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

  listContent: { padding: 16, paddingBottom: 30 },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff'
  },
  cardTitle: { 
  fontSize: 17,
  fontWeight: '600',
  color: '#333',
  marginBottom: 4,
  maxWidth: 250,        
  flexShrink: 1,       
  flexWrap: 'wrap'      
},

  cardDate: { fontSize: 13, color: '#007bff', fontWeight: '500' },
  deleteBtn: { padding: 8 },

  itemsContainer: { padding: 16 },
  
  // Item Row
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9'
  },
  itemTextContainer: { flex: 1, marginLeft: 12, flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { fontSize: 15, color: '#333', flex: 1 },
  itemQty: { fontSize: 14, color: '#666', fontWeight: '500' },
  
  strikethrough: { 
    textDecorationLine: 'line-through', 
    color: '#aaa' 
  },

  // Purchased Section
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  purchasedHeader: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 4, letterSpacing: 0.5 },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
});
