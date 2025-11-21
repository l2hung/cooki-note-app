import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../apiClient';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // --- CHANGE PASSWORD LOGIC ---
  const ChangePasswordModal = () => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
      if (newPassword !== confirmPassword) {
        Alert.alert('Lỗi', 'Mật khẩu mới không khớp');
        return;
      }
      setLoading(true);
      try {
        await apiClient.patch('/users/change-password', {
          currentPassword,
          newPassword,
          confirmNewPassword: confirmPassword
        });
        Alert.alert('Thành công', 'Đổi mật khẩu thành công');
        setShowPasswordModal(false);
      } catch (err) {
        Alert.alert('Lỗi', err.response?.data?.message || 'Thất bại');
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            
            <Text style={styles.label}>Mật khẩu hiện tại</Text>
            <TextInput 
                secureTextEntry 
                style={styles.input} 
                value={currentPassword} 
                onChangeText={setCurrentPassword} 
            />
            
            <Text style={styles.label}>Mật khẩu mới</Text>
            <TextInput 
                secureTextEntry 
                style={styles.input} 
                value={newPassword} 
                onChangeText={setNewPassword} 
            />
            
            <Text style={styles.label}>Xác nhận mật khẩu mới</Text>
            <TextInput 
                secureTextEntry 
                style={styles.input} 
                value={confirmPassword} 
                onChangeText={setConfirmPassword} 
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)} style={styles.btnSec}>
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmit} style={styles.btnPri} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff'}}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // --- DELETE ACCOUNT LOGIC ---
  const DeleteAccountModal = () => {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
      if (confirmText !== 'XÓA') {
        Alert.alert('Lỗi', 'Vui lòng nhập đúng chữ "XÓA"');
        return;
      }
      setLoading(true);
      try {
        await apiClient.delete('/users');
        await AsyncStorage.multiRemove(['jwt_token', 'user_id']);
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      } catch (err) {
        Alert.alert('Lỗi', 'Không thể xóa tài khoản');
        setLoading(false);
      }
    };

    return (
      <Modal visible={showDeleteModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Xóa tài khoản?</Text>
            <Text style={styles.warningText}>Hành động này không thể hoàn tác. Nhập "XÓA" để xác nhận.</Text>
            
            <TextInput 
                style={styles.input} 
                value={confirmText} 
                onChangeText={setConfirmText} 
                placeholder='Gõ "XÓA"'
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowDeleteModal(false)} style={styles.btnSec}>
                <Text>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.btnDanger} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff'}}>Xóa vĩnh viễn</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // --- LOGOUT ---
  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy' },
      { text: 'Đăng xuất', onPress: async () => {
        await AsyncStorage.multiRemove(['jwt_token', 'user_id']);
        navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={26} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Group 1: Tài khoản */}
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <View style={styles.group}>
            <TouchableOpacity style={styles.item} onPress={() => setShowPasswordModal(true)}>
                <View style={styles.itemLeft}>
                    <Feather name="lock" size={20} color="#666" />
                    <Text style={styles.itemText}>Đổi mật khẩu</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.item} onPress={handleLogout}>
                <View style={styles.itemLeft}>
                    <Feather name="log-out" size={20} color="#666" />
                    <Text style={styles.itemText}>Đăng xuất</Text>
                </View>
            </TouchableOpacity>
        </View>

        {/* Group 2: Nguy hiểm */}
        <Text style={styles.sectionTitle}>Nguy hiểm</Text>
        <View style={styles.group}>
            <TouchableOpacity style={styles.item} onPress={() => setShowDeleteModal(true)}>
                <View style={styles.itemLeft}>
                    <Feather name="trash-2" size={20} color="#ff4757" />
                    <Text style={[styles.itemText, { color: '#ff4757' }]}>Xóa tài khoản</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#ccc" />
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modals */}
      <ChangePasswordModal />
      <DeleteAccountModal />

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

  content: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  
  group: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  item: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0' 
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemText: { fontSize: 16, fontWeight: '500', color: '#333' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#333' },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 16, fontSize: 16 },
  warningText: { color: '#666', marginBottom: 16 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnSec: { padding: 10, borderRadius: 8, backgroundColor: '#eee' },
  btnPri: { padding: 10, borderRadius: 8, backgroundColor: '#007bff', minWidth: 80, alignItems: 'center' },
  btnDanger: { padding: 10, borderRadius: 8, backgroundColor: '#ff4757', minWidth: 80, alignItems: 'center' },
});