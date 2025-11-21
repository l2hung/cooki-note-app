
import React, { useState } from 'react';
import { Alert } from 'react-native';
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
    setLoading(true);
    try {
      const res = await apiClient.get('/email/request-otp', { params: { email } });
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