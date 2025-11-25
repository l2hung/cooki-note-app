import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../apiClient';

const getToday = () => new Date().toISOString().split('T')[0];
const getFirstDayOfMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
};

export default function StatsScreen() {
  const navigation = useNavigation();
  
  const [startDate, setStartDate] = useState(getFirstDayOfMonth());
  const [endDate, setEndDate] = useState(getToday());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    // Không setStats(null) ở đây để tránh nhấp nháy nếu muốn giữ data cũ, 
    // nhưng reset để an toàn cũng được.
    setStats(null); 

    try {
      const res = await apiClient.get('/recipes/stats/created-between', { 
        params: { 
            createdAtAfter: startDate, 
            createdAtBefore: endDate 
        } 
      });
      setStats(res.data.data);
      
    } catch (err) {
      // 🔹 SỬA TẠI ĐÂY: Xử lý 404 êm đẹp
      if (err.response && err.response.status === 404) {
        // Nếu server báo 404 (Không có dữ liệu), ta tự tạo data rỗng
        setStats({
            recipeCount: 0,
            totalLikes: 0,
            totalComments: 0,
            totalViews: 0,
            recipes: [] // Danh sách rỗng
        });
      } else {
        // Chỉ log lỗi nếu KHÔNG phải là 404
        console.error("Stats Error:", err);
        Alert.alert('Lỗi', 'Không thể tải thống kê lúc này.');
      }
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, value, label, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Feather name={icon} size={24} color={color} style={{ marginBottom: 8 }} />
      <Text style={[styles.statValue, { color: color }]}>{value || 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const RecipeStatItem = ({ recipe }) => (
    <TouchableOpacity 
        style={styles.recipeStatCard}
        onPress={() => navigation.navigate('RecipeDetail', { id: recipe.id })}
    >
        <Text style={styles.recipeStatTitle} numberOfLines={1}>{recipe.title}</Text>
        <View style={styles.recipeStatMetrics}>
            <View style={styles.metric}>
                <Feather name="heart" size={14} color="#ff4757" />
                <Text style={styles.metricText}>{recipe.likes?.length || 0}</Text>
            </View>
            <View style={styles.metric}>
                <Feather name="message-circle" size={14} color="#2ecc71" />
                <Text style={styles.metricText}>{recipe.comments?.length || 0}</Text>
            </View>
            <View style={styles.metric}>
                <Feather name="eye" size={14} color="#8e44ad" />
                <Text style={styles.metricText}>{recipe.viewsCount || 0}</Text>
            </View>
        </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Thống kê bếp</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Bộ lọc ngày */}
        <View style={styles.filterCard}>
            <View style={styles.dateRow}>
                <View style={styles.dateInputGroup}>
                    <Text style={styles.label}>Từ ngày</Text>
                    <TextInput 
                        value={startDate} 
                        onChangeText={setStartDate} 
                        placeholder="YYYY-MM-DD"
                        style={styles.input} 
                    />
                </View>
                <View style={styles.dateInputGroup}>
                    <Text style={styles.label}>Đến ngày</Text>
                    <TextInput 
                        value={endDate} 
                        onChangeText={setEndDate} 
                        placeholder="YYYY-MM-DD"
                        style={styles.input} 
                    />
                </View>
            </View>
            <TouchableOpacity 
                style={[styles.submitBtn, loading && styles.disabledBtn]} 
                onPress={fetchStats}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                ) : (
                    <Text style={styles.submitBtnText}>Xem thống kê</Text>
                )}
            </TouchableOpacity>
        </View>

        {/* Kết quả thống kê */}
        {stats && (
            <>
                {/* Grid Tổng quan (Sẽ hiện số 0 nếu 404) */}
                <View style={styles.statsGrid}>
                    <StatCard icon="file-text" value={stats.recipeCount} label="Công thức" color="#007bff" />
                    <StatCard icon="heart" value={stats.totalLikes} label="Lượt thích" color="#ff4757" />
                    <StatCard icon="message-circle" value={stats.totalComments} label="Bình luận" color="#2ecc71" />
                    <StatCard icon="eye" value={stats.totalViews} label="Lượt xem" color="#8e44ad" />
                </View>

                {/* Chi tiết danh sách */}
                {stats.recipes && stats.recipes.length > 0 ? (
                    <View style={styles.detailsSection}>
                        <Text style={styles.sectionTitle}>Chi tiết ({stats.recipes.length})</Text>
                        {stats.recipes.map(recipe => (
                            <RecipeStatItem key={recipe.id} recipe={recipe} />
                        ))}
                    </View>
                ) : (
                    /* Hiển thị thông báo nhỏ nếu không có bài viết nào */
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Chưa có dữ liệu trong khoảng thời gian này.</Text>
                    </View>
                )}
            </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f8fa' },
  
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
  title: { fontSize: 18, fontWeight: '600', color: '#333' },

  scrollContent: { padding: 16 },

  filterCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dateRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  dateInputGroup: { flex: 1 },
  label: { fontSize: 13, color: '#555', marginBottom: 6, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    backgroundColor: '#fff'
  },
  submitBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledBtn: { backgroundColor: '#ccc' },
  submitBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: '48%', 
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: '700', marginVertical: 4 },
  statLabel: { fontSize: 13, color: '#666' },

  detailsSection: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  
  recipeStatCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  recipeStatTitle: { flex: 1, fontSize: 15, color: '#333', fontWeight: '500', marginRight: 10 },
  recipeStatMetrics: { flexDirection: 'row', gap: 12 },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricText: { fontSize: 13, color: '#555', fontWeight: '500' },

  emptyContainer: { alignItems: 'center', marginTop: 20 },
  emptyText: { color: '#888', fontSize: 14 },
});
