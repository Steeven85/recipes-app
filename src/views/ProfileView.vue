<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loader -->
      <div v-if="userStore.loading" class="flex justify-center py-12">
        <svg class="animate-spin h-12 w-12 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- Not authenticated -->
      <div v-else-if="!userStore.isAuthenticated" class="text-center py-12 bg-white rounded-xl shadow-lg">
        <div class="p-6 sm:p-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-emerald-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Accès Restreint</h2>
          <p class="text-lg text-gray-600 mb-6">Vous devez être connecté pour accéder à cette page.</p>
          <button 
            @click="router.push('/login')" 
            class="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg shadow hover:bg-emerald-700 transition duration-200 transform hover:-translate-y-0.5"
          >
            Se connecter
          </button>
        </div>
      </div>
      
      <!-- Profile content -->
      <div v-else>
        <!-- Profile header with tabs -->
        <div class="bg-white rounded-t-xl shadow-sm border-b border-gray-200">
          <div class="relative bg-emerald-700 rounded-t-xl h-32">
            <div class="absolute -bottom-16 left-8">
              <div class="h-32 w-32 rounded-full bg-white p-1 shadow-lg">
                <div class="h-full w-full rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold">
                  {{ getInitials(userStore.user?.full_name || userStore.user?.username) }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="ml-8 md:ml-44 pt-20 md:pt-4 pb-4 pr-4 md:pr-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-800">{{ userStore.user?.full_name }}</h1>
                <div class="flex flex-col md:flex-row md:items-center mt-1">
                  <p class="text-gray-600">@{{ userStore.user?.username }}</p>
                  <span class="hidden md:inline mx-2 text-gray-400">•</span>
                  <p class="text-gray-600 truncate max-w-xs">{{ userStore.user?.email }}</p>
                </div>
              </div>
              <div class="mt-2 md:mt-0">
                <span class="px-3 py-1 inline-flex text-sm font-medium rounded-full" 
                  :class="userStore.isAdmin ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'">
                  {{ userStore.isAdmin ? 'Administrateur' : 'Utilisateur' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Profile content -->
        <div class="bg-white rounded-b-xl shadow-md p-8">
          <!-- Personal Information -->
          <div class="mb-10">
            <div class="flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 class="text-xl font-bold text-gray-800">Informations personnelles</h2>
            </div>
            
            <div v-if="updateError" class="mb-4 p-4 border-l-4 border-red-500 bg-red-50 text-red-700 rounded">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ updateError }}
              </div>
            </div>
            
            <div v-if="updateSuccess" class="mb-4 p-4 border-l-4 border-emerald-500 bg-emerald-50 text-emerald-700 rounded">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ updateSuccess }}
              </div>
            </div>
            
            <form @submit.prevent="updateProfile" class="bg-gray-50 rounded-lg p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="username">
                    Nom d'utilisateur
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      v-model="profileForm.username"
                      class="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      id="username"
                      type="text"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="email">
                    Adresse e-mail
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      v-model="profileForm.email"
                      class="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      id="email"
                      type="email"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="full_name">
                    Nom complet
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                      </svg>
                    </div>
                    <input
                      v-model="profileForm.full_name"
                      class="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      id="full_name"
                      type="text"
                    />
                  </div>
                </div>
              </div>
              
              <div class="mt-6">
                <button
                  type="submit"
                  :disabled="updateLoading"
                  class="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-75 transition duration-200"
                >
                  <span v-if="updateLoading" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mise à jour...
                  </span>
                  <span v-else class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Enregistrer les modifications
                  </span>
                </button>
              </div>
            </form>
          </div>
          
          <!-- Password Change -->
          <div>
            <div class="flex items-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <h2 class="text-xl font-bold text-gray-800">Sécurité</h2>
            </div>
            
            <div v-if="passwordError" class="mb-4 p-4 border-l-4 border-red-500 bg-red-50 text-red-700 rounded">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {{ passwordError }}
              </div>
            </div>
            
            <div v-if="passwordSuccess" class="mb-4 p-4 border-l-4 border-emerald-500 bg-emerald-50 text-emerald-700 rounded">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                {{ passwordSuccess }}
              </div>
            </div>
            
            <form @submit.prevent="updatePassword" class="bg-gray-50 rounded-lg p-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="current_password">
                    Mot de passe actuel
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      v-model="passwordForm.current_password"
                      class="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      id="current_password"
                      type="password"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="new_password">
                    Nouveau mot de passe
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      v-model="passwordForm.new_password"
                      class="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      id="new_password"
                      type="password"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1" for="confirm_password">
                    Confirmer le nouveau mot de passe
                  </label>
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <input
                      v-model="passwordForm.confirm_password"
                      class="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-emerald-500 focus:border-emerald-500"
                      id="confirm_password"
                      type="password"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div class="mt-6">
                <button
                  type="submit"
                  :disabled="passwordLoading"
                  class="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-75 transition duration-200"
                >
                  <span v-if="passwordLoading" class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mise à jour...
                  </span>
                  <span v-else class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    Changer le mot de passe
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useUserStore } from '../stores/userStore';
import { useRouter } from 'vue-router';

