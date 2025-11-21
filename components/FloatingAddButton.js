import React from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather'; 

export default function FloatingAddButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={() => navigation.navigate('AddRecipe')}
      activeOpacity={0.8}
    >

      <Feather name="plus" size={30} color="#fff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
  
    right: 20,
    bottom: 165, 
    
    width: 56,
    height: 56,
    borderRadius: 28, 
    backgroundColor: '#007bff', 
    
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, 
    
    elevation: 8, 
    shadowColor: '#007bff', 
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});