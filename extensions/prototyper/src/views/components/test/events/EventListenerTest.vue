<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEvents } from '../../../composables/useEvents';

const { on, getListeners } = useEvents();

const receivedEvents = ref<Array<{ type: string; data: any; timestamp: string }>>([]);
const isListening = ref(false);
const maxEvents = ref(10);

const addEvent = (type: string, data: any) => {
  const event = {
    type,
    data,
    timestamp: new Date().toLocaleTimeString()
  };
  
  receivedEvents.value.unshift(event);
  
  // Keep only the latest maxEvents
  if (receivedEvents.value.length > maxEvents.value) {
    receivedEvents.value = receivedEvents.value.slice(0, maxEvents.value);
  }
};

const startListening = () => {
  if (isListening.value) return;
  
  // Listen to test events
  on('test:click', (data) => addEvent('test:click', data));
  on('test:input', (data) => addEvent('test:input', data));
  on('test:counter', (data) => addEvent('test:counter', data));
  
  // Listen to notification events
  on('notification:show', (data) => addEvent('notification:show', data));
  
  // Listen to script events
  on('script:created', (data) => addEvent('script:created', data));
  on('script:executed', (data) => addEvent('script:executed', data));
  on('script:deleted', (data) => addEvent('script:deleted', data));
  
  isListening.value = true;
};

const clearEvents = () => {
  receivedEvents.value = [];
};

const getEventTypeIcon = (type: string) => {
  switch (type) {
    case 'test:click': return '🖱️';
    case 'test:input': return '⌨️';
    case 'test:counter': return '🔢';
    case 'notification:show': return '🔔';
    case 'script:created': return '📝';
    case 'script:executed': return '⚡';
    case 'script:deleted': return '🗑️';
    default: return '📡';
  }
};

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'test:click': return 'text-blue-600 bg-blue-50';
    case 'test:input': return 'text-green-600 bg-green-50';
    case 'test:counter': return 'text-purple-600 bg-purple-50';
    case 'notification:show': return 'text-orange-600 bg-orange-50';
    case 'script:created': return 'text-indigo-600 bg-indigo-50';
    case 'script:executed': return 'text-yellow-600 bg-yellow-50';
    case 'script:deleted': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
};

onMounted(() => {
  startListening();
});
</script>

<template>
  <div class="bg-white rounded-lg border p-6 shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800 flex items-center">
        <span class="mr-2">🎧</span>
        Event Listener Test
      </h3>
      
      <div class="flex items-center space-x-3">
        <div class="flex items-center">
          <span class="text-sm text-gray-600 mr-2">Max events:</span>
          <input
            v-model.number="maxEvents"
            type="number"
            min="1"
            max="50"
            class="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <button
          @click="clearEvents"
          class="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Clear
        </button>
      </div>
    </div>
    
    <!-- Status -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center">
        <div 
          :class="[
            'w-3 h-3 rounded-full mr-2',
            isListening ? 'bg-green-500' : 'bg-red-500'
          ]"
        ></div>
        <span class="text-sm text-gray-600">
          {{ isListening ? 'Listening for events' : 'Not listening' }}
        </span>
      </div>
      
      <span class="text-sm text-gray-500">
        Active listeners: {{ getListeners().length }}
      </span>
    </div>
    
    <!-- Events List -->
    <div class="max-h-80 overflow-y-auto">
      <div v-if="receivedEvents.length === 0" class="text-center py-8 text-gray-500">
        <span class="text-4xl block mb-2">📭</span>
        No events received yet. Try using the Event Emitter Test component!
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="(event, index) in receivedEvents"
          :key="index"
          :class="[
            'p-3 rounded-lg border-l-4 transition-all duration-200',
            getEventTypeColor(event.type)
          ]"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center">
              <span class="text-lg mr-2">{{ getEventTypeIcon(event.type) }}</span>
              <div>
                <div class="font-medium text-sm">{{ event.type }}</div>
                <div class="text-xs text-gray-500">{{ event.timestamp }}</div>
              </div>
            </div>
          </div>
          
          <div class="mt-2 text-xs font-mono bg-gray-100 p-2 rounded overflow-auto">
            <pre>{{ JSON.stringify(event.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
