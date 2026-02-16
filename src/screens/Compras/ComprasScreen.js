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
import PurchaseModal from '../../components/modals/PurchaseModal';

export default function ComprasScreen() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
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
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los paquetes');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPackage = (pkg) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
  };

  const handleConfirmPurchase = async (phoneNumber) => {
    try {
      // Crear el pedido directamente como "completed"
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
      const newTotal = (profile?.total_spent || 0) + parseFloat(selectedPackage.price);
      await updateProfile({ total_spent: newTotal });

      setModalVisible(false);
      
      Alert.alert(
        '¡Éxito! 🎉',
        `Tu recarga de ${selectedPackage.amount} CUP al número +53 ${phoneNumber} ha sido procesada exitosamente.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo completar la compra');
      console.error(error);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'popular') return pkg.is_featured;
    if (selectedFilter === 'low') return pkg.amount <= 120;
    if (selectedFilter === 'high') return pkg.amount >= 240;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* Filtros */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterText, selectedFilter === 'all' && styles.filterTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'popular' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('popular')}
          >
            <Text style={[styles.filterText, selectedFilter === 'popular' && styles.filterTextActive]}>
              🔥 Popular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'low' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('low')}
          >
            <Text style={[styles.filterText, selectedFilter === 'low' && styles.filterTextActive]}>
              Pequeños
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilter === 'high' && styles.filterButtonActive]}
            onPress={() => setSelectedFilter('high')}
          >
            <Text style={[styles.filterText, selectedFilter === 'high' && styles.filterTextActive]}>
              Grandes
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Lista de Paquetes */}
        <ScrollView style={styles.packageList}>
          {filteredPackages.map((pkg) => (
            <View key={pkg.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardAmount}>{pkg.amount} CUP</Text>
                  <Text style={styles.cardName}>{pkg.name}</Text>
                </View>
                {pkg.is_featured && (
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredText}>POPULAR</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardDescription}>{pkg.description}</Text>

              <View style={styles.cardFooter}>
                <View>
                  {pkg.original_price && (
                    <Text style={styles.cardOriginalPrice}>
                      ${pkg.original_price}
                    </Text>
                  )}
                  <Text style={styles.cardPrice}>${pkg.price} USD</Text>
                </View>

                <TouchableOpacity
                  style={styles.buyButton}
                  onPress={() => handleBuyPackage(pkg)}
                >
                  <Text style={styles.buyButtonText}>Comprar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

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
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  packageList: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cardName: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  featuredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  featuredText: {
    color: '#DC2626',
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardOriginalPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  cardPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  buyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});