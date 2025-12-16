import React, { useState, useEffect } from 'react';
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
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons'; 
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker'; 
import * as FileSystem from 'expo-file-system';       
import apiClient from '../apiClient';

export default function AddRecipeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { recipeId } = route.params || {}; 
  const isEditing = !!recipeId;

  // --- STATE ---
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const [description, setDescription] = useState('');
  
  // STATE CHO: THỜI GIAN, KHẨU PHẦN, ĐỘ KHÓ
  const [cookTime, setCookTime] = useState('30'); 
  const [servings, setServings] = useState('2');  
  const [difficulty, setDifficulty] = useState('EASY'); 

  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // 🔹 STATE CHO AI
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [ingredients, setIngredients] = useState([
    { name: '', quantity: '', unit: '', note: '', required: true, error: '' }
  ]);

  const [steps, setSteps] = useState([{ description: '', images: [] }]);
  const [mainImage, setMainImage] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [uploadingMsg, setUploadingMsg] = useState('');

  // --- 1. LOAD DATA ---
  useEffect(() => {
    apiClient.get('/category')
      .then(res => setAllCategories(res.data.data || []))
      .catch(err => console.error("Lỗi tải danh mục:", err));

    if (isEditing) {
      fetchRecipeData();
    }
  }, [recipeId]);

  const fetchRecipeData = async () => {
    setInitialLoading(true);
    try {
      const res = await apiClient.get(`/recipes/${recipeId}`);
      const data = res.data.data;

      setTitle(data.title);
      setDescription(data.description || '');
      
      if (data.cookTimeMinutes) setCookTime(String(data.cookTimeMinutes));
      if (data.servings) setServings(String(data.servings));
      if (data.difficulty) setDifficulty(data.difficulty);
      
      if (data.category) setSelectedCategory(data.category);

      if (data.ingredients && data.ingredients.length > 0) {
        const mappedIngs = data.ingredients.map(i => ({
          name: i.ingredient.name,
          quantity: String(i.quantity),
          unit: i.unit,
          note: i.note || '',
          required: i.required,
          error: ''
        }));
        setIngredients(mappedIngs);
      }

      const avatarMedia = data.medias?.find(m => m.type === 'AVATAR');
      if (avatarMedia) {
        setMainImage({ uri: avatarMedia.media.url, id: avatarMedia.media.id });
      }

      if (data.steps && data.steps.length > 0) {
        const sortedSteps = data.steps.sort((a, b) => a.stepOrder - b.stepOrder);
        const mappedSteps = sortedSteps.map(s => ({
          description: s.description,
          images: s.medias ? s.medias.map(m => ({ uri: m.media.url, id: m.media.id })) : []
        }));
        setSteps(mappedSteps);
      }

    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải dữ liệu công thức.");
      navigation.goBack();
    } finally {
      setInitialLoading(false);
    }
  };

  // --- IMAGE PICKER ---
  const pickMainImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setMainImage(result.assets[0]);
      }
    } catch {
      Alert.alert("Lỗi", "Không thể mở thư viện ảnh.");
    }
  };

  const pickStepImage = async (stepIndex) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
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

  // 🔹 --- FILE PICKER FOR AI ---
