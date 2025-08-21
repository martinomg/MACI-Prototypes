<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEvents } from '../../../composables/useEvents';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: number;
  visible: boolean;
}

const { on } = useEvents();
const notifications = ref<Notification[]>([]);
const autoHideDelay = ref(4000);

const addNotification = (type: Notification['type'], message: string) => {
  const notification: Notification = {
    id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    message,
    timestamp: Date.now(),
    visible: true
  };
  
  notifications.value.push(notification);
  
  // Auto hide after delay
  setTimeout(() => {
    hideNotification(notification.id);
  }, autoHideDelay.value);
};

const hideNotification = (id: string) => {
  const notification = notifications.value.find(n => n.id === id);
  if (notification) {
    notification.visible = false;
    
    // Remove from array after animation
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== id);
    }, 300);
  }
};

const clearAllNotifications = () => {
  notifications.value.forEach(n => n.visible = false);
  setTimeout(() => {
    notifications.value = [];
  }, 300);
};

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📢';
  }
};

const getNotificationClasses = (type: Notification['type']) => {
  const baseClasses = 'p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 transform';
  
  switch (type) {
    case 'success':
      return `${baseClasses} bg-green-50 border-green-500 text-green-800`;
    case 'error':
      return `${baseClasses} bg-red-50 border-red-500 text-red-800`;
    case 'warning':
      return `${baseClasses} bg-yellow-50 border-yellow-500 text-yellow-800`;
    case 'info':
      return `${baseClasses} bg-blue-50 border-blue-500 text-blue-800`;
    default:
      return `${baseClasses} bg-gray-50 border-gray-500 text-gray-800`;
  }
};

onMounted(() => {
  // Listen for notification events
  on('notification:show', (data) => {
    addNotification(data.type, data.message);
  });
  
  // Listen for script events and show appropriate notifications
  on('script:executed', (data) => {
    addNotification('success', `Script "${data.id}" executed successfully`);
  });
  
  on('script:deleted', (data) => {
    addNotification('warning', `Script "${data.id}" has been deleted`);
  });
});
</script>

<template>
  <div class="fixed top-4 right-4 z-50 w-80 space-y-2">
    <!-- Controls -->
    <div v-if="notifications.length > 0" class="mb-4">
      <div class="bg-white rounded-lg p-3 shadow-sm border flex justify-between items-center">
        <span class="text-sm text-gray-600">
          {{ notifications.length }} notification{{ notifications.length !== 1 ? 's' : '' }}
        </span>
        
        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <span class="text-xs text-gray-500 mr-1">Auto-hide:</span>
            <input
              v-model.number="autoHideDelay"
              type="number"
              min="1000"
              max="10000"
              step="1000"
              class="w-16 px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span class="text-xs text-gray-500 ml-1">ms</span>
          </div>
          
          <button
            @click="clearAllNotifications"
            class="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
    
    <!-- Notifications -->
    <div class="space-y-2">
      <div
        v-for="notification in notifications"
        :key="notification.id"
        :class="[
          getNotificationClasses(notification.type),
          notification.visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center">
            <span class="text-lg mr-3">{{ getNotificationIcon(notification.type) }}</span>
            <div class="flex-1">
              <div class="font-medium text-sm">{{ notification.type.toUpperCase() }}</div>
              <div class="text-sm mt-1">{{ notification.message }}</div>
              <div class="text-xs opacity-75 mt-1">
                {{ new Date(notification.timestamp).toLocaleTimeString() }}
              </div>
            </div>
          </div>
          
          <button
            @click="hideNotification(notification.id)"
            class="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span class="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
