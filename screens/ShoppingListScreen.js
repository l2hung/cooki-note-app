import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SectionList, 
  StyleSheet, 
  Alert, 
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; 
import apiClient from '../apiClient';

export default function ShoppingListScreen() {
  const navigation = useNavigation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Lấy dữ liệu từ API
  const fetchLists = async () => {
    try {
      const res = await apiClient.get('/shopping-list/me');
      setLists(res.data.data || []);
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không thể tải danh sách đi chợ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  // 2. XỬ LÝ DỮ LIỆU: Gom nhóm theo Ngày & Gộp nguyên liệu trùng
  const groupedData = useMemo(() => {
    if (!lists.length) return [];

    const groups = {};

    lists.forEach(list => {
      // Ưu tiên lấy ngày tạo (createdAt), nếu không có mới lấy ngày dự kiến
      const rawDate = list.createdAt ? new Date(list.createdAt) : (list.plannedDate ? new Date(list.plannedDate) : new Date());
      const dateKey = rawDate.toISOString().split('T')[0]; // Format: "YYYY-MM-DD"

      if (!groups[dateKey]) {
        groups[dateKey] = {
          title: `Ngày ${rawDate.getDate()}/${rawDate.getMonth() + 1}/${rawDate.getFullYear()}`,
          dateKey: dateKey,
          items: {},
          listIds: new Set() // Dùng Set để lưu ID các danh sách cần xóa
        };
      }

      groups[dateKey].listIds.add(list.id);

      list.items.forEach(item => {
        const itemId = item.ingredient.id;
        // Key gộp: ID nguyên liệu + Đơn vị (để tránh cộng nhầm đơn vị khác nhau)
        const mergeKey = `${itemId}_${item.unit}`;

        if (groups[dateKey].items[mergeKey]) {
          // A. NẾU ĐÃ CÓ: Cộng dồn số lượng
          groups[dateKey].items[mergeKey].quantity += item.quantity;
          
          // Logic: Nếu có 1 cái chưa mua -> Cả nhóm coi như chưa mua xong
          if (!item.purchased) {
            groups[dateKey].items[mergeKey].purchased = false; 
          }
          
          // Lưu vết item gốc (QUAN TRỌNG: Phải lưu cả quantity và unit để tránh lỗi 500)
          groups[dateKey].items[mergeKey].originalItems.push({ 
            listId: list.id, 
            ingredientId: itemId,
            purchased: item.purchased,
            quantity: item.quantity, // <--- Fix lỗi 500
            unit: item.unit          // <--- Fix lỗi 500
          });

        } else {
          // B. NẾU MỚI: Tạo mới
          groups[dateKey].items[mergeKey] = {
            ...item,
            originalItems: [{ 
              listId: list.id, 
              ingredientId: itemId,
              purchased: item.purchased,
              quantity: item.quantity, // <--- Fix lỗi 500
              unit: item.unit          // <--- Fix lỗi 500
            }]
          };
        }
      });
    });

    // Sắp xếp ngày mới nhất lên đầu
    const sortedDates = Object.keys(groups).sort().reverse();
    
    // Chuyển đổi sang mảng cho SectionList
    return sortedDates.map(dateKey => ({
      title: groups[dateKey].title,
      listIds: Array.from(groups[dateKey].listIds),
      data: Object.values(groups[dateKey].items).map(item => ({
        ...item,
        // Tạo Key duy nhất để tránh lỗi trùng key của React
        uniqueRowKey: `${dateKey}_${item.ingredient.id}_${item.unit}`
      }))
    }));

  }, [lists]);

  // 3. XỬ LÝ CHECK / UNCHECK MÓN ĂN
  const handleToggleMergedItem = async (mergedItem) => {
    const newCheckedState = !mergedItem.purchased;

    // A. Optimistic Update (Cập nhật giao diện ngay lập tức)
    const updatedLists = lists.map(list => {
      const listItems = list.items.map(item => {
        // So sánh ID (ép về String để an toàn)
        const isMatch = mergedItem.originalItems.some(
          oi => String(oi.listId) === String(list.id) && 
                String(oi.ingredientId) === String(item.ingredient.id)
        );
        
        if (isMatch) {
          return { ...item, purchased: newCheckedState };
        }
        return item;
      });
      return { ...list, items: listItems };
    });

    setLists(updatedLists);

    // B. Gọi API cập nhật từng item gốc
    try {
      const updatePromises = mergedItem.originalItems.map(oi => {
        // Payload đầy đủ để tránh lỗi 500 từ Backend
        const payload = {
            shoppingList: { id: oi.listId },
            ingredient: { id: oi.ingredientId },
            purchased: newCheckedState,
            quantity: oi.quantity,
            unit: oi.unit
        };
        return apiClient.patch('/shopping-items', payload);
      });

      await Promise.all(updatePromises);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái món ăn.');
      fetchLists(); // Rollback về dữ liệu cũ nếu lỗi
    }
  };

  // 4. XỬ LÝ XÓA NHÓM (Xóa toàn bộ danh sách trong ngày)
  const handleDeleteGroup = (dateTitle, listIds) => {
    Alert.alert(
      'Xóa danh sách',
      `Bạn có muốn xóa toàn bộ danh sách đi chợ của ${dateTitle}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            // Optimistic Update: Xóa khỏi state trước
            const newLists = lists.filter(l => !listIds.includes(l.id));
            setLists(newLists);

            try {
              // Gọi API xóa từng List ID
              await Promise.all(listIds.map(id => apiClient.delete(`/shopping-list/${id}`)));
            } catch (error) {
              console.error(error);
              Alert.alert('Lỗi', 'Không thể xóa danh sách');
              fetchLists(); // Rollback
            }
          }
        }
      ]
    );
  };

  // --- RENDER COMPONENTS ---

  const renderItem = ({ item }) => {
    return (
      <TouchableOpacity 
        style={styles.itemRow} 
        onPress={() => handleToggleMergedItem(item)}
        activeOpacity={0.7}
      >
        <Feather 
          name={item.purchased ? "check-square" : "square"} 
          size={22} 
          color={item.purchased ? "#4CAF50" : "#ccc"} 
        />
        <View style={styles.itemTextContainer}>
          <Text style={[styles.itemName, item.purchased && styles.strikethrough]}>
            {item.ingredient.name}
          </Text>
          <Text style={[styles.itemQty, item.purchased && styles.strikethrough]}>
            {parseFloat(item.quantity.toFixed(2))} {item.unit}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
        <Feather name="calendar" size={16} color="#007bff" />
        <Text style={styles.sectionTitle}>{section.title}</Text>
      </View>
      
      {/* Nút Xóa (Thùng rác) */}
      <TouchableOpacity 
        onPress={() => handleDeleteGroup(section.title, section.listIds)}
        style={{ padding: 4 }}
      >
        <Feather name="trash-2" size={18} color="#ff4757" />
      </TouchableOpacity>
    </View>
  );

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
        <SectionList
          sections={groupedData}
          keyExtractor={(item) => item.uniqueRowKey}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={false}
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

  // Header Styles
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

  listContent: { paddingBottom: 30 },

  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
    borderRadius: 8,
    // Shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#007bff' },

  // Item Row Styles
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 1, 
    borderRadius: 4
  },
  itemTextContainer: { flex: 1, marginLeft: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, color: '#333', flex: 1, fontWeight: '500' },
  itemQty: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  
  strikethrough: { 
    textDecorationLine: 'line-through', 
    color: '#aaa',
    fontStyle: 'italic'
  },

  emptyText: { textAlign: 'center', marginTop: 50, color: '#999', fontSize: 16 },
});
