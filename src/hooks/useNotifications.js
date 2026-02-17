import { useEffect, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { notificationService } from '../services/notificationService';
import { useAuthStore } from '../stores/authStore';

export function useNotifications() {
  const { user } = useAuthStore();
  const notificationListener = useRef();
  const responseListener = useRef();

  // Usamos try/catch para que useNavigation no rompa nada
  let navigation;
  try {
    navigation = useNavigation();
  } catch (e) {
    navigation = null;
  }

  useEffect(() => {
    if (!user) return;

    // Registrar dispositivo (falla silenciosamente en Expo Go)
    notificationService.registerForPushNotifications(user.id);

    // Escuchar notificaciones recibidas
    notificationListener.current =
      notificationService.addNotificationListener((notification) => {
        console.log('📱 Notificación recibida:', notification.request.content.title);
      });

    // Escuchar cuando el usuario toca una notificación
    responseListener.current =
      notificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;

        if (!navigation) return;

        // Navegar según el tipo de notificación
        try {
          if (data?.type === 'recharge_success') {
            navigation.navigate('Pedidos');
          } else if (data?.type === 'special_offer') {
            navigation.navigate('Compras');
          }
        } catch (navError) {
          console.log('ℹ️ Error navegando desde notificación');
        }
      });

    // Limpiar listeners al desmontar
    return () => {
      if (notificationListener.current?.remove) {
        notificationListener.current.remove();
      }
      if (responseListener.current?.remove) {
        responseListener.current.remove();
      }
    };
  }, [user]);
}