// screens/WelcomeScreen.js
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={{ uri: 'https://res.cloudinary.com/dqegnnt2w/image/upload/v1755990799/logo.png' }}
          style={styles.logo}
        />
        <Text style={styles.title}>Chào mừng đến Cookinote!</Text>
        <Text style={styles.subtitle}>Đăng nhập để khám phá công thức ngon.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Đăng ký hoặc đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff8f0' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logo: { width: 180, height: 180, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ff6f3c', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#333', marginVertical: 20, textAlign: 'center' },
  btn: { backgroundColor: '#ff6f3c', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});