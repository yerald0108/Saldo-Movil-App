import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Configurar cómo se muestran las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Verificar si las notificaciones están disponibles
const isNotificationsAvailable = () => {
  return Device.isDevice;
};

export const notificationService = {
  // Registrar dispositivo y obtener token
  registerForPushNotifications: async (userId) => {
    try {
      // Solo funciona en dispositivos físicos
      if (!Device.isDevice) {
        console.log('ℹ️ Notificaciones: Usando emulador, se omite registro');
        return null;
      }

      // Pedir permisos
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('ℹ️ Permiso de notificaciones denegado');
        return null;
      }

      // Configurar canal para Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Recarga Cuba',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3B82F6',
        });
      }

      // Intentar obtener token (puede fallar en Expo Go)
      try {
        const token = (
          await Notifications.getExpoPushTokenAsync()
        ).data;

        // Guardar token en Supabase
        if (userId && token) {
          await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', userId);
        }

        console.log('✅ Token de notificación registrado');
        return token;
      } catch (tokenError) {
        // Error esperado en Expo Go - no es crítico
        console.log('ℹ️ Token no disponible en Expo Go (normal)');
        return null;
      }
    } catch (error) {
      // Error silencioso - no rompe la app
      console.log('ℹ️ Notificaciones no disponibles:', error.message);
      return null;
    }
  },

  // Enviar notificación local (estas SÍ funcionan en Expo Go)
  sendLocalNotification: async (title, body, data = {}) => {
    try {
      if (!Device.isDevice) {
        console.log(`ℹ️ [Notificación simulada] ${title}: ${body}`);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        console.log('ℹ️ Sin permisos para notificaciones');
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // null = inmediata
      });
    } catch (error) {
      // Error silencioso
      console.log('ℹ️ No se pudo enviar notificación:', error.message);
    }
  },

  // Notificación de recarga exitosa
  notifyRechargeSuccess: async (phoneNumber, amount) => {
    await notificationService.sendLocalNotification(
      '✅ Recarga Exitosa',
      `Se recargaron ${amount} CUP al número +53 ${phoneNumber}`,
      { type: 'recharge_success', phoneNumber, amount }
    );
  },

  // Notificación de oferta especial
  notifySpecialOffer: async (packageName, discount) => {
    await notificationService.sendLocalNotification(
      '🎁 ¡Oferta Especial!',
      `${packageName} con ${discount}% de descuento por tiempo limitado`,
      { type: 'special_offer' }
    );
  },

  // Notificación de pedido pendiente
  notifyOrderPending: async (orderId) => {
    await notificationService.sendLocalNotification(
      '⏳ Pedido en Proceso',
      'Tu pedido está siendo procesado. Te avisaremos cuando esté listo.',
      { type: 'order_pending', orderId }
    );
  },

  // Escuchar notificaciones recibidas
  addNotificationListener: (callback) => {
    try {
      return Notifications.addNotificationReceivedListener(callback);
    } catch (error) {
      console.log('ℹ️ No se pudo agregar listener');
      return { remove: () => {} }; // Objeto vacío para evitar errores
    }
  },

  // Escuchar cuando el usuario toca una notificación
  addNotificationResponseListener: (callback) => {
    try {
      return Notifications.addNotificationResponseReceivedListener(callback);
    } catch (error) {
      console.log('ℹ️ No se pudo agregar response listener');
      return { remove: () => {} }; // Objeto vacío para evitar errores
    }
  },

  // Limpiar badge
  clearBadge: async () => {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      // Silencioso
    }
  },
};