<script setup lang="ts">
import { ref, onMounted } from 'vue';
import '../styles/main.scss';
import { Icon } from '@iconify/vue';

// Import test components
import EventEmitterTest from './components/test/EventEmitterTest.vue';
import EventListenerTest from './components/test/EventListenerTest.vue';
import NotificationTest from './components/test/NotificationTest.vue';
import EventStatsTest from './components/test/EventStatsTest.vue';
import VueDraggableExample from './components/test/vuedraggable/VueDraggableExample.vue';
import AlternativeKanban from './components/test/vuedraggable/AlternativeKanban.vue';

const currentTime = ref(new Date().toLocaleString());

onMounted(() => {
	// Update time every second
	setInterval(() => {
		currentTime.value = new Date().toLocaleString();
	}, 1000);
});
</script>
<template>
	<private-view title="Script Composer">
		<template #headline>
			<h2 class="flex items-center gap-2">
				<Icon icon="mdi:code-braces" class="text-2xl" />
				Advanced Script Management
			</h2>
		</template>
		
		<template #title-outer:prepend>
			<v-icon name="code" />
		</template>
		
		<template #actions>
			<v-button rounded icon secondary>
				<v-icon name="refresh" />
			</v-button>
			<v-button rounded icon secondary>
				<v-icon name="settings" />
			</v-button>
			<v-button>
				Create New Script
			</v-button>
		</template>
		
		<template #navigation>
			<div>
				Left Navigation
			</div>
		</template>
		
		<template #sidebar>
			<sidebar-detail icon="info" title="Script Information">
				<div>Some info</div>
			</sidebar-detail>
		</template>

		<template #default>
			<div class="p-10 max-w-screen-2xl mx-auto">
				<!-- Welcome Section -->
				<div class="text-center mb-10 p-8 bg-gray-50 rounded-lg border">
					<h1 class="text-4xl font-bold text-blue-600 mb-5">Welcome to Script Composer</h1>
					<p class="text-lg mb-2 text-gray-600">This is your central hub for managing custom scripts and automation in Directus.</p>
					<p class="text-lg text-gray-600">Current time: <span class="font-semibold text-gray-800">{{ currentTime }}</span></p>
				</div>

				<!-- Vue Draggable Example Section -->
				<div class="mb-10">
					<VueDraggableExample />
				</div>

				<!-- Alternative Kanban Example Section -->
				<div class="mb-10">
					<AlternativeKanban />
				</div>

			</div>
		</template>
	</private-view>
</template>
<style lang="scss" scoped>
/* Custom SCSS styles using Tailwind utilities */
.script-composer {
  @apply min-h-screen bg-gray-50;
}

/* Override Directus variables with SCSS */
:deep(.private-view) {
  .welcome-section {
    @apply transition-all duration-300 hover:shadow-lg;
    
    h1 {
      @apply bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent;
    }
  }
}

/* Custom SCSS mixins and variables */
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$card-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);

.enhanced-card {
  background: $primary-gradient;
  box-shadow: $card-shadow;
  @apply rounded-lg p-6 text-white;
  
  &:hover {
    @apply transform scale-105 transition-transform duration-200;
  }
}
</style>
