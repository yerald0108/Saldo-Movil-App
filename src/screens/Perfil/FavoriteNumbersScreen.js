import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';

export default function FavoriteNumbersScreen({ navigation }) {
  const [favoriteNumbers, setFavoriteNumbers] = useState([]);
  const [newNumber, setNewNumber] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const { profile, updateProfile } = useAuthStore();

  useEffect(() => {
    // Cargar números favoritos del perfil
    // Formato: ["label:number", "Mamá:52345678", ...]
    if (profile?.favorite_numbers && Array.isArray(profile.favorite_numbers)) {
      const parsed = profile.favorite_numbers.map(item => {
        const [label, number] = item.split(':');
        return { label, number };
      });
      setFavoriteNumbers(parsed);
    } else {
      setFavoriteNumbers([]);
    }
  }, [profile]);

  const addFavoriteNumber = async () => {
    if (!newNumber) {
      Alert.alert('Error', 'Ingresa un número de teléfono');
      return;
    }

    const cleanNumber = newNumber.replace(/\s+/g, '');
    if (cleanNumber.length !== 8 || !/^\d+$/.test(cleanNumber)) {
      Alert.alert('Error', 'Ingresa un número válido de 8 dígitos');
      return;
    }

    if (!newLabel) {
      Alert.alert('Error', 'Ingresa una etiqueta (ej: Mamá, Trabajo)');
      return;
    }

    // Verificar si ya existe
    const exists = favoriteNumbers.some(
      (fav) => fav.number === cleanNumber
    );

    if (exists) {
      Alert.alert('Error', 'Este número ya está en tus favoritos');
      return;
    }

    const newFavorite = {
      number: cleanNumber,
      label: newLabel,
    };

    const updatedFavorites = [...favoriteNumbers, newFavorite];
    
    // Convertir a formato "label:number"
    const formattedForDB = updatedFavorites.map(
      fav => `${fav.label}:${fav.number}`
    );
    
    setLoading(true);
    const result = await updateProfile({
      favorite_numbers: formattedForDB,
    });
    setLoading(false);

    if (result.success) {
      setFavoriteNumbers(updatedFavorites);
      setNewNumber('');
      setNewLabel('');
      Alert.alert('¡Éxito!', 'Número agregado a favoritos');
    } else {
      Alert.alert('Error', 'No se pudo agregar el número');
    }
  };

  const removeFavoriteNumber = async (number) => {
    Alert.alert(
      'Eliminar Número',
      '¿Estás seguro que deseas eliminar este número de favoritos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updatedFavorites = favoriteNumbers.filter(
              (fav) => fav.number !== number
            );

            // Convertir a formato "label:number"
            const formattedForDB = updatedFavorites.map(
              fav => `${fav.label}:${fav.number}`
            );

            setLoading(true);
            const result = await updateProfile({
              favorite_numbers: formattedForDB,
            });
            setLoading(false);

            if (result.success) {
              setFavoriteNumbers(updatedFavorites);
              Alert.alert('Eliminado', 'Número eliminado de favoritos');
            } else {
              Alert.alert('Error', 'No se pudo eliminar el número');
            }
          },
        },
      ]
    );
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length === 8) {
      return `+53 ${phone.substring(0, 4)} ${phone.substring(4)}`;
    }
    return phone;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Agregar Nuevo Número */}
      <View style={styles.addSection}>
        <Text style={styles.sectionTitle}>Agregar Número Favorito</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Etiqueta</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Mamá, Trabajo, Hermano"
            value={newLabel}
            onChangeText={setNewLabel}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Número de Teléfono</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.prefix}>+53</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="5XXXXXXX"
              value={newNumber}
              onChangeText={setNewNumber}
              keyboardType="phone-pad"
              maxLength={8}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.addButton, loading && styles.buttonDisabled]}
          onPress={addFavoriteNumber}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add-circle" size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Agregar a Favoritos</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Lista de Favoritos */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>
          Mis Números ({favoriteNumbers.length})
        </Text>

        {favoriteNumbers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="star-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              No tienes números favoritos aún
            </Text>
          </View>
        ) : (
          favoriteNumbers.map((favorite, index) => (
            <View key={index} style={styles.favoriteCard}>
              <View style={styles.favoriteIcon}>
                <Ionicons name="call" size={24} color="#3B82F6" />
              </View>

              <View style={styles.favoriteInfo}>
                <Text style={styles.favoriteLabel}>{favorite.label}</Text>
                <Text style={styles.favoriteNumber}>
                  {formatPhoneNumber(favorite.number)}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeFavoriteNumber(favorite.number)}
              >
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Nota informativa */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Los números favoritos te permiten recargar más rápido sin tener que
          escribir el número cada vez.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  addSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  addButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  favoriteNumber: {
    fontSize: 14,
    color: '#6B7280',
  },
  deleteButton: {
    padding: 8,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 18,
  },
});