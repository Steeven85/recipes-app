<template>
    <div>
      <!-- Barre de recherche avec debounce -->
      <div class="mb-6">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher une recette..."
          class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          @input="debouncedSearch"
        />
      </div>
  
      <!-- Modes d'affichage: Tous/Favoris -->
      <div class="flex mb-6">
        <button 
          @click="updateActiveView('all')"
          class="px-4 py-2 rounded-lg mr-2"
          :class="activeView === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'"
        >
          Toutes les recettes
        </button>
        <button 
          @click="updateActiveView('favorites')"
          class="px-4 py-2 rounded-lg flex items-center"
          :class="activeView === 'favorites' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
          </svg>
          Favoris
          <span v-if="favoritesCount > 0" class="ml-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
            {{ favoritesCount }}
          </span>
        </button>
      </div>
  
      <!-- Filtre par catégories -->
      <div class="mb-6">
        <div class="flex justify-between items-center mb-2">
          <button 
            @click="toggleCategoriesFilter"
            class="flex items-center text-emerald-600 font-medium"
          >
            <span>Filtrer par catégorie</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 ml-1 transition-transform" 
              :class="showCategoriesFilter ? 'transform rotate-180' : ''"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <!-- Affichage de la catégorie sélectionnée -->
          <div v-if="selectedCategory" class="flex items-center">
            <span class="text-sm text-gray-600 mr-2">
              Catégorie : 
              <span class="font-medium text-emerald-600">
                {{ (getCategoryName(selectedCategory)) || 'Catégorie inconnue' }}
              </span>
            </span>
            <button 
              @click="clearCategoryFilter"
              class="text-gray-500 hover:text-gray-700"
              title="Effacer le filtre"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
  
      <!-- Panneau déroulant des catégories -->
      <div 
        v-show="showCategoriesFilter" 
        class="bg-white rounded-lg shadow-md p-4 mb-4 transition-all duration-300 max-h-72 overflow-y-auto"
      >
        <div v-if="loading && categories.length === 0" class="text-gray-500 text-center py-2">
          <slot name="spinner"></slot>
        </div>
        <div v-else-if="categories.length === 0" class="text-gray-500 text-center py-2">
          Aucune catégorie trouvée
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <button 
            v-for="(category, index) in categories" 
            :key="category?.id || `category-${index}`"
            @click="category && category.id && selectCategory(category.id)"
            class="px-3 py-2 rounded-full text-sm text-center transition-colors truncate"
            :class="selectedCategory === (category?.id || '') 
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
          >
            {{ category?.name || 'Catégorie sans nom' }}
            <span v-if="category?.count" class="ml-1 text-xs font-medium">
              ({{ category.count }})
            </span>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, defineComponent } from 'vue';
  
  // Créer une fonction de debounce réutilisable
  const useDebounce = (fn, delay = 300) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };
  
  export default defineComponent({
    name: 'RecipeFilters',
    
    props: {
      categories: {
        type: Array,
        required: true
      },
      modelValue: {
        type: String,
        default: ''
      },
      activeView: {
        type: String,
        default: 'all'
      },
      selectedCategory: {
        type: String,
        default: null
      },
      loading: {
        type: Boolean,
        default: false
      },
      favoritesCount: {
        type: Number,
        default: 0
      }
    },
    
    emits: ['update:modelValue', 'update:activeView', 'select-category', 'clear-category', 'search'],
    
    setup(props, { emit }) {
      const searchQuery = computed({
        get: () => props.modelValue,
        set: (value) => emit('update:modelValue', value)
      });
      
      const showCategoriesFilter = ref(false);
      
      // Debounce la recherche
      const debouncedSearch = useDebounce(() => {
        emit('search', searchQuery.value);
      }, 300);
      
      // Mise à jour de la vue active (tous/favoris)
      const updateActiveView = (view) => {
        emit('update:activeView', view);
      };
      
      // Toggle du panneau des catégories
      const toggleCategoriesFilter = () => {
        showCategoriesFilter.value = !showCategoriesFilter.value;
      };
      
      // Sélection d'une catégorie
      const selectCategory = (categoryId) => {
        if (props.selectedCategory === categoryId) {
          emit('clear-category');
        } else {
          emit('select-category', categoryId);
        }
        showCategoriesFilter.value = false;
      };
      
      // Effacer le filtre de catégorie
      const clearCategoryFilter = () => {
        emit('clear-category');
      };
      
      // Obtenir le nom d'une catégorie à partir de son ID
      const getCategoryName = (categoryId) => {
        const category = props.categories.find(c => c && c.id === categoryId);
        return category ? category.name : null;
      };
      
      return {
        searchQuery,
        showCategoriesFilter,
        debouncedSearch,
        updateActiveView,
        toggleCategoriesFilter,
        selectCategory,
        clearCategoryFilter,
        getCategoryName
      };
    }
  });
  </script>