import { create } from 'zustand';
import { supabase } from '../services/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  isAdmin: false,

  // Inicializar sesión
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        // Asegurar que favorite_numbers sea un array
        if (profile && !Array.isArray(profile.favorite_numbers)) {
          profile.favorite_numbers = [];
        }

        set({ 
          user: session.user, 
          profile,
          session,
          isAdmin: profile?.role === 'admin',
          loading: false 
        });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false });
    }
  },

  // Registrarse
  signUp: async (email, password, name) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      });

      if (error) throw error;

      // Obtener perfil
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({ 
          user: data.user, 
          profile,
          session: data.session,
          isAdmin: profile?.role === 'admin'
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Iniciar sesión
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Obtener perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({ 
        user: data.user, 
        profile,
        session: data.session,
        isAdmin: profile?.role === 'admin'
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Cerrar sesión
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ 
        user: null, 
        profile: null, 
        session: null,
        isAdmin: false
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Actualizar perfil
  updateProfile: async (updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', useAuthStore.getState().user.id)
        .select()
        .single();

      if (error) throw error;

      set({ 
        profile: data,
        isAdmin: data?.role === 'admin'
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));