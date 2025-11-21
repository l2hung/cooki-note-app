import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker'; // Dùng Expo Image Picker
import apiClient from '../apiClient';

export default function EditProfileScreen() {
  const navigation = useNavigation();
  
  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  
  // User Data Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [fullName, setFullName] = useState(''); // Dùng để hiển thị trên UI
  const [username, setUsername] = useState('');
  const [biography, setBiography] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  // 1. Load Data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/me');
        const user = res.data.data;
        
        if (user) {
          setFirstName(user.firstName || '');
          setLastName(user.lastName || '');
          setFullName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
          setUsername(user.username || '');
          setBiography(user.biography || '');
          setGender(user.gender || '');
          setDateOfBirth(user.dateOfBirth || ''); // YYYY-MM-DD

          // Lấy avatar mới nhất
          const latestAvatar = user.medias?.slice().reverse().find(m => m.type === 'AVATAR');
          if (latestAvatar) {
            setAvatarUrl(latestAvatar.media.url);
          }
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể tải thông tin hồ sơ.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // 2. Handle Avatar Change (Upload ngay khi chọn)
  const handlePickAvatar = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        uploadAvatar(asset);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở thư viện ảnh.');
    }
  };

  const uploadAvatar = async (imageAsset) => {
    setAvatarUploading(true);
    const formData = new FormData();
    
    const uri = Platform.OS === "android" ? imageAsset.uri : imageAsset.uri.replace("file://", "");
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', {
      uri: uri,
      name: filename || `avatar_${Date.now()}.jpg`,
      type: type,
    });

    try {
      // Gọi API upload riêng giống Web
      await apiClient.patch('/users/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Refresh lại để lấy URL mới nhất từ server
      const res = await apiClient.get('/users/me');
      const latestAvatar = res.data.data?.medias?.slice().reverse().find(m => m.type === 'AVATAR');
      if (latestAvatar) {
        setAvatarUrl(latestAvatar.media.url); // Update UI với URL từ server
        Alert.alert('Thành công', 'Ảnh đại diện đã được cập nhật!');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Tải ảnh đại diện thất bại.');
    } finally {
      setAvatarUploading(false);
    }
  };

  // 3. Handle Submit Profile Info
  const handleSave = async () => {
    setSubmitting(true);

    // Tách fullName thành firstName và lastName
    const parts = fullName.trim().split(/\s+/);
    let fName = firstName;
    let lName = lastName;
    
    if (parts.length > 0) {
        if (parts.length === 1) {
            fName = parts[0];
            lName = '';
        } else {
            lName = parts.pop(); // Lấy từ cuối làm tên
            fName = parts.join(' '); // Các từ còn lại là họ/đệm
        }
    }

    const updateData = {
        firstName: fName,
        lastName: lName,
        username,
        biography,
        gender,
        dateOfBirth: dateOfBirth || null,
    };

    try {
        await apiClient.patch('/users/update-profile', updateData);
        Alert.alert('Thành công', 'Cập nhật hồ sơ thành công!', [
            { text: 'OK', onPress: () => navigation.goBack() }
        ]);
    } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', err.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
        setSubmitting(false);
    }
  };

  if (loading) {
    return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#007bff" />
        </View>
    );
  }

  // Avatar Letter Fallback
  const avatarLetter = (firstName?.[0] || username?.[0] || '?').toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Feather name="arrow-left" size={26} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
            <TouchableOpacity onPress={handleSave} disabled={submitting} style={styles.saveBtn}>
                {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveText}>Cập nhật</Text>}
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
            
            {/* AVATAR SECTION */}
            <View style={styles.avatarSection}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarLetter}>{avatarLetter}</Text>
                    </View>
                )}
                
                <TouchableOpacity 
                    style={[styles.changeAvatarBtn, avatarUploading && styles.disabledBtn]} 
                    onPress={handlePickAvatar}
                    disabled={avatarUploading}
                >
                    <Text style={[styles.changeAvatarText, avatarUploading && {color: '#aaa'}]}>
                        {avatarUploading ? "Đang tải ảnh..." : "Thay đổi ảnh đại diện"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* FORM FIELDS */}
            <View style={styles.formContent}>
                
                <View style={styles.formGroup}>
                    <Text style={styles.label}>Tên</Text>
                    <TextInput 
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Họ và Tên"
                        style={styles.input}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>ID Cookpad (Username)</Text>
                    <TextInput 
                        value={username}
                        onChangeText={setUsername}
                        style={styles.input}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Giới tính</Text>
                    {/* Tạm thời dùng TextInput, có thể thay bằng Picker/Modal nếu muốn */}
                    <View style={styles.genderRow}>
                        {['MALE', 'FEMALE', 'OTHER'].map((g) => (
                            <TouchableOpacity 
                                key={g} 
                                onPress={() => setGender(g)}
                                style={[styles.genderOption, gender === g && styles.genderActive]}
                            >
                                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                                    {g === 'MALE' ? 'Nam' : g === 'FEMALE' ? 'Nữ' : 'Khác'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Ngày sinh (YYYY-MM-DD)</Text>
                    <TextInput 
                        value={dateOfBirth}
                        onChangeText={setDateOfBirth}
                        placeholder="YYYY-MM-DD"
                        style={styles.input}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.label}>Vài dòng về bạn và đam mê nấu nướng</Text>
                    <TextInput 
                        value={biography}
                        onChangeText={setBiography}
                        placeholder="Chia sẻ về bản thân..."
                        multiline
                        style={[styles.input, styles.textArea]}
                    />
                </View>

            </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  saveBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  scrollContent: { paddingBottom: 40 },

  // AVATAR SECTION (Nền xám nhạt giống Web)
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#f7f8fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#555',
  },
  changeAvatarBtn: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 20,
  },
  disabledBtn: { borderColor: '#aaa' },
  changeAvatarText: {
    color: '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },

  // FORM CONTENT
  formContent: { paddingHorizontal: 20 },
  formGroup: { marginBottom: 24 },
  label: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingVertical: 8,
    fontSize: 16,
    color: '#111',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Custom Gender Selection
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  genderActive: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
  },
  genderText: { color: '#555', fontSize: 14 },
  genderTextActive: { color: '#007bff', fontWeight: '600' },
});