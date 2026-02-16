import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function PurchaseModal({ visible, onClose, package: pkg, onConfirm }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile } = useAuthStore();

  const handleConfirm = async () => {
    // Validar número de teléfono
    if (!phoneNumber) {
      Alert.alert('Error', 'Por favor ingresa un número de teléfono');
      return;
    }

    // Validar formato básico (8 dígitos para Cuba)
    const cleanNumber = phoneNumber.replace(/\s+/g, '');
    if (cleanNumber.length !== 8 || !/^\d+$/.test(cleanNumber)) {
      Alert.alert('Error', 'Ingresa un número válido de 8 dígitos');
      return;
    }

    setLoading(true);
    await onConfirm(cleanNumber);
    setLoading(false);
    setPhoneNumber('');
  };

  const handleClose = () => {
    setPhoneNumber('');
    onClose();
  };

  const selectFavoriteNumber = (number) => {
    setPhoneNumber(number);
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length === 8) {
      return `+53 ${phone.substring(0, 4)} ${phone.substring(4)}`;
    }
    return phone;
  };

  if (!pkg) return null;

  // Parsear números favoritos desde formato "label:number"
  const favoriteNumbers = (profile?.favorite_numbers || []).map(item => {
    if (typeof item === 'string' && item.includes(':')) {
      const [label, number] = item.split(':');
      return { label, number };
    }
    return item; // Por si ya está en formato objeto
  }).filter(item => item.label && item.number);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Confirmar Compra</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={28} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {/* Info del Paquete */}
            <View style={styles.packageInfo}>
              <View style={styles.packageIcon}>
                <Text style={styles.packageEmoji}>📱</Text>
              </View>
              <View style={styles.packageDetails}>
                <Text style={styles.packageName}>{pkg.name}</Text>
                <Text style={styles.packageAmount}>{pkg.amount} CUP</Text>
              </View>
              <Text style={styles.packagePrice}>${pkg.price}</Text>
            </View>

            {/* Números Favoritos */}
            {favoriteNumbers.length > 0 && (
              <View style={styles.favoritesSection}>
                <Text style={styles.favoritesTitle}>
                  ⭐ Números Favoritos
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.favoritesScroll}
                >
                  {favoriteNumbers.map((favorite, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.favoriteChip,
                        phoneNumber === favorite.number && styles.favoriteChipSelected,
                      ]}
                      onPress={() => selectFavoriteNumber(favorite.number)}
                    >
                      <Ionicons
                        name="call"
                        size={16}
                        color={phoneNumber === favorite.number ? '#FFFFFF' : '#3B82F6'}
                      />
                      <View style={styles.favoriteChipText}>
                        <Text
                          style={[
                            styles.favoriteLabel,
                            phoneNumber === favorite.number && styles.favoriteLabelSelected,
                          ]}
                        >
                          {favorite.label}
                        </Text>
                        <Text
                          style={[
                            styles.favoriteNumber,
                            phoneNumber === favorite.number && styles.favoriteNumberSelected,
                          ]}
                        >
                          {formatPhoneNumber(favorite.number)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Input de Teléfono */}
            <View style={styles.inputSection}>
              <Text style={styles.label}>
                {favoriteNumbers.length > 0 ? 'O ingresa otro número' : 'Número a recargar'}
              </Text>
              <View style={styles.phoneInputContainer}>
                <Text style={styles.prefix}>+53</Text>
                <TextInput
                  style={styles.phoneInput}
                  placeholder="5XXXXXXX"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={8}
                />
                {phoneNumber.length > 0 && (
                  <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => setPhoneNumber('')}
                  >
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.hint}>Ingresa el número de 8 dígitos</Text>
            </View>

            {/* Resumen */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Saldo a recargar</Text>
                <Text style={styles.summaryValue}>{pkg.amount} CUP</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Número</Text>
                <Text style={styles.summaryValue}>
                  {phoneNumber ? `+53 ${phoneNumber}` : '-'}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total a pagar</Text>
                <Text style={styles.totalValue}>${pkg.price} USD</Text>
              </View>
            </View>
          </ScrollView>

          {/* Botones */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, loading && styles.buttonDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirmar Compra</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scrollContent: {
    maxHeight: 500,
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    margin: 20,
    borderRadius: 12,
  },
  packageIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packageEmoji: {
    fontSize: 24,
  },
  packageDetails: {
    flex: 1,
  },
  packageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  packageAmount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  favoritesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  favoritesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  favoritesScroll: {
    flexDirection: 'row',
  },
  favoriteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
    minWidth: 140,
  },
  favoriteChipSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  favoriteChipText: {
    marginLeft: 8,
    flex: 1,
  },
  favoriteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  favoriteLabelSelected: {
    color: '#FFFFFF',
  },
  favoriteNumber: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  favoriteNumberSelected: {
    color: '#E0E7FF',
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  prefix: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  summary: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});