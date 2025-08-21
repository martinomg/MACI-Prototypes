<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useEvents } from '../../../composables/useEvents';

const { on, getListeners } = useEvents();

const eventStats = ref<Record<string, number>>({});
const totalEvents = ref(0);
const startTime = ref(Date.now());

const uptime = ref(0);
const uptimeInterval = ref<NodeJS.Timeout>();

const sortedEventStats = computed(() => {
  return Object.entries(eventStats.value)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
});

const formatUptime = (ms: number) => {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

const incrementEventCount = (eventType: string) => {
  if (!eventStats.value[eventType]) {
    eventStats.value[eventType] = 0;
  }
  eventStats.value[eventType]++;
  totalEvents.value++;
};

const resetStats = () => {
  eventStats.value = {};
  totalEvents.value = 0;
  startTime.value = Date.now();
  uptime.value = 0;
};

onMounted(() => {
  // Update uptime every second
  uptimeInterval.value = setInterval(() => {
    uptime.value = Date.now() - startTime.value;
  }, 1000);
  
  // Listen to all event types and count them
  on('test:click', () => incrementEventCount('test:click'));
  on('test:input', () => incrementEventCount('test:input'));
  on('test:counter', () => incrementEventCount('test:counter'));
  on('notification:show', () => incrementEventCount('notification:show'));
  on('script:created', () => incrementEventCount('script:created'));
  on('script:executed', () => incrementEventCount('script:executed'));
  on('script:deleted', () => incrementEventCount('script:deleted'));
});

// Cleanup interval on unmount
onMounted(() => {
  return () => {
    if (uptimeInterval.value) {
      clearInterval(uptimeInterval.value);
    }
  };
});
</script>

<template>
  <div class="bg-white rounded-lg border p-6 shadow-sm">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800 flex items-center">
        <span class="mr-2">📊</span>
        Event Statistics
      </h3>
      
      <button
        @click="resetStats"
        class="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Reset
      </button>
    </div>
    
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-blue-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-blue-600">{{ totalEvents }}</div>
        <div class="text-sm text-blue-800">Total Events</div>
      </div>
      
      <div class="bg-green-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-green-600">{{ Object.keys(eventStats).length }}</div>
        <div class="text-sm text-green-800">Event Types</div>
      </div>
      
      <div class="bg-purple-50 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-purple-600">{{ getListeners().length }}</div>
        <div class="text-sm text-purple-800">Active Listeners</div>
      </div>
    </div>
    
    <!-- Uptime -->
    <div class="mb-6 p-3 bg-gray-50 rounded-lg">
      <div class="flex justify-between items-center">
        <span class="text-sm font-medium text-gray-700">Session Uptime:</span>
        <span class="text-sm text-gray-600 font-mono">{{ formatUptime(uptime) }}</span>
      </div>
    </div>
    
    <!-- Event Breakdown -->
    <div>
      <h4 class="text-md font-medium text-gray-700 mb-3">Event Breakdown:</h4>
      
      <div v-if="sortedEventStats.length === 0" class="text-center py-4 text-gray-500">
        <span class="text-2xl block mb-2">📈</span>
        No events recorded yet
      </div>
      
      <div v-else class="space-y-2">
        <div
          v-for="([eventType, count], index) in sortedEventStats"
          :key="eventType"
          class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
          <div class="flex items-center">
            <div 
              :class="[
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3',
                index === 0 ? 'bg-yellow-500' : 
                index === 1 ? 'bg-gray-400' : 
                index === 2 ? 'bg-orange-500' : 'bg-blue-500'
              ]"
            >
              {{ index + 1 }}
            </div>
            
            <div>
              <div class="font-medium text-sm text-gray-800">{{ eventType }}</div>
              <div class="text-xs text-gray-500">
                {{ ((count / totalEvents) * 100).toFixed(1) }}% of total
              </div>
            </div>
          </div>
          
          <div class="flex items-center">
            <div class="text-lg font-bold text-gray-700 mr-2">{{ count }}</div>
            
            <!-- Visual bar -->
            <div class="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full bg-blue-500 transition-all duration-300"
                :style="{ width: `${(count / Math.max(...Object.values(eventStats))) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
