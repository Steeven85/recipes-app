<template>
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <button 
          @click="showCreateUserModal = true"
          class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter un utilisateur
        </button>
      </div>
  
      <!-- État de chargement -->
      <div v-if="userStore.loading" class="flex justify-center py-12">
        <svg class="animate-spin h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
  
      <!-- Affichage de l'erreur -->
      <div v-else-if="userStore.error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ userStore.error }}
      </div>
  
      <!-- Tableau des utilisateurs -->
      <div v-else class="bg-white shadow overflow-hidden rounded-lg">
        <!-- Débug: Afficher les données brutes (à supprimer en production) -->
        <!-- <div class="p-4 bg-gray-50">
          <p class="text-sm font-mono">Users data: {{ Array.isArray(userStore.users) ? userStore.users.length + ' users' : 'not an array' }}</p>
        </div> -->
        
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="!Array.isArray(userStore.users) || userStore.users.length === 0">
              <td colspan="4" class="px-6 py-4 text-center text-gray-500">
                Aucun utilisateur trouvé
              </td>
            </tr>
            <template v-else>
              <tr v-for="(user, index) in userStore.users" :key="user?.id || index">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                  <div class="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 font-medium">
                      {{ getInitials(user.fullName || user.username) }}
                  </div>
                  <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{{ user.fullName }}</div>
                      <div class="text-sm text-gray-500">@{{ user.username }}</div>
                  </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ user?.email || '-' }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" 
                    :class="user?.admin ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'">
                    {{ user?.admin ? 'Administrateur' : 'Utilisateur' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button @click="editUser(user)" class="text-blue-600 hover:text-blue-800 mr-2">
                    Modifier
                  </button>
                  <button 
                    @click="confirmDelete(user)"
                    :disabled="user?.id === userStore.user?.id"
                    :class="{'text-red-600 hover:text-red-800': user?.id !== userStore.user?.id, 'text-gray-400 cursor-not-allowed': user?.id === userStore.user?.id}"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
  
      <!-- Modal Création/Modification d'utilisateur -->
      <div v-if="showCreateUserModal || showEditUserModal" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 transition-opacity" aria-hidden="true">
            <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
  
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 class="text-lg leading-6 font-medium text-gray-900">
                {{ showEditUserModal ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur' }}
              </h3>
              <div class="mt-4">
                <form @submit.prevent="showEditUserModal ? updateUser() : createUser()">
                  <div v-if="formError" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {{ formError }}
                  </div>
  
                  <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="username">
                      Nom d'utilisateur
                    </label>
                    <input
                      v-model="userForm.username"
                      class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="username"
                      type="text"
                      required
                    />
                  </div>
                  
                  <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="email">
                      Email
                    </label>
                    <input
                      v-model="userForm.email"
                      class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="email"
                      type="email"
                      required
                    />
                  </div>
                  
                  <div class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="full_name">
                      Nom complet
                    </label>
                    <input
                      v-model="userForm.full_name"
                      class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="full_name"
                      type="text"
                    />
                  </div>
                  
                  <div v-if="!showEditUserModal" class="mb-4">
                    <label class="block text-gray-700 text-sm font-bold mb-2" for="password">
                      Mot de passe
                    </label>
                    <input
                      v-model="userForm.password"
                      class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="password"
                      type="password"
                      required
                    />
                  </div>
                  
                  <div class="mb-4">
                    <label class="flex items-center">
                      <input
                        v-model="userForm.admin"
                        type="checkbox"
                        class="form-checkbox h-5 w-5 text-emerald-600"
                      />
                      <span class="ml-2 text-gray-700">Administrateur</span>
                    </label>
                  </div>
                  
                  <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="submit"
                      class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {{ showEditUserModal ? 'Mettre à jour' : 'Créer' }}
                    </button>
                    <button
                      type="button"
                      @click="closeModal"
                      class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Modal de confirmation de suppression -->
      <div v-if="showDeleteConfirmation" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div class="fixed inset-0 transition-opacity" aria-hidden="true">
            <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
          </div>
  
          <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
            <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    Supprimer l'utilisateur
                  </h3>
                  <div class="mt-2">
                    <p class="text-sm text-gray-500">
                      Êtes-vous sûr de vouloir supprimer l'utilisateur "{{ userToDelete?.username }}" ? 
                      Cette action est irréversible.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button 
                type="button"
                @click="deleteUser"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Supprimer
              </button>
              <button 
                type="button"
                @click="showDeleteConfirmation = false"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Annuler
              </button>
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
      
      // États pour les modales
      const showCreateUserModal = ref(false);
      const showEditUserModal = ref(false);
      const showDeleteConfirmation = ref(false);
      const userToDelete = ref(null);
      const formError = ref('');
      
      // Formulaire utilisateur
      const userForm = ref({
        username: '',
        email: '',
        full_name: '',
        password: '',
        admin: false
      });
      
      // Charger les utilisateurs au montage du composant
      onMounted(async () => {
        // Vérifier si l'utilisateur est connecté et est administrateur
        if (!userStore.isAuthenticated) {
          router.push('/login');
          return;
        }
        
        if (!userStore.isAdmin) {
          router.push('/');
          return;
        }
        
        try {
          // Log avant le chargement
          console.log("Avant fetchUsers");
          
          // Charger la liste des utilisateurs
          await userStore.fetchUsers();
          
          // Log après le chargement pour déboguer
          console.log("Après fetchUsers:");
          console.log("Type de userStore.users:", typeof userStore.users);
          console.log("Est un tableau?", Array.isArray(userStore.users));
          console.log("Contenu:", userStore.users);
          
          // Si ce n'est pas un tableau, essayer de le convertir en tableau
          if (!Array.isArray(userStore.users) && userStore.users) {
            console.log("Conversion en tableau...");
            // Si c'est un objet avec des entrées, convertir en tableau
            if (typeof userStore.users === 'object') {
              const usersArray = Object.values(userStore.users);
              console.log("Après conversion:", usersArray);
              userStore.users = usersArray;
            }
          }
        } catch (error) {
          console.error("Erreur lors du chargement des utilisateurs:", error);
        }
      });
      
      // Extraction des initiales pour l'avatar
      const getInitials = (name) => {
        if (!name) return '?';
        
        const parts = name.split(' ');
        if (parts.length >= 2) {
          return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        
        return name.substring(0, 2).toUpperCase();
      };
      
      // Ouvrir le modal d'édition
      const editUser = (user) => {
        userForm.value = {
            id: user.id,
            username: user.username,
            email: user.email,
            full_name: user.fullName || '',
            admin: user.admin || false,
            // Ajouter les champs supplémentaires requis
            group: user.group,
            household: user.household,
            groupId: user.groupId,
            groupSlug: user.groupSlug,
            householdId: user.householdId, 
            householdSlug: user.householdSlug,
            cacheKey: user.cacheKey
        };
        
        showEditUserModal.value = true;
        };
      
      // Mettre à jour un utilisateur
      const updateUser = async () => {
        formError.value = '';
        
        if (!userForm.value.id) {
            formError.value = "ID de l'utilisateur manquant";
            return;
        }
        
        try {
            // Envoyer tous les champs requis
            await userStore.updateUser(userForm.value.id, {
            username: userForm.value.username,
            email: userForm.value.email,
            full_name: userForm.value.full_name,
            admin: userForm.value.admin,
            group: userForm.value.group,
            household: userForm.value.household,
            groupId: userForm.value.groupId,
            groupSlug: userForm.value.groupSlug,
            householdId: userForm.value.householdId,
            householdSlug: userForm.value.householdSlug,
            cacheKey: userForm.value.cacheKey
            });
            
            closeModal();
        } catch (error) {
            formError.value = error.message || "Erreur lors de la mise à jour de l'utilisateur";
        }
        };
      
      // Créer un utilisateur
      const createUser = async () => {
        formError.value = '';
        
        if (!userForm.value.password) {
          formError.value = "Le mot de passe est obligatoire";
          return;
        }
        
        try {
          await userStore.createUser({
            username: userForm.value.username,
            email: userForm.value.email,
            full_name: userForm.value.full_name,
            password: userForm.value.password,
            admin: userForm.value.admin
          });
          
          closeModal();
        } catch (error) {
          formError.value = error.message || "Erreur lors de la création de l'utilisateur";
        }
      };
      
      // Confirmer la suppression
      const confirmDelete = (user) => {
        // Ne pas permettre de supprimer l'utilisateur actuel
        if (!user || user.id === userStore.user?.id) return;
        
        userToDelete.value = user;
        showDeleteConfirmation.value = true;
      };
      
      // Supprimer un utilisateur
      const deleteUser = async () => {
        if (!userToDelete.value || !userToDelete.value.id) return;
        
        try {
          await userStore.deleteUser(userToDelete.value.id);
          showDeleteConfirmation.value = false;
          userToDelete.value = null;
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
        }
      };
      
      // Fermer les modales
      const closeModal = () => {
        showCreateUserModal.value = false;
        showEditUserModal.value = false;
        
        // Réinitialiser le formulaire
        userForm.value = {
          username: '',
          email: '',
          full_name: '',
          password: '',
          admin: false
        };
        
        formError.value = '';
      };
      
      return {
        userStore,
        showCreateUserModal,
        showEditUserModal,
        showDeleteConfirmation,
        userToDelete,
        userForm,
        formError,
        getInitials,
        editUser,
        updateUser,
        createUser,
        confirmDelete,
        deleteUser,
        closeModal
      };
    }
  }
  </script>