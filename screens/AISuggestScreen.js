import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import apiClient from '../apiClient';

// --- CẤU HÌNH ---
const COLORS = {
  primary: '#FF8C00',
  primaryLight: '#FFF5E6',
  secondary: '#10B981',
  background: '#F7F8FA',
  cardBg: '#FFFFFF',
  textDark: '#1A202C',
  textMedium: '#4A5568',
  textLight: '#A0AEC0',
  border: '#E2E8F0',
};

const STORAGE_KEY_PLAN = 'ai_meal_plan';
const STORAGE_KEY_REQUEST = 'ai_special_request';

export default function AISuggestScreen() {
  const navigation = useNavigation();

  const [specialRequest, setSpecialRequest] = useState('');
  const [mealPlan, setMealPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingList, setCreatingList] = useState(false);

  // -- KHÔI PHỤC DỮ LIỆU CŨ --
  useEffect(() => {
    const restoreData = async () => {
      try {
        const savedPlan = await AsyncStorage.getItem(STORAGE_KEY_PLAN);
        const savedReq = await AsyncStorage.getItem(STORAGE_KEY_REQUEST);

        if (savedPlan) setMealPlan(JSON.parse(savedPlan));
        if (savedReq) setSpecialRequest(savedReq);
      } catch (error) {
        console.error("Lỗi khôi phục dữ liệu:", error);
      }
    };
    restoreData();
  }, []);

  // --- XỬ LÝ ---
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

  const formatDateToWeekday = (dateString) =>
    new Date(dateString)
      .toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric'
      })
      .replace(/^\w/, (c) => c.toUpperCase());

  const translateMealType = (type) => {
    switch (type) {
      case 'BREAKFAST': return 'Bữa sáng';
      case 'LUNCH': return 'Bữa trưa';
      case 'DINNER': return 'Bữa tối';
      default: return type;
    }
  };

  const getMealIconName = (type) => {
    switch (type) {
      case 'BREAKFAST': return 'sunrise';
      case 'LUNCH': return 'sun';
      case 'DINNER': return 'moon';
      default: return 'clock';
    }
  };

  // --- TẠO PLAN ---
  const handleGeneratePlan = async () => {
    setLoading(true);
    setMealPlan(null);

    try {
      await AsyncStorage.removeItem(STORAGE_KEY_PLAN);

      // Prompt AI CHỈ CÒN YÊU CẦU ĐẶC BIỆT
      let message = "";
      if (specialRequest.trim()) {
        message += `Yêu cầu đặc biệt: ${specialRequest}`;
      } else {
        message += "Hãy thiết kế thực đơn cân bằng dinh dưỡng trong tuần.";
      }

      const res = await apiClient.post('/ai/chat', message, {
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' }
      });

      const groupedData = groupMealsByDate(res.data);
      setMealPlan(groupedData);

      await AsyncStorage.setItem(STORAGE_KEY_PLAN, JSON.stringify(groupedData));
      await AsyncStorage.setItem(STORAGE_KEY_REQUEST, specialRequest);

    } catch (err) {
      console.error("AI Error:", err);
      Alert.alert("Lỗi", "AI đang bận hoặc gặp sự cố.");
    } finally {
      setLoading(false);
    }
  };

  // --- THÊM DANH SÁCH ĐI CHỢ ---
  const handleAddToShoppingList = async () => {
    if (!mealPlan) return;

    Alert.alert(
      "Xác nhận",
      "Bạn có muốn thêm tất cả nguyên liệu vào danh sách đi chợ?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Đồng ý",
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
                Alert.alert("Thông báo", "Không có công thức nào.");
                return;
              }

              await Promise.all(uniqueRecipeIds.map(id =>
                apiClient.post('/shopping-list', { recipeId: id })
              ));

              Alert.alert(
                "Thành công",
                "Đã thêm vào danh sách đi chợ!",
                [{ text: "Xem danh sách", onPress: () => navigation.navigate('ShoppingList') }]
              );
            } catch {
              Alert.alert("Lỗi", "Không thể thêm danh sách.");
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
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Kế Hoạch Ăn Uống</Text>
          <Text style={styles.headerSubtitle}>AI Chef gợi ý thực đơn</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Form nhập yêu cầu */}
        <View style={styles.card}>
          <Text style={styles.label}>Yêu cầu đặc biệt (tùy chọn)</Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ví dụ: thực đơn giảm cân, cho trẻ em..."
            placeholderTextColor={COLORS.textLight}
            value={specialRequest}
            onChangeText={setSpecialRequest}
            multiline
            textAlignVertical="top"
          />

          <TouchableOpacity 
            style={[styles.submitBtn, loading && styles.disabledBtn]} 
            onPress={handleGeneratePlan}
            disabled={loading}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Đang suy nghĩ...</Text>
              </View>
            ) : (
              <Text style={styles.submitBtnText}>Tạo Kế Hoạch Ngay</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* KẾT QUẢ */}
        {mealPlan && (
          <View style={styles.resultContainer}>
            
            {/* Nút thêm đi chợ */}
            <TouchableOpacity
              style={[styles.shoppingBtn, creatingList && styles.disabledBtn]}
              onPress={handleAddToShoppingList}
              disabled={creatingList}
            >
              <Feather name="shopping-cart" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.shoppingBtnText}>
                {creatingList ? "Đang thêm..." : "Thêm tất cả vào danh sách đi chợ"}
              </Text>
            </TouchableOpacity>

            {/* Danh sách theo ngày */}
            {Object.keys(mealPlan).map((date, index) => (
              <View key={index} style={styles.dayCard}>
                <View style={styles.dayHeaderContainer}>
                  <Text style={styles.dayHeader}>{formatDateToWeekday(date)}</Text>
                </View>

                <View style={styles.mealsList}>
                  {mealPlan[date].map((meal, idx) => {
                    const isLast = idx === mealPlan[date].length - 1;
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.mealItem, isLast && styles.mealItemNoBorder]}
                        onPress={() =>
                          meal.recipe?.id && navigation.navigate('RecipeDetail', { id: meal.recipe.id })
                        }
                      >
                        <View style={styles.mealIconContainer}>
                          <Feather name={getMealIconName(meal.mealType)} size={18} color={COLORS.primary} />
                        </View>

                        <View style={styles.mealInfo}>
                          <Text style={styles.mealType}>{translateMealType(meal.mealType)}</Text>
                          <Text style={styles.mealName}>{meal.recipe?.title || "Chưa có tên"}</Text>
                        </View>

                        <Feather name="chevron-right" size={16} color={COLORS.textLight} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  headerTitleContainer: { marginLeft: 12 },
  headerTitle: { fontSize: 20, color: COLORS.textDark, fontWeight: 'bold' },
  headerSubtitle: { fontSize: 14, color: COLORS.textMedium },

  scrollContent: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 1,
  },

  label: { color: COLORS.textDark, fontWeight: 'bold', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    color: COLORS.textDark,
    backgroundColor: '#fff',
  },
  textArea: { height: 100 },

  submitBtn: {
    marginTop: 14,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { opacity: 0.5 },

  resultContainer: { marginTop: 10 },

  shoppingBtn: {
    backgroundColor: COLORS.secondary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  shoppingBtnText: { color: '#fff', fontWeight: 'bold' },

  dayCard: {
    backgroundColor: COLORS.cardBg,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  dayHeaderContainer: { marginBottom: 10 },
  dayHeader: { fontSize: 16, fontWeight: 'bold', color: COLORS.textDark },

  mealsList: {},
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  mealItemNoBorder: { borderBottomWidth: 0 },

  mealIconContainer: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },

  mealInfo: { flex: 1 },
  mealType: { fontSize: 12, color: COLORS.textMedium },
  mealName: { fontSize: 15, color: COLORS.textDark, fontWeight: '500' },
});
