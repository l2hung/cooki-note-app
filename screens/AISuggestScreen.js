import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import apiClient from '../apiClient';

// Key lưu trữ
const STORAGE_KEY_PLAN = 'ai_meal_plan';
const STORAGE_KEY_CATEGORY = 'ai_selected_category';
const STORAGE_KEY_REQUEST = 'ai_special_request';

export default function AISuggestScreen() {
  const navigation = useNavigation();
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [specialRequest, setSpecialRequest] = useState('');
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingList, setCreatingList] = useState(false);

  // 1. Load Categories & Restore Data
  useEffect(() => {
    // Load danh mục
    apiClient.get('/category')
      .then(res => setCategories(res.data.data || []))
      .catch(err => console.error(err));

    // Khôi phục dữ liệu cũ từ AsyncStorage
    const restoreData = async () => {
        try {
            const savedPlan = await AsyncStorage.getItem(STORAGE_KEY_PLAN);
            const savedCat = await AsyncStorage.getItem(STORAGE_KEY_CATEGORY);
            const savedReq = await AsyncStorage.getItem(STORAGE_KEY_REQUEST);

            if (savedPlan) setMealPlan(JSON.parse(savedPlan));
            if (savedCat) setSelectedCategory(savedCat);
            if (savedReq) setSpecialRequest(savedReq);
        } catch (error) {
            console.error('Lỗi khôi phục dữ liệu AI:', error);
        }
    };
    restoreData();
  }, []);

  // Helper: Group Meals
  const groupMealsByDate = (flatList) => {
    if (!Array.isArray(flatList)) return {};
    const mealOrder = { 'BREAKFAST': 1, 'LUNCH': 2, 'DINNER': 3 };
    flatList.sort((a, b) => {
        if (a.mealDate !== b.mealDate) return new Date(a.mealDate) - new Date(b.mealDate);
        return (mealOrder[a.mealType] || 0) - (mealOrder[b.mealType] || 0);
    });
    return flatList.reduce((groups, item) => {
        const dateKey = item.mealDate;
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(item);
        return groups;
    }, {});
  };

  const formatDateToWeekday = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
  };

  const translateMealType = (type) => {
    switch(type) {
        case 'BREAKFAST': return 'Bữa sáng';
        case 'LUNCH': return 'Bữa trưa';
        case 'DINNER': return 'Bữa tối';
        default: return type;
    }
  };

  // 2. Generate Plan (Tạo mới và Lưu)
  const handleGeneratePlan = async () => {
    setLoading(true);
    setMealPlan(null);

    try {
        // Xóa dữ liệu cũ trước khi tạo mới
        await AsyncStorage.removeItem(STORAGE_KEY_PLAN);

        let message = "";
        if (selectedCategory) {
            // Tìm tên category để gửi cho AI hiểu rõ hơn (nếu cần)
            const catName = categories.find(c => c.id == selectedCategory)?.name || selectedCategory;
            message += `Chỉ ưu tiên chọn các món thuộc danh mục: ${catName}. `;
        } else {
            message += "Có thể chọn món từ tất cả danh mục. ";
        }

        if (specialRequest.trim()) {
            message += `Yêu cầu đặc biệt: ${specialRequest}`;
        } else {
            message += "Hãy thiết kế thực đơn cân bằng dinh dưỡng.";
        }

        // Gọi API
        const res = await apiClient.post('/ai/chat', message, {
            headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
        });

        const groupedData = groupMealsByDate(res.data);
        setMealPlan(groupedData);

        // Lưu dữ liệu mới vào Storage
        await AsyncStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(groupedData));
        await AsyncStorage.setItem(STORAGE_KEY_CATEGORY, selectedCategory);
        await AsyncStorage.setItem(STORAGE_KEY_REQUEST, specialRequest);

    } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'AI đang bận, vui lòng thử lại sau.');
    } finally {
        setLoading(false);
    }
  };

  // 3. Add to Shopping List
  const handleAddToShoppingList = async () => {
    if (!mealPlan) return;
    
    Alert.alert(
        'Xác nhận',
        'Thêm tất cả nguyên liệu vào danh sách đi chợ?',
        [
            { text: 'Hủy', style: 'cancel' },
            { 
                text: 'Đồng ý', 
                onPress: async () => {
                    setCreatingList(true);
                    try {
                        const allMealItems = Object.values(mealPlan).flat();
                        const uniqueRecipeIds = [...new Set(
                            allMealItems
                                .filter(item => item.recipe?.id)
                                .map(item => item.recipe.id)
                        )];

                        if (uniqueRecipeIds.length === 0) {
                            Alert.alert('Thông báo', 'Không tìm thấy công thức nào.');
                            return;
                        }

                        const promises = uniqueRecipeIds.map(id => 
                            apiClient.post('/shopping-list', { recipeId: id })
                        );

                        await Promise.all(promises);
                        Alert.alert('Thành công', 'Đã thêm vào danh sách đi chợ!');
                        navigation.navigate('ShoppingList');
                    } catch (err) {
                        Alert.alert('Lỗi', 'Thêm thất bại.');
                    } finally {
                        setCreatingList(false);
                    }
                }
            }
        ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Kế Hoạch Ăn Uống</Text>
            <Text style={styles.subtitle}>AI gợi ý thực đơn cho bạn</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Tùy chọn gợi ý</Text>
                <Text style={styles.subLabel}>Nhập danh mục món ăn (VD: Món Á, Chay...)</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Tất cả danh mục" 
                    value={selectedCategory}
                    onChangeText={setSelectedCategory}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Yêu cầu đặc biệt</Text>
                <TextInput 
                    style={[styles.input, styles.textArea]} 
                    placeholder="Ví dụ: thực đơn giảm cân, cho trẻ em..." 
                    value={specialRequest}
                    onChangeText={setSpecialRequest}
                    multiline
                />
            </View>

            <TouchableOpacity 
                style={[styles.submitBtn, (loading || creatingList) && styles.disabledBtn]} 
                onPress={handleGeneratePlan}
                disabled={loading || creatingList}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.submitBtnText}>Tạo Kế Hoạch Ngay</Text>
                )}
            </TouchableOpacity>
        </View>

        {loading && (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>AI đang suy nghĩ thực đơn ngon nhất...</Text>
            </View>
        )}

        {mealPlan && (
            <View style={styles.resultContainer}>
                <TouchableOpacity 
                    style={[styles.shoppingBtn, creatingList && styles.disabledBtn]}
                    onPress={handleAddToShoppingList}
                    disabled={creatingList}
                >
                    <Feather name="shopping-cart" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.shoppingBtnText}>
                        {creatingList ? 'Đang thêm...' : 'Thêm tất cả vào DS đi chợ'}
                    </Text>
                </TouchableOpacity>

                {Object.keys(mealPlan).map((date, index) => (
                    <View key={index} style={styles.dayCard}>
                        <Text style={styles.dayHeader}>{formatDateToWeekday(date)}</Text>
                        
                        {mealPlan[date].map((meal, idx) => (
                            <View key={idx} style={styles.mealItem}>
                                <Text style={styles.mealType}>{translateMealType(meal.mealType)}</Text>
                                <TouchableOpacity 
                                    onPress={() => {
                                        if(meal.recipe?.id) navigation.navigate('RecipeDetail', { id: meal.recipe.id });
                                    }}
                                >
                                    <Text style={styles.mealName}>
                                        {meal.recipe?.title || "Món ăn chưa có tên"}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    paddingBottom: 8
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 2
  },
  headerTextContainer: { marginLeft: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1a202c' },
  subtitle: { fontSize: 14, color: '#718096' },

  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
    marginBottom: 20
  },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', color: '#2d3748', marginBottom: 4 },
  subLabel: { fontSize: 12, color: '#718096', marginBottom: 8 },
  input: {
    backgroundColor: '#f7fafc', 
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#2d3748'
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  submitBtn: {
    backgroundColor: '#ff7e21', 
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 8
  },
  disabledBtn: { backgroundColor: '#ffd5b8' },
  submitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  loadingContainer: { alignItems: 'center', marginVertical: 20 },
  loadingText: { marginTop: 10, color: '#ff7e21', fontSize: 15, fontWeight: '500' },

  resultContainer: { marginTop: 10 },
  
  shoppingBtn: {
    backgroundColor: '#10b981', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    shadowColor: '#10b981', shadowOpacity: 0.3, shadowOffset: {width: 0, height: 4}, elevation: 4
  },
  shoppingBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  dayCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    borderLeftColor: '#ff7e21',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2
  },
  dayHeader: { fontSize: 17, fontWeight: 'bold', color: '#1a202c', marginBottom: 12 },
  
  mealItem: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf2f7',
    paddingBottom: 8
  },
  mealType: { fontSize: 12, color: '#718096', textTransform: 'uppercase', marginBottom: 2, fontWeight: '600' },
  mealName: { fontSize: 16, color: '#2d3748', fontWeight: '500' },
});