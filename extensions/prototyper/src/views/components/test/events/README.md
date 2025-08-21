# Script Composer Event System

This extension uses `mitt` for event handling and includes a comprehensive testing suite.

## Event System Components

### 1. Composable: `useEvents.ts`
Located at: `src/views/components/composables/useEvents.ts`

**Features:**
- Type-safe event system using TypeScript
- Automatic cleanup on component unmount
- Global event emitter instance
- Support for one-time listeners
- Listener management and tracking

**Available Events:**
- `test:click` - Test button click events
- `test:input` - Input field change events
- `test:counter` - Counter increment events
- `notification:show` - Display notifications
- `script:created` - Script creation events
- `script:executed` - Script execution events
- `script:deleted` - Script deletion events

### 2. Test Components

#### EventEmitterTest.vue
- Emits various types of events
- Interactive buttons and inputs
- Demonstrates event emission patterns

#### EventListenerTest.vue
- Listens to all events in real-time
- Displays event data with timestamps
- Shows active listener count
- Configurable max events display

#### NotificationTest.vue
- Global notification system
- Auto-hide functionality
- Different notification types (success, error, warning, info)
- Positioned as floating notifications

#### EventStatsTest.vue
- Real-time event statistics
- Event frequency tracking
- Visual charts and progress bars
- Session uptime tracking

## Usage Example

```typescript
import { useEvents } from '../composables/useEvents';

const { emit, on, off } = useEvents();

// Emit an event
emit('script:created', {
  id: 'script_123',
  name: 'My New Script'
});

// Listen to events
on('notification:show', (data) => {
  console.log('Notification:', data);
});

// One-time listener
once('script:executed', (data) => {
  console.log('Script executed once:', data);
});
```

## Event Flow

1. **EventEmitterTest** generates events through user interactions
2. **EventListenerTest** captures and displays all events with data
3. **NotificationTest** shows user-friendly notifications for specific events
4. **EventStatsTest** tracks and visualizes event frequency and patterns

## Styling

The components use a combination of:
- Tailwind CSS utility classes for rapid styling
- SCSS for custom styles and variables
- Responsive design principles
- Directus design system compatibility
