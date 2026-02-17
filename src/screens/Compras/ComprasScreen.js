import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useAuthStore } from '../../stores/authStore';
import PurchaseModal from '../../components/modals/PurchaseModal';
import { notificationService } from '../../services/notificationService';

export default function ComprasScreen() {
  const [packages, setPackages] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filtros
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState('amount_desc');
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const { user, profile, updateProfile } = useAuthStore();

  useEffect(() => {
    fetchPackages();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [packages, searchQuery, selectedFilter, minPrice, maxPrice, minAmount, maxAmount, sortBy]);

  useEffect(() => {
    countActiveFilters();
  }, [minPrice, maxPrice, minAmount, maxAmount, selectedFilter, sortBy]);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      setPackages(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los paquetes');
    } finally {
      setLoading(false);
    }
  };

  const countActiveFilters = () => {
    let count = 0;
    if (minPrice) count++;
    if (maxPrice) count++;
    if (minAmount) count++;
    if (maxAmount) count++;
    if (selectedFilter !== 'all') count++;
    if (sortBy !== 'amount_desc') count++;
    setActiveFiltersCount(count);
  };

  const applyFilters = () => {
    let filtered = [...packages];

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(query) ||
          pkg.description?.toLowerCase().includes(query) ||
          pkg.amount.toString().includes(query)
      );
    }

    // Filtro por categoría
    if (selectedFilter === 'popular') {
      filtered = filtered.filter((pkg) => pkg.is_featured);
    } else if (selectedFilter === 'discount') {
      filtered = filtered.filter((pkg) => pkg.original_price > pkg.price);
    }

    // Filtro por precio mínimo
    if (minPrice) {
      filtered = filtered.filter(
        (pkg) => parseFloat(pkg.price) >= parseFloat(minPrice)
      );
    }

    // Filtro por precio máximo
    if (maxPrice) {
      filtered = filtered.filter(
        (pkg) => parseFloat(pkg.price) <= parseFloat(maxPrice)
      );
    }

    // Filtro por saldo mínimo
    if (minAmount) {
      filtered = filtered.filter(
        (pkg) => pkg.amount >= parseInt(minAmount)
      );
    }

    // Filtro por saldo máximo
    if (maxAmount) {
      filtered = filtered.filter(
        (pkg) => pkg.amount <= parseInt(maxAmount)
      );
    }

    // Ordenar
    switch (sortBy) {
      case 'amount_desc':
        filtered.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount_asc':
        filtered.sort((a, b) => a.amount - b.amount);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'discount':
        filtered.sort(
          (a, b) =>
            (b.original_price - b.price) - (a.original_price - a.price)
        );
        break;
    }

    setFilteredPackages(filtered);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinAmount('');
    setMaxAmount('');
    setSelectedFilter('all');
    setSortBy('amount_desc');
    setSearchQuery('');
  };

  const handleBuyPackage = (pkg) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
  };

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

  const getDiscount = (pkg) => {
    if (!pkg.original_price || pkg.original_price <= pkg.price) return null;
    return Math.round(
      ((pkg.original_price - pkg.price) / pkg.original_price) * 100
    );
  };

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
        {/* Barra de Búsqueda */}
        <View style={styles.searchBar}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar paquetes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              activeFiltersCount > 0 && styles.filterButtonActive,
            ]}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons
              name="options"
              size={20}
              color={activeFiltersCount > 0 ? '#FFFFFF' : '#6B7280'}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Filtros Rápidos */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFilters}
        >
          {[
            { key: 'all', label: 'Todos' },
            { key: 'popular', label: '🔥 Popular' },
            { key: 'discount', label: '🏷️ Descuento' },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.quickFilterChip,
                selectedFilter === filter.key && styles.quickFilterChipActive,
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text
                style={[
                  styles.quickFilterText,
                  selectedFilter === filter.key && styles.quickFilterTextActive,
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Resultados */}
        <View style={styles.resultsBar}>
          <Text style={styles.resultsText}>
            {filteredPackages.length} paquete
            {filteredPackages.length !== 1 ? 's' : ''} encontrado
            {filteredPackages.length !== 1 ? 's' : ''}
          </Text>
          {activeFiltersCount > 0 && (
            <TouchableOpacity onPress={clearFilters}>
              <Text style={styles.clearFiltersText}>Limpiar filtros</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Lista de Paquetes */}
        <ScrollView style={styles.packageList}>
          {filteredPackages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptyText}>
                Intenta con otros filtros o términos de búsqueda
              </Text>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearFilters}
              >
                <Text style={styles.clearButtonText}>Limpiar Filtros</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredPackages.map((pkg) => {
              const discount = getDiscount(pkg);
              return (
                <View key={pkg.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <Text style={styles.cardAmount}>{pkg.amount} CUP</Text>
                      <Text style={styles.cardName}>{pkg.name}</Text>
                    </View>
                    <View style={styles.cardBadges}>
                      {pkg.is_featured && (
                        <View style={styles.featuredBadge}>
                          <Text style={styles.featuredText}>POPULAR</Text>
                        </View>
                      )}
                      {discount && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountText}>-{discount}%</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Text style={styles.cardDescription}>{pkg.description}</Text>

                  <View style={styles.cardFooter}>
                    <View>
                      {pkg.original_price && (
                        <Text style={styles.cardOriginalPrice}>
                          ${pkg.original_price}
                        </Text>
                      )}
                      <Text style={styles.cardPrice}>
                        ${pkg.price} USD
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.buyButton}
                      onPress={() => handleBuyPackage(pkg)}
                    >
                      <Text style={styles.buyButtonText}>Comprar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>

      {/* Modal de Filtros Avanzados */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Filtros Avanzados</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={28} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalContent}>
              {/* Ordenar por */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Ordenar por</Text>
                {[
                  { key: 'amount_desc', label: 'Mayor saldo primero' },
                  { key: 'amount_asc', label: 'Menor saldo primero' },
                  { key: 'price_asc', label: 'Menor precio primero' },
                  { key: 'price_desc', label: 'Mayor precio primero' },
                  { key: 'discount', label: 'Mayor descuento primero' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.sortOption}
                    onPress={() => setSortBy(option.key)}
                  >
                    <Ionicons
                      name={
                        sortBy === option.key
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={sortBy === option.key ? '#3B82F6' : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        sortBy === option.key && styles.sortOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Rango de Precio */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>
                  Precio (USD)
                </Text>
                <View style={styles.rangeInputs}>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeLabel}>Mínimo</Text>
                    <TextInput
                      style={styles.rangeInputField}
                      placeholder="$0"
                      value={minPrice}
                      onChangeText={setMinPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <Text style={styles.rangeSeparator}>—</Text>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeLabel}>Máximo</Text>
                    <TextInput
                      style={styles.rangeInputField}
                      placeholder="$999"
                      value={maxPrice}
                      onChangeText={setMaxPrice}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>
              </View>

              {/* Rango de Saldo */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Saldo (CUP)</Text>
                <View style={styles.rangeInputs}>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeLabel}>Mínimo</Text>
                    <TextInput
                      style={styles.rangeInputField}
                      placeholder="0"
                      value={minAmount}
                      onChangeText={setMinAmount}
                      keyboardType="numeric"
                    />
                  </View>
                  <Text style={styles.rangeSeparator}>—</Text>
                  <View style={styles.rangeInput}>
                    <Text style={styles.rangeLabel}>Máximo</Text>
                    <TextInput
                      style={styles.rangeInputField}
                      placeholder="999"
                      value={maxAmount}
                      onChangeText={setMaxAmount}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Botones */}
            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  clearFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.clearFiltersButtonText}>
                  Limpiar Todo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyFiltersButton}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyFiltersButtonText}>
                  Aplicar Filtros
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonActive: {
    backgroundColor: '#3B82F6',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  quickFilters: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickFilterChipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  resultsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    color: '#6B7280',
  },
  clearFiltersText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  packageList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
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
  cardHeaderLeft: {
    flex: 1,
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
  cardBadges: {
    gap: 4,
    alignItems: 'flex-end',
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
  discountBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#10B981',
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
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  filterModalContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  sortOptionText: {
    fontSize: 15,
    color: '#6B7280',
  },
  sortOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  rangeInputField: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  rangeSeparator: {
    fontSize: 20,
    color: '#9CA3AF',
    marginTop: 20,
  },
  filterModalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  clearFiltersButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  clearFiltersButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  applyFiltersButton: {
    flex: 2,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  applyFiltersButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});