<script setup lang="ts">
import { ref, nextTick } from 'vue';
import VueDraggable from 'vuedraggable';

interface TaskItem {
  id: number;
  name: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

// Sample data for draggable lists - using reactive arrays with unique IDs
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

// Force reactivity refresh
const refreshLists = async () => {
  await nextTick();
};

// Event handlers for debugging
const onMove = (evt: any, originalEvent: any, listType: string) => {
  console.log(`Move event on ${listType}:`, evt);
  return true; // Allow move
};

const onStart = (evt: any, listType: string) => {
  console.log(`Start dragging on ${listType}:`, evt);
};

const onEnd = (evt: any, listType: string) => {
  console.log(`End dragging on ${listType}:`, evt);
  refreshLists();
};
</script>

<template>
  <div class="alternative-kanban p-6 space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-800 mb-2">Alternative Kanban Board</h2>
      <p class="text-gray-600">This version uses simpler configuration to avoid drag locking issues</p>
    </div>

    <!-- Kanban Board -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h3 class="text-xl font-semibold mb-6 text-gray-700">Simple Kanban Board</h3>
      
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
              group="shared-tasks"
              :animation="200"
              ghost-class="sortable-ghost"
              chosen-class="sortable-chosen"
              drag-class="sortable-drag"
              class="space-y-3 min-h-4"
              item-key="id"
              :move="(evt: any, originalEvent: any) => onMove(evt, originalEvent, 'todo')"
              @start="(evt: any) => onStart(evt, 'todo')"
              @end="(evt: any) => onEnd(evt, 'todo')"
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
              group="shared-tasks"
              :animation="200"
              ghost-class="sortable-ghost"
              chosen-class="sortable-chosen"
              drag-class="sortable-drag"
              class="space-y-3 min-h-4"
              item-key="id"
              :move="(evt: any, originalEvent: any) => onMove(evt, originalEvent, 'progress')"
              @start="(evt: any) => onStart(evt, 'progress')"
              @end="(evt: any) => onEnd(evt, 'progress')"
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
              group="shared-tasks"
              :animation="200"
              ghost-class="sortable-ghost"
              chosen-class="sortable-chosen"
              drag-class="sortable-drag"
              class="space-y-3 min-h-4"
              item-key="id"
              :move="(evt: any, originalEvent: any) => onMove(evt, originalEvent, 'completed')"
              @start="(evt: any) => onStart(evt, 'completed')"
              @end="(evt: any) => onEnd(evt, 'completed')"
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

    <!-- Debug Info -->
    <div class="bg-gray-50 rounded-lg p-4">
      <h4 class="text-sm font-semibold mb-2 text-gray-700">Debug Info (check browser console for drag events)</h4>
      <div class="grid grid-cols-3 gap-4 text-xs">
        <div>
          <span class="font-medium">Todo:</span> {{ todoTasks.length }} items
        </div>
        <div>
          <span class="font-medium">Progress:</span> {{ inProgressTasks.length }} items
        </div>
        <div>
          <span class="font-medium">Completed:</span> {{ completedTasks.length }} items
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sortable-ghost {
  opacity: 0.4;
  background: #f3f4f6;
  border: 2px dashed #d1d5db !important;
}

.sortable-chosen {
  transform: scale(1.02);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.sortable-drag {
  transform: rotate(2deg);
  opacity: 0.8;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.alternative-kanban {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
</style>
