// screens/RegisterScreen.js
import React, { useState } from 'react';
import { Alert } from 'react-native';
import AuthForm from '../components/AuthForm';
import apiClient from '../apiClient';

export default function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (password !== confirm) return Alert.alert('Lỗi', 'Mật khẩu không khớp');

    setLoading(true);
    try {
      await apiClient.post('/auth/register', { username, email, password, confirmPassword: confirm });
      Alert.alert('Thành công', 'Tài khoản đã tạo! Hãy đăng nhập');
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { placeholder: 'Tên người dùng', value: username, onChangeText: setUsername },
    { placeholder: 'Email', value: email, onChangeText: setEmail, keyboardType: 'email-address' },
    { placeholder: 'Mật khẩu', value: password, onChangeText: setPassword, secure: true },
    { placeholder: 'Xác nhận mật khẩu', value: confirm, onChangeText: setConfirm, secure: true },
  ];

  return (
    <AuthForm
      title="Tạo tài khoản mới"
      fields={fields}
      buttonText={loading ? 'Đang xử lý...' : 'Đăng ký'}
      onSubmit={handleRegister}
      loading={loading}
      bottomLink={{
        text: 'Đã có tài khoản?',
        linkText: 'Đăng nhập',
        onPress: () => navigation.navigate('Login'),
      }}
    />
  );
}