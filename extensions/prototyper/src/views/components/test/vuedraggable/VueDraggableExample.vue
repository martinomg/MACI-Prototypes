<script setup lang="ts">
import { ref } from 'vue';
import VueDraggable from 'vuedraggable';

interface TaskItem {
  id: number;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

// Sample data for draggable lists
const todoTasks = ref<TaskItem[]>([
  { id: 1, name: 'Design UI Components', description: 'Create reusable Vue components', priority: 'high', completed: false },
  { id: 2, name: 'Setup API Endpoints', description: 'Configure Directus endpoints', priority: 'medium', completed: false },
  { id: 3, name: 'Write Documentation', description: 'Document the extension features', priority: 'low', completed: false },
]);

const inProgressTasks = ref<TaskItem[]>([
  { id: 4, name: 'Implement Drag & Drop', description: 'Add Vue Draggable functionality', priority: 'high', completed: false },
]);

const completedTasks = ref<TaskItem[]>([
  { id: 5, name: 'Project Setup', description: 'Initialize Directus extension', priority: 'medium', completed: false },
]);

// Simple list for basic dragging example
const simpleList = ref([
  'Item 1 - Drag me around!',
  'Item 2 - I can be reordered',
  'Item 3 - Vue Draggable is awesome',
  'Item 4 - Smooth animations',
  'Item 5 - Easy to implement'
]);

// Get priority color class
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-100 border-red-300 text-red-800';
    case 'medium': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
    case 'low': return 'bg-green-100 border-green-300 text-green-800';
    default: return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

// Get column color
const getColumnColor = (type: string) => {
  switch (type) {
    case 'todo': return 'bg-blue-50 border-blue-200';
    case 'progress': return 'bg-yellow-50 border-yellow-200';
    case 'completed': return 'bg-green-50 border-green-200';
    default: return 'bg-gray-50 border-gray-200';
  }
};

// Draggable group configuration
const dragGroup = {
  name: 'tasks',
  pull: true,
  put: true
};

// Clone function to ensure proper reactivity
const cloneItem = (item: TaskItem) => {
  return { ...item };
};

// Draggable options
const dragOptions = {
  animation: 200,
  ghostClass: 'ghost',
  dragClass: 'drag',
  group: dragGroup,
  clone: cloneItem,
  sort: true,
  forceFallback: false,
  fallbackOnBody: true,
  swapThreshold: 0.5,
};

// Simple logging for debugging
const logDragEvent = (event: string, listType: string) => {
  console.log(`Drag event: ${event} on ${listType} list`);
};
</script>

<template>
  <div class="vue-draggable-example p-6 space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-800 mb-2">Vue Draggable Example</h2>
      <p class="text-gray-600">Drag and drop items between lists and within lists</p>
    </div>

    <!-- Simple List Example -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold mb-4 text-gray-700">Simple Reorderable List</h3>
      <VueDraggable
        v-model="simpleList"
        :animation="200"
        ghost-class="ghost"
        drag-class="drag"
        class="space-y-2"
        item-key="index"
      >
        <template #item="{ element, index }">
          <div class="bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-lg p-4 cursor-move hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="text-gray-800 font-medium">{{ element }}</span>
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">#{{ index + 1 }}</span>
                <svg class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                </svg>
              </div>
            </div>
          </div>
        </template>
      </VueDraggable>
    </div>

