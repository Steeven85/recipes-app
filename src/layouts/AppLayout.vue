<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <!-- En-tête de l'application -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo et titre -->
          <div class="flex items-center">
            <router-link
              to="/"
              class="text-emerald-600 font-bold text-xl flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-8 w-8 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {{ appName }}
            </router-link>
          </div>
  
          <!-- Navigation principale -->
          <nav class="hidden md:flex space-x-4">
            <router-link 
              v-for="item in navItems" 
              :key="item.to" 
              :to="item.to"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="[
                $route.path.startsWith(item.to) 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
              ]"
            >
              {{ item.label }}
            </router-link>
          </nav>
  
          <!-- Actions (droite) -->
          <div class="flex items-center space-x-3">
            <!-- Notifications (exemple) -->
            <button 
              v-if="showNotifications"
              class="p-2 rounded-full text-gray-500 hover:text-emerald-600 hover:bg-gray-100 relative"
              aria-label="Notifications"
              @click="toggleNotifications"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <!-- Badge de notification (si notifications non lues) -->
              <span 
                v-if="unreadNotifications > 0"
                class="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500"
              >
                {{ unreadNotifications > 9 ? '9+' : unreadNotifications }}
              </span>
            </button>
  
            <!-- Menu utilisateur ou bouton de connexion -->
            <div class="relative">
              <button 
                v-if="isAuthenticated"
                class="flex items-center text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                :aria-expanded="userMenuOpen"
                aria-haspopup="true"
                @click="toggleUserMenu"
              >
                <span class="sr-only">Ouvrir le menu utilisateur</span>
                <div class="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  {{ userInitials }}
                </div>
              </button>
              <router-link
                v-else
                to="/login"
                class="px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
              >
                Connexion
              </router-link>
  
              <!-- Menu déroulant utilisateur -->
              <transition
                enter-active-class="transition ease-out duration-100"
                enter-from-class="transform opacity-0 scale-95"
                enter-to-class="transform opacity-100 scale-100"
                leave-active-class="transition ease-in duration-75"
                leave-from-class="transform opacity-100 scale-100"
                leave-to-class="transform opacity-0 scale-95"
              >
                <div 
                  v-if="userMenuOpen && isAuthenticated"
                  ref="userMenuRef"
                  class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none z-50"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <router-link 
                    to="/profile" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="userMenuOpen = false"
                  >
                    Profil
                  </router-link>
                  <router-link 
                    to="/settings" 
                    class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="userMenuOpen = false"
                  >
                    Paramètres
                  </router-link>
                  <div class="border-t border-gray-100 my-1" />
                  <button 
                    class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    @click="logout"
                  >
                    Déconnexion
                  </button>
                </div>
              </transition>
            </div>
  
            <!-- Menu mobile toggle -->
            <button 
              class="md:hidden p-2 rounded-md text-gray-500 hover:text-emerald-600 hover:bg-gray-100"
              aria-expanded="false"
              @click="toggleMobileMenu"
            >
              <span class="sr-only">Menu</span>
              <svg 
                v-if="!mobileMenuOpen" 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-6 w-6" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <svg 
                v-else 
                xmlns="http://www.w3.org/2000/svg" 
                class="h-6 w-6" 
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
        </div>
      </div>
  
      <!-- Menu mobile -->
      <transition
        enter-active-class="transition ease-out duration-100 transform"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75 transform"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-show="mobileMenuOpen"
          class="md:hidden"
        >
          <div class="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
            <router-link 
              v-for="item in navItems" 
              :key="`mobile-${item.to}`" 
              :to="item.to"
              class="block px-3 py-2 rounded-md text-base font-medium"
              :class="[
                $route.path.startsWith(item.to) 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-gray-700 hover:text-emerald-600 hover:bg-gray-50'
              ]"
              @click="mobileMenuOpen = false"
            >
              {{ item.label }}
            </router-link>
              
            <!-- Options supplémentaires pour mobile -->
            <div
              v-if="isAuthenticated"
              class="border-t border-gray-200 mt-2 pt-2"
            >
              <router-link 
                to="/profile" 
                class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                @click="mobileMenuOpen = false"
              >
                Profil
              </router-link>
              <router-link 
                to="/settings" 
                class="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                @click="mobileMenuOpen = false"
              >
                Paramètres
              </router-link>
              <button 
                class="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-emerald-600 hover:bg-gray-50"
                @click="logout"
              >
                Déconnexion
              </button>
            </div>
            <router-link
              v-else
              to="/login"
              class="block px-3 py-2 rounded-md text-base font-medium bg-emerald-600 text-white hover:bg-emerald-700 text-center mt-2"
              @click="mobileMenuOpen = false"
            >
              Connexion
            </router-link>
          </div>
        </div>
      </transition>
    </header>
  
    <!-- Contenu principal -->
    <main class="flex-grow container mx-auto px-4 py-6">
      <slot />
    </main>
  
    <!-- Pied de page -->
    <footer class="bg-white border-t border-gray-200 py-6">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center">
          <!-- Logo et copyright -->
          <div class="mb-4 md:mb-0">
            <div class="flex items-center text-emerald-600 font-bold text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              {{ appName }}
            </div>
            <p class="text-sm text-gray-500 mt-2">
              &copy; {{ currentYear }} {{ appName }}. Tous droits réservés.
            </p>
          </div>
  
          <!-- Liens rapides -->
          <div class="grid grid-cols-2 gap-8 md:grid-cols-3">
            <div>
              <h3 class="text-sm font-semibold text-gray-700 tracking-wider uppercase mb-4">
                App
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="item in footerNavItems.app"
                  :key="item.to"
                >
                  <router-link
                    :to="item.to"
                    class="text-sm text-gray-600 hover:text-emerald-600"
                  >
                    {{ item.label }}
                  </router-link>
                </li>
              </ul>
            </div>
  
            <div>
              <h3 class="text-sm font-semibold text-gray-700 tracking-wider uppercase mb-4">
                Ressources
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="item in footerNavItems.resources"
                  :key="item.to"
                >
                  <router-link
                    :to="item.to"
                    class="text-sm text-gray-600 hover:text-emerald-600"
                  >
                    {{ item.label }}
                  </router-link>
                </li>
              </ul>
            </div>
  
            <div>
              <h3 class="text-sm font-semibold text-gray-700 tracking-wider uppercase mb-4">
                Légal
              </h3>
              <ul class="space-y-2">
                <li
                  v-for="item in footerNavItems.legal"
                  :key="item.to"
                >
                  <router-link
                    :to="item.to"
                    class="text-sm text-gray-600 hover:text-emerald-600"
                  >
                    {{ item.label }}
                  </router-link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  
    <!-- Notifications Toast -->
    <BaseToast
      v-if="toast.show"
      :message="toast.message"
      :type="toast.type"
      :duration="toast.duration"
      @close="hideToast"
    />
  </div>
