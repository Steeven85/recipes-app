<template>
    <div class="relative">
      <!-- Affichage quand non connecté -->
      <div v-if="!userStore.isAuthenticated">
        <router-link 
          to="/login" 
          class="px-3 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          Connexion
        </router-link>
      </div>
      
      <!-- Menu utilisateur quand connecté -->
      <div v-else>
        <button 
          @click="toggleUserMenu"
          class="flex items-center text-sm font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          aria-expanded="false"
          aria-haspopup="true"
        >
          <span class="sr-only">Ouvrir le menu utilisateur</span>
          <div class="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            {{ getInitials(userStore.user?.full_name || userStore.user?.username) }}
          </div>
        </button>
        
        <!-- Menu déroulant -->
        <div 
          v-if="userMenuOpen"
          class="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 focus:outline-none z-50"
        >
          <router-link 
            to="/profile" 
            class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            @click="userMenuOpen = false"
          >
            Profil
          </router-link>
          
          <!-- Options d'administration -->
          <template v-if="userStore.isAdmin">
            <div class="border-t border-gray-100 my-1"></div>
            
            <router-link 
              to="/admin" 
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="userMenuOpen = false"
            >
              Admin Données
            </router-link>
            
            <router-link 
              to="/admin/users" 
              class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              @click="userMenuOpen = false"
            >
              Gestion des utilisateurs
            </router-link>
          </template>
          
          <div class="border-t border-gray-100 my-1"></div>
          
          <button 
            @click="logout"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, onUnmounted } from 'vue';
  import { useUserStore } from '../stores/userStore';
  import { useRouter } from 'vue-router';
  
  export default {
    setup() {
      const userStore = useUserStore();
      const router = useRouter();
      const userMenuOpen = ref(false);
      
      // Amélioré : Gérer le clic en dehors du menu pour le fermer
      const handleClickOutside = (event) => {
        // Vérifier si le clic s'est produit en dehors du menu utilisateur
        const target = event.target;
        const menuContainer = document.querySelector('.relative');
        
        if (userMenuOpen.value && menuContainer && !menuContainer.contains(target)) {
          userMenuOpen.value = false;
        }
      };
      
      onMounted(() => {
        document.addEventListener('click', handleClickOutside);
      });
      
      onUnmounted(() => {
        document.removeEventListener('click', handleClickOutside);
      });
      
      // Obtenir les initiales pour l'avatar
      const getInitials = (name) => {
        if (!name) return '?';
        
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        
        return name.substring(0, 2).toUpperCase();
      };
      
      // Basculer l'affichage du menu
      const toggleUserMenu = (event) => {
        event.stopPropagation();
        userMenuOpen.value = !userMenuOpen.value;
      };
      
      // Déconnexion
      const logout = () => {
        userStore.logout();
        userMenuOpen.value = false;
        router.push('/login');
      };
      
      return {
        userStore,
        userMenuOpen,
        getInitials,
        toggleUserMenu,
        logout
      };
    }
  }
  </script>