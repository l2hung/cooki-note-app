import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../../apiClient';

export default function AdminDashboardScreen() {
  const navigation = useNavigation();
  // Mặc định stats là object chứa các số 0 để không bị lỗi null
  const [stats, setStats] = useState({ recipeCount: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
  const [loading, setLoading] = useState(true);
  
  const [filterType, setFilterType] = useState('THIS_MONTH'); 
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const formatLocalYMD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateDateRange = (type) => {
    const now = new Date();
    const todayStr = formatLocalYMD(now); 
    
    if (type === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatLocalYMD(firstDay), end: todayStr };
    } 
    else if (type === 'LAST_MONTH') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: formatLocalYMD(firstDayLastMonth), end: formatLocalYMD(lastDayLastMonth) };
    } 
    else if (type === 'ALL') {
      return { start: '2023-01-01', end: todayStr }; 
    }
    return { start: todayStr, end: todayStr };
  };

  useEffect(() => {
    const range = calculateDateRange(filterType);
    setDateRange(range);
  }, [filterType]);

  useEffect(() => {
    if (!dateRange.start) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/admin/stats/created-between', {
          params: { createdAtAfter: dateRange.start, createdAtBefore: dateRange.end }
        });
        
        // Nếu có data thì set, nếu null/undefined thì set về object 0
        setStats(res.data.data || { recipeCount: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
        
      } catch (err) {
        // Nếu lỗi 404 (Không có dữ liệu), ta chủ động set về 0
        if (err.response?.status === 404) {
             setStats({ recipeCount: 0, totalLikes: 0, totalComments: 0, totalViews: 0 });
        } 
        else if (err.response?.status === 403) {
          Alert.alert('Lỗi', 'Bạn không có quyền truy cập trang này.');
          navigation.goBack();
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [dateRange]);

  const StatCard = ({ label, value, icon, color }) => (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <Feather name={icon} size={24} color={color} />
      <View style={styles.cardContent}>
        {/* Luôn hiển thị 0 nếu giá trị là null/undefined */}
        <Text style={styles.cardValue}>{value ?? 0}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    </View>
  );

  const MenuButton = ({ label, icon, screen }) => (
    <TouchableOpacity style={styles.menuBtn} onPress={() => navigation.navigate(screen)}>
      <Feather name={icon} size={20} color="#333" />
      <Text style={styles.menuText}>{label}</Text>
      <Feather name="chevron-right" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  const FilterButton = ({ label, type }) => (
    <TouchableOpacity 
      style={[styles.filterBtn, filterType === type && styles.filterBtnActive]} 
      onPress={() => setFilterType(type)}
    >
      <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.filterContainer}>
            <FilterButton label="Tháng này" type="THIS_MONTH" />
            <FilterButton label="Tháng trước" type="LAST_MONTH" />
            <FilterButton label="Tất cả" type="ALL" />
        </View>
        
        <Text style={styles.dateRangeText}>
            Dữ liệu từ: {dateRange.start} đến {dateRange.end}
        </Text>

        <Text style={styles.sectionTitle}>Thống kê</Text>
        
        {loading ? (
            <View style={{ height: 150, justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Công thức" value={stats.recipeCount} icon="file-text" color="#007bff" />
            <StatCard label="Lượt thích" value={stats.totalLikes} icon="heart" color="#ff4757" />
            <StatCard label="Bình luận" value={stats.totalComments} icon="message-circle" color="#2ecc71" />
            <StatCard label="Lượt xem" value={stats.totalViews} icon="eye" color="#8e44ad" />
          </View>
        )}

        <Text style={styles.sectionTitle}>Quản lý</Text>
        <MenuButton label="Quản lý Người dùng" icon="users" screen="AdminUsers" />
        <MenuButton label="Quản lý Công thức" icon="book-open" screen="AdminRecipes" />
        <MenuButton label="Quản lý Danh mục" icon="grid" screen="AdminCategories" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scroll: { padding: 16 },
  
  filterContainer: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#e0e0e0' },
  filterBtnActive: { backgroundColor: '#333' },
  filterText: { fontSize: 13, color: '#333', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  dateRangeText: { fontSize: 12, color: '#666', marginBottom: 10, textAlign: 'center' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 12, marginTop: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  card: { width: '48%', backgroundColor: '#fff', padding: 16, borderRadius: 12, borderLeftWidth: 4, elevation: 2, flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardContent: { flex: 1 },
  cardValue: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  cardLabel: { fontSize: 12, color: '#666' },
  menuBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10, elevation: 1 },
  menuText: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
});