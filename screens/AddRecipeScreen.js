import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../apiClient';

export default function AddRecipeScreen() {
  const navigation = useNavigation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cookTime, setCookTime] = useState('30');
  const [servings, setServings] = useState('2');
  const [difficulty, setDifficulty] = useState('EASY');
  const [category, setCategory] = useState('');
  
  const [ingredients, setIngredients] = useState([
    { name: '', quantity: '', unit: '', note: '', required: true }
  ]);
  
  const [steps, setSteps] = useState([{ description: '', images: [] }]);
  const [mainImage, setMainImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingMsg, setUploadingMsg] = useState('');

  // --- CHỌN ẢNH (SỬA LỖI UNDEFINED) ---

  const pickMainImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        // 2. SỬA LỖI IMAGE PICKER: Dùng MediaTypeOptions
        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMainImage(result.assets[0]);
      }
    } catch (error) {
      console.log("Lỗi chọn ảnh:", error);
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh.");
    }
  };

  const pickStepImage = async (stepIndex) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        // 2. SỬA LỖI IMAGE PICKER: Dùng MediaTypeOptions
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, 
        quality: 0.7,
      });

      if (!result.canceled && result.assets) {
        const newSteps = [...steps];
        newSteps[stepIndex].images = [...newSteps[stepIndex].images, ...result.assets];
        setSteps(newSteps);
      }
    } catch (error) {
      console.log("Lỗi chọn ảnh bước:", error);
    }
  };

  // --- LOGIC UPLOAD ---
  const uploadFile = async (imageAsset, endpoint) => {
    const formData = new FormData();
    const uri = Platform.OS === "android" ? imageAsset.uri : imageAsset.uri.replace("file://", "");
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', {
      uri: uri,
      name: filename || `upload_${Date.now()}.jpg`,
      type: type,
    });

    try {
      const res = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    } catch (error) {
      console.error(`Upload failed to ${endpoint}:`, error);
      throw error;
    }
  };

  const submitRecipe = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên món ăn.');
      return;
    }

    setLoading(true);
    
    try {
      let mainImageMedia = null;
      if (mainImage) {
        setUploadingMsg('Đang tải ảnh bìa...');
        mainImageMedia = await uploadFile(mainImage, '/media/recipe-avatar');
      }

      setUploadingMsg('Đang tải ảnh các bước...');
      const stepsWithMedia = await Promise.all(steps.map(async (step, index) => {
        let uploadedMedias = [];
        if (step.images && step.images.length > 0) {
          const uploadPromises = step.images.map(img => uploadFile(img, '/media/step-image'));
          const results = await Promise.all(uploadPromises);
          uploadedMedias = results.map(mediaData => ({ media: { id: mediaData.id } }));
        }

        return {
          stepOrder: index + 1,
          description: step.description,
          estimatedTimeMinutes: 10,
          medias: uploadedMedias
        };
      }));

      setUploadingMsg('Đang tạo công thức...');
      
      const ingredientsPayload = ingredients
        .filter(ing => ing.name.trim() !== '')
        .map(ing => ({
          ingredient: { name: ing.name },
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          required: ing.required,
          note: ing.note || ''
        }));

      const mediasPayload = mainImageMedia 
        ? [{ media: { id: mainImageMedia.id }, type: 'AVATAR' }] 
        : [];

      const finalPayload = {
        title: title,
        description: description,
        cookTimeMinutes: parseInt(cookTime) || 30,
        servings: parseInt(servings) || 2,
        difficulty: difficulty,
        category: category ? { name: category } : null,
        ingredients: ingredientsPayload,
        steps: stepsWithMedia,
        medias: mediasPayload
      };

      await apiClient.post('/recipes', finalPayload);
      
      Alert.alert('Thành công 🎉', 'Công thức đã được đăng!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);

    } catch (err) {
      console.error('Full Submit Error:', err);
      const msg = err.response?.data?.message || 'Đăng công thức thất bại. Vui lòng thử lại.';
      Alert.alert('Lỗi', msg);
    } finally {
      setLoading(false);
      setUploadingMsg('');
    }
  };

  // --- HANDLERS KHÁC ---
  const updateIngredient = (index, field, value) => {
    const newIngs = [...ingredients];
    newIngs[index][field] = value;
    setIngredients(newIngs);
  };
  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: '', unit: '', note: '', required: true }]);
  const removeIngredient = (index) => setIngredients(ingredients.filter((_, i) => i !== index));
  const addStep = () => setSteps([...steps, { description: '', images: [] }]);
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));
  const updateStepDesc = (text, index) => {
    const newSteps = [...steps];
    newSteps[index].description = text;
    setSteps(newSteps);
  };
  const removeStepImage = (stepIndex, imgIndex) => {
    const newSteps = [...steps];
    newSteps[stepIndex].images.splice(imgIndex, 1);
    setSteps(newSteps);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="x" size={24} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={submitRecipe} 
            disabled={loading} 
            style={[styles.publishBtn, loading && styles.disabledBtn]}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishText}>Lên Sóng</Text>}
          </TouchableOpacity>
        </View>

        {loading && uploadingMsg ? (
            <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>{uploadingMsg}</Text>
            </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          {/* Ảnh bìa */}
          <View style={styles.imageUploadSection}>
            <TouchableOpacity onPress={pickMainImage} activeOpacity={0.8}>
              {mainImage ? (
                <Image source={{ uri: mainImage.uri }} style={styles.mainImagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={32} color="#aaa" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={pickMainImage}>
              <Text style={styles.uploadTextBtn}>Đăng hình đại diện món ăn</Text>
            </TouchableOpacity>
          </View>

          {/* Thông tin cơ bản */}
          <View style={styles.section}>
            <TextInput placeholder="Tên món..." value={title} onChangeText={setTitle} style={styles.input} />
            <TextInput placeholder="Mô tả..." value={description} onChangeText={setDescription} multiline style={[styles.input, styles.textArea]} />
            <TextInput placeholder="Danh mục..." value={category} onChangeText={setCategory} style={styles.input} />
            
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.label}>Khẩu phần</Text>
                <TextInput value={servings} onChangeText={setServings} keyboardType="numeric" style={styles.metaInput} />
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.label}>Thời gian (phút)</Text>
                <TextInput value={cookTime} onChangeText={setCookTime} keyboardType="numeric" style={styles.metaInput} />
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.label}>Độ khó</Text>
                <TouchableOpacity 
                    style={styles.metaInput}
                    onPress={() => {
                        const nextDiff = difficulty === 'EASY' ? 'MEDIUM' : difficulty === 'MEDIUM' ? 'HARD' : 'EASY';
                        setDifficulty(nextDiff);
                    }}
                >
                    <Text>{difficulty === 'EASY' ? 'Dễ' : difficulty === 'MEDIUM' ? 'Trung bình' : 'Khó'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Nguyên liệu */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nguyên Liệu</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={styles.dragHandle}><Feather name="menu" size={16} color="#ccc" /></View>
                <View style={{ flex: 1 }}>
                    <TextInput 
                        placeholder="Tên nguyên liệu (VD: Sườn non)" 
                        value={ing.name} 
                        onChangeText={(t) => updateIngredient(i, 'name', t)} 
                        style={[styles.ingInput, { marginBottom: 8 }]} 
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TextInput placeholder="SL" value={ing.quantity} onChangeText={(t) => updateIngredient(i, 'quantity', t)} style={[styles.ingInput, { width: 60 }]} keyboardType="numeric"/>
                        <TextInput placeholder="Đơn vị" value={ing.unit} onChangeText={(t) => updateIngredient(i, 'unit', t)} style={[styles.ingInput, { width: 80 }]} />
                        <TextInput placeholder="Ghi chú" value={ing.note} onChangeText={(t) => updateIngredient(i, 'note', t)} style={[styles.ingInput, { flex: 1 }]} />
                    </View>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(i)} style={styles.removeBtn}>
                  <Feather name="x" size={18} color="#555" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addIngredient} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Nguyên liệu</Text>
            </TouchableOpacity>
          </View>

          {/* Cách làm */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cách Làm</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{i + 1}</Text></View>
                  {steps.length > 1 && (
                    <TouchableOpacity onPress={() => removeStep(i)}>
                      <Feather name="x" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
                
                <TextInput placeholder="Mô tả bước làm..." value={step.description} onChangeText={(t) => updateStepDesc(t, i)} multiline style={styles.stepInput} />

                <View style={styles.stepImagesContainer}>
                  {step.images.map((img, j) => (
                    <View key={j} style={styles.stepThumbWrapper}>
                      <Image source={{ uri: img.uri }} style={styles.stepThumb} />
                      <TouchableOpacity style={styles.removeThumbBtn} onPress={() => removeStepImage(i, j)}>
                        <Feather name="x" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addStepImageBtn} onPress={() => pickStepImage(i)}>
                    <Feather name="camera" size={24} color="#aaa" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={addStep} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Thêm bước</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
  iconBtn: { padding: 4 },
  publishBtn: { backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  disabledBtn: { backgroundColor: '#aaa' },
  publishText: { color: '#fff', fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, alignItems: 'center' },
  loadingText: { marginTop: 5, color: '#007bff', fontWeight: '500' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  imageUploadSection: { alignItems: 'center', marginBottom: 24, gap: 12 },
  mainImagePreview: { width: 100, height: 100, borderRadius: 50, borderWidth: 1, borderColor: '#ccc' },
  imagePlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  uploadTextBtn: { color: '#555', paddingVertical: 6, paddingHorizontal: 16, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, fontSize: 14 },
  section: { marginBottom: 24 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 12, fontSize: 16, color: '#333' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  metaGrid: { flexDirection: 'row', gap: 10 },
  metaItem: { flex: 1 },
  label: { fontSize: 13, color: '#777', marginBottom: 4 },
  metaInput: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0e0e0', color: '#333', textAlign: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#e0e0e0' },
  dragHandle: { padding: 8, marginRight: 4, justifyContent: 'center' },
  ingInput: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 4, fontSize: 15, color: '#333' },
  removeBtn: { padding: 8, marginLeft: 4, backgroundColor: '#f0f0f0', borderRadius: 15, width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  addBtn: { alignSelf: 'flex-start', marginTop: 8 },
  addBtnText: { color: '#007bff', fontWeight: '500', fontSize: 16 },
  stepContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  stepBadgeText: { fontSize: 12, fontWeight: 'bold', color: '#555' },
  stepInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: 'top', fontSize: 16, color: '#333', marginBottom: 10 },
  stepImagesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stepThumbWrapper: { position: 'relative', width: 70, height: 70 },
  stepThumb: { width: '100%', height: '100%', borderRadius: 8 },
  removeThumbBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: 'rgba(0,0,0,0.6)', width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addStepImageBtn: { width: 70, height: 70, borderRadius: 8, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
});
