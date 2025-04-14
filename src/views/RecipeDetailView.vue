<template>
  <!-- État de chargement -->
  <div v-if="loading && !recipe" class="text-center py-12">
    <svg
      class="animate-spin h-12 w-12 text-emerald-600 mx-auto"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="4"
      ></circle>
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>

  <!-- Message d'erreur -->
  <div v-else-if="error" class="text-center py-12 text-red-500">
    {{ error }}
  </div>

  <!-- Affichage de la recette - Vue normale lorsque isEditing est false -->
  <div v-else-if="recipe && !isEditing" class="max-w-4xl mx-auto px-4 py-8">
    <!-- En-tête avec titre et boutons d'action -->
    <div class="mb-8 relative">
      <!-- Titre en premier pour mobile -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ recipe.name }}</h1>
        <p v-if="recipe.description" class="text-gray-600 text-lg">
          {{ recipe.description }}
        </p>
      </div>
      
      <!-- Boutons d'action après le titre en mobile, à droite en desktop -->
      <div class="flex justify-center md:absolute md:top-0 md:right-0 mt-4 md:mt-0 space-x-2">
        <!-- Bouton Modifier/Visualiser -->
        <button 
          @click="toggleEditMode"
          class="p-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 shadow-md transition-all"
          title="Modifier la recette"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
          </svg>
        </button>
        
        <!-- Bouton Favoris -->
        <button 
          @click="toggleFavorite"
          class="p-2 rounded-full shadow-md transition-all"
          :class="isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'"
          title="Ajouter aux favoris"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path v-if="isFavorite" fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            <path v-else fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" stroke="currentColor" stroke-width="1" fill="none" />
          </svg>
        </button>
        
        <!-- Bouton Supprimer -->
        <button 
          @click="confirmDelete"
          class="p-2 bg-white text-red-600 rounded-full hover:bg-red-100 shadow-md transition-all"
          title="Supprimer la recette"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Image principale avec lazy loading et chargement progressif -->
    <div class="mb-8 relative">
      <div v-if="imageLoading" class="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
        <svg class="animate-spin h-8 w-8 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- Affichage de l'image -->
      <img
        :src="getRecipeImage(recipe.id)"
        :alt="recipe.name"
        class="w-full h-96 object-cover rounded-xl shadow-lg"
        loading="lazy"
        @load="imageLoading = false"
        @error="handleImageError"
      />
    </div>

    <!-- Métadonnées -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <!-- Sélecteur de portions -->
      <div class="bg-emerald-50 p-4 rounded-lg text-center col-span-2 md:col-span-1">
        <p class="text-sm font-semibold text-emerald-600 mb-1">Portions</p>
        <div class="flex items-center justify-center">
          <button 
            @click="decreaseServings" 
            class="bg-emerald-100 text-emerald-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
            :disabled="servings <= 1"
            :class="{'opacity-50 cursor-not-allowed': servings <= 1}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd" />
            </svg>
          </button>
          <span class="mx-3 text-lg font-medium text-gray-900">{{ servings }}</span>
          <button 
            @click="increaseServings" 
            class="bg-emerald-100 text-emerald-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Champs Temps de préparation/cuisson -->
      <div class="bg-emerald-50 p-4 rounded-lg text-center">
        <p class="text-sm font-semibold text-emerald-600 mb-1">Préparation</p>
        <p class="text-lg text-gray-900">{{ formatTime(recipe.prepTime) }}</p>
      </div>
      
      <div class="bg-emerald-50 p-4 rounded-lg text-center">
        <p class="text-sm font-semibold text-emerald-600 mb-1">Cuisson</p>
        <p class="text-lg text-gray-900">{{ formatTime(recipe.performTime) }}</p>
      </div>
      
      <div class="bg-emerald-50 p-4 rounded-lg text-center">
        <p class="text-sm font-semibold text-emerald-600 mb-1">Total</p>
        <p class="text-lg text-gray-900">{{ formatTime(recipe.totalTime) }}</p>
      </div>
    </div>

    <!-- Tabs pour navigation entre sections sur mobile -->
    <div class="md:hidden mb-4">
      <div class="flex space-x-2 overflow-x-auto pb-2">
        <button 
          @click="activeTab = 'ingredients'" 
          :class="['px-4 py-2 rounded-lg text-sm whitespace-nowrap', activeTab === 'ingredients' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800']"
        >
          Ingrédients
        </button>
        <button 
          @click="activeTab = 'instructions'" 
          :class="['px-4 py-2 rounded-lg text-sm whitespace-nowrap', activeTab === 'instructions' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800']"
        >
          Instructions
        </button>
        <button 
          v-if="recipe.nutrition" 
          @click="activeTab = 'nutrition'" 
          :class="['px-4 py-2 rounded-lg text-sm whitespace-nowrap', activeTab === 'nutrition' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-800']"
        >
          Nutrition
        </button>
      </div>
    </div>

    <div v-if="recipe">
      <!-- Notification pour les recettes fraîchement importées ou modifiées -->
      <div v-if="(recipeJustImported || recipeJustModified) && !showOptimizer" class="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-blue-700">
              {{ recipeJustImported ? 'Recette importée avec succès!' : 'Recette modifiée avec succès!' }} 
              Vous pouvez optimiser les ingrédients pour une meilleure structure.
            </p>
            <div class="mt-2">
              <button 
                @click="displayOptimizer" 
                class="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 text-sm"
              >
                Optimiser maintenant
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Bouton d'optimisation toujours visible (en plus petit, dans la section des ingrédients) -->
      <div v-if="!showOptimizer" class="mb-4">
        <button 
          @click="displayOptimizer" 
          class="flex items-center text-sm px-3 py-1 border border-emerald-300 text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
          Optimiser les ingrédients
        </button>
      </div>
      
      <!-- Composant d'optimisation des ingrédients -->
      <IngredientOptimizer 
        v-if="showOptimizer" 
        :recipe-id="recipe.id"
        :recipe-slug="recipe.slug"
        :original-recipe="recipe"
        @update:recipe="updateRecipeAfterOptimization"
        @optimization-complete="handleOptimizationComplete"
      />
    </div>


    <!-- Ingrédients -->
    <section v-show="activeTab === 'ingredients' || !isMobile" class="mb-8 bg-white p-6 rounded-xl shadow-sm">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Ingrédients</h2>
      
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <li
          v-for="(ingredient, index) in adjustedIngredients"
          :key="index"
          class="flex items-center bg-gray-50 p-3 rounded-lg"
        >
          <span class="mr-2 text-emerald-500">•</span>
          <span class="text-gray-700">{{ formatIngredient(ingredient) }}</span>
        </li>
      </ul>
    </section>

    <!-- Instructions -->
    <section v-show="activeTab === 'instructions' || !isMobile" class="mb-8 bg-white p-6 rounded-xl shadow-sm">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Instructions</h2>
      
      <ol class="space-y-4">
        <li
          v-for="(step, index) in recipe.recipeInstructions"
          :key="index"
          class="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500"
        >
          <div class="font-semibold text-emerald-600 mb-2">
            Étape {{ index + 1 }}
            <span v-if="step.summary" class="ml-2">- {{ step.summary }}</span>
          </div>
          <p class="text-gray-700">{{ step.text }}</p>
        </li>
      </ol>
    </section>

    <!-- Nutrition -->
    <section v-if="recipe.nutrition" v-show="activeTab === 'nutrition' || !isMobile" class="bg-white p-6 rounded-xl shadow-sm mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Valeurs nutritionnelles</h2>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          v-for="([key, value], index) in Object.entries(adjustedNutrition || {}).filter(([_, value]) => value)"
          :key="index"
          class="bg-gray-50 p-3 rounded-lg text-center"
        >
          <p class="text-sm font-semibold text-gray-600 capitalize">{{ nutritionLabels[key] || key }}</p>
          <p class="text-lg text-gray-900">{{ value }}</p>
        </div>
      </div>
    </section>

    <!-- Bouton retour -->
    <div class="text-center mt-8">
      <button 
        @click="router.back()" 
        class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
      >
        Retour à la liste
      </button>
    </div>
  </div>

  <!-- Composant RecipeEditor en mode édition -->
  <div v-else-if="recipe && isEditing" class="max-w-4xl mx-auto px-4 py-8">
    <RecipeEditor 
      :recipeData="recipe" 
      @close="cancelEditing" 
      @recipe-saved="handleRecipeSaved"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { recipeService } from '../services/api';
