import React, { useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // 1. Import AsyncStorage
import AuthForm from '../components/AuthForm';
import apiClient from '../apiClient';

export default function ForgotPasswordScreen({ navigation }) {
  const [stage, setStage] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendOtp = async () => {
    if (!email.trim()) {
        setMessage('Vui lòng nhập email');
        return;
    }

    // --- 2. LOGIC KIỂM TRA GIỚI HẠN 5 LẦN/NGÀY ---
    const MAX_ATTEMPTS = 5;
    const today = new Date().toDateString(); // Lấy ngày hiện tại (VD: "Mon Nov 30 2025")
    const storageKey = `otp_limit_${email.trim().toLowerCase()}`; // Key riêng cho từng email

    let usageData = { date: today, count: 0 };

    try {
        const savedData = await AsyncStorage.getItem(storageKey);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Nếu dữ liệu là của ngày hôm nay thì dùng tiếp, khác ngày thì reset về 0
            if (parsedData.date === today) {
                usageData = parsedData;
            }
        }

        if (usageData.count >= MAX_ATTEMPTS) {
            Alert.alert(
                'Giới hạn gửi OTP', 
                'Bạn đã yêu cầu OTP quá 5 lần trong ngày hôm nay. Vui lòng thử lại vào ngày mai.'
            );
            return; // Chặn không cho gọi API
        }
    } catch (error) {
        console.error('Lỗi kiểm tra giới hạn OTP:', error);
    }
    // -------------------------------------------------

    setLoading(true);
    try {
      const res = await apiClient.get('/email/request-otp', { params: { email } });
      
      // --- 3. TĂNG BIẾN ĐẾM KHI GỬI THÀNH CÔNG ---
      usageData.count += 1;
      await AsyncStorage.setItem(storageKey, JSON.stringify(usageData));
      // -------------------------------------------

      setMessage('Đã gửi mã OTP, kiểm tra email!');
      setStage('otp');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Gửi OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const resetPass = async () => {
    if (newPass !== confirm) return setMessage('Mật khẩu không khớp');

    setLoading(true);
    apiClient
      .patch('/users/reset-password', { email, otpCode: otp, newPassword: newPass, confirmPassword: confirm })
      .then(() => {
        Alert.alert('Thành công', 'Đặt lại mật khẩu thành công', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      })
      .catch(err => setMessage(err.response?.data?.message || 'Lỗi'))
      .finally(() => setLoading(false));
  };

  let fields = [];
  let btnText = '';
  if (stage === 'email') {
    fields = [{ placeholder: 'Nhập email', value: email, onChangeText: setEmail, keyboardType: 'email-address' }];
    btnText = loading ? 'Đang gửi...' : 'Gửi mã OTP';
  } else {
    fields = [
      { placeholder: 'Email', value: email, editable: false },
      { placeholder: 'Mã OTP', value: otp, onChangeText: setOtp },
      { placeholder: 'Mật khẩu mới', value: newPass, onChangeText: setNewPass, secure: true },
      { placeholder: 'Xác nhận', value: confirm, onChangeText: setConfirm, secure: true },
    ];
    btnText = loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu';
  }

  return (
    <AuthForm
      title="Đặt lại mật khẩu"
      fields={fields}
      buttonText={btnText}
      onSubmit={stage === 'email' ? sendOtp : resetPass}
      loading={loading}
      message={message}
      bottomLink={{
        text: 'Nhớ rồi?',
        linkText: 'Quay lại Đăng nhập',
        onPress: () => navigation.navigate('Login'),
      }}
    />
  );
}