export default {
  setup() {
    const userStore = useUserStore();
    const router = useRouter();
    
    // Formulaires
    const profileForm = ref({
      username: '',
      email: '',
      full_name: ''
    });
    
    const passwordForm = ref({
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    
    // États
    const updateError = ref('');
    const updateSuccess = ref('');
    const updateLoading = ref(false);
    
    const passwordError = ref('');
    const passwordSuccess = ref('');
    const passwordLoading = ref(false);
    
    // Charger les données utilisateur
    onMounted(async () => {
      if (!userStore.isAuthenticated) {
        router.push('/login');
        return;
      }
      
      // Si les données utilisateur ne sont pas déjà chargées
      if (!userStore.user) {
        await userStore.fetchCurrentUser();
      }
      
      // Initialiser le formulaire avec les données actuelles
      profileForm.value = {
        username: userStore.user?.username || '',
        email: userStore.user?.email || '',
        full_name: userStore.user?.full_name || ''
      };
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
    
    // Mettre à jour le profil
    const updateProfile = async () => {
      updateError.value = '';
      updateSuccess.value = '';
      updateLoading.value = true;
      
      try {
        await userStore.updateUser(userStore.user.id, {
          username: profileForm.value.username,
          email: profileForm.value.email,
          full_name: profileForm.value.full_name
        });
        
        updateSuccess.value = "Votre profil a été mis à jour avec succès";
      } catch (error) {
        updateError.value = error.message || "Une erreur est survenue lors de la mise à jour du profil";
      } finally {
        updateLoading.value = false;
      }
    };
    
    // Mettre à jour le mot de passe
    const updatePassword = async () => {
      passwordError.value = '';
      passwordSuccess.value = '';
      
      // Vérifier que les mots de passe correspondent
      if (passwordForm.value.new_password !== passwordForm.value.confirm_password) {
        passwordError.value = "Les nouveaux mots de passe ne correspondent pas";
        return;
      }
      
      passwordLoading.value = true;
      
      try {
        const success = await userStore.changePassword(
          userStore.user.id,
          passwordForm.value.current_password,
          passwordForm.value.new_password
        );
        
        if (success) {
          passwordSuccess.value = "Votre mot de passe a été modifié avec succès";
          // Réinitialiser le formulaire
          passwordForm.value = {
            current_password: '',
            new_password: '',
            confirm_password: ''
          };
        } else {
          passwordError.value = "Échec du changement de mot de passe";
        }
      } catch (error) {
        passwordError.value = error.message || "Une erreur est survenue lors du changement de mot de passe";
      } finally {
        passwordLoading.value = false;
      }
    };
    
    return {
      userStore,
      router,
      profileForm,
      passwordForm,
      updateError,
      updateSuccess,
      updateLoading,
      passwordError,
      passwordSuccess,
      passwordLoading,
      getInitials,
      updateProfile,
      updatePassword
    };
  }
}
</script>