import React, { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthForm from '../components/AuthForm';
import apiClient from '../apiClient';

let jwt_decode;
try {
  const module = require('jwt-decode');
  jwt_decode = module.jwtDecode || module.default || module;

  if (typeof jwt_decode !== 'function') {
    throw new Error('Import thành công nhưng không tìm thấy function jwtDecode');
  }
} catch (err) {
  console.error('Lỗi import jwt-decode:', err);

  jwt_decode = (token) => { throw new Error('Thư viện jwt-decode chưa được load đúng cách'); };
}

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await apiClient.post('/auth/authenticate', { email, password });
      console.log('API response:', res.data);

      // Lấy token từ cấu trúc response
      const token = res.data?.data?.token || res.data?.token;
      if (!token) throw new Error('Token không tồn tại trong phản hồi API');

      // 🔹 Gọi hàm giải mã (đã được fix ở trên)
      const decoded = jwt_decode(token); 
      console.log('Decoded Token:', decoded);

      // Lưu token và userId vào Storage
      await AsyncStorage.multiSet([
        ['jwt_token', token],
        ['user_id', decoded.userId?.toString() || decoded.sub?.toString()],
      ]);

      // Điều hướng vào Home và reset stack để không back lại Login được
      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }], 
      });

    } catch (err) {
      console.log('Login error:', err.response?.data || err.message);
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setMessage(msg);
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { 
      placeholder: 'Nhập email của bạn', 
      value: email, 
      onChangeText: setEmail, 
      keyboardType: 'email-address', 
      autoCapitalize: 'none' 
    },
    { 
      placeholder: 'Nhập mật khẩu', 
      value: password, 
      onChangeText: setPassword, 
      secure: true 
    },
  ];

  return (
    <AuthForm
      title="Chào mừng trở lại!"
      fields={fields}
      buttonText={loading ? 'Đang xử lý...' : 'Đăng nhập'}
      onSubmit={handleLogin}
      loading={loading}
      message={message}
      forgotLink={{ text: 'Quên mật khẩu?', onPress: () => navigation.navigate('ForgotPassword') }}
      bottomLink={{ text: 'Chưa có tài khoản?', linkText: 'Đăng ký', onPress: () => navigation.navigate('Register') }}
    />
  );
}