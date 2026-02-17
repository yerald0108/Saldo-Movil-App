import React, { useState } from 'react';
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
import { notificationService } from '../../services/notificationService';

export default function AdminNotificationsScreen() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const templates = [
    {
      id: 1,
      icon: '🎁',
      label: 'Oferta Especial',
      title: '¡Oferta Especial!',
      message: 'Recarga ahora con 25% de descuento por tiempo limitado.',
    },
    {
      id: 2,
      icon: '🔥',
      label: 'Paquete Popular',
      title: '🔥 Paquete 360 CUP',
      message: 'El paquete más popular ahora a mejor precio. ¡Aprovecha!',
    },
    {
      id: 3,
      icon: '📱',
      label: 'Nuevo Paquete',
      title: '¡Nuevo Paquete Disponible!',
      message: 'Tenemos nuevas opciones de recarga para ti. ¡Entra y mira!',
    },
    {
      id: 4,
      icon: '⏰',
      label: 'Oferta Limitada',
      title: '⏰ ¡Solo por hoy!',
      message: 'Aprovecha nuestras ofertas especiales de fin de semana.',
    },
  ];

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Completa el título y el mensaje');
      return;
    }

    setLoading(true);
    try {
      await notificationService.sendLocalNotification(title, message, {
        type: 'admin_broadcast',
      });

      Alert.alert('✅ Éxito', 'Notificación enviada correctamente');
      setTitle('');
      setMessage('');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la notificación');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template) => {
    setTitle(template.title);
    setMessage(template.message);
  };

  const handleTestNotification = async (type) => {
    switch (type) {
      case 'success':
        await notificationService.notifyRechargeSuccess('52345678', 360);
        break;
      case 'offer':
        await notificationService.notifySpecialOffer('Paquete 360', 25);
        break;
      case 'pending':
        await notificationService.notifyOrderPending('TEST-123');
        break;
    }
    Alert.alert('✅ Prueba enviada', 'Revisa las notificaciones de tu dispositivo');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Plantillas Rápidas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Plantillas Rápidas</Text>
        <Text style={styles.sectionSubtitle}>
          Toca una plantilla para usarla
        </Text>

        <View style={styles.templatesGrid}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => handleUseTemplate(template)}
            >
              <Text style={styles.templateEmoji}>{template.icon}</Text>
              <Text style={styles.templateLabel}>{template.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Formulario */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>✏️ Crear Notificación</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Título</Text>
          <TextInput
            style={styles.input}
            placeholder="Título de la notificación"
            value={title}
            onChangeText={setTitle}
            maxLength={50}
          />
          <Text style={styles.charCount}>{title.length}/50</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mensaje</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escribe el mensaje aquí..."
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={4}
            maxLength={200}
          />
          <Text style={styles.charCount}>{message.length}/200</Text>
        </View>

        {/* Preview */}
        {(title || message) && (
          <View style={styles.preview}>
            <Text style={styles.previewLabel}>Vista Previa:</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHeader}>
                <Ionicons name="notifications" size={16} color="#3B82F6" />
                <Text style={styles.previewApp}>Recarga Cuba</Text>
                <Text style={styles.previewTime}>ahora</Text>
              </View>
              <Text style={styles.previewTitle}>{title || 'Título...'}</Text>
              <Text style={styles.previewMessage}>
                {message || 'Mensaje...'}
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={handleSendNotification}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>Enviar Notificación</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Pruebas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🧪 Notificaciones de Prueba</Text>
        <Text style={styles.sectionSubtitle}>
          Prueba los diferentes tipos de notificaciones
        </Text>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => handleTestNotification('success')}
        >
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={styles.testButtonText}>Probar Recarga Exitosa</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => handleTestNotification('offer')}
        >
          <Ionicons name="gift" size={20} color="#F59E0B" />
          <Text style={styles.testButtonText}>Probar Oferta Especial</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.testButton}
          onPress={() => handleTestNotification('pending')}
        >
          <Ionicons name="time" size={20} color="#3B82F6" />
          <Text style={styles.testButtonText}>Probar Pedido Pendiente</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  templatesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  templateCard: {
    width: '47%',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  templateEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  templateLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E40AF',
    textAlign: 'center',
  },
  inputGroup: {
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
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  preview: {
    marginBottom: 16,
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  previewCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  previewApp: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  previewTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  previewMessage: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  sendButton: {
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
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  testButtonText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
});