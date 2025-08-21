<script setup lang="ts">
import { ref } from 'vue';
import { useEvents } from '../../../composables/useEvents';

const { emit } = useEvents();

const message = ref('Hello from Event Emitter!');
const counter = ref(0);
const inputValue = ref('');

const handleButtonClick = () => {
  emit('test:click', {
    message: message.value,
    timestamp: Date.now()
  });
  
  emit('notification:show', {
    type: 'success',
    message: `Button clicked at ${new Date().toLocaleTimeString()}`
  });
};

const handleCounterIncrement = () => {
  counter.value++;
  emit('test:counter', { count: counter.value });
};

const handleInputChange = () => {
  emit('test:input', { value: inputValue.value });
};

const simulateScriptCreation = () => {
  const scriptId = `script_${Date.now()}`;
  emit('script:created', {
    id: scriptId,
    name: `Test Script ${counter.value + 1}`
  });
  
  emit('notification:show', {
    type: 'info',
    message: `Script "${scriptId}" created successfully`
  });
};
</script>

<template>
  <div class="bg-white rounded-lg border p-6 shadow-sm">
    <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
      <span class="mr-2">📡</span>
      Event Emitter Test
    </h3>
    
    <div class="space-y-4">
      <!-- Message Input -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Custom Message:
        </label>
        <input
          v-model="message"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter a message..."
        />
      </div>
      
      <!-- Buttons Row -->
      <div class="flex flex-wrap gap-3">
        <button
          @click="handleButtonClick"
          class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
        >
          <span class="mr-2">🚀</span>
          Emit Click Event
        </button>
        
        <button
          @click="handleCounterIncrement"
          class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
        >
          <span class="mr-2">🔢</span>
          Counter: {{ counter }}
        </button>
        
        <button
          @click="simulateScriptCreation"
          class="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors flex items-center"
        >
          <span class="mr-2">📝</span>
          Create Script
        </button>
      </div>
      
      <!-- Input Test -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Input Event Test:
        </label>
        <input
          v-model="inputValue"
          @input="handleInputChange"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="Type to emit input events..."
        />
      </div>
    </div>
  </div>
</template>
