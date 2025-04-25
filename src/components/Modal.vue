<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto"
        @click.self="closeIfClickOutside"
      >
        <div class="flex items-center justify-center min-h-screen p-4">
          <!-- Overlay -->
          <div
            class="fixed inset-0 transition-opacity bg-black bg-opacity-50"
            aria-hidden="true"
          />
            
          <!-- Modal panel -->
          <div 
            :class="[size, roundedClass]"
            class="relative bg-white dark:bg-emerald-600 overflow-hidden shadow-xl transform transition-all max-w-full"
            :style="contentStyle"
            @click.stop
          >
            <!-- Header -->
            <div 
<<<<<<< HEAD
              v-if="$slots.header || title" 
              class="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center"
=======
              :class="[size, roundedClass]"
              class="relative bg-white dark:bg-emerald-600 overflow-hidden shadow-xl transform transition-all max-w-full"
              :style="contentStyle"
              @click.stop
>>>>>>> 53c7b4ed70d3c00647a31fbe10100d13d2c3f7ed
            >
              <slot name="header">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                  {{ title }}
                </h3>
              </slot>
                
              <button 
                v-if="closable" 
                class="text-gray-400 hover:text-gray-500 focus:outline-none" 
                aria-label="Fermer"
                @click="close"
              >
                <svg
                  class="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
              
            <!-- Body -->
            <div :class="bodyClass">
              <slot />
            </div>
              
            <!-- Footer -->
            <div 
              v-if="$slots.footer" 
              class="px-6 py-4 border-t border-gray-200 dark:border-gray-700"
            >
              <slot name="footer" />
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
  
  <script>
  import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
  
  export default {
    name: 'Modal',
    props: {
      modelValue: {
        type: Boolean,
        default: false
      },
      title: {
        type: String,
        default: ''
      },
      size: {
        type: String,
        default: 'md',
        validator: (val) => ['sm', 'md', 'lg', 'xl', 'full'].includes(val)
      },
      maxWidth: {
        type: String,
        default: null
      },
      maxHeight: {
        type: String,
        default: null
      },
      closable: {
        type: Boolean,
        default: true
      },
      closeOnClickOutside: {
        type: Boolean,
        default: true
      },
      closeOnEsc: {
        type: Boolean,
        default: true
      },
      rounded: {
        type: [Boolean, String],
        default: true
      },
      noPadding: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue', 'close'],
    setup(props, { emit }) {
      // Tailles prédéfinies
      const sizeClasses = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        'full': 'max-w-full'
      };
      
      // Style dynamique pour les dimensions personnalisées
      const contentStyle = computed(() => {
        const style = {};
        
        if (props.maxWidth) {
          style.maxWidth = props.maxWidth;
        }
        
        if (props.maxHeight) {
          style.maxHeight = props.maxHeight;
        }
        
        return style;
      });
      
      // Classe pour les coins arrondis
      const roundedClass = computed(() => {
        if (props.rounded === false) return '';
        if (props.rounded === true) return 'rounded-lg';
        return `rounded-${props.rounded}`;
      });
      
      // Classe pour le padding du corps
      const bodyClass = computed(() => {
        return props.noPadding ? '' : 'p-6';
      });
      
      // Fermer la modale
      const close = () => {
        emit('update:modelValue', false);
        emit('close');
      };
      
      // Fermer si clic à l'extérieur
      const closeIfClickOutside = () => {
        if (props.closeOnClickOutside) {
          close();
        }
      };
      
      // Gestion de la touche Échap
      const handleEscKey = (event) => {
        if (props.closeOnEsc && event.key === 'Escape' && props.modelValue) {
          close();
        }
      };
      
      // Gestion du défilement du body
      const handleBodyScroll = (shouldDisable) => {
        if (shouldDisable) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      };
      
      // Appliquer/supprimer les écouteurs d'événements
      onMounted(() => {
        document.addEventListener('keydown', handleEscKey);
      });
      
      onBeforeUnmount(() => {
        document.removeEventListener('keydown', handleEscKey);
        handleBodyScroll(false); // Restaurer le défilement
      });
      
      // Observer les changements de visibilité
      watch(() => props.modelValue, (newVal) => {
        handleBodyScroll(newVal);
      }, { immediate: true });
      
      return {
        close,
        closeIfClickOutside,
        contentStyle,
        roundedClass,
        bodyClass
      };
    }
  };
  </script>
  
  <style scoped>
  .modal-enter-active,
  .modal-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .modal-enter-from,
  .modal-leave-to {
    opacity: 0;
  }
  
  .modal-enter-active .transform,
  .modal-leave-active .transform {
    transition: transform 0.3s ease-out;
  }
  
  .modal-enter-from .transform {
    transform: scale(0.95);
  }
  
  .modal-leave-to .transform {
    transform: scale(0.95);
  }
  </style>