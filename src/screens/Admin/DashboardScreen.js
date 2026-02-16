import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { adminService } from '../../services/adminService';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsResult, chartResult] = await Promise.all([
        adminService.getStats(),
        adminService.getChartData(),
      ]);

      if (statsResult.success) {
        setStats(statsResult.data);
      }

      if (chartResult.success) {
        setChartData(chartResult.data);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header con color azul */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Panel de Administración</Text>
            <Text style={styles.headerSubtitle}>
              Visión general de tu negocio
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Perfil')}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Estadísticas Principales */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
          <View style={styles.statIcon}>
            <Ionicons name="people" size={28} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          <Text style={styles.statLabel}>Usuarios</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
          <View style={styles.statIcon}>
            <Ionicons name="cart" size={28} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{stats?.totalOrders || 0}</Text>
          <Text style={styles.statLabel}>Pedidos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
          <View style={styles.statIcon}>
            <Ionicons name="cash" size={28} color="#F59E0B" />
          </View>
          <Text style={styles.statValue}>
            ${stats?.totalRevenue?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.statLabel}>Ingresos</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
          <View style={styles.statIcon}>
            <Ionicons name="today" size={28} color="#EF4444" />
          </View>
          <Text style={styles.statValue}>{stats?.ordersToday || 0}</Text>
          <Text style={styles.statLabel}>Hoy</Text>
        </View>
      </View>

      {/* Accesos Rápidos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gestión Rápida</Text>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('AdminUsers')}
        >
          <View style={styles.quickActionLeft}>
            <Ionicons name="people-outline" size={24} color="#3B82F6" />
            <Text style={styles.quickActionText}>Gestionar Usuarios</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('AdminOrders')}
        >
          <View style={styles.quickActionLeft}>
            <Ionicons name="receipt-outline" size={24} color="#10B981" />
            <Text style={styles.quickActionText}>Ver Pedidos</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() => navigation.navigate('AdminPackages')}
        >
          <View style={styles.quickActionLeft}>
            <Ionicons name="cube-outline" size={24} color="#F59E0B" />
            <Text style={styles.quickActionText}>Gestionar Paquetes</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
        </TouchableOpacity>
      </View>

      {/* Paquetes Más Vendidos */}
      {chartData?.packageCount && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paquetes Más Vendidos</Text>
          {Object.entries(chartData.packageCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count], index) => (
              <View key={index} style={styles.packageItem}>
                <View style={styles.packageRank}>
                  <Text style={styles.packageRankText}>{index + 1}</Text>
                </View>
                <View style={styles.packageInfo}>
                  <Text style={styles.packageName}>{name}</Text>
                  <Text style={styles.packageCount}>{count} ventas</Text>
                </View>
                <View style={styles.packageBar}>
                  <View
                    style={[
                      styles.packageBarFill,
                      {
                        width: `${(count / Object.values(chartData.packageCount)[0]) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
        </View>
      )}

      {/* Ingresos por Día */}
      {chartData?.revenueByDay && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingresos (Últimos 7 días)</Text>
          {Object.entries(chartData.revenueByDay).map(([date, revenue], index) => (
            <View key={index} style={styles.revenueItem}>
              <Text style={styles.revenueDate}>{date}</Text>
              <Text style={styles.revenueAmount}>${revenue.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
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
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E0E7FF',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    marginTop: -20,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quickActionText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  packageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  packageRankText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  packageInfo: {
    flex: 1,
  },
  packageName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  packageCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  packageBar: {
    width: 80,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginLeft: 12,
  },
  packageBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  revenueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  revenueDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  revenueAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#10B981',
  },
});