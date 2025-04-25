<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header masqué sur la page de connexion -->
    <header v-if="!isLoginPage" class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <!-- Logo -->
          <router-link to="/" class="block">
            <img
              src="/logoFP.png"
              alt="Logo"
              class="h-16 w-16 object-contain sm:h-24 sm:w-24"
            >
          </router-link>
          <!-- Titre visible uniquement sur grand écran -->
          <router-link to="/" class="block">
            <h1 class="hidden sm:block text-2xl font-semibold">
              Recette
            </h1>
          </router-link>
        </div>
        
        <div class="flex items-center">
          <nav class="flex space-x-4 mr-4">
            <router-link 
              to="/" 
              class="px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
            >
              Recettes
            </router-link>
            <router-link 
              to="/planner" 
              class="px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
            >
              Planning
            </router-link>
            <router-link 
              to="/shopping" 
              class="px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
            >
              Courses
            </router-link>
          </nav>
          
          <!-- Nous laissons UserNav gérer le menu utilisateur -->
          <UserNav />
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script>
import UserNav from './components/UserNav.vue';
import { useUserStore } from './stores/userStore';
import { useRoute } from 'vue-router';
import { onMounted, computed } from 'vue';

export default {
  name: 'App',
  components: {
    UserNav
  },
  setup() {
    const userStore = useUserStore();
    const route = useRoute();
    
    // Déterminer si la route actuelle est la page de connexion
    const isLoginPage = computed(() => {
      return route.path === '/login';
    });
    
    onMounted(async () => {
      try {
        // Initialiser le store utilisateur au démarrage
        await userStore.init();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du store utilisateur:', error);
      }
    });
    
    return {
      userStore,
      isLoginPage
    };
  }
};
</script>