    <!-- Kanban Board Example -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold mb-6 text-gray-700">Kanban Board (Drag Between Lists)</h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Todo Column -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-gray-700">To Do</h4>
            <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {{ todoTasks.length }}
            </span>
          </div>
          <div class="min-h-96 p-4 rounded-lg border-2 border-dashed" :class="getColumnColor('todo')">
            <VueDraggable
              v-model="todoTasks"
              v-bind="dragOptions"
              class="space-y-3"
              item-key="id"
            >
              <template #item="{ element }">
                <div class="bg-white rounded-lg border-2 shadow-sm p-4 cursor-move hover:shadow-md transition-shadow">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between">
                      <h5 class="font-medium text-gray-800 text-sm">{{ element.name }}</h5>
                      <span class="text-xs px-2 py-1 rounded-full border" :class="getPriorityColor(element.priority)">
                        {{ element.priority }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600">{{ element.description }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">#{{ element.id }}</span>
                      <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </template>
            </VueDraggable>
          </div>
        </div>

        <!-- In Progress Column -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-gray-700">In Progress</h4>
            <span class="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {{ inProgressTasks.length }}
            </span>
          </div>
          <div class="min-h-96 p-4 rounded-lg border-2 border-dashed" :class="getColumnColor('progress')">
            <VueDraggable
              v-model="inProgressTasks"
              v-bind="dragOptions"
              class="space-y-3"
              item-key="id"
            >
              <template #item="{ element }">
                <div class="bg-white rounded-lg border-2 shadow-sm p-4 cursor-move hover:shadow-md transition-shadow">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between">
                      <h5 class="font-medium text-gray-800 text-sm">{{ element.name }}</h5>
                      <span class="text-xs px-2 py-1 rounded-full border" :class="getPriorityColor(element.priority)">
                        {{ element.priority }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600">{{ element.description }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">#{{ element.id }}</span>
                      <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </template>
            </VueDraggable>
          </div>
        </div>

        <!-- Completed Column -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="font-semibold text-gray-700">Completed</h4>
            <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {{ completedTasks.length }}
            </span>
          </div>
          <div class="min-h-96 p-4 rounded-lg border-2 border-dashed" :class="getColumnColor('completed')">
            <VueDraggable
              v-model="completedTasks"
              v-bind="dragOptions"
              class="space-y-3"
              item-key="id"
            >
              <template #item="{ element }">
                <div class="bg-white rounded-lg border-2 shadow-sm p-4 cursor-move hover:shadow-md transition-shadow opacity-75">
                  <div class="space-y-2">
                    <div class="flex items-start justify-between">
                      <h5 class="font-medium text-gray-800 text-sm line-through">{{ element.name }}</h5>
                      <span class="text-xs px-2 py-1 rounded-full border" :class="getPriorityColor(element.priority)">
                        {{ element.priority }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-600">{{ element.description }}</p>
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-gray-500">#{{ element.id }}</span>
                      <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </template>
            </VueDraggable>
          </div>
        </div>
      </div>
    </div>

    <!-- Features Info -->
    <div class="bg-gray-50 rounded-lg p-6">
      <h3 class="text-lg font-semibold mb-4 text-gray-700">Vue Draggable Features Demonstrated</h3>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="flex items-start space-x-3">
          <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          <div>
            <h4 class="font-medium text-gray-800">Smooth Animations</h4>
            <p class="text-sm text-gray-600">200ms animation duration for smooth transitions</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <div class="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
          <div>
            <h4 class="font-medium text-gray-800">Cross-List Dragging</h4>
            <p class="text-sm text-gray-600">Drag items between different lists/columns</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <div class="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
          <div>
            <h4 class="font-medium text-gray-800">TypeScript Support</h4>
            <p class="text-sm text-gray-600">Fully typed components and data structures</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
          <div>
            <h4 class="font-medium text-gray-800">Visual Feedback</h4>
            <p class="text-sm text-gray-600">Hover effects and visual cues for better UX</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
          <div>
            <h4 class="font-medium text-gray-800">Responsive Design</h4>
            <p class="text-sm text-gray-600">Works on mobile and desktop devices</p>
          </div>
        </div>
        <div class="flex items-start space-x-3">
          <div class="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
          <div>
            <h4 class="font-medium text-gray-800">Tailwind Styling</h4>
            <p class="text-sm text-gray-600">Beautiful UI with Tailwind CSS classes</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.drag {
  transform: rotate(5deg);
}

.vue-draggable-example {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Smooth transitions for all draggable items */
.vue-draggable-example .sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.vue-draggable-example .sortable-drag {
  transform: rotate(2deg);
  opacity: 0.8;
}
</style>
