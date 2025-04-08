<template>
  <div>
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold">Planning des Repas</h1>
      <div class="flex space-x-2">
        <button 
          @click="generateShoppingList"
          class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          :disabled="!hasMeals || generatingList"
          :class="{'opacity-50 cursor-not-allowed': !hasMeals || generatingList}"
        >
          <svg v-if="generatingList" class="animate-spin h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Générer liste de courses
        </button>
      </div>
    </div>

    <!-- Modal pour sélectionner une date -->
    <Teleport to="body">
      <div v-if="showDateSelector" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg p-6 max-w-md w-full" @click.stop>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              Choisir une date pour "{{ pendingRecipe?.name }}"
            </h3>
            <button @click="showDateSelector = false" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="grid grid-cols-1 gap-2 mt-4">
            <div v-for="day in weekDays" :key="day.date" 
                class="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="selectDate(day.date)">
              <div class="text-center">
                <p class="font-semibold">{{ formatDay(day.date) }} {{ formatDate(day.date) }}</p>
                <p class="text-sm text-gray-500">{{ formatFullDate(day.date) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <div class="bg-white rounded-lg shadow p-4 mb-6">
      <div class="flex justify-between items-center mb-6">
        <button 
          @click="previousWeek" 
          class="p-2 rounded hover:bg-gray-100 flex items-center"
          :disabled="loading"
          :class="{'opacity-50 cursor-not-allowed': loading}"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="hidden md:inline ml-1">Semaine précédente</span>
        </button>
        
        <h2 class="text-xl font-semibold">
          {{ formatWeekRange(startDate, endDate) }}
        </h2>
        
        <button 
          @click="nextWeek" 
          class="p-2 rounded hover:bg-gray-100 flex items-center"
          :disabled="loading"
          :class="{'opacity-50 cursor-not-allowed': loading}"
        >
          <span class="hidden md:inline mr-1">Semaine suivante</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="animate-spin h-10 w-10 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-lg font-medium">{{ errorMessage || 'Erreur lors du chargement du planning' }}</p>
        <button 
          @click="loadMealPlan" 
          class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Réessayer
        </button>
      </div>
      
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4">
        <div 
          v-for="day in weekDays" 
          :key="day.date"
          class="border rounded-lg p-3"
          :class="{ 'bg-indigo-50': isToday(day.date) }"
        >
          <div class="text-center mb-2">
            <p class="text-sm text-gray-500">{{ formatDay(day.date) }}</p>
            <p class="font-semibold">{{ formatDate(day.date) }}</p>
          </div>
          
          <div class="min-h-[120px] flex flex-col">
            <TransitionGroup 
              name="meal-list" 
              tag="div" 
              class="flex-grow"
            >
              <div 
                v-for="meal in day.meals" 
                :key="meal.id"
                class="bg-white border border-indigo-100 p-2 rounded mb-2 text-sm shadow-sm hover:shadow transition-shadow flex-shrink-0"
              >
                <div class="flex justify-between items-start">
                  <div class="flex items-start min-w-0 max-w-[calc(100%-40px)]">
                    <div 
                      class="w-2 h-2 rounded-full mt-1.5 mr-2 flex-shrink-0"
                      :class="getMealTypeClass(meal.type)"
                    ></div>
                    <span class="truncate overflow-ellipsis" :title="meal.recipe.name">{{ meal.recipe.name }}</span>
                  </div>
                  <div class="flex items-center flex-shrink-0 ml-1">
                    <button 
                      @click.stop="openRecipeDetails(meal.recipe.id)"
                      class="text-indigo-500 p-1"
                      title="Voir la recette"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button 
                      @click.stop="removeMeal(meal)" 
                      class="text-red-500 p-1"
                      title="Supprimer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </TransitionGroup>
            
            <div v-if="day.meals.length === 0" class="flex items-center justify-center h-32 opacity-50 text-sm text-center text-gray-500">
              <p>Aucun repas planifié</p>
            </div>
            
            <div class="mt-auto">
              <button 
                @click="openRecipeSelector(day.date)"
                class="w-full mt-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 border border-dashed border-indigo-300 rounded hover:bg-indigo-50 transition-colors"
              >
                + Ajouter un repas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal pour sélectionner une recette -->
    <Teleport to="body">
      <div v-if="showRecipeSelector" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] overflow-auto" @click.stop>
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              Ajouter un repas pour le {{ formatFullDate(selectedDate) }}
            </h3>
            <button @click="closeRecipeSelector" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="mb-4 flex flex-col md:flex-row gap-4">
            <div class="w-full md:w-3/4">
              <input 
                type="text" 
                v-model="recipeSearch" 
                placeholder="Rechercher une recette..." 
                class="w-full border rounded-lg px-3 py-2"
                @input="debouncedSearch"
                ref="searchInput"
              />
            </div>
            <div class="w-full md:w-1/4">
              <select 
                v-model="selectedMealType" 
                class="w-full border rounded-lg px-3 py-2"
              >
                <option value="breakfast">Petit-déjeuner</option>
                <option value="lunch">Déjeuner</option>
                <option value="dinner">Dîner</option>
                <option value="snack">Collation</option>
              </select>
            </div>
          </div>
          
          <div v-if="loadingRecipes" class="flex justify-center py-8">
            <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          
          <div v-else-if="recipesError" class="text-center py-8 text-red-500">
            <p>{{ recipesError }}</p>
            <button 
              @click="loadRecipes" 
              class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Réessayer
            </button>
          </div>
          
          <div v-else-if="filteredRecipes.length === 0" class="text-center py-8 text-gray-500">
            <p>Aucune recette trouvée</p>
          </div>
          
          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div 
              v-for="recipe in filteredRecipes" 
              :key="recipe.id"
              class="border rounded-lg p-3 flex items-center hover:bg-gray-50 cursor-pointer transition-colors"
              @click="addRecipeToDay(recipe)"
            >
              <div class="w-12 h-12 relative flex-shrink-0 mr-3 rounded overflow-hidden bg-gray-100">
                <img 
                  :src="getRecipeImage(recipe)"
                  :alt="recipe.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="handleImageError"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium truncate">{{ recipe.name }}</h4>
                <div class="flex items-center text-xs text-gray-500">
                  <span v-if="recipe.totalTime">{{ formatCookTime(recipe.totalTime) }}</span>
                  <span v-if="recipe.difficulty" class="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                    {{ recipe.difficulty }}
                  </span>
                </div>
              </div>
              <div class="ml-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
    
    <!-- Toast pour les notifications -->
    <div 
      v-if="toast.show" 
      class="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center z-50"
      :class="{ 'bg-green-600': toast.type === 'success', 'bg-red-600': toast.type === 'error' }"
    >
      <span>{{ toast.message }}</span>
      <button @click="toast.show = false" class="ml-2 text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick, onBeforeUnmount } from 'vue';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { useRoute, useRouter } from 'vue-router';
import { recipeService, shoppingService } from '../services/api';
import { useRecipeStore } from '../stores/recipeStore';
import axiosInstance from '../services/axiosInstance';

// Configurer dayjs
dayjs.extend(localizedFormat);
dayjs.locale('fr');

// Fonction helper pour debounce
const useDebounce = (fn, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

export default {
  setup() {
    const router = useRouter();
    const route = useRoute();
    const recipeStore = useRecipeStore();
    const startDate = ref(dayjs().startOf('week').format('YYYY-MM-DD'));
    const endDate = ref(dayjs().endOf('week').format('YYYY-MM-DD'));
    const weekDays = ref([]);
    const selectedRecipe = ref(null);
    const loading = ref(true);
    const error = ref(false);
    const errorMessage = ref('');
    const loadingRecipes = ref(false);
    const recipesError = ref('');
    const showRecipeSelector = ref(false);
    const selectedDate = ref('');
    const recipes = ref([]);
    const showDateSelector = ref(false);
    const pendingRecipe = ref(null);
    const recipeSearch = ref('');
    const selectedMealType = ref('dinner');
    const searchInput = ref(null);
    const toast = ref({
      show: false,
      message: '',
      type: 'success',
      timeout: null
    });
    const generatingList = ref(false);
    
    // Controller pour annuler les requêtes en cours
    let abortController = new AbortController();

    const openDateSelector = (recipe) => {
      pendingRecipe.value = recipe;
      showDateSelector.value = true;
    };

    const selectDate = (date) => {
      if (pendingRecipe.value) {
        // Fermer le sélecteur de date
        showDateSelector.value = false;
        
        // Ajouter directement la recette à la date choisie
        addRecipeToDay(pendingRecipe.value, date);
        
        // Réinitialiser la recette en attente
        pendingRecipe.value = null;
      }
    };
    // Cache d'images avec Map
    const imageCache = new Map();
    
    // Computed properties
    const hasMeals = computed(() => {
      return weekDays.value.some(day => day.meals && day.meals.length > 0);
    });

    const filteredRecipes = computed(() => {
      if (!recipeSearch.value.trim()) return recipes.value;
      
      const query = recipeSearch.value.toLowerCase().trim();
      const terms = query.split(/\s+/).filter(term => term.length > 0);
      
      if (terms.length === 0) return recipes.value;
      
      return recipes.value.filter(recipe => {
        // Recherche optimisée multi-termes
        let score = 0;
        const name = recipe.name.toLowerCase();
        
        for (const term of terms) {
          if (name.includes(term)) score += 5;
          if (recipe.description?.toLowerCase().includes(term)) score += 2;
          if (recipe.tags?.some(tag => tag.name?.toLowerCase().includes(term))) score += 3;
        }
        
        return score > 0;
      }).sort((a, b) => {
        // Tri par pertinence basé sur le nom contenant tous les termes
        const aContains = terms.every(term => a.name.toLowerCase().includes(term));
        const bContains = terms.every(term => b.name.toLowerCase().includes(term));
        
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        return 0;
      });
    });

    const openRecipeSelector = (date) => {
      selectedDate.value = date;
      showRecipeSelector.value = true;
      recipeSearch.value = '';
      
      // Focus sur le champ de recherche après le rendu du modal
      nextTick(() => {
        if (searchInput.value) {
          searchInput.value.focus();
        }
      });
    };

    watch(() => route.query, (query) => {
      if (query.recipeId) {
        // Récupérez les détails de la recette
        const recipe = {
          id: query.recipeId,
          name: query.recipeName
        };
        
        // Ouvrir le sélecteur de date pour cette recette
        openDateSelector(recipe);
      }
    }, { immediate: true });


    // Lifecycle hooks
    onMounted(async () => {
      await loadMealPlan();
      await loadRecipes();
    });
    
    onBeforeUnmount(() => {
      // Annuler les requêtes en cours lors du démontage
      abortController.abort();
      
      // Nettoyer les timeouts
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
      }
    });
    
    // Ajout d'un délai pour la recherche
    const debouncedSearch = useDebounce(() => {
      // Implémentation vide - la recherche est déjà gérée par le computed
    }, 300);

    // Méthodes
    const loadMealPlan = async () => {
      try {
        // Annuler les requêtes précédentes
        abortController.abort();
        abortController = new AbortController();
        
        loading.value = true;
        error.value = false;
        errorMessage.value = '';
        
        const response = await recipeService.getMealPlan(
          startDate.value, 
          endDate.value,
          { signal: abortController.signal }
        );
        
        const mealPlanData = Array.isArray(response.data?.items) 
          ? response.data.items 
          : [];
        
        // Initialiser les jours de la semaine
        weekDays.value = Array.from({ length: 7 }, (_, i) => {
          const date = dayjs(startDate.value).add(i, 'day').format('YYYY-MM-DD');
          return {
            date,
            meals: mealPlanData.filter(meal => meal.date === date) || []
          };
        });
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Requête annulée');
          return;
        }
        
        console.error('Erreur lors du chargement du plan de repas', err);
        error.value = true;
        errorMessage.value = err.message || 'Erreur lors du chargement du planning';
        showToast('Erreur lors du chargement du planning', 'error');
      } finally {
        loading.value = false;
      }
    };

    const getRecipeImage = (recipe) => {
      return recipeService.getRecipeImageUrl(recipe, 'min-original.webp', '/default-recipe.png', true);
    };

    const handleImageError = (e) => {
      e.target.src = '/default-recipe.png';
    };

    const loadRecipes = async () => {
      try {
        // Utiliser d'abord le cache du store si disponible
        if (recipeStore.recipes.length > 0) {
          recipes.value = recipeStore.recipes;
          loadingRecipes.value = false;
          return;
        }
        
        loadingRecipes.value = true;
        recipesError.value = '';
        
        const response = await recipeService.getAll();
        recipes.value = response.data.items || [];
        
        // Enregistrer dans le store pour les autres vues
        recipeStore.setBasicRecipes(recipes.value);
      } catch (error) {
        console.error('Erreur lors du chargement des recettes', error);
        recipesError.value = 'Erreur lors du chargement des recettes';
        showToast('Erreur lors du chargement des recettes', 'error');
      } finally {
        loadingRecipes.value = false;
      }
    };

    const previousWeek = () => {
      if (loading.value) return;
      startDate.value = dayjs(startDate.value).subtract(7, 'day').format('YYYY-MM-DD');
      endDate.value = dayjs(endDate.value).subtract(7, 'day').format('YYYY-MM-DD');
      loadMealPlan();
    };

    const nextWeek = () => {
      if (loading.value) return;
      startDate.value = dayjs(startDate.value).add(7, 'day').format('YYYY-MM-DD');
      endDate.value = dayjs(endDate.value).add(7, 'day').format('YYYY-MM-DD');
      loadMealPlan();
    };

    const formatWeekRange = (start, end) => {
      return `${dayjs(start).format('D MMM')} - ${dayjs(end).format('D MMM YYYY')}`;
    };

    const formatDay = (date) => {
      return dayjs(date).format('ddd');
    };

    const formatDate = (date) => {
      return dayjs(date).format('D');
    };
    
    const formatFullDate = (date) => {
      return dayjs(date).format('dddd D MMMM');
    };

    const formatCookTime = (minutes) => {
      if (!minutes) return 'N/A';
      if (minutes < 60) return `${minutes} min`;
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins ? `${hours}h ${mins}min` : `${hours}h`;
    };
    
    const isToday = (date) => {
      return dayjs(date).format('YYYY-MM-DD') === dayjs().format('YYYY-MM-DD');
    };

   
    const closeRecipeSelector = () => {
      showRecipeSelector.value = false;
      selectedDate.value = '';
      recipeSearch.value = '';
    };
    
    const openRecipeDetails = (recipeId) => {
      router.push(`/recipes/${recipeId}`);
    };

    const addRecipeToDay = async (recipe, date = selectedDate.value) => {
      try {
        const response = await recipeService.addToMealPlan({
          date: date,
          recipeId: recipe.id,
          type: selectedMealType.value || 'dinner',
          title: recipe.name,
          description: recipe.description || ''
        });

        console.log('Réponse complète de l\'ajout:', response);

        if (!response || !response.data) {
          throw new Error('Réponse invalide de l\'API');
        }

        const dayIndex = weekDays.value.findIndex(day => day.date === date);
        if (dayIndex !== -1) {
          weekDays.value[dayIndex].meals.push(response.data);
        }
        
        showToast(`"${recipe.name}" ajouté au planning`);
        closeRecipeSelector();
      } catch (error) {
        console.error('Erreur détaillée ajout repas', error);
        const errorMessage = error.message || 'Erreur lors de l\'ajout du repas';
        showToast(errorMessage, 'error');
      }
    };

    const removeMeal = async (meal) => {
      try {
        // Mettre à jour l'interface d'abord (optimiste)
        const dayIndex = weekDays.value.findIndex(day => day.date === meal.date);
        let mealIndex = -1;
        let removedMeal = null;
        
        if (dayIndex !== -1) {
          mealIndex = weekDays.value[dayIndex].meals.findIndex(m => m.id === meal.id);
          if (mealIndex !== -1) {
            removedMeal = weekDays.value[dayIndex].meals[mealIndex];
            weekDays.value[dayIndex].meals.splice(mealIndex, 1);
          }
        }
        
        // Puis envoyer la requête à l'API
        await recipeService.removeFromMealPlan(meal.id);
        
        showToast('Repas supprimé du planning');
      } catch (error) {
        console.error('Erreur lors de la suppression du repas', error);
        
        // En cas d'erreur, remettre le repas dans l'interface
        if (removedMeal && dayIndex !== -1) {
          weekDays.value[dayIndex].meals.splice(mealIndex, 0, removedMeal);
        }
        
        showToast('Erreur lors de la suppression du repas', 'error');
      }
    };

    // Fonction corrigée pour generateShoppingList dans PlannerView.vue
    const generateShoppingList = async () => {
      if (!hasMeals.value) {
        showToast('Aucun repas n\'a été planifié', 'error');
        return;
      }
      
      try {
        generatingList.value = true;
        
        // 1. Récupérer les identifiants des recettes du planning
        const recipeIds = new Set();
        weekDays.value.forEach(day => {
          day.meals.forEach(meal => {
            if (meal.recipe && meal.recipe.id) {
              recipeIds.add(meal.recipe.id);
            }
          });
        });
        
        if (recipeIds.size === 0) {
          throw new Error('Aucune recette trouvée dans le planning pour générer la liste');
        }
        
        console.log(`Recettes trouvées dans le planning: ${Array.from(recipeIds).join(', ')}`);
        
        // 2. Pour chaque recette, récupérer ses détails complets
        const recipePromises = Array.from(recipeIds).map(id => recipeService.getById(id));
        const recipeResponses = await Promise.all(recipePromises);
        
        // 3. Récupérer la liste de courses principale
        const listResponse = await shoppingService.getMainShoppingList();
        const mainList = listResponse.data.items?.[0];
        
        if (!mainList || !mainList.id) {
          throw new Error('Aucune liste de courses valide trouvée');
        }
        
        console.log(`Liste de courses cible: ${mainList.id}`);
        
        // 4. Pour chaque recette, envoyer une requête séparée
        for (const recipeResponse of recipeResponses) {
          if (!recipeResponse.data || !recipeResponse.data.id) {
            console.warn('Recette invalide ignorée');
            continue;
          }
          
          const recipe = recipeResponse.data;
          
          // Préparer le payload au format attendu par l'API
          const payload = [{
            recipeId: recipe.id,
            recipeIncrementQuantity: 1,
            recipeIngredients: recipe.recipeIngredient || []
          }];
          
          console.log(`Ajout de la recette ${recipe.name} (${recipe.id}) à la liste de courses`);
          
          // Appeler l'API avec le format exact qu'elle attend
          await axiosInstance.post(`/households/shopping/lists/${mainList.id}/recipe`, payload);
        }
        
        showToast('Liste de courses générée avec succès');
        
        // 5. Redirection vers la page des courses
        setTimeout(() => {
          router.push('/shopping');
        }, 1000);
        
      } catch (error) {
        console.error('Erreur lors de la génération de la liste', error);
        
        if (error.response) {
          console.error('Détails de l\'erreur API:', {
            status: error.response.status,
            data: error.response.data
          });
        }
        
        showToast(
          error.message || 'Erreur lors de la génération de la liste de courses', 
          'error'
        );
      } finally {
        generatingList.value = false;
      }
    };

    const getMealTypeClass = (type) => {
      const classes = {
        'lunch': 'bg-green-500',
        'dinner': 'bg-blue-500',
        'breakfast': 'bg-orange-400',
        'snack': 'bg-purple-500'
      };
      
      return classes[type] || 'bg-gray-500';
    };
    
    const showToast = (message, type = 'success') => {
      // Effacer le timeout précédent s'il existe
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
      }
      
      // Mettre à jour le toast
      toast.value = {
        show: true,
        message,
        type,
        timeout: setTimeout(() => {
          toast.value.show = false;
        }, 3000)
      };
    };

    return {
      startDate,
      endDate,
      weekDays,
      loading,
      error,
      errorMessage,
      loadingRecipes,
      recipesError,
      getRecipeImage,
      handleImageError,
      showRecipeSelector,
      selectedDate,
      recipes,
      recipeSearch,
      selectedMealType,
      filteredRecipes,
      hasMeals,
      searchInput,
      toast,
      generatingList,
      previousWeek,
      selectedRecipe,
      nextWeek,
      formatWeekRange,
      formatDay,
      formatDate,
      formatFullDate,
      formatCookTime,
      isToday,
      openRecipeSelector,
      closeRecipeSelector,
      addRecipeToDay,
      removeMeal,
      generateShoppingList,
      openRecipeDetails,
      loadMealPlan,
      debouncedSearch,
      getMealTypeClass,
      formatWeekRange,
      formatDay,
      showDateSelector,
      pendingRecipe,
      openDateSelector,
      selectDate,
      formatDate
    };
  }
};
</script>

<style scoped>
/* Assurer que les conteneurs de repas gèrent correctement l'overflow */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Animation pour la liste de repas */
.meal-list-enter-active,
.meal-list-leave-active {
  transition: all 0.3s ease;
}
.meal-list-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.meal-list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* Animation pour le toast */
@keyframes slideIn {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

[v-cloak] {
  display: none;
}
</style>