import { supabase } from './supabase';

export const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    console.log('✅ Conexión exitosa a Supabase');
    console.log('📦 Paquetes disponibles:', data);
    return data;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return null;
  }
};