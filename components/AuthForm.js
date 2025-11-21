// components/AuthForm.js
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';

export default function AuthForm({
  title,
  fields,
  buttonText,
  onSubmit,
  loading = false,
  bottomLink,
  forgotLink,
  message,
  logoUri = 'https://res.cloudinary.com/dqegnnt2w/image/upload/v1755990799/logo.png',
}) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {logoUri && <Image source={{ uri: logoUri }} style={styles.logo} />}
          <Text style={styles.title}>{title}</Text>

          {fields.map((f, i) => (
            <TextInput
              key={i}
              style={styles.input}
              placeholder={f.placeholder}
              value={f.value}
              onChangeText={f.onChangeText}
              secureTextEntry={f.secure}
              keyboardType={f.keyboardType || 'default'}
              autoCapitalize={f.autoCapitalize || 'sentences'}
              editable={!loading && f.editable !== false}
              placeholderTextColor="#999"
            />
          ))}

          {message && <Text style={styles.message}>{message}</Text>}

          {forgotLink && (
            <TouchableOpacity style={styles.forgot} onPress={forgotLink.onPress}>
              <Text style={styles.forgotText}>{forgotLink.text}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={onSubmit}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{buttonText}</Text>}
          </TouchableOpacity>

          {bottomLink && (
            <View style={styles.bottom}>
              <Text style={styles.bottomText}>{bottomLink.text} </Text>
              <TouchableOpacity onPress={bottomLink.onPress}>
                <Text style={styles.link}>{bottomLink.linkText}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb', padding: 20 },
  card: { backgroundColor: '#fff', padding: 36, borderRadius: 16, width: '100%', maxWidth: 420, elevation: 8 },
  logo: { width: 100, height: 100, alignSelf: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '600', textAlign: 'center', marginBottom: 24, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, marginBottom: 16, fontSize: 16, color: '#333' },
  message: { textAlign: 'center', color: '#d00', marginBottom: 12, fontSize: 14 },
  forgot: { alignSelf: 'flex-end', marginBottom: 12 },
  forgotText: { color: '#555', fontSize: 14 },
  btn: { backgroundColor: '#000', padding: 16, borderRadius: 8, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#999' },
  btnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  bottom: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  bottomText: { fontSize: 14, color: '#555' },
  link: { color: '#f97316', fontWeight: 'bold' },
});