</template>
  
  <script>
  import { ref, computed, onMounted, onUnmounted, defineComponent } from 'vue';
  import { useRoute } from 'vue-router';
  import BaseToast from './base/BaseToast.vue';
  
  export default defineComponent({
    name: 'AppLayout',
    
    components: {
      BaseToast
    },
    
    props: {
      /**
       * Nom de l'application
       */
      appName: {
        type: String,
        default: 'RecipeApp'
      },
      /**
       * État d'authentification
       */
      isAuthenticated: {
        type: Boolean,
        default: false
      },
      /**
       * Utilisateur actuel
       */
      user: {
        type: Object,
        default: () => ({})
      },
      /**
       * Afficher les notifications
       */
      showNotifications: {
        type: Boolean,
        default: true
      },
      /**
       * Nombre de notifications non lues
       */
      unreadNotifications: {
        type: Number,
        default: 0
      }
    },
    
    setup(props, { emit }) {
      const route = useRoute();
      
      // Menus
      const mobileMenuOpen = ref(false);
      const userMenuOpen = ref(false);
      const notificationsOpen = ref(false);
      const userMenuRef = ref(null);
      
      // Toast notifications
      const toast = ref({
        show: false,
        message: '',
        type: 'success',
        duration: 3000
      });
      
      // Navigation items
      const navItems = [
        { label: 'Accueil', to: '/' },
        { label: 'Recettes', to: '/recipes' },
        { label: 'Planning repas', to: '/planner' },
        { label: 'Liste de courses', to: '/shopping' }
      ];
      
      // Footer navigation
      const footerNavItems = {
        app: [
          { label: 'Accueil', to: '/' },
          { label: 'Recettes', to: '/recipes' },
          { label: 'Planning repas', to: '/planner' },
          { label: 'Liste de courses', to: '/shopping' }
        ],
        resources: [
          { label: 'Guide nutritionnel', to: '/guides/nutrition' },
          { label: 'Techniques', to: '/guides/techniques' },
          { label: 'FAQ', to: '/faq' }
        ],
        legal: [
          { label: 'Mentions légales', to: '/legal' },
          { label: 'Confidentialité', to: '/privacy' },
          { label: 'CGU', to: '/terms' }
        ]
      };
      
      // Année courante pour le footer
      const currentYear = computed(() => new Date().getFullYear());
      
      // Initiales de l'utilisateur
      const userInitials = computed(() => {
        if (!props.user || !props.user.name) return '?';
        
        const nameParts = props.user.name.split(' ');
        if (nameParts.length >= 2) {
          return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
          return nameParts[0][0].toUpperCase();
        }
        
        return '?';
      });
      
      // Gestion du clic en dehors du menu utilisateur
      const handleClickOutside = (event) => {
        if (userMenuRef.value && !userMenuRef.value.contains(event.target) && userMenuOpen.value) {
          userMenuOpen.value = false;
        }
      };
      
      // Toggle des menus
      const toggleMobileMenu = () => {
        mobileMenuOpen.value = !mobileMenuOpen.value;
        if (mobileMenuOpen.value) {
          userMenuOpen.value = false;
          notificationsOpen.value = false;
        }
      };
      
      const toggleUserMenu = () => {
        userMenuOpen.value = !userMenuOpen.value;
        if (userMenuOpen.value) {
          notificationsOpen.value = false;
        }
      };
      
      const toggleNotifications = () => {
        notificationsOpen.value = !notificationsOpen.value;
        if (notificationsOpen.value) {
          userMenuOpen.value = false;
        }
        
        // Marquer les notifications comme lues
        if (notificationsOpen.value && props.unreadNotifications > 0) {
          emit('read-notifications');
        }
      };
      
      // Déconnexion
      const logout = () => {
        emit('logout');
        userMenuOpen.value = false;
        mobileMenuOpen.value = false;
      };
      
      // Gestion des toasts
      const showToast = (message, type = 'success', duration = 3000) => {
        toast.value = {
          show: true,
          message,
          type,
          duration
        };
      };
      
      const hideToast = () => {
        toast.value.show = false;
      };
      
      // Détecter les changements de route pour fermer le menu mobile
      onMounted(() => {
        document.addEventListener('click', handleClickOutside);
        
        // Fermer les menus lors du changement de route
        if (route) {
          const unwatch = route.path.watch(() => {
            mobileMenuOpen.value = false;
            userMenuOpen.value = false;
            notificationsOpen.value = false;
          });
          
          onUnmounted(() => {
            unwatch();
          });
        }
      });
      
      onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
      });
      
      return {
        mobileMenuOpen,
        userMenuOpen,
        notificationsOpen,
        userMenuRef,
        navItems,
        footerNavItems,
        currentYear,
        userInitials,
        toast,
        toggleMobileMenu,
        toggleUserMenu,
        toggleNotifications,
        logout,
        showToast,
        hideToast
      };
    }
  });
  </script>
  
  <style scoped>
  /* Animations et styles spécifiques */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  @media (max-width: 768px) {
    .container {
      padding-left: 1rem;
      padding-right: 1rem;
    }
  }
  </style>