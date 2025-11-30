import React, { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthForm from '../components/AuthForm';
import apiClient from '../apiClient';

// --- CẤU HÌNH CHẶN ĐĂNG NHẬP ---
const MAX_ATTEMPTS = 3; // Số lần thử tối đa
const LOCKOUT_TIME = 10 * 60 * 1000; // 10 phút (tính bằng mili giây)

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

  // Helper tạo key cho từng email 
  const getKeys = (userEmail) => {
      const safeEmail = userEmail.trim().toLowerCase();
      return {
          attemptKey: `login_failed_${safeEmail}`,
          lockoutKey: `login_lockout_${safeEmail}`
      };
  };

  // Hàm kiểm tra xem EMAIL NÀY có đang bị khóa không
  const checkLockout = async () => {
    if (!email.trim()) return false;
    
    const { attemptKey, lockoutKey } = getKeys(email);

    try {
      const lockoutTimestamp = await AsyncStorage.getItem(lockoutKey);
      if (lockoutTimestamp) {
        const releaseTime = parseInt(lockoutTimestamp, 10);
        const now = Date.now();
        
        if (now < releaseTime) {
          const remainingMinutes = Math.ceil((releaseTime - now) / 60000);
          Alert.alert(
            'Tài khoản tạm khóa', 
            `Email "${email}" đã nhập sai quá ${MAX_ATTEMPTS} lần. Vui lòng thử lại sau ${remainingMinutes} phút.`
          );
          return true; // Đang bị khóa
        } else {
          // Đã hết thời gian khóa -> Reset cho email này
          await AsyncStorage.multiRemove([lockoutKey, attemptKey]);
        }
      }
    } catch (error) {
      console.error('Lỗi kiểm tra khóa:', error);
    }
    return false; // Không bị khóa
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      return Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
    }

    // 1. Kiểm tra khóa cho EMAIL CỤ THỂ
    const isLocked = await checkLockout();
    if (isLocked) return;

    setLoading(true);
    setMessage('');

    try {
      const res = await apiClient.post('/auth/authenticate', { email, password });
      console.log('API response:', res.data);

      const token = res.data?.data?.token || res.data?.token;
      if (!token) throw new Error('Token không tồn tại');

      const decoded = jwt_decode(token); 

      // 2. Đăng nhập thành công -> Xóa bộ đếm lỗi CỦA EMAIL NÀY
      const { attemptKey, lockoutKey } = getKeys(email);
      await AsyncStorage.multiRemove([lockoutKey, attemptKey]);

      await AsyncStorage.multiSet([
        ['jwt_token', token],
        ['user_id', decoded.userId?.toString() || decoded.sub?.toString()],
      ]);

      navigation.reset({
        index: 0,
        routes: [{ name: 'Main' }], 
      });

    } catch (err) {
      console.log('Login error:', err.response?.data || err.message);
      const msg = err.response?.data?.message || err.message || 'Đăng nhập thất bại';
      setMessage(msg);

      // 3. Xử lý khi đăng nhập thất bại
      // Chỉ đếm lỗi khi server trả về 401 (Unauthorized) hoặc lỗi sai mật khẩu
      if (err.response && err.response.status === 401) {
          await handleFailedAttempt();
      } else {
          Alert.alert('Lỗi', msg);
      }

    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý tăng số lần sai CHO EMAIL HIỆN TẠI
  const handleFailedAttempt = async () => {
    const { attemptKey, lockoutKey } = getKeys(email);

    try {
        const attemptsStr = await AsyncStorage.getItem(attemptKey);
        let attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
        attempts += 1;

        if (attempts >= MAX_ATTEMPTS) {
            // Khóa email này
            const releaseTime = Date.now() + LOCKOUT_TIME;
            await AsyncStorage.setItem(lockoutKey, releaseTime.toString());
            
            Alert.alert(
                'Tạm khóa đăng nhập', 
                `Tài khoản ${email} đã bị tạm khóa 10 phút do nhập sai quá nhiều lần.`
            );
        } else {
            // Lưu số lần sai
            await AsyncStorage.setItem(attemptKey, attempts.toString());
            const remaining = MAX_ATTEMPTS - attempts;
            Alert.alert(
                'Sai thông tin', 
                `Email hoặc mật khẩu không đúng. Bạn còn ${remaining} lần thử.`
            );
        }
    } catch (error) {
        console.error(error);
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
