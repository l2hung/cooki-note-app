import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// --- IMPORT SCREENS ---
import WelcomeScreen from './screens/WelcomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';

import HomeScreen from './screens/HomeScreen';
import SearchScreen from './screens/SearchScreen';
import LikedRecipesScreen from './screens/LikedRecipesScreen';
import NotificationScreen from './screens/NotificationScreen';
import ProfileScreen from './screens/ProfileScreen';

import AddRecipeScreen from './screens/AddRecipeScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import RecipeDetailScreen from './screens/RecipeDetailScreen';
import StatsScreen from './screens/StatsScreen';
import AISuggestScreen from './screens/AISuggestScreen';
import HistoryScreen from './screens/HistoryScreen';
import FriendsScreen from './screens/FriendsScreen';
import CategoryScreen from './screens/CategoryScreen';
import CategoryListScreen from './screens/CategoryListScreen';
import AdminDashboardScreen from './screens/admin/AdminDashboardScreen';
import AdminUsersScreen from './screens/admin/AdminUsersScreen';
import AdminRecipesScreen from './screens/admin/AdminRecipesScreen';
import AdminCategoriesScreen from './screens/admin/AdminCategoriesScreen';

// --- IMPORT COMPONENTS ---
import BottomTabBar from './components/BottomTabBar';
import FloatingAddButton from './components/FloatingAddButton';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Các Stack con
const HomeStack = createNativeStackNavigator();
const SearchStack = createNativeStackNavigator();
const LikedStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();


function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <HomeStack.Screen name="Profile" component={ProfileScreen} />
      <HomeStack.Screen name="Category" component={CategoryScreen} />
      <HomeStack.Screen name="CategoryList" component={CategoryListScreen} />
      <HomeStack.Screen name="NotificationTab" component={NotificationScreen} />
      <HomeStack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <HomeStack.Screen name="AISuggest" component={AISuggestScreen} />
      <HomeStack.Screen name="History" component={HistoryScreen} />
      <HomeStack.Screen name="Stats" component={StatsScreen} />
      <HomeStack.Screen name="Friends" component={FriendsScreen} />
      <HomeStack.Screen name="Settings" component={SettingsScreen} />
      <HomeStack.Screen name="EditProfile" component={EditProfileScreen} />
    </HomeStack.Navigator>
  );
}

function SearchStackScreen() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <SearchStack.Screen name="Profile" component={ProfileScreen} />
      <SearchStack.Screen name="Category" component={CategoryScreen} />
      <SearchStack.Screen name="CategoryList" component={CategoryListScreen} />
      <SearchStack.Screen name="NotificationTab" component={NotificationScreen} />
      <SearchStack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <SearchStack.Screen name="AISuggest" component={AISuggestScreen} />
      <SearchStack.Screen name="History" component={HistoryScreen} />
      <SearchStack.Screen name="Stats" component={StatsScreen} />
      <SearchStack.Screen name="Friends" component={FriendsScreen} />
      <SearchStack.Screen name="Settings" component={SettingsScreen} />
      <SearchStack.Screen name="EditProfile" component={EditProfileScreen} />
    </SearchStack.Navigator>
  );
}

function LikedStackScreen() {
  return (
    <LikedStack.Navigator screenOptions={{ headerShown: false }}>
      <LikedStack.Screen name="Liked" component={LikedRecipesScreen} />
      <LikedStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <LikedStack.Screen name="Profile" component={ProfileScreen} />
      <LikedStack.Screen name="Category" component={CategoryScreen} />
      <LikedStack.Screen name="CategoryList" component={CategoryListScreen} />
      <LikedStack.Screen name="NotificationTab" component={NotificationScreen} />
      <LikedStack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <LikedStack.Screen name="AISuggest" component={AISuggestScreen} />
      <LikedStack.Screen name="History" component={HistoryScreen} />
      <LikedStack.Screen name="Stats" component={StatsScreen} />
      <LikedStack.Screen name="Friends" component={FriendsScreen} />
      <LikedStack.Screen name="Settings" component={SettingsScreen} />
      <LikedStack.Screen name="EditProfile" component={EditProfileScreen} />
    </LikedStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="MyProfile" component={ProfileScreen} initialParams={{ userId: 'me' }} />
      <ProfileStack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Category" component={CategoryScreen} />
      <ProfileStack.Screen name="CategoryList" component={CategoryListScreen} />
      <ProfileStack.Screen name="NotificationTab" component={NotificationScreen} />
      <ProfileStack.Screen name="ShoppingList" component={ShoppingListScreen} />
      <ProfileStack.Screen name="AISuggest" component={AISuggestScreen} />
      <ProfileStack.Screen name="History" component={HistoryScreen} />
      <ProfileStack.Screen name="Stats" component={StatsScreen} />
      <ProfileStack.Screen name="Friends" component={FriendsScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// --- MAIN TABS ---
function MainTabs() {
  return (
    <View style={styles.container}>
      <Tab.Navigator
        tabBar={(props) => <BottomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Tab.Screen name="HomeTab" component={HomeStackScreen} />
        <Tab.Screen name="SearchTab" component={SearchStackScreen} />
        <Tab.Screen name="LikedTab" component={LikedStackScreen} />
        <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
      </Tab.Navigator>

      <FloatingAddButton />
    </View>
  );
}

// --- ROOT APP ---
export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Auth */}
        <RootStack.Screen name="Welcome" component={WelcomeScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

        {/* Main */}
        <RootStack.Screen name="Main" component={MainTabs} />

        {/* Global Screens (Che mất BottomTab) */}
        <RootStack.Screen name="AddRecipe" component={AddRecipeScreen} />

        <RootStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <RootStack.Screen name="AdminUsers" component={AdminUsersScreen} />
        <RootStack.Screen name="AdminRecipes" component={AdminRecipesScreen} />
        <RootStack.Screen name="AdminCategories" component={AdminCategoriesScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative', 
  },
});
