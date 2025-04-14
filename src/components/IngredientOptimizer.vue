<!-- IngredientOptimizer.vue -->
<template>
    <div class="ingredient-optimizer">
      <!-- Bouton d'optimisation qui apparaît sur la page de détail de la recette -->
      <button 
        v-if="!isOptimizing && !optimizedRecipe" 
        @click="optimizeIngredients" 
        class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center mx-auto my-4"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
        </svg>
        Optimiser les ingrédients
      </button>
  
      <!-- Indicateur de chargement -->
      <div v-if="isOptimizing" class="text-center py-4">
        <svg class="animate-spin h-8 w-8 text-emerald-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-2 text-gray-600">Analyse et optimisation des ingrédients en cours...</p>
      </div>
  
      <!-- Affichage des résultats d'optimisation pour révision par l'utilisateur -->
      <div v-if="optimizedRecipe && !isUpdating" class="mt-6 bg-white rounded-lg shadow-md p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-4">Révision des ingrédients optimisés</h3>
        
        <div v-if="error" class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {{ errorMessage }}
        </div>
        
        <div v-if="success" class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          Ingrédients mis à jour avec succès !
        </div>
        
        <div class="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
          <p>Les ingrédients ont été analysés et optimisés. Vérifiez les modifications ci-dessous avant de les appliquer.</p>
        </div>
        
        <!-- Tableau de comparaison des ingrédients -->
        <div class="overflow-x-auto">
          <table class="min-w-full bg-white">
            <thead>
              <tr class="bg-gray-100">
                <th class="py-2 px-4 border-b text-left">Ingrédient d'origine</th>
                <th class="py-2 px-4 border-b text-left">Ingrédient optimisé</th>
                <th class="py-2 px-4 border-b text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(ingredient, index) in comparisonData" :key="index" class="border-b hover:bg-gray-50">
                <td class="py-2 px-4">
                  {{ ingredient.original }}
                </td>
                <td class="py-2 px-4">
                  <div class="flex items-center">
                    <!-- Badge pour indiquer la qualité de la correspondance -->
                    <span 
                      v-if="ingredient.matchQuality" 
                      :class="getMatchQualityClass(ingredient.matchQuality)"
                      class="inline-block rounded-full px-2 py-1 text-xs mr-2"
                    >
                      {{ ingredient.matchQuality }}
                    </span>
                    {{ ingredient.optimized }}
                  </div>
                </td>
                <td class="py-2 px-4 text-center">
                  <button 
                    @click="toggleIngredient(index)" 
                    :title="ingredient.use ? 'Conserver la version optimisée' : 'Revenir à la version d\'origine'"
                    :class="ingredient.use ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'"
                    class="p-1 rounded-full hover:bg-opacity-80"
                  >
                    <svg v-if="ingredient.use" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Actions -->
        <div class="mt-6 flex justify-end space-x-3">
          <button 
            @click="cancel" 
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button 
            @click="applyOptimizations" 
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
            :disabled="isUpdating"
          >
            <span v-if="isUpdating">
              <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Mise à jour...
            </span>
            <span v-else>
              Appliquer les optimisations
            </span>
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, reactive, computed, onMounted } from 'vue';
  import { recipeService } from '../services/api';
  
  export default {
    name: 'IngredientOptimizer',
    
    props: {
      recipeId: {
        type: String,
        required: false
      },
      recipeSlug: {
        type: String,
        required: false
      },
      originalRecipe: {
        type: Object,
        required: true
      }
    },
    
    emits: ['update:recipe', 'optimization-complete'],
    
    setup(props, { emit }) {
      const isOptimizing = ref(false);
      const isUpdating = ref(false);
      const optimizedRecipe = ref(null);
      const error = ref(false);
      const errorMessage = ref('');
      const success = ref(false);
      
      // Données pour la comparaison des ingrédients
      const comparisonData = ref([]);
      
      // Fonction pour optimiser les ingrédients
      const optimizeIngredients = async () => {
        isOptimizing.value = true;
        error.value = false;
        errorMessage.value = '';
        
        try {
          // Déterminer quel identifiant utiliser, en privilégiant le slug
          const recipeIdentifier = props.recipeSlug || props.originalRecipe.slug || props.recipeId || props.originalRecipe.id;
          
          if (!recipeIdentifier) {
            throw new Error("Impossible d'identifier la recette. Ni slug ni ID disponible.");
          }
          
          // Appeler l'API pour optimiser les ingrédients
          const optimizedData = await recipeService.optimizeRecipeIngredients(recipeIdentifier);
          
          // Stocker les données optimisées
          optimizedRecipe.value = optimizedData;
          
          // Préparer les données de comparaison
          prepareComparisonData();
        } catch (err) {
          console.error('Erreur lors de l\'optimisation des ingrédients:', err);
          error.value = true;
          errorMessage.value = err.message || 'Impossible d\'optimiser les ingrédients. Veuillez réessayer.';
        } finally {
          isOptimizing.value = false;
        }
      };
      
      // Préparer les données de comparaison entre les ingrédients originaux et optimisés
      const prepareComparisonData = () => {
        if (!props.originalRecipe || !optimizedRecipe.value) return;
        
        const originalIngredients = props.originalRecipe.recipeIngredient || [];
        const optimizedIngredients = optimizedRecipe.value.recipeIngredient || [];
        
        // Créer les données de comparaison
        comparisonData.value = [];
        
        for (let i = 0; i < Math.min(originalIngredients.length, optimizedIngredients.length); i++) {
          const original = originalIngredients[i];
          const optimized = optimizedIngredients[i];
          
          // Nettoyer l'affichage des ingrédients originaux (supprimer les "1 " au début s'ils sont suivis d'une quantité)
          let originalDisplay = original.display || original.originalText || '';
          if (originalDisplay.match(/^1\s+(?:\d+|\d+\/\d+|\d+\.\d+|\d+\s+\w+)/)) {
            originalDisplay = originalDisplay.replace(/^1\s+/, '');
          }
          
          // Nettoyer l'affichage des ingrédients optimisés
          let optimizedDisplay = optimized.display || optimized.originalText || '';
          if (optimizedDisplay.match(/^1\s+(?:\d+|\d+\/\d+|\d+\.\d+|\d+\s+\w+)/)) {
            optimizedDisplay = optimizedDisplay.replace(/^1\s+/, '');
          }
          
          // Déterminer la qualité de la correspondance
          let matchQuality = null;
          
          // Une correspondance exacte si l'ingrédient a un ID de food
          if (optimized.food && optimized.food.id) {
            matchQuality = 'Exact';
          } 
          // Une correspondance partielle si le nom a changé mais pas d'ID
          else if (optimized.food && optimized.food.name && 
                  (!original.food || optimized.food.name !== original.food.name)) {
            matchQuality = 'Partiel';
          }
          // Une correspondance d'unité si l'unité a un ID
          else if (optimized.unit && optimized.unit.id && 
                  (!original.unit || optimized.unit.id !== original.unit.id)) {
            matchQuality = 'Unité';
          }
          
          // N'ajouter que si l'optimisation a apporté des changements
          const hasChanged = originalDisplay !== optimizedDisplay || matchQuality !== null;
          
          if (hasChanged) {
            comparisonData.value.push({
              original: originalDisplay,
              optimized: optimizedDisplay,
              use: true, // Par défaut, utiliser la version optimisée
              matchQuality,
              // Conserver les références aux objets pour la mise à jour
              originalIndex: i,
              originalObject: original,
              optimizedObject: optimized
            });
          }
        }
        
        // Si aucun changement détecté, afficher un message
        if (comparisonData.value.length === 0) {
          error.value = true;
          errorMessage.value = "Aucune optimisation n'a pu être effectuée. Les ingrédients sont déjà bien structurés.";
        }
      };
      
      // Inverser la sélection d'un ingrédient
      const toggleIngredient = (index) => {
        if (index >= 0 && index < comparisonData.value.length) {
          comparisonData.value[index].use = !comparisonData.value[index].use;
        }
      };

      // Appliquer les optimisations sélectionnées
      const applyOptimizations = async () => {
        isUpdating.value = true;
        error.value = false;
        errorMessage.value = '';
        
        try {
          // Créer une copie profonde de la recette originale
          const finalRecipe = JSON.parse(JSON.stringify(props.originalRecipe));
          
          // Mettre à jour uniquement les ingrédients modifiés selon les sélections de l'utilisateur
          for (let i = 0; i < comparisonData.value.length; i++) {
            const comparison = comparisonData.value[i];
            const index = comparison.originalIndex;
            
            // Si l'utilisateur a accepté l'optimisation pour cet ingrédient
            if (comparison.use) {
              // Extraire les propriétés importantes à mettre à jour
              const { quantity, unit, food, note, display } = comparison.optimizedObject;
              
              // Mettre à jour ces propriétés dans la recette finale
              finalRecipe.recipeIngredient[index].quantity = quantity;
              finalRecipe.recipeIngredient[index].unit = unit;
              finalRecipe.recipeIngredient[index].food = food;
              finalRecipe.recipeIngredient[index].note = note;
              finalRecipe.recipeIngredient[index].display = display;
            }
            // Sinon, conserver les valeurs originales (déjà présentes dans finalRecipe)
          }
          
          // Mettre à jour la recette
          await recipeService.updateRecipeWithOptimizedIngredients(props.recipeId, finalRecipe);
          
          // Afficher le succès
          success.value = true;
          
          // Émettre l'événement pour mettre à jour la recette dans le composant parent
          emit('update:recipe', finalRecipe);
          emit('optimization-complete', true);
          
          // Réinitialiser après un délai
          setTimeout(() => {
            optimizedRecipe.value = null;
            comparisonData.value = [];
            success.value = false;
          }, 3000);
        } catch (err) {
          console.error('Erreur lors de la mise à jour de la recette:', err);
          error.value = true;
          errorMessage.value = err.message || 'Impossible de mettre à jour la recette avec les ingrédients optimisés.';
          emit('optimization-complete', false);
        } finally {
          isUpdating.value = false;
        }
      };
      
      
      // Annuler l'optimisation
      const cancel = () => {
        optimizedRecipe.value = null;
        comparisonData.value = [];
        error.value = false;
        success.value = false;
        emit('optimization-complete', false);
      };
      
      // Obtenir la classe CSS pour la qualité de la correspondance
      const getMatchQualityClass = (quality) => {
        switch (quality) {
          case 'Exact':
            return 'bg-green-100 text-green-800';
          case 'Partiel':
            return 'bg-yellow-100 text-yellow-800';
          case 'Unité':
            return 'bg-blue-100 text-blue-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
      };
      
      return {
        isOptimizing,
        isUpdating,
        optimizedRecipe,
        error,
        errorMessage,
        success,
        comparisonData,
        optimizeIngredients,
        toggleIngredient,
        applyOptimizations,
        cancel,
        getMatchQualityClass
      };
    }
  };
  </script>