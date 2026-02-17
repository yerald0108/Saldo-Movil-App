import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import { ordersService } from '../../services/ordersService';
import PurchaseModal from '../../components/modals/PurchaseModal';
import { notificationService } from '../../services/notificationService';

export default function HomeScreen({ navigation }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredPackage, setFeaturedPackage] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const { user, profile, updateProfile } = useAuthStore();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('amount', { ascending: false });

      if (error) throw error;

      setPackages(data);
      const featured = data.find(pkg => pkg.is_featured);
      setFeaturedPackage(featured || data[0]);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los paquetes');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = (pkg) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
  };

// Actualiza handleConfirmPurchase
const handleConfirmPurchase = async (phoneNumber) => {
  try {
    const result = await supabase
      .from('orders')
      .insert([
        {
          user_id: user.id,
          package_id: selectedPackage.id,
          phone_number: phoneNumber,
          amount: selectedPackage.price,
          status: 'completed',
          completed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (result.error) {
      throw new Error(result.error.message);
    }

    // Actualizar total gastado del usuario
    const newTotal =
      (profile?.total_spent || 0) + parseFloat(selectedPackage.price);
    await updateProfile({ total_spent: newTotal });

    // 🔔 Enviar notificación de éxito
    await notificationService.notifyRechargeSuccess(
      phoneNumber,
      selectedPackage.amount
    );

    setModalVisible(false);

    Alert.alert(
      '¡Éxito! 🎉',
      `Tu recarga de ${selectedPackage.amount} CUP al número +53 ${phoneNumber} ha sido procesada exitosamente.`,
      [
        {
          text: 'Ver Mis Pedidos',
          onPress: () => navigation.navigate('Pedidos'),
        },
        { text: 'OK' },
      ]
    );
  } catch (error) {
    Alert.alert('Error', error.message || 'No se pudo completar la compra');
    console.error(error);
  }
};

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando ofertas...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Hero Section - Paquete Destacado */}
        {featuredPackage && (
          <View style={styles.heroSection}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🔥 MÁS POPULAR</Text>
            </View>
            <Text style={styles.heroTitle}>Paquete {featuredPackage.amount}</Text>
            <Text style={styles.heroDescription}>{featuredPackage.description}</Text>
            
            <View style={styles.priceContainer}>
              {featuredPackage.original_price && (
                <Text style={styles.originalPrice}>
                  ${featuredPackage.original_price}
                </Text>
              )}
              <Text style={styles.currentPrice}>${featuredPackage.price}</Text>
            </View>

            <TouchableOpacity
              style={styles.heroButton}
              onPress={() => handleBuyPackage(featuredPackage)}
            >
              <Text style={styles.heroButtonText}>Comprar Ahora</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Sección de Otros Paquetes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Todos los Paquetes</Text>
          
          {packages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.packageCard}
              onPress={() => handleBuyPackage(pkg)}
            >
              <View style={styles.packageInfo}>
                <Text style={styles.packageAmount}>{pkg.amount} CUP</Text>
                <Text style={styles.packageName}>{pkg.name}</Text>
              </View>
              
              <View style={styles.packagePricing}>
                {pkg.original_price && (
                  <Text style={styles.packageOriginalPrice}>
                    ${pkg.original_price}
                  </Text>
                )}
                <Text style={styles.packagePrice}>${pkg.price}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Promoción Banner */}
        <View style={styles.promoBanner}>
          <Text style={styles.promoText}>
            🎁 ¡Recarga ahora y ahorra hasta 25%!
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Compra */}
      <PurchaseModal
        visible={modalVisible}
        package={selectedPackage}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmPurchase}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  heroSection: {
    backgroundColor: '#3B82F6',
    padding: 24,
    margin: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  badgeText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 12,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 16,
    color: '#E0E7FF',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  originalPrice: {
    fontSize: 20,
    color: '#E0E7FF',
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  heroButtonText: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  packageInfo: {
    flex: 1,
  },
  packageAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  packageName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  packagePricing: {
    alignItems: 'flex-end',
  },
  packageOriginalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  packagePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  promoBanner: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  promoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
});