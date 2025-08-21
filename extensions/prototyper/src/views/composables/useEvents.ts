import mitt, { type Emitter, type Handler } from 'mitt';
import { ref, onUnmounted } from 'vue';

// Define event types for type safety
type Events = {
  'test:click': { message: string; timestamp: number };
  'test:input': { value: string };
  'test:counter': { count: number };
  'notification:show': { type: 'success' | 'error' | 'warning' | 'info'; message: string };
  'script:created': { id: string; name: string };
  'script:executed': { id: string; result: any };
  'script:deleted': { id: string };
};

// Create a global event emitter instance
const globalEmitter: Emitter<Events> = mitt<Events>();

/**
 * Composable for event handling with mitt
 * Provides emit and listen functionality with automatic cleanup
 */
export function useEvents() {
  const listeners = ref<Array<{ event: keyof Events; handler: Handler<any> }>>([]);

  /**
   * Emit an event
   */
  const emit = <T extends keyof Events>(event: T, data: Events[T]) => {
    globalEmitter.emit(event, data);
  };

  /**
   * Listen to an event
   */
  const on = <T extends keyof Events>(event: T, handler: (data: Events[T]) => void) => {
    const typedHandler = handler as Handler<Events[T]>;
    globalEmitter.on(event, typedHandler);
    listeners.value.push({ event, handler: typedHandler });
  };

  /**
   * Listen to an event once
   */
  const once = <T extends keyof Events>(event: T, handler: (data: Events[T]) => void) => {
    const onceHandler = (data: Events[T]) => {
      handler(data);
      off(event, onceHandler);
    };
    on(event, onceHandler);
  };

  /**
   * Remove event listener
   */
  const off = <T extends keyof Events>(event: T, handler?: (data: Events[T]) => void) => {
    if (handler) {
      const typedHandler = handler as Handler<Events[T]>;
      globalEmitter.off(event, typedHandler);
      listeners.value = listeners.value.filter(
        l => !(l.event === event && l.handler === typedHandler)
      );
    } else {
      globalEmitter.off(event);
      listeners.value = listeners.value.filter(l => l.event !== event);
    }
  };

  /**
   * Clear all event listeners
   */
  const clear = () => {
    globalEmitter.all.clear();
    listeners.value = [];
  };

  /**
   * Get all active listeners
   */
  const getListeners = () => {
    return listeners.value;
  };

  // Auto cleanup on component unmount
  onUnmounted(() => {
    listeners.value.forEach(({ event, handler }) => {
      globalEmitter.off(event, handler);
    });
    listeners.value = [];
  });

  return {
    emit,
    on,
    once,
    off,
    clear,
    getListeners,
  };
}