import { useRecipeStore } from '../stores/recipeStore';
import RecipeEditor from './RecipeEditor.vue';
import IngredientOptimizer from '../components/IngredientOptimizer.vue';

export default {
  components: {
    RecipeEditor,
    IngredientOptimizer
  },
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const recipeStore = useRecipeStore();
    const recipe = ref(null);
    const loading = ref(true);
    const error = ref(null);
    const imageLoading = ref(true);
    const abortController = new AbortController();
    const isFavorite = ref(false);
    const showOptimizer = ref(false);
    const recipeJustImported = ref(false);
    const displayOptimizer = () => {
      showOptimizer.value = true;
    };

    
    // Gestion du mode édition
    const isEditing = ref(false);
    
    // Gestion des portions
    const originalServings = ref(4); // Valeur par défaut
    const servings = ref(4); // Nombre actuel de portions
    
    // État pour les tabs sur mobile
    const activeTab = ref('ingredients');
    const isMobile = computed(() => window.innerWidth < 768);
    const windowWidth = ref(window.innerWidth);

    // Gestionnaire de redimensionnement
    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    };
    
    // Toggle mode édition
    const toggleEditMode = () => {
      isEditing.value = !isEditing.value;
    };
    
    // Annuler l'édition
    const cancelEditing = () => {
      isEditing.value = false;
    };
    
    // Gestion de l'erreur d'image
    const handleImageError = (e) => {
      console.log("Erreur de chargement d'image", e);
      e.target.src = '/default-recipe.png'; // Image par défaut
    };
    
    // Traitement après sauvegarde d'une recette
    const handleRecipeSaved = (updatedRecipe) => {
      // Mettre à jour la recette locale
      recipe.value = updatedRecipe;
      
      // Mettre à jour la recette dans le store
      recipeStore.updateRecipe(updatedRecipe.id, updatedRecipe);
      
      // Fermer le mode édition
      isEditing.value = false;
    };

    // Méthode pour confirmer la suppression avec une boîte de dialogue
    const confirmDelete = () => {
      if (!recipe.value) return;
      
      // Utiliser une confirmation pour éviter les suppressions accidentelles
      const isConfirmed = window.confirm(
        `Êtes-vous sûr de vouloir supprimer la recette "${recipe.value.name}" ? Cette action est irréversible.`
      );
      
      if (isConfirmed) {
        deleteRecipe();
      }
    };

    // Méthode pour supprimer la recette
    const deleteRecipe = async () => {
      if (!recipe.value) return;
      
      try {
        loading.value = true;
        
        // Appel API pour supprimer la recette
        await recipeService.deleteRecipe(recipe.value.id);
        
        // Suppression dans le store local
        recipeStore.removeRecipe(recipe.value.id);
        
        // Notification de succès
        alert('Recette supprimée avec succès');
        
        // Redirection vers la liste des recettes
        router.push('/');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert(`Erreur lors de la suppression : ${error.message}`);
      } finally {
        loading.value = false;
      }
    };

    // Fonction utilitaire pour convertir les temps
    const convertTimeToMinutes = (time) => {
      // Si déjà un nombre, le retourner tel quel
      if (typeof time === 'number') return time;
      
      // Si null ou undefined, retourner 0
      if (time == null) return 0;
      
      // Si chaîne
      if (typeof time === 'string') {
        // Essayer d'extraire un nombre
        const match = time.match(/(\d+)/);
        if (match) {
          return parseInt(match[1], 10);
        }
      }
      
      // Dernier recours
      return 0;
    };

    // Modification du nombre de portions
    const increaseServings = () => {
      servings.value += 1;
    };

    const decreaseServings = () => {
      if (servings.value > 1) {
        servings.value -= 1;
      }
    };

    // Formatage du temps en heures/minutes
    const formatTime = (minutes) => {
      // Conversion explicite en nombre
      const minutesNum = convertTimeToMinutes(minutes);
      
      // Différents cas de formatage
      if (minutesNum === 0) return 'N/A';
      
      const hours = Math.floor(minutesNum / 60);
      const mins = Math.floor(minutesNum % 60);
      
      if (hours > 0 && mins > 0) {
        return `${hours}h${mins.toString().padStart(2, '0')}`;
      } else if (hours > 0) {
        return `${hours}h`;
      } else if (mins > 0) {
        return `${mins}min`;
      }
      
      return 'N/A';
    };
    
    // Fonction pour ajouter/retirer des favoris
    const toggleFavorite = () => {
      isFavorite.value = !isFavorite.value;
      
      // Si on a un service/store pour gérer les favoris
      if (recipe.value) {
        if (isFavorite.value) {
          // Ajouter aux favoris via le store ou un service
          recipeStore.addFavorite(recipe.value.id);
        } else {
          // Retirer des favoris
          recipeStore.removeFavorite(recipe.value.id);
        }
      }
    };

    // Récupération de l'image avec taille adaptative
    const getRecipeImage = (id) => {
      // Utiliser une image plus petite sur mobile pour optimiser le chargement
      const size = windowWidth.value < 768 ? 'min-original.webp' : 'original.webp';
      return recipeService.getRecipeImageUrl(id, size);
    };

    const nutritionLabels = {
      calories: 'Calories',
      carbohydrateContent: 'Glucides',
      cholesterolContent: 'Cholestérol',
      fatContent: 'Lipides',
      fiberContent: 'Fibres',
      proteinContent: 'Protéines',
      saturatedFatContent: 'Graisses saturées',
      sodiumContent: 'Sodium',
      sugarContent: 'Sucres',
      transFatContent: 'Graisses trans',
      unsaturatedFatContent: 'Graisses insaturées',
    };

    const formatIngredient = (ingredient) => {
      if (!ingredient) return '';
      
      const parts = [];
      
      // Quantité
      if (ingredient.quantity) parts.push(ingredient.quantity);
      
      // Unité avec gestion du pluriel
      if (ingredient.unit && ingredient.unit.name) {
        const quantity = ingredient.quantity || 1;
        const unit = quantity > 1 && ingredient.unit.pluralName ? 
                    ingredient.unit.pluralName : 
                    ingredient.unit.name;
        parts.push(unit);
      }
      
      // Nom de l'aliment
      if (ingredient.food && ingredient.food.name) {
        const foodName = ingredient.quantity > 1 && ingredient.food.pluralName ?
                        ingredient.food.pluralName :
                        ingredient.food.name;
        parts.push(foodName);
      }
      
      // Note entre parenthèses
      if (ingredient.note) parts.push(`(${ingredient.note})`);

      return parts.join(' ');
    };

    // Ajustement des ingrédients en fonction du nombre de portions
    const adjustedIngredients = computed(() => {
      if (!recipe.value || !originalServings.value || !recipe.value.recipeIngredient) return [];
      
      const ratio = servings.value / originalServings.value;
      
      return recipe.value.recipeIngredient.map(ingredient => {
        if (!ingredient) return {};
        
        // Créer une copie profonde pour ne pas modifier l'original
        const adjustedIngredient = JSON.parse(JSON.stringify(ingredient));
        
        // S'assurer que les propriétés nécessaires existent
        if (!adjustedIngredient.unit) adjustedIngredient.unit = { name: '' };
        if (!adjustedIngredient.food) adjustedIngredient.food = { name: '' };
        
        // Ajuster la quantité si elle existe
        if (adjustedIngredient.quantity !== null && adjustedIngredient.quantity !== undefined) {
          adjustedIngredient.quantity = (adjustedIngredient.quantity * ratio).toFixed(1);
          // Supprimer les zéros décimaux inutiles (ex: 2.0 -> 2)
          adjustedIngredient.quantity = parseFloat(adjustedIngredient.quantity);
        }
        
        return adjustedIngredient;
      });
    });
    
    // Ajustement des valeurs nutritionnelles
    const adjustedNutrition = computed(() => {
      if (!recipe.value || !recipe.value.nutrition || !originalServings.value) return {};
      
      const ratio = servings.value / originalServings.value;
      const result = {};
      
      // Pour chaque valeur nutritionnelle, l'ajuster selon le ratio
      for (const [key, value] of Object.entries(recipe.value.nutrition || {})) {
        if (value === null || value === undefined) {
          result[key] = value;
          continue;
        }
        
        // Calcul de la nouvelle valeur nutritionnelle
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          result[key] = (numValue * ratio).toFixed(1);
          // Si la valeur est un entier, on supprime la partie décimale
          if (result[key].endsWith('.0')) {
            result[key] = result[key].slice(0, -2);
          }
        } else {
          result[key] = value;
        }
      }
      
      return result;
    });

    const handleOptimizationComplete = (success) => {
      if (success) {
        // Recharger les données de la recette après une optimisation réussie
        loadRecipeDetails();
      }
      showOptimizer.value = false;
    };
    
    // Ajouter cette méthode pour mettre à jour la recette après optimisation
    const updateRecipeAfterOptimization = (updatedRecipe) => {
      if (updatedRecipe && recipe.value) {
        recipe.value = updatedRecipe;
      }
    };


    // Dans la fonction onMounted
    onMounted(async () => {
      // Ajouter l'écouteur de redimensionnement
      window.addEventListener('resize', handleResize);
      
      try {
        const recipeId = route.params.id;
        
        if (!recipeId) {
          error.value = 'Identifiant de recette manquant';
          loading.value = false;
          return;
        }
        
        // Vérifier si la recette est déjà dans le store
        const cachedRecipe = recipeStore.getRecipeById(recipeId);
        
        if (cachedRecipe && cachedRecipe._detailsLoaded) {
          // Utiliser la recette en cache si les détails sont chargés
          recipe.value = cachedRecipe;
          
          // Initialiser originalServings à partir de la recette
          if (recipe.value && recipe.value.recipeServings) {
            originalServings.value = recipe.value.recipeServings;
            servings.value = recipe.value.recipeServings;
          }
          
          loading.value = false;
        } else if (cachedRecipe) {
          // Utiliser la version en cache temporairement, mais charger les détails complets
          recipe.value = cachedRecipe;
        }
        
        // Charger les détails complets de la recette
        const response = await recipeService.getById(recipeId, { signal: abortController.signal });
        
        if (!response.data) {
          throw new Error('Recette non trouvée');
        }
        
        recipe.value = response.data;
        
        // Initialiser originalServings à partir de la recette
        if (recipe.value && recipe.value.recipeServings) {
          originalServings.value = recipe.value.recipeServings;
          servings.value = recipe.value.recipeServings;
        }
        
        // Vérifier si la recette est en favoris
        if (recipeStore.isFavorite && recipeStore.isFavorite(recipeId)) {
          isFavorite.value = true;
        }
        
        // Mettre à jour le store avec les détails complets
        if (cachedRecipe) {
          recipeStore.updateRecipe(recipeId, { ...response.data, _detailsLoaded: true });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error(err);
          error.value = 'Erreur lors du chargement de la recette';
        }
      } finally {
        loading.value = false;
      }
     // Vérifier si la recette vient d'être importée (via un paramètre d'URL par exemple)
     const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('imported') === 'true') {
        recipeJustImported.value = true;
        showOptimizer.value = true;
      }
    });
    
    onBeforeUnmount(() => {
      // Nettoyer l'écouteur et annuler les requêtes en cours
      window.removeEventListener('resize', handleResize);
      abortController.abort();
    });

    return {
      recipe,
      loading,
      error,
      imageLoading,
      formatTime,
      getRecipeImage,
      nutritionLabels,
      formatIngredient,
      activeTab,
      isMobile,
      router,
      isFavorite,
      toggleFavorite,
      isEditing,
      toggleEditMode,
      cancelEditing,
      handleRecipeSaved,
      originalServings,
      servings,
      increaseServings,
      decreaseServings,
      adjustedIngredients,
      adjustedNutrition,
      confirmDelete,
      deleteRecipe,
      handleImageError,
      showOptimizer,
      recipeJustImported,
      handleOptimizationComplete,
      updateRecipeAfterOptimization,
      displayOptimizer
    };
  }
};
</script>

<style scoped>
/* Animation de fade pour les transitions */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Animation pour le bouton favoris */
button {
  transition: all 0.2s ease;
}
</style>