const pickDocument = async () => {
    try {
      console.log("Đang mở trình chọn file...");
      
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', 
        copyToCacheDirectory: true, 
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        console.log("URI file:", fileUri);

        //  Dùng fetch để đọc file text
        const response = await fetch(fileUri);
        const content = await response.text();
        
        console.log("Đọc thành công!");
        setAiInputText(content);
      }
    } catch (err) {
      console.error("LỖI ĐỌC FILE:", err);
      Alert.alert("Lỗi", "Chi tiết lỗi: " + err.message);
    }
  };
  // 🔹 --- AI MAGIC FILL HANDLER ---
  const handleGenerateByAI = async () => {
    if (!aiInputText.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập nội dung hoặc chọn file');
    
    setAiLoading(true);
    try {
      // Gọi API Backend
      const res = await apiClient.post('/ai/generate-recipe', { content: aiInputText });
      const aiDataString = res.data.data;
      
      // Parse JSON
      let aiData;
      try {
        aiData = JSON.parse(aiDataString);
      } catch (e) {
        // Fallback nếu AI trả về lỗi định dạng
        console.error("AI JSON Parse Error:", e);
        Alert.alert("Lỗi AI", "Dữ liệu AI trả về không đúng định dạng JSON.");
        setAiLoading(false);
        return;
      }

      // Điền vào Form
      if (aiData.title) setTitle(aiData.title);
      if (aiData.description) setDescription(aiData.description);
      if (aiData.cookTimeMinutes) setCookTime(String(aiData.cookTimeMinutes));
      if (aiData.servings) setServings(String(aiData.servings));
      if (aiData.difficulty) setDifficulty(aiData.difficulty);

      // Map Ingredients
      if (aiData.ingredients && aiData.ingredients.length > 0) {
        const newIngs = aiData.ingredients.map(ing => ({
          name: ing.name,
          quantity: String(ing.quantity || ''),
          unit: ing.unit || '',
          note: ing.note || '',
          required: true,
          error: ''
        }));
        setIngredients(newIngs);
      }

      // Map Steps
      if (aiData.steps && aiData.steps.length > 0) {
        const newSteps = aiData.steps.map(step => ({
          description: step.description,
          images: [] 
        }));
        setSteps(newSteps);
      }

      setAiModalVisible(false);
      Alert.alert('Thành công', 'AI đã điền thông tin giúp bạn! Hãy kiểm tra lại nhé.');

    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || 'AI không hiểu nội dung này. Vui lòng thử lại chi tiết hơn.';
      Alert.alert('Lỗi', msg);
    } finally {
      setAiLoading(false);
    }
  };

  // --- UPLOAD ---
  const handleImageUpload = async (imageObj, endpoint) => {
    if (imageObj.id) return imageObj.id; 

    const formData = new FormData();
    const uri = Platform.OS === "android" ? imageObj.uri : imageObj.uri.replace("file://", "");
    const filename = uri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', { uri, name: filename || `upload_${Date.now()}.jpg`, type });

    try {
      const res = await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data.id;
    } catch (error) {
      console.error(`Upload failed to ${endpoint}:`, error);
      throw error;
    }
  };

  // --- HANDLERS ---
  const handleTitleChange = (text) => {
    setTitle(text);
    if (!text.trim()) setTitleError('Tên món không được để trống');
    else setTitleError('');
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngs = [...ingredients];
    newIngs[index][field] = value;
    if (field === 'name') {
      newIngs[index].error = !value.trim() ? 'Tên nguyên liệu trống' : '';
    }
    setIngredients(newIngs);
  };

  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: '', unit: '', note: '', required: true, error: '' }]);
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

  // --- SUBMIT ---
  const submitRecipe = async () => {
    if (!title.trim()) return Alert.alert('Lỗi', 'Vui lòng nhập tên món');
    if (!selectedCategory) return Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
    
    const timeVal = parseInt(cookTime);
    const servVal = parseInt(servings);
    if (isNaN(timeVal) || timeVal <= 0) return Alert.alert('Lỗi', 'Thời gian nấu không hợp lệ');
    if (isNaN(servVal) || servVal <= 0) return Alert.alert('Lỗi', 'Khẩu phần ăn không hợp lệ');

    const validIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    if (validIngredients.length === 0) return Alert.alert('Lỗi', 'Cần ít nhất 1 nguyên liệu');

    setLoading(true);
    try {
      let mainMediaId = null;
      if (mainImage) {
        setUploadingMsg('Đang xử lý ảnh bìa...');
        mainMediaId = await handleImageUpload(mainImage, '/media/recipe-avatar');
      }

      setUploadingMsg('Đang xử lý ảnh các bước...');
      const stepsWithMedia = await Promise.all(steps.map(async (step, index) => {
        let uploadedMediaIds = [];
        if (step.images.length > 0) {
          uploadedMediaIds = await Promise.all(step.images.map(img => handleImageUpload(img, '/media/step-image')));
        }
        return {
          stepOrder: index + 1,
          description: step.description,
          medias: uploadedMediaIds.map(id => ({ media: { id } }))
        };
      }));

      setUploadingMsg(isEditing ? 'Đang cập nhật...' : 'Đang tạo công thức...');
      
      const ingredientsPayload = validIngredients.map(ing => ({
          ingredient: { name: ing.name },
          quantity: parseFloat(ing.quantity) || 0,
          unit: ing.unit,
          required: ing.required,
          note: ing.note || ''
        }));

      const mediasPayload = mainMediaId ? [{ media: { id: mainMediaId }, type: 'AVATAR' }] : [];

      const finalPayload = {
        title,
        description,
        cookTimeMinutes: timeVal,
        servings: servVal,
        difficulty,
        category: { id: selectedCategory.id },
        ingredients: ingredientsPayload,
        steps: stepsWithMedia,
        medias: mediasPayload
      };

      if (isEditing) {
        await apiClient.patch(`/recipes/${recipeId}`, finalPayload);
        Alert.alert('Thành công', 'Cập nhật công thức thành công!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await apiClient.post('/recipes', finalPayload);
        Alert.alert('Thành công 🎉', 'Công thức đã được đăng!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }

    } catch (err) {
      console.error('Submit Error:', err);
      Alert.alert('Lỗi', err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
      setUploadingMsg('');
    }
  };

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="x" size={24} color="#555" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? 'Sửa công thức' : 'Tạo công thức mới'}</Text>
          <TouchableOpacity 
            onPress={submitRecipe} 
            disabled={loading} 
            style={[styles.publishBtn, loading && styles.disabledBtn]}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.publishText}>{isEditing ? 'Lưu' : 'Đăng'}</Text>}
          </TouchableOpacity>
        </View>

        {loading && uploadingMsg ? (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.loadingText}>{uploadingMsg}</Text>
          </View>
        ) : null}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* 🔹 NÚT TẠO BẰNG AI */}
          <TouchableOpacity 
            style={styles.aiMagicBtn} 
            onPress={() => setAiModalVisible(true)}
          >
            <Feather name="zap" size={18} color="#fff" />
            <Text style={styles.aiMagicText}>Tạo nhanh bằng AI</Text>
          </TouchableOpacity>

          {/* ẢNH BÌA */}
          <View style={styles.imageUploadSection}>
            <TouchableOpacity onPress={pickMainImage}>
              {mainImage ? (
                <Image source={{ uri: mainImage.uri }} style={styles.mainImagePreview} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Feather name="camera" size={32} color="#aaa" />
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.uploadTextBtn}>Ảnh đại diện món ăn</Text>
          </View>

          {/* THÔNG TIN CHUNG */}
          <View style={styles.section}>
            <Text style={styles.label}>Tên món ăn <Text style={{color:'red'}}>*</Text></Text>
            <TextInput 
              placeholder="Ví dụ: Phở bò..." 
              value={title} 
              onChangeText={handleTitleChange} 
              style={[styles.input, titleError && { borderColor: 'red' }]} 
            />
            {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
            
            <Text style={styles.label}>Mô tả</Text>
            <TextInput 
              placeholder="Giới thiệu sơ qua..." 
              value={description} 
              onChangeText={setDescription} 
              multiline 
              style={[styles.input, styles.textArea]} 
            />
            
            <View style={styles.row}>
                <View style={styles.col}>
                    <Text style={styles.label}>Thời gian (phút)</Text>
                    <TextInput 
                        keyboardType="numeric" 
                        value={cookTime} 
                        onChangeText={setCookTime} 
                        style={styles.input} 
                        placeholder="30"
                    />
                </View>
                <View style={[styles.col, { marginLeft: 12 }]}>
                    <Text style={styles.label}>Khẩu phần (người)</Text>
                    <TextInput 
                        keyboardType="numeric" 
                        value={servings} 
                        onChangeText={setServings} 
                        style={styles.input} 
                        placeholder="2"
                    />
                </View>
            </View>

             <Text style={styles.label}>Độ khó</Text>
             <View style={styles.difficultyRow}>
                {['EASY', 'MEDIUM', 'HARD'].map(d => (
                    <TouchableOpacity 
                        key={d} 
                        style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                        onPress={() => setDifficulty(d)}
                    >
                        <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>
                            {d === 'EASY' ? 'Dễ' : d === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                        </Text>
                    </TouchableOpacity>
                ))}
             </View>

          </View>

          {/* DANH MỤC */}
          <View style={styles.section}>
            <Text style={styles.label}>Danh mục <Text style={{color:'red'}}>*</Text></Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setModalVisible(true)}>
              <Text style={{ color: selectedCategory ? '#333' : '#999' }}>
                {selectedCategory ? selectedCategory.name : 'Chọn danh mục...'}
              </Text>
              <Feather name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* NGUYÊN LIỆU */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nguyên Liệu</Text>
            {ingredients.map((ing, i) => (
              <View key={i} style={styles.ingredientRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    placeholder="Tên nguyên liệu..." 
                    value={ing.name} 
                    onChangeText={(t) => handleIngredientChange(i, 'name', t)}
                    style={[styles.ingInput, ing.error && { borderColor: 'red' }]}
                  />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput placeholder="SL" value={ing.quantity} onChangeText={t => handleIngredientChange(i, 'quantity', t)} style={[styles.ingInput, { width: 60 }]} keyboardType="numeric"/>
                    <TextInput placeholder="Đơn vị" value={ing.unit} onChangeText={t => handleIngredientChange(i, 'unit', t)} style={[styles.ingInput, { width: 80 }]} />
                    <TextInput placeholder="Ghi chú" value={ing.note} onChangeText={t => handleIngredientChange(i, 'note', t)} style={[styles.ingInput, { flex: 1 }]} />
                  </View>
                </View>
                <TouchableOpacity onPress={() => removeIngredient(i)} style={styles.removeBtn}>
                  <Feather name="x" size={18} color="#555" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={addIngredient} style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Thêm nguyên liệu</Text>
            </TouchableOpacity>
          </View>

          {/* CÁCH LÀM */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cách Làm</Text>
            {steps.map((step, i) => (
              <View key={i} style={styles.stepContainer}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepBadge}><Text style={styles.stepBadgeText}>{i+1}</Text></View>
                  <Text style={{ fontWeight: '600', marginLeft: 8, flex: 1 }}>Bước {i+1}</Text>
                  {steps.length > 1 && <TouchableOpacity onPress={() => removeStep(i)}><Feather name="x" size={20} color="#999" /></TouchableOpacity>}
                </View>
                <TextInput 
                    placeholder="Mô tả bước làm..." 
                    value={step.description} 
                    onChangeText={t => updateStepDesc(t, i)} 
                    multiline 
                    style={styles.stepInput} 
                />
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
              <Text style={styles.addBtnText}>+ Thêm bước làm</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>

        {/* MODAL DANH MỤC */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Chọn danh mục</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}><Feather name="x" size={24} color="#333" /></TouchableOpacity>
              </View>
              <FlatList
                data={allCategories}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => { setSelectedCategory(item); setModalVisible(false); }}>
                    <Text style={[styles.modalItemText, selectedCategory?.id === item.id && styles.modalItemTextSelected]}>{item.name}</Text>
                    {selectedCategory?.id === item.id && <Feather name="check" size={20} color="#007bff" />}
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 🔹 MODAL AI INPUT */}
        <Modal visible={aiModalVisible} animationType="slide" transparent>
            <View style={styles.modalOverlay}>
              <View style={styles.aiModalContent}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                    <Text style={styles.modalTitle}>✨ AI Trợ Lý Bếp</Text>
                    <TouchableOpacity onPress={() => setAiModalVisible(false)}><Feather name="x" size={24} color="#333" /></TouchableOpacity>
                </View>
                <Text style={styles.modalSub}>Nhập tên món, nguyên liệu thô, hoặc tải file text (.txt) để AI tự điền công thức.</Text>
                
                <TextInput
                  style={styles.aiInput}
                  multiline
                  placeholder="VD: Gà kho gừng, cần nửa con gà, gừng, nước mắm. Kho 20 phút..."
                  value={aiInputText}
                  onChangeText={setAiInputText}
                />

                <View style={styles.aiActionRow}>
                    <TouchableOpacity onPress={pickDocument} style={styles.fileBtn}>
                        <Feather name="file-text" size={20} color="#007bff" />
                        <Text style={{color: '#007bff', fontWeight:'500'}}>Chọn file .txt</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity onPress={() => setAiModalVisible(false)} style={styles.cancelBtn}>
                    <Text style={{color:'#666'}}>Hủy</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleGenerateByAI} 
                    style={styles.generateBtn}
                    disabled={aiLoading}
                  >
                    {aiLoading ? <ActivityIndicator color="#fff" size="small"/> : <Text style={{color:'#fff', fontWeight:'bold'}}>Tạo ngay</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f5f7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  iconBtn: { padding: 4 },
  publishBtn: { backgroundColor: '#007bff', paddingVertical: 8, paddingHorizontal: 20, borderRadius: 20 },
  disabledBtn: { backgroundColor: '#aaa' },
  publishText: { color: '#fff', fontWeight: '600' },
  loadingOverlay: { position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, alignItems: 'center' },
  loadingText: { marginTop: 5, color: '#007bff', fontWeight: '500' },
  errorText: { color: 'red', fontSize: 12, marginBottom: 8 },
  
  scrollContent: { padding: 16, paddingBottom: 40 },
  imageUploadSection: { alignItems: 'center', marginBottom: 24 },
  mainImagePreview: { width: 120, height: 120, borderRadius: 12, borderWidth: 1, borderColor: '#ccc' },
  imagePlaceholder: { width: 120, height: 120, borderRadius: 12, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
  uploadTextBtn: { color: '#555', marginTop: 8, fontSize: 13 },
  
  section: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '500', marginBottom: 6, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 12 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row', marginBottom: 12 },
  col: { flex: 1 },

  difficultyRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  diffBtn: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center', backgroundColor: '#fff' },
  diffBtnActive: { backgroundColor: '#e6f7ff', borderColor: '#007bff' },
  diffText: { color: '#555', fontSize: 13 },
  diffTextActive: { color: '#007bff', fontWeight: 'bold' },

  selectInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#222' },
  
  ingredientRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  ingInput: { backgroundColor: '#fff', borderRadius: 8, padding: 8, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 6 },
  removeBtn: { marginLeft: 8, marginTop: 12, padding: 4 },
  addBtn: { backgroundColor: '#fff', padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: '#007bff', borderStyle: 'dashed' },
  addBtnText: { color: '#007bff', fontWeight: '600' },
  
  stepContainer: { backgroundColor: '#fff', padding: 12, borderRadius: 12, marginBottom: 12, elevation: 1 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#007bff', justifyContent: 'center', alignItems: 'center' },
  stepBadgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  stepInput: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 8, padding: 10, minHeight: 80, textAlignVertical: 'top', backgroundColor: '#f9f9f9', marginBottom: 10 },
  stepImagesContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  stepThumbWrapper: { position: 'relative', marginRight: 10, marginBottom: 10 },
  stepThumb: { width: 70, height: 70, borderRadius: 8 },
  removeThumbBtn: { position: 'absolute', top: -6, right: -6, backgroundColor: '#ff4d4f', borderRadius: 10, padding: 4 },
  addStepImageBtn: { width: 70, height: 70, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', maxHeight: '60%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 16, fontWeight: 'bold' },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  modalItemText: { fontSize: 16, color: '#333' },
  modalItemTextSelected: { fontWeight: '600', color: '#007bff' },

  // 🔹 STYLES CHO AI
  aiMagicBtn: {
    backgroundColor: '#8e44ad',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8e44ad', shadowOffset: {width:0,height:2}, shadowOpacity:0.3, shadowRadius:4
  },
  aiMagicText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  aiModalContent: { backgroundColor: '#fff', padding: 20, margin: 16, borderRadius: 16, marginTop: '30%', shadowColor: '#000', shadowOffset:{width:0,height:2}, shadowOpacity:0.25, shadowRadius:4, elevation:5 },
  modalSub: { color: '#666', marginTop: 8, marginBottom: 12 },
  aiInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, height: 140, textAlignVertical: 'top', fontSize: 15, backgroundColor: '#f9f9f9' },
  aiActionRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
  fileBtn: { flexDirection: 'row', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#007bff', borderRadius: 8, backgroundColor: '#e6f7ff' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 24, gap: 16, alignItems: 'center' },
  cancelBtn: { padding: 10 },
  generateBtn: { backgroundColor: '#8e44ad', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
});
