<script setup lang="ts">
import { ref } from 'vue';
import VueDraggable from 'vuedraggable';

interface ListItem {
  id: number;
  text: string;
  color: string;
}

// Simple list of items
const items = ref<ListItem[]>([
  { id: 1, text: 'First Item', color: 'bg-blue-100 border-blue-300' },
  { id: 2, text: 'Second Item', color: 'bg-green-100 border-green-300' },
  { id: 3, text: 'Third Item', color: 'bg-yellow-100 border-yellow-300' },
  { id: 4, text: 'Fourth Item', color: 'bg-purple-100 border-purple-300' },
  { id: 5, text: 'Fifth Item', color: 'bg-pink-100 border-pink-300' },
]);
</script>

<template>
  <div class="simple-draggable p-6">
    <h3 class="text-xl font-semibold mb-4 text-gray-700">Simple Draggable List</h3>
    
    <div class="bg-white rounded-lg border shadow-sm p-4">
      <VueDraggable
        v-model="items"
        :animation="200"
        ghost-class="ghost-item"
        drag-class="drag-item"
        class="space-y-2"
        item-key="id"
      >
        <template #item="{ element }">
          <div
            class="p-3 rounded-lg border-2 cursor-move transition-all duration-200 hover:shadow-md"
            :class="element.color"
          >
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-800">{{ element.text }}</span>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">#{{ element.id }}</span>
                <!-- Drag handle -->
                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a1 1 0 011 1v1h4V3a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v4h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H8v1a1 1 0 11-2 0v-1H4a2 2 0 01-2-2v-2H1a1 1 0 110-2h1V8H1a1 1 0 010-2h1V4a2 2 0 012-2h2V3a1 1 0 011-1zM4 6v8h12V6H4z"></path>
                </svg>
              </div>
            </div>
          </div>
        </template>
      </VueDraggable>
    </div>

    <div class="mt-4 text-sm text-gray-600">
      <p>💡 <strong>Tip:</strong> Click and drag any item to reorder the list!</p>
    </div>
  </div>
</template>

<style scoped>
.ghost-item {
  opacity: 0.4;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
}

.drag-item {
  transform: rotate(2deg);
  opacity: 0.8;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}
</style>
