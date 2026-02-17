import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

// Auth Store
import { useAuthStore } from '../stores/authStore';

// Notifications Hook
import { useNotifications } from '../hooks/useNotifications';

// Auth Screens
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';

// Main Screens
import HomeScreen from '../screens/Home/HomeScreen';
import ComprasScreen from '../screens/Compras/ComprasScreen';
import PedidosScreen from '../screens/Pedidos/PedidosScreen';
import PerfilScreen from '../screens/Perfil/PerfilScreen';

// Profile Stack Screens
import EditProfileScreen from '../screens/Perfil/EditProfileScreen';
import FavoriteNumbersScreen from '../screens/Perfil/FavoriteNumbersScreen';

// Admin Screens
import DashboardScreen from '../screens/Admin/DashboardScreen';
import AdminUsersScreen from '../screens/Admin/AdminUsersScreen';
import AdminOrdersScreen from '../screens/Admin/AdminOrdersScreen';
import AdminPackagesScreen from '../screens/Admin/AdminPackagesScreen';
import AdminNotificationsScreen from '../screens/Admin/AdminNotificationsScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const AdminStack = createNativeStackNavigator();

// ─── Stack de Autenticación ───────────────────────────────────────────────────
function AuthStackScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

// ─── Stack de Perfil ──────────────────────────────────────────────────────────
function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <ProfileStack.Screen
        name="PerfilMain"
        component={PerfilScreen}
        options={{ headerShown: false }}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Editar Perfil' }}
      />
      <ProfileStack.Screen
        name="FavoriteNumbers"
        component={FavoriteNumbersScreen}
        options={{ title: 'Números Favoritos' }}
      />
    </ProfileStack.Navigator>
  );
}

// ─── Stack de Admin ───────────────────────────────────────────────────────────
function AdminStackScreen() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <AdminStack.Screen
        name="DashboardMain"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <AdminStack.Screen
        name="AdminUsers"
        component={AdminUsersScreen}
        options={{ title: 'Gestión de Usuarios' }}
      />
      <AdminStack.Screen
        name="AdminOrders"
        component={AdminOrdersScreen}
        options={{ title: 'Gestión de Pedidos' }}
      />
      <AdminStack.Screen
        name="AdminPackages"
        component={AdminPackagesScreen}
        options={{ title: 'Gestión de Paquetes' }}
      />
      <AdminStack.Screen
        name="AdminNotifications"
        component={AdminNotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
    </AdminStack.Navigator>
  );
}

// ─── Tabs para Usuarios Normales ──────────────────────────────────────────────
function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Compras') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Compras"
        component={ComprasScreen}
        options={{ title: 'Comprar Saldo' }}
      />
      <Tab.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{ title: 'Mis Pedidos' }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStackScreen}
        options={{ title: 'Mi Perfil', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// ─── Tabs para Admin ──────────────────────────────────────────────────────────
function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Dashboard') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else if (route.name === 'Compras') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Pedidos') {
            iconName = focused ? 'list' : 'list-outline';
          } else if (route.name === 'Perfil') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#3B82F6' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio' }}
      />
      <Tab.Screen
        name="Dashboard"
        component={AdminStackScreen}
        options={{ title: 'Admin', headerShown: false }}
      />
      <Tab.Screen
        name="Compras"
        component={ComprasScreen}
        options={{ title: 'Comprar Saldo' }}
      />
      <Tab.Screen
        name="Pedidos"
        component={PedidosScreen}
        options={{ title: 'Mis Pedidos' }}
      />
      <Tab.Screen
        name="Perfil"
        component={ProfileStackScreen}
        options={{ title: 'Mi Perfil', headerShown: false }}
      />
    </Tab.Navigator>
  );
}

// ─── Componente que usa el Hook de Notificaciones ─────────────────────────────
// Este componente va DENTRO del NavigationContainer para poder usar useNavigation
function NavigatorWithNotifications() {
  const { user, isAdmin } = useAuthStore();

  // Hook de notificaciones (solo activo cuando hay usuario)
  useNotifications();

  if (!user) return <AuthStackScreen />;
  if (isAdmin) return <AdminTabs />;
  return <UserTabs />;
}

// ─── Navegador Principal ──────────────────────────────────────────────────────
export default function AppNavigator() {
  const { loading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <NavigatorWithNotifications />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});