<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="getPositionClass(toast.position)"
          class="fixed z-50"
        >
          <div
            :class="getTypeClass(toast.type)"
            class="rounded-lg shadow-lg px-4 py-2 flex items-center min-w-[300px] max-w-sm mb-2"
            role="alert"
          >
            <!-- Icône -->
            <span v-if="toast.icon" class="mr-2">
              <svg v-if="toast.type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <svg v-else-if="toast.type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <svg v-else-if="toast.type === 'info'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <svg v-else-if="toast.type === 'warning'" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </span>
            
            <!-- Message -->
            <span class="flex-grow">{{ toast.message }}</span>
            
            <!-- Bouton de fermeture -->
            <button
              v-if="toast.dismissible"
              @click="removeToast(toast.id)"
              class="ml-2 text-white opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script>
import { computed, onMounted, onUnmounted, watch } from 'vue';
import toastService from '../services/toastService';

export default {
  name: 'ToastContainer',
  setup() {
    // Les toasts sont directement accessibles depuis le service
    const toasts = computed(() => toastService.getToasts());
    
    // Classes basées sur le type de toast
    const getTypeClass = (type) => {
      const classes = {
        'success': 'bg-green-600 text-white',
        'error': 'bg-red-600 text-white',
        'info': 'bg-blue-600 text-white',
        'warning': 'bg-yellow-600 text-white'
      };
      
      return classes[type] || classes.info;
    };
    
    // Classes basées sur la position
    const getPositionClass = (position) => {
      const classes = {
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'top-right': 'top-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4'
      };
      
      return classes[position] || classes['bottom-right'];
    };
    
    // Supprimer un toast spécifique
    const removeToast = (id) => {
      toastService.remove(id);
    };
    
    // Limiter le nombre de toasts affichés simultanément
    const MAX_TOASTS = 5;
    
    watch(toasts, (newToasts) => {
      if (newToasts.length > MAX_TOASTS) {
        // Supprimer les toasts les plus anciens
        const oldestToasts = [...newToasts]
          .sort((a, b) => a.timestamp - b.timestamp)
          .slice(0, newToasts.length - MAX_TOASTS);
          
        oldestToasts.forEach(toast => {
          toastService.remove(toast.id);
        });
      }
    });
    
    return {
      toasts,
      getTypeClass,
      getPositionClass,
      removeToast
    };
  }
};
</script>

<style scoped>
/* Animation pour les toasts */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100px);
}

/* Gérer les groupes de toasts en fonction de leur position */
.toast-container > * {
  display: block;
}
</style>