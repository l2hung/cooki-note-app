// screens/NotificationScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import apiClient from '../apiClient';

const ArrowLeft = () => <Text style={{ fontSize: 24 }}>←</Text>;

export default function NotificationScreen() {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNoti = async () => {
      try {
        const res = await apiClient.get('/notification/me');
        setNotifications(res.data.data || []);
      } catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNoti();
  }, []);

  const formatTime = (iso) => {
    return new Date(iso).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderItem = ({ item }) => (
    <View style={[styles.item, !item.read && styles.unread]}>
      <View style={styles.content}>
        <Text style={styles.message}>{item.message}</Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft />
        </TouchableOpacity>
        <Text style={styles.title}>Thông báo</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 50 }} size="large" color="#f97316" />
      ) : notifications.length === 0 ? (
        <Text style={styles.empty}>Bạn không có thông báo nào.</Text>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 20, fontWeight: '600' },
  item: { padding: 16, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  unread: { backgroundColor: '#f7f8fa' },
  message: { fontSize: 16, color: '#333', marginBottom: 6 },
  time: { fontSize: 13, color: '#888' },
  empty: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#888' },
});