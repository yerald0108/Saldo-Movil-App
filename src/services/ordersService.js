import { supabase } from './supabase';

export const ordersService = {
  // Crear un nuevo pedido
  createOrder: async (userId, packageId, phoneNumber, amount) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            user_id: userId,
            package_id: packageId,
            phone_number: phoneNumber,
            amount: amount,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error creating order:', error);
      return { success: false, error: error.message };
    }
  },

  // Obtener pedidos del usuario
  getUserOrders: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          packages (
            name,
            amount
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching orders:', error);
      return { success: false, error: error.message };
    }
  },

  // Actualizar estado del pedido
updateOrderStatus: async (orderId, status) => {
  try {
    const updateData = {
      status,
      ...(status === 'completed' && { completed_at: new Date().toISOString() }),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select();

    if (error) throw error;

    // Verificar si se actualizó algo
    if (!data || data.length === 0) {
      console.warn('No se encontró el pedido para actualizar');
      // Intentar obtener el pedido para verificar que existe
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (existingOrder) {
        console.log('El pedido existe pero no se pudo actualizar:', existingOrder);
      }
      return { success: true, data: existingOrder };
    }

    return { success: true, data: data[0] };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error.message };
  }
},

  // Simular procesamiento de pago (por ahora)
  processPayment: async (orderId) => {
    // Simular delay de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Por ahora siempre es exitoso (luego integraremos Stripe)
    return { success: true };
  },
};