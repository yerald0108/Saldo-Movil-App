import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { ordersService } from '../../services/ordersService';
import { useAuthStore } from '../../stores/authStore';

export default function PedidosScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuthStore();

  // Cargar pedidos al entrar a la pantalla
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [])
  );

  const fetchOrders = async () => {
    try {
      const result = await ordersService.getUserOrders(user.id);
      if (result.success) {
        setOrders(result.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completado',
          icon: 'checkmark-circle',
          color: '#10B981',
          bgColor: '#D1FAE5',
        };
      case 'pending':
        return {
          label: 'Pendiente',
          icon: 'time',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
        };
      case 'failed':
        return {
          label: 'Fallido',
          icon: 'close-circle',
          color: '#EF4444',
          bgColor: '#FEE2E2',
        };
      default:
        return {
          label: 'Desconocido',
          icon: 'help-circle',
          color: '#6B7280',
          bgColor: '#F3F4F6',
        };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) {
      return 'Hace un momento';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Hace ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;
    } else {
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const formatPhoneNumber = (phone) => {
    if (phone.length === 8) {
      return `+53 ${phone.substring(0, 4)} ${phone.substring(4)}`;
    }
    return phone;
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.emptyContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.emptyIcon}>
          <Ionicons name="receipt-outline" size={80} color="#D1D5DB" />
        </View>
        <Text style={styles.emptyTitle}>Sin pedidos aún</Text>
        <Text style={styles.emptyText}>
          Tus pedidos aparecerán aquí una vez que realices tu primera compra
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{orders.length}</Text>
          <Text style={styles.statLabel}>Total Pedidos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {orders.filter(o => o.status === 'completed').length}
          </Text>
          <Text style={styles.statLabel}>Completados</Text>
        </View>
      </View>

      {/* Lista de Pedidos */}
      <View style={styles.ordersSection}>
        <Text style={styles.sectionTitle}>Historial de Pedidos</Text>

        {orders.map((order) => {
          const statusInfo = getStatusInfo(order.status);
          
          return (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              activeOpacity={0.7}
            >
              {/* Header del pedido */}
              <View style={styles.orderHeader}>
                <View style={styles.orderHeaderLeft}>
                  <View style={styles.orderIcon}>
                    <Ionicons name="phone-portrait" size={24} color="#3B82F6" />
                  </View>
                  <View style={styles.orderHeaderText}>
                    <Text style={styles.orderTitle}>
                      {order.packages?.name || 'Paquete de Saldo'}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.created_at)}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: statusInfo.bgColor },
                  ]}
                >
                  <Ionicons
                    name={statusInfo.icon}
                    size={16}
                    color={statusInfo.color}
                  />
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </View>

              {/* Detalles del pedido */}
              <View style={styles.orderDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.detailLabel}>Número:</Text>
                  <Text style={styles.detailValue}>
                    {formatPhoneNumber(order.phone_number)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="cash-outline" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.detailLabel}>Saldo:</Text>
                  <Text style={styles.detailValue}>
                    {order.packages?.amount || 0} CUP
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailIcon}>
                    <Ionicons name="card-outline" size={16} color="#6B7280" />
                  </View>
                  <Text style={styles.detailLabel}>Pagado:</Text>
                  <Text style={styles.detailValueBold}>
                    ${parseFloat(order.amount).toFixed(2)} USD
                  </Text>
                </View>
              </View>

              {/* Footer del pedido */}
              {order.status === 'completed' && (
                <View style={styles.orderFooter}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={styles.completedText}>
                    Recarga procesada exitosamente
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Nota informativa */}
      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color="#3B82F6" />
        <Text style={styles.infoText}>
          Las recargas se procesan en tiempo real. Si tienes algún problema,
          contacta a soporte.
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ordersSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderHeaderText: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    width: 24,
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
  },
  detailValueBold: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  orderFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 8,
  },
  completedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
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