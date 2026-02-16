import { supabase } from './supabase';

export const adminService = {
  // Obtener estadísticas generales
  getStats: async () => {
    try {
      // Total de usuarios
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Total de pedidos
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      // Total de ingresos
      const { data: orders } = await supabase
        .from('orders')
        .select('amount, status')
        .eq('status', 'completed');

      const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.amount), 0) || 0;

      // Pedidos hoy
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: ordersToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      return {
        success: true,
        data: {
          totalUsers,
          totalOrders,
          totalRevenue,
          ordersToday,
        },
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener todos los usuarios
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting users:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener todos los pedidos
  getAllOrders: async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles (
            name,
            email
          ),
          packages (
            name,
            amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error getting orders:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener datos para gráficos
  getChartData: async () => {
    try {
      // Ingresos por día (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentOrders } = await supabase
        .from('orders')
        .select('created_at, amount, status')
        .gte('created_at', sevenDaysAgo.toISOString())
        .eq('status', 'completed');

      // Agrupar por día
      const revenueByDay = {};
      recentOrders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString();
        revenueByDay[date] = (revenueByDay[date] || 0) + parseFloat(order.amount);
      });

      // Paquetes más vendidos
      const { data: packageSales } = await supabase
        .from('orders')
        .select('package_id, packages(name, amount)')
        .eq('status', 'completed');

      const packageCount = {};
      packageSales?.forEach(order => {
        const packageName = order.packages?.name || 'Desconocido';
        packageCount[packageName] = (packageCount[packageName] || 0) + 1;
      });

      return {
        success: true,
        data: {
          revenueByDay,
          packageCount,
        },
      };
    } catch (error) {
      console.error('Error getting chart data:', error);
      return { success: false, error: error.message };
    }
  },

  // Crear paquete
  createPackage: async (packageData) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .insert([packageData])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating package:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar paquete
  updatePackage: async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating package:', error);
      return { success: false, error: error.message };
    }
  },

  // Eliminar paquete (desactivar)
  deletePackage: async (id) => {
    try {
      const { data, error } = await supabase
        .from('packages')
        .update({ is_active: false })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error deleting package:', error);
      return { success: false, error: error.message };
    }
  },
};