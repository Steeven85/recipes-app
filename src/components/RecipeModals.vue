<template>
<<<<<<< HEAD
  <div>
    <!-- Modal pour ajouter une recette (choix entre URL et création manuelle) -->
    <BaseModal
      v-model="showAddRecipeModal"
      title="Ajouter une recette"
      size="md"
    >
      <div class="space-y-4">
        <div class="grid grid-cols-1 gap-4">
          <button 
            class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="showUrlImport"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span class="font-medium">Importer depuis une URL</span>
          </button>
  
          <button 
            class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="showManualCreate"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            <span class="font-medium">Créer manuellement</span>
          </button>
            
          <button 
            class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            @click="$emit('open-wizard')"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <span class="font-medium">Assistant de création</span>
          </button>
        </div>
      </div>
    </BaseModal>
  
    <!-- Modal pour importer via URL -->
    <BaseModal
      v-model="localShowUrlImport"
      title="Importer depuis une URL"
      size="md"
    >
      <div
        v-if="urlImportStatus === 'error'"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        {{ urlImportError }}
      </div>
  
      <div
        v-if="urlImportStatus === 'success'"
        class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
      >
        Recette importée avec succès !
      </div>
  
      <form @submit.prevent="importFromUrl">
        <div class="mb-4">
          <label
            for="recipe-url"
            class="block text-sm font-medium text-gray-700 mb-1"
          >URL de la recette</label>
          <input
            id="recipe-url"
            v-model="recipeUrl"
            type="url"
            placeholder="https://exemple.com/recette"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
          >
          <p class="mt-1 text-sm text-gray-500">
            Collez l'URL d'une recette en ligne
          </p>
        </div>
  
        <div class="flex justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            :disabled="urlImportStatus === 'loading'"
            @click="localShowUrlImport = false"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
            :disabled="urlImportStatus === 'loading'"
          >
            <span v-if="urlImportStatus === 'loading'">
              <LoadingSpinner
                size="sm"
                class="mr-2"
              />
              Importation...
            </span>
            <span v-else>Importer</span>
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
=======
    <div>
      <!-- Modal pour ajouter une recette (choix entre URL et création manuelle) -->
      <BaseModal
        v-model="showAddRecipeModal"
        title="Ajouter une recette"
        size="md"
      >
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <button 
              @click="showUrlImport"
              class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span class="font-medium">Importer depuis une URL</span>
            </button>
  
            <button 
              @click="showManualCreate"
              class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="font-medium">Créer manuellement</span>
            </button>
            
            <button 
              @click="$emit('open-wizard')"
              class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span class="font-medium">Assistant de création</span>
            </button>
          </div>
        </div>
      </BaseModal>
  
      <!-- Modal pour importer via URL -->
      <BaseModal
        v-model="localShowUrlImport"
        title="Importer depuis une URL"
        size="md"
      >
        <div v-if="urlImportStatus === 'error'" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ urlImportError }}
        </div>
  
        <div v-if="urlImportStatus === 'success'" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Recette importée avec succès !
        </div>
  
        <form @submit.prevent="importFromUrl">
          <div class="mb-4">
            <label for="recipe-url" class="block text-sm font-medium text-gray-700 mb-1">URL de la recette</label>
            <input
              id="recipe-url"
              v-model="recipeUrl"
              type="url"
              placeholder="https://exemple.com/recette"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            />
            <p class="mt-1 text-sm text-gray-500">Collez l'URL d'une recette en ligne</p>
          </div>
  
          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="localShowUrlImport = false"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              :disabled="urlImportStatus === 'loading'"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
              :disabled="urlImportStatus === 'loading'"
            >
              <span v-if="urlImportStatus === 'loading'">
                <LoadingSpinner size="sm" class="mr-2" />
                Importation...
              </span>
              <span v-else>Importer</span>
            </button>
          </div>
        </form>
      </BaseModal>
    </div>
  </template>
>>>>>>> 53c7b4ed70d3c00647a31fbe10100d13d2c3f7ed
  
  <script>
  import { ref, defineComponent, computed, watch } from 'vue';
  import BaseModal from './base/BaseModal.vue';
  import LoadingSpinner from './LoadingSpinner.vue';
  
  export default defineComponent({
    name: 'RecipeModals',
    
    components: {
      BaseModal,
      LoadingSpinner
    },
    
    props: {
      show: {
        type: Boolean,
        default: false
      },
      showUrlImportModal: {
        type: Boolean,
        default: false
      },
      urlImportStatus: {
        type: String,
        default: 'idle' // idle, loading, success, error
      },
      urlImportError: {
        type: String,
        default: ''
      }
    },
    
    emits: [
      'update:show', 
      'update:showUrlImportModal', 
      'import-from-url', 
      'show-manual-create', 
      'open-wizard'
    ],
    
    setup(props, { emit }) {
      // Liaison bidirectionnelle avec les props
      const showAddRecipeModal = computed({
        get: () => props.show,
        set: (value) => emit('update:show', value)
      });
      
      const localShowUrlImport = computed({
        get: () => props.showUrlImportModal,
        set: (value) => emit('update:showUrlImportModal', value)
      });
      
      // État local
      const recipeUrl = ref('');
      
      // Méthodes
      const showUrlImport = () => {
        showAddRecipeModal.value = false;
        localShowUrlImport.value = true;
      };
      
      const showManualCreate = () => {
        showAddRecipeModal.value = false;
        emit('show-manual-create');
      };
      
      const importFromUrl = () => {
        if (!recipeUrl.value) return;
        emit('import-from-url', recipeUrl.value);
      };
      
      // Réinitialiser l'URL lorsque le modal se ferme
      watch(localShowUrlImport, (value) => {
        if (!value) {
          recipeUrl.value = '';
        }
      });
      
      return {
        showAddRecipeModal,
        localShowUrlImport,
        recipeUrl,
        showUrlImport,
        showManualCreate,
        importFromUrl
      };
    }
  });
  </script>