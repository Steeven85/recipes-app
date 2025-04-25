<!-- IngredientOptimizer.vue -->
<template>
  <div class="ingredient-optimizer">
    <!-- Bouton d'optimisation qui apparaît sur la page de détail de la recette -->
    <button 
      v-if="!isOptimizing && !optimizedRecipe" 
      class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center mx-auto my-4" 
      @click="optimizeIngredients"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-5 w-5 mr-2"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
          clip-rule="evenodd"
        />
      </svg>
      Optimiser les ingrédients
    </button>

    <!-- Indicateur de chargement -->
    <div
      v-if="isOptimizing"
      class="text-center py-4"
    >
      <svg
        class="animate-spin h-8 w-8 text-emerald-600 mx-auto"
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
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <p class="mt-2 text-gray-600">
        Analyse et optimisation des ingrédients en cours...
      </p>
    </div>

    <!-- Affichage des résultats d'optimisation pour révision par l'utilisateur -->
    <div
      v-if="optimizedRecipe && !isUpdating"
      class="mt-6 bg-white rounded-lg shadow-md p-6"
    >
      <h3 class="text-xl font-semibold text-gray-800 mb-4">
        Révision des ingrédients optimisés
      </h3>
      
      <div
        v-if="error"
        class="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
      >
        {{ errorMessage }}
      </div>
      
      <div
        v-if="success"
        class="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded"
      >
        Ingrédients mis à jour avec succès !
      </div>
      
      <div class="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 text-blue-700">
        <p>Les ingrédients ont été analysés et optimisés. Vérifiez les modifications ci-dessous avant de les appliquer.</p>
        <div class="flex flex-wrap gap-2 mt-2">
          <span class="inline-block rounded-full px-2 py-1 text-xs bg-purple-100 text-purple-800">
            Déjà associé
          </span>
          <span class="inline-block rounded-full px-2 py-1 text-xs bg-yellow-100 text-yellow-800">
            Partiel
          </span>
          <span class="inline-block rounded-full px-2 py-1 text-xs bg-green-100 text-green-800">
            Exact
          </span>
          <span class="inline-block rounded-full px-2 py-1 text-xs bg-blue-100 text-blue-800">
            Suggestion
          </span>
          <span class="inline-block rounded-full px-2 py-1 text-xs bg-red-100 text-red-800">
            À améliorer
          </span>
        </div>
      </div>
      
      <!-- Table comparing ingredients - DESKTOP VIEW -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead>
            <tr class="bg-gray-100">
              <th class="py-2 px-4 border-b text-left">
                Ingrédient d'origine
              </th>
              <th class="py-2 px-4 border-b text-left">
                Ingrédient optimisé
              </th>
              <th class="py-2 px-2 border-b text-center">
                Quantité
              </th>
              <th class="py-2 px-2 border-b text-center">
                Unité
              </th>
              <th class="py-2 px-2 border-b text-center">
                Aliment
              </th>
              <th class="py-2 px-2 border-b text-center w-16">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(ingredient, index) in comparisonData"
              :key="index"
              class="border-b hover:bg-gray-50"
              :class="{ 
                'bg-yellow-50': ingredient.matchQuality === 'Partiel',
                'bg-green-50': ingredient.isAlreadyOptimized,
                'opacity-50': ingredient.isAlreadyOptimized
              }"
            >
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
                  <!-- Badge pour indiquer si déjà optimisé -->
                  <span 
                    v-if="ingredient.isAlreadyOptimized" 
                    class="inline-block rounded-full px-2 py-1 text-xs mr-2 bg-purple-100 text-purple-800"
                  >
                    Déjà associé
                  </span>
                  <!-- Afficher le texte normal -->
                  <div>
                    {{ ingredient.optimized }}
                  </div>
                </div>
              </td>
              <td class="py-2 px-2 text-center">
                {{ ingredient.optimizedObject.quantity }}
              </td>
              <td class="py-2 px-2">
                <div class="text-center">
                  {{ ingredient.optimizedObject.unit ? (ingredient.optimizedObject.unit.abbreviation || ingredient.optimizedObject.unit.name) : '-' }}
                </div>
              </td>
              <td class="py-2 px-2">
                <div class="text-center">
                  {{ ingredient.optimizedObject.food ? ingredient.optimizedObject.food.name : '-' }}
                </div>
              </td>
              <td class="py-2 px-2 text-center">
                <div class="flex justify-center">
                  <button 
                    :title="ingredient.use ? 'Conserver la version optimisée' : 'Revenir à la version d\'origine'" 
                    :class="ingredient.use ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'"
                    class="p-1 rounded-full hover:bg-opacity-80"
                    @click="toggleIngredient(index)"
                  >
                    <svg
                      v-if="ingredient.use"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      />
                    </svg>
                    <svg
                      v-else
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                  <!-- Bouton d'édition -->
                  <button 
                    title="Modifier cet ingrédient" 
                    class="ml-2 p-1 rounded-full hover:bg-gray-200 text-blue-600" 
                    @click="openIngredientEditor(index)"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- MOBILE VIEW - Cards instead of table -->
      <div class="md:hidden space-y-4">
        <div 
          v-for="(ingredient, index) in comparisonData" 
          :key="index" 
          class="border rounded-lg overflow-hidden shadow-sm"
          :class="{ 
            'border-yellow-300 bg-yellow-50': ingredient.matchQuality === 'Partiel',
            'border-purple-300 bg-purple-50': ingredient.isAlreadyOptimized,
            'opacity-70': ingredient.isAlreadyOptimized
          }"
        >
          <div class="flex justify-between items-center p-3 bg-gray-50 border-b">
            <div class="flex items-center">
              <!-- Badge pour indiquer la qualité de la correspondance -->
              <div class="flex flex-wrap gap-1">
                <span 
                  v-if="ingredient.matchQuality" 
                  :class="getMatchQualityClass(ingredient.matchQuality)"
                  class="inline-block rounded-full px-2 py-1 text-xs"
                >
                  {{ ingredient.matchQuality }}
                </span>
                <span 
                  v-if="ingredient.isAlreadyOptimized" 
                  class="inline-block rounded-full px-2 py-1 text-xs bg-purple-100 text-purple-800"
                >
                  Déjà associé
                </span>
              </div>
              <span class="font-medium">Ingrédient {{ index + 1 }}</span>
            </div>
            <div class="flex space-x-2">
              <button 
                :title="ingredient.use ? 'Conserver la version optimisée' : 'Revenir à la version d\'origine'" 
                :class="ingredient.use ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'"
                class="p-1 rounded-full hover:bg-opacity-80"
                @click="toggleIngredient(index)"
              >
                <svg
                  v-if="ingredient.use"
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <svg
                  v-else
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
              <button 
                title="Modifier cet ingrédient" 
                class="p-1 rounded-full hover:bg-gray-200 text-blue-600" 
                @click="openIngredientEditor(index)"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-3 bg-white">
            <div class="mb-2">
              <span class="text-xs font-medium text-gray-500">Original:</span>
              <p class="text-gray-800">
                {{ ingredient.original }}
              </p>
            </div>
            
            <div class="mb-2">
              <span class="text-xs font-medium text-gray-500">Optimisé:</span>
              <p class="text-gray-800 font-medium">
                {{ ingredient.optimized }}
              </p>
            </div>
            
            <div class="grid grid-cols-3 gap-2 mt-3 text-sm">
              <div>
                <span class="text-xs font-medium text-gray-500">Quantité</span>
                <p class="text-gray-800">
                  {{ ingredient.optimizedObject.quantity || '-' }}
                </p>
              </div>
              <div>
                <span class="text-xs font-medium text-gray-500">Unité</span>
                <p class="text-gray-800">
                  {{ ingredient.optimizedObject.unit ? (ingredient.optimizedObject.unit.abbreviation || ingredient.optimizedObject.unit.name) : '-' }}
                </p>
              </div>
              <div>
                <span class="text-xs font-medium text-gray-500">Aliment</span>
                <p class="text-gray-800">
                  {{ ingredient.optimizedObject.food ? ingredient.optimizedObject.food.name : '-' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="mt-6 flex flex-wrap justify-end gap-3">
        <button 
          class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 w-full md:w-auto" 
          @click="cancel"
        >
          Annuler
        </button>
        <button 
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center w-full md:w-auto" 
          :disabled="isUpdating"
          @click="applyOptimizations"
        >
          <span v-if="isUpdating">
            <svg
              class="animate-spin h-5 w-5 mr-2 text-white"
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
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Mise à jour...
          </span>
          <span v-else>
            Appliquer les optimisations
          </span>
        </button>
      </div>
    </div>

    <!-- Modal d'édition d'ingrédient -->
    <div
      v-if="editingIngredientIndex !== null"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg shadow-xl p-4 md:p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">
            Modifier l'ingrédient
          </h3>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="closeIngredientEditor"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        
        <div
          v-if="editingIngredient"
          class="mb-3 p-3 bg-gray-50 rounded-lg"
        >
          <!-- Utiliser une disposition en colonne pour mobile, grille pour desktop -->
          <div class="space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-2">
            <!-- Quantité -->
            <div class="md:col-span-2">
              <label
                for="quantity"
                class="block text-sm font-medium text-gray-700 mb-1 md:sr-only"
              >
                Quantité
              </label>
              <input 
                id="quantity"
                v-model.number="editingIngredient.quantity" 
                type="number" 
                min="0" 
                step="0.1"
                placeholder="Qté"
                class="w-full border border-gray-300 rounded p-2 text-center"
              >
            </div>
            
            <!-- Unité -->
            <div class="md:col-span-3">
              <label
                for="unit"
                class="block text-sm font-medium text-gray-700 mb-1 md:sr-only"
              >
                Unité
              </label>
              <div class="relative">
                <input 
                  id="unit"
                  v-model="editingUnitInput"
                  placeholder="Unité (optionnelle)"
                  class="w-full border border-gray-300 rounded p-2" 
                  @input="editingIngredient.unit = null"
                  @focus="showUnitDropdown = true"
                  @blur="closeUnitDropdown"
                >
                <div 
                  v-if="showUnitDropdown" 
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                >
                  <!-- Option pour aucune unité -->
                  <div 
                    class="p-2 hover:bg-gray-100 cursor-pointer bg-gray-50 text-gray-700 font-medium border-b border-gray-200"
                    @mousedown.prevent="handleUnitSelection(null)"
                  >
                    -- Aucune unité --
                  </div>
                  
                  <!-- Liste des unités disponibles -->
                  <div 
                    v-for="unit in filteredUnits(editingUnitInput)" 
                    :key="unit.id" 
                    class="p-2 hover:bg-gray-100 cursor-pointer"
                    @mousedown.prevent="handleUnitSelection(unit)"
                  >
                    {{ unit.name }}
                  </div>
                </div>
              </div>
              <!-- Bouton pour effacer l'unité -->
              <button 
                v-if="editingUnitInput" 
                class="absolute right-12 mt-2 text-gray-400 hover:text-gray-600"
                title="Effacer l'unité"
                @click="clearUnit"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4"
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

            <!-- Ingrédient -->
            <div class="md:col-span-7">
              <label
                for="food"
                class="block text-sm font-medium text-gray-700 mb-1 md:sr-only"
              >
                Ingrédient
              </label>
              <div class="relative">
                <input 
                  id="food"
                  v-model="editingFoodInput"
                  placeholder="Ingrédient"
                  class="w-full border border-gray-300 rounded p-2" 
                  @input="editingIngredient.food = null"
                  @focus="openFoodDropdown"
                  @blur="closeFoodDropdown"
                  @keydown.enter.prevent="handleFoodInputEnter"
                >
                <div 
                  v-if="showFoodDropdown" 
                  class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                  @scroll="handleFoodDropdownScroll"
                >
                  <!-- Message si aucun ingrédient trouvé -->
                  <div
                    v-if="filteredFoods(editingFoodInput).length === 0"
                    class="p-3 text-gray-500 text-center"
                  >
                    Aucun ingrédient trouvé
                  </div>
                  
                  <!-- Liste d'ingrédients -->
                  <div 
                    v-for="food in filteredFoods(editingFoodInput)" 
                    :key="food.id" 
                    :class="[
                      'p-2 cursor-pointer',
                      food.isNewFood 
                        ? 'text-emerald-600 font-medium bg-emerald-50 hover:bg-emerald-100 flex items-center' 
                        : food.isLoadMoreIndicator
                          ? 'text-gray-600 bg-gray-100 font-medium text-center'
                          : 'hover:bg-gray-100'
                    ]"
                    @mousedown.prevent="selectFood(food)"
                  >
                    <!-- Icône plus pour nouvel ingrédient -->
                    <svg
                      v-if="food.isNewFood"
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4 mr-1 inline"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                    
                    <!-- Indicateur de chargement pour "Charger plus" -->
                    <div
                      v-if="food.isLoadMoreIndicator && isLoadingMoreFoods"
                      class="flex justify-center items-center"
                    >
                      <svg
                        class="animate-spin h-4 w-4 mr-2"
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
                        />
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    </div>
                    
                    {{ food.name }}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Note (optionnel) -->
          <div class="mt-3">
            <label
              for="note"
              class="block text-sm font-medium text-gray-700 mb-1"
            >
              Note (optionnel)
            </label>
            <input 
              id="note"
              v-model="editingIngredient.note" 
              placeholder="Note (optionnel)"
              class="w-full border border-gray-300 rounded p-2 text-sm"
            >
          </div>
        </div>

        <!-- Boutons d'action -->
        <div class="flex flex-col-reverse md:flex-row md:justify-end space-y-2 space-y-reverse md:space-y-0 md:space-x-2 pt-4">
          <button 
            class="px-3 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 w-full md:w-auto" 
            @click="closeIngredientEditor"
          >
            Annuler
          </button>
          <button 
            class="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 w-full md:w-auto" 
            @click="saveEditingIngredient"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { recipeService, referenceService } from '@/services/api';

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
    },
    skipAutoOptimization: {
      type: Boolean,
      default: false
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
    
    // Pagination des ingrédients
    const currentFoodsPage = ref(1);
    const hasMoreFoods = ref(true);
    const isLoadingMoreFoods = ref(false);
    
    // Stocker les unités et aliments disponibles
    const units = ref([]);
    const foods = ref([]);
    
    // État pour l'édition d'ingrédient
    const editingIngredientIndex = ref(null);
    const editingIngredient = ref(null);
    const editingUnitInput = ref('');
    const editingFoodInput = ref('');
    const showUnitDropdown = ref(false);
    const showFoodDropdown = ref(false);
    
    // Charger les unités et aliments disponibles
    const loadReferenceData = async () => {
      try {
        isOptimizing.value = true;
        
        // Charger les unités
        const unitsResponse = await referenceService.getUnits();
        if (unitsResponse.data && Array.isArray(unitsResponse.data.items)) {
          units.value = unitsResponse.data.items.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
        } else {
          units.value = [];
        }
        
        // Réinitialiser la pagination pour les ingrédients
        currentFoodsPage.value = 1;
        hasMoreFoods.value = true;
        
        // Charger les aliments
        await loadAllFoods('');
        
      } catch (err) {
        console.error('Erreur lors du chargement des données de référence', err);
        error.value = true;
        errorMessage.value = 'Impossible de charger les données de référence. Réessayez plus tard.';
      } finally {
        isOptimizing.value = false;
      }
    };
    
    // Chargement de tous les aliments
    const loadAllFoods = async (query = '') => {
      isLoadingMoreFoods.value = true;
      try {
        const perPage = 1000; // On charge jusqu'à 1000 ingrédients d'un coup
        const response = await referenceService.getFoods({
          page: 1,
          perPage: perPage,
          query: query,
          orderBy: 'name',
          orderDirection: 'asc'
        });
        
        if (response.data && Array.isArray(response.data.items)) {
          // On trie par ordre alphabétique (insensible à la casse)
          foods.value = response.data.items.sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          hasMoreFoods.value = false; // Plus de pagination nécessaire
        }
      } catch (err) {
        console.error("Erreur lors du chargement complet des ingrédients", err);
      } finally {
        isLoadingMoreFoods.value = false;
      }
    };
    
    // Chargement progressif des ingrédients
    const loadNextPageOfFoods = async (query = '') => {
      if (isLoadingMoreFoods.value || !hasMoreFoods.value) return;
      
      isLoadingMoreFoods.value = true;
      
      try {
        const perPage = 100; // Nombre d'éléments par page
              
        const response = await referenceService.getFoods({
          page: currentFoodsPage.value,
          perPage: perPage,
          query: query,
          orderBy: 'name',
          orderDirection: 'asc'
        });
        
        if (response.data && Array.isArray(response.data.items)) {
          const newFoods = response.data.items;
          
          // Si première page, remplacer les ingrédients
          if (currentFoodsPage.value === 1) {
            foods.value = newFoods;
          } else {
            // Sinon, ajouter à la liste existante
            // Éviter les doublons en utilisant les IDs
            const existingIds = new Set(foods.value.map(food => food.id));
            const uniqueNewFoods = newFoods.filter(food => !existingIds.has(food.id));
            foods.value = [...foods.value, ...uniqueNewFoods];
          }
          
          // Vérifier s'il y a plus de pages à charger
          if (response.data.pagination) {
            // Si l'API fournit des informations de pagination
            hasMoreFoods.value = currentFoodsPage.value < response.data.pagination.totalPages;
          } else {
            // Sinon, supposer qu'il y a plus de pages si on a reçu le nombre maximal d'éléments
            hasMoreFoods.value = newFoods.length === perPage;
          }
          
          // Trier la liste complète par ordre alphabétique
          foods.value.sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
          
          // Incrémenter le numéro de page pour le prochain chargement
          currentFoodsPage.value++;
        } else {
          hasMoreFoods.value = false;
        }
      } catch (err) {
        console.error('Erreur lors du chargement des ingrédients', err);
        hasMoreFoods.value = false;
      } finally {
        isLoadingMoreFoods.value = false;
      }
    };
    
    // Gestionnaire de défilement pour le dropdown des ingrédients
    const handleFoodDropdownScroll = (event) => {
      const dropdown = event.target;
      
      // Vérifier si l'utilisateur est proche du bas de la liste
      if (dropdown.scrollHeight - dropdown.scrollTop <= dropdown.clientHeight + 50) {
        // Charger la page suivante si on n'est pas déjà en train de charger
        if (!isLoadingMoreFoods.value && hasMoreFoods.value) {
          // Important: utiliser la valeur de recherche actuelle
          const searchQuery = editingFoodInput.value || '';
          loadNextPageOfFoods(searchQuery);
        }
      }
    };
    
    // Filtrage des unités avec tri intelligent
    const filteredUnits = (query) => {
      let filteredList = [];
      
      // Filtrer les unités normales
      if (!query) {
        filteredList = [...units.value];
      } else {
        const lowerQuery = query.toLowerCase();
        const matches = units.value.filter(unit => 
          unit.name.toLowerCase().includes(lowerQuery)
        );
        filteredList = [...matches];
      }
      
      return filteredList;
    };
    
    // Filtrage des aliments avec tri intelligent
    const filteredFoods = (query) => {
      const lowerQuery = query ? query.toLowerCase().trim() : '';
      
      // Filtrer les ingrédients selon la requête
      let matches;
      if (!lowerQuery) {
        // Sans requête, prendre tous les ingrédients chargés
        matches = [...foods.value];
      } else {
        // Avec requête, filtrer selon les critères
        matches = foods.value.filter(food => {
          const foodName = food.name.toLowerCase();
          
          // Recherche exacte (prioritaire)
          if (foodName === lowerQuery) return true;
          
          // Commence par la requête
          if (foodName.startsWith(lowerQuery)) return true;
          
          // Contient la requête
          if (foodName.includes(lowerQuery)) return true;
          
          // Recherche de mots individuels
          const words = lowerQuery.split(/\s+/);
          return words.every(word => foodName.includes(word));
        });
      }
      
      // Trier les résultats par pertinence
      matches.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Priorité 1 : Correspondance exacte
        if (aName === lowerQuery && bName !== lowerQuery) return -1;
        if (bName === lowerQuery && aName !== lowerQuery) return 1;
        
        // Priorité 2 : Commence par la requête
        if (lowerQuery && aName.startsWith(lowerQuery) && !bName.startsWith(lowerQuery)) return -1;
        if (lowerQuery && bName.startsWith(lowerQuery) && !aName.startsWith(lowerQuery)) return 1;
        
        // Priorité 3 : Ordre alphabétique
        return aName.localeCompare(bName);
      });
      
      // Limiter le nombre de résultats pour des raisons de performance UI
      const limitedMatches = matches.slice(0, 100);
      
      // Si aucun résultat exact et qu'une requête est présente, ajouter l'option de création
      if (lowerQuery && (limitedMatches.length === 0 || 
          !limitedMatches.some(food => food.name.toLowerCase() === lowerQuery))) {
        limitedMatches.push({
          id: 'new',
          name: `Créer "${query}"`,
          isNewFood: true
        });
      }
      
      // Ajouter un indicateur de chargement si plus d'ingrédients sont disponibles
      if (hasMoreFoods.value && !isLoadingMoreFoods.value) {
        // On peut ajouter ici un élément visuel qui indique qu'il y a plus à charger
        limitedMatches.push({
          id: 'load-more',
          name: '↓ Charger plus d\'ingrédients ↓',
          isLoadMoreIndicator: true
        });
      }
      
      return limitedMatches;
    };
    
    // Ouvrir le dropdown pour les unités
    const openUnitDropdown = () => {
      showUnitDropdown.value = true;
    };
    
    // Fermer le dropdown pour les unités
    const closeUnitDropdown = (event) => {
      // Fermer avec délai pour permettre la sélection
      setTimeout(() => {
        showUnitDropdown.value = false;
      }, 200);
    };
    
    // Gérer la sélection d'une unité
    const handleUnitSelection = (unit) => {
      if (!unit) {
        // Traiter comme "Aucune unité"
        editingIngredient.value.unit = null;
        editingUnitInput.value = '';
      } else {
        // Traiter comme une unité normale
        editingIngredient.value.unit = unit;
        editingUnitInput.value = unit.name;
      }
      showUnitDropdown.value = false;
    };
    
    // Effacer l'unité
    const clearUnit = () => {
      editingIngredient.value.unit = null;
      editingUnitInput.value = '';
    };
    
    // Ouvrir le dropdown pour les aliments
    const openFoodDropdown = () => {
      // Affiche le dropdown
      showFoodDropdown.value = true;
      
      // Si la liste n'a pas encore été chargée, charger tous les ingrédients
      if (foods.value.length === 0) {
        loadAllFoods(editingFoodInput.value || '');
      } else if (editingFoodInput.value) {
        // Si un terme de recherche existe, filtrer en rechargeant
        loadAllFoods(editingFoodInput.value);
      }
    };
    
    // Fermer le dropdown pour les aliments
    const closeFoodDropdown = () => {
      // Fermer avec délai pour permettre la sélection
      setTimeout(() => {
        showFoodDropdown.value = false;
      }, 200);
    };
    
    // Gérer l'appui sur la touche Entrée dans le champ ingrédient
    const handleFoodInputEnter = () => {
      const foodName = editingFoodInput.value;
      if (!foodName || !foodName.trim()) return;
      
      // Rechercher si l'ingrédient existe déjà
      const exactMatch = foods.value.find(food => 
        food.name.toLowerCase() === foodName.toLowerCase()
      );
      
      if (exactMatch) {
        // Si l'ingrédient existe, le sélectionner
        selectFood(exactMatch);
      } else {
        // Sinon, proposer de créer un nouvel ingrédient
        createNewFood(foodName.trim());
      }
    };
    
    // Sélectionner un aliment dans la liste déroulante
    const selectFood = (food) => {
      // Si c'est l'indicateur de chargement, charger plus d'ingrédients
      if (food.isLoadMoreIndicator) {
        loadNextPageOfFoods(editingFoodInput.value || '');
        return;
      }
      
      if (food.isNewFood) {
        // Code pour créer un nouvel ingrédient
        createNewFood(editingFoodInput.value);
      } else {
        // Mettre à jour l'ingrédient
        editingIngredient.value.food = food;
        editingFoodInput.value = food.name;
      }
      showFoodDropdown.value = false;
    };
    
    // Création d'un nouvel ingrédient
    const createNewFood = async (foodName) => {
      try {
        isLoadingMoreFoods.value = true;
        
        // Créer un nouvel aliment via l'API
        const response = await referenceService.createFood({
          id: "", // L'API génère l'ID
          name: foodName,
          description: ''
        });
        
        if (response && response.data) {
          const newFood = response.data;
          
          // Ajouter le nouvel aliment à la liste locale
          foods.value.unshift(newFood);
          
          // Mettre à jour l'ingrédient avec le nouvel aliment
          editingIngredient.value.food = newFood;
          editingFoodInput.value = newFood.name;
          
          // Notification de succès
          success.value = true;
          
          // Masquer après un délai
          setTimeout(() => {
            success.value = false;
          }, 3000);
        }
      } catch (err) {
        console.error('Erreur lors de la création de l\'ingrédient', err);
        error.value = true;
        errorMessage.value = 'Impossible de créer l\'ingrédient. Veuillez réessayer.';
        
        // Masquer après un délai
        setTimeout(() => {
          error.value = false;
        }, 3000);
      } finally {
        isLoadingMoreFoods.value = false;
      }
    };
    
    // Fonction pour optimiser les ingrédients - version améliorée
    const optimizeIngredients = async () => {
      isOptimizing.value = true;
      error.value = false;
      errorMessage.value = '';
      
      try {
        // Charger les unités et aliments si pas déjà chargés
        if (units.value.length === 0 || foods.value.length === 0) {
          await loadReferenceData();
        }
        
        // Si on doit sauter l'optimisation automatique
        if (props.skipAutoOptimization) {
          // Utiliser directement les données originales sans optimisation
          optimizedRecipe.value = JSON.parse(JSON.stringify(props.originalRecipe));
        } else {
          // Sinon, procéder à l'optimisation automatique avec notre propre logique
          const recipeIdentifier = props.recipeSlug || props.originalRecipe.slug || props.recipeId || props.originalRecipe.id;
          
          if (!recipeIdentifier) {
            throw new Error("Impossible d'identifier la recette. Ni slug ni ID disponible.");
          }
          
          // Récupérer la recette originale
          const originalRecipeResponse = await recipeService.getBySlug(recipeIdentifier);
          const originalRecipeData = originalRecipeResponse.data;
          
          // Créer une copie pour y appliquer nos optimisations
          optimizedRecipe.value = JSON.parse(JSON.stringify(originalRecipeData));
          
          // Pour chaque ingrédient, analyser et optimiser manuellement
          if (optimizedRecipe.value.recipeIngredient && Array.isArray(optimizedRecipe.value.recipeIngredient)) {
            for (let i = 0; i < optimizedRecipe.value.recipeIngredient.length; i++) {
              const ingredient = optimizedRecipe.value.recipeIngredient[i];
              
              // Obtenir le texte d'origine de l'ingrédient
              let originalText = '';
              if (ingredient.originalText && ingredient.originalText.trim()) {
                originalText = ingredient.originalText.trim();
              } else if (ingredient.display && ingredient.display.trim()) {
                originalText = ingredient.display.trim();
              } else if (ingredient.note && ingredient.note.trim()) {
                originalText = ingredient.note.trim();
              }
              
              // Stocker le texte original pour référence
              ingredient._originalText = originalText;
              
              // Prétraiter le texte pour enlever le préfixe "1 " qui est ajouté systématiquement
              originalText = originalText.replace(/^1\s+/, '');
              
              // Notre propre logique d'analyse d'ingrédient
              const parsedIngredient = parseIngredientText(originalText);
              
              // Mettre à jour l'ingrédient avec les données analysées
              if (parsedIngredient.quantity !== null) {
                ingredient.quantity = parsedIngredient.quantity;
              }
              
              // Chercher l'unité dans notre liste d'unités
              if (parsedIngredient.unit) {
                const unitMatch = findUnitByName(parsedIngredient.unit, units.value);
                if (unitMatch) {
                  ingredient.unit = unitMatch;
                }
              }
              
              // Chercher l'aliment dans notre liste d'aliments
              if (parsedIngredient.food) {
                const foodMatch = findFoodByName(parsedIngredient.food, foods.value);
                if (foodMatch) {
                  ingredient.food = foodMatch;
                }
              }
              
              // Ajouter SEULEMENT la note extraite des parenthèses si présente
              if (parsedIngredient.note) {
                ingredient.note = parsedIngredient.note;
              } else {
                // Si pas de note extraite, vérifier si l'original en avait une entre parenthèses
                const originalNoteMatch = originalText.match(/\(([^)]+)\)/);
                if (originalNoteMatch) {
                  ingredient.note = originalNoteMatch[1].trim();
                } else {
                  // Sinon, ne pas mettre de note du tout
                  ingredient.note = null;
                }
              }
              
              // S'assurer que chaque ingrédient a un referenceId
              if (!ingredient.referenceId) {
                ingredient.referenceId = generateUUID();
              }
              
              // Mettre à jour l'affichage formaté
              ingredient.display = formatIngredientDisplay(ingredient);
            }
          }
        }
        
        // Préparer les données de comparaison (commune aux deux approches)
        await prepareComparisonData();
      } catch (err) {
        console.error('Erreur lors de l\'optimisation des ingrédients:', err);
        error.value = true;
        errorMessage.value = err.message || 'Impossible d\'optimiser les ingrédients. Veuillez réessayer.';
      } finally {
        isOptimizing.value = false;
      }
    };
    
    // Fonction améliorée pour analyser un texte d'ingrédient
    function parseIngredientText(text) {
      if (!text) return { quantity: null, unit: null, food: null, note: null };
      
      // Résultat par défaut
      const result = {
        quantity: null,
        unit: null,
        food: null,
        note: null
      };
      
      // Nettoyage initial du texte
      let cleanedText = text.trim();
      
      // 1. Extraction des notes entre parenthèses
      const noteMatch = cleanedText.match(/\(([^)]+)\)/);
      if (noteMatch) {
        result.note = noteMatch[1].trim();
        // Enlever la note du texte pour faciliter le parsing du reste
        cleanedText = cleanedText.replace(/\([^)]+\)/, '').trim();
      }
      
      // 2. Extraction de la quantité et de l'unité
      
      // Gestion des fractions (1/2, 1/4, etc.)
      const fractionMatch = cleanedText.match(/^(\d+\/\d+)\s+(.+)$/);
      if (fractionMatch) {
        const fractionParts = fractionMatch[1].split('/');
        if (fractionParts.length === 2) {
          result.quantity = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
          // Reste du texte (unité + aliment)
          const remaining = fractionMatch[2].trim();
          
          // Essayer d'extraire l'unité et l'aliment du reste
          handleRemainingText(remaining, result);
          return result;
        }
      }
      
      // Gestion des quantités mixtes (comme 1 1/2)
      const mixedFractionMatch = cleanedText.match(/^(\d+)\s+(\d+\/\d+)\s+(.+)$/);
      if (mixedFractionMatch) {
        const wholePart = parseInt(mixedFractionMatch[1]);
        const fractionParts = mixedFractionMatch[2].split('/');
        if (fractionParts.length === 2) {
          result.quantity = wholePart + (parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]));
          // Reste du texte (unité + aliment)
          const remaining = mixedFractionMatch[3].trim();
          
          // Essayer d'extraire l'unité et l'aliment du reste
          handleRemainingText(remaining, result);
          return result;
        }
      }
      
      // Cas spécial pour "càs" ou "c. à s." ou "cuillère à soupe"
      const spoonMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s*(?:càs|c\.?\s*à\s*s\.?|cuill[eè]re\s*à\s*soupe|cs)\s+(.+)$/i);
      if (spoonMatch) {
        result.quantity = parseFloat(spoonMatch[1].replace(',', '.'));
        result.unit = 'cuillère à soupe';
        result.food = spoonMatch[2].trim();
        return result;
      }
      
      // Cas spécial pour fractions suivi de càs
      const fractionSpoonMatch = cleanedText.match(/^(\d+\/\d+)\s*(?:càs|c\.?\s*à\s*s\.?|cuill[eè]re\s*à\s*soupe|cs)\s+(.+)$/i);
      if (fractionSpoonMatch) {
        const fractionParts = fractionSpoonMatch[1].split('/');
        if (fractionParts.length === 2) {
          result.quantity = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
          result.unit = 'cuillère à soupe';
          result.food = fractionSpoonMatch[2].trim();
          return result;
        }
      }
      
      // Cas spécial pour "càc" ou "c. à c." ou "cuillère à café"
      const teaspoonMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s*(?:càc|c\.?\s*à\s*c\.?|cuill[eè]re\s*à\s*caf[ée]|cc)\s+(.+)$/i);
      if (teaspoonMatch) {
        result.quantity = parseFloat(teaspoonMatch[1].replace(',', '.'));
        result.unit = 'cuillère à café';
        result.food = teaspoonMatch[2].trim();
        return result;
      }
      
      // Cas spécial pour fractions suivi de càc
      const fractionTeaspoonMatch = cleanedText.match(/^(\d+\/\d+)\s*(?:càc|c\.?\s*à\s*c\.?|cuill[eè]re\s*à\s*caf[ée]|cc)\s+(.+)$/i);
      if (fractionTeaspoonMatch) {
        const fractionParts = fractionTeaspoonMatch[1].split('/');
        if (fractionParts.length === 2) {
          result.quantity = parseFloat(fractionParts[0]) / parseFloat(fractionParts[1]);
          result.unit = 'cuillère à café';
          result.food = fractionTeaspoonMatch[2].trim();
          return result;
        }
      }
      
      // Cas spécial pour pincée, poignée
      const specialUnitMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s*(?:pinc\.?|pincée|poignée|pincee|poignee)\s+(.+)$/i);
      if (specialUnitMatch) {
        result.quantity = parseFloat(specialUnitMatch[1].replace(',', '.'));
        // Déterminer l'unité exacte
        const unitText = specialUnitMatch[0].toLowerCase();
        if (unitText.includes('pinc') || unitText.includes('pincée') || unitText.includes('pincee')) {
          result.unit = 'pincée';
        } else if (unitText.includes('poignée') || unitText.includes('poignee')) {
          result.unit = 'poignée';
        }
        result.food = specialUnitMatch[2].trim();
        return result;
      }
      
      // Cas pour "6 tranche brioche"
      const quantityWithUnitMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s+([a-zéèêëàâäôöùûüïîç]+)\s+(.+)$/i);
      if (quantityWithUnitMatch) {
        result.quantity = parseFloat(quantityWithUnitMatch[1].replace(',', '.'));
        result.unit = quantityWithUnitMatch[2].trim();
        result.food = quantityWithUnitMatch[3].trim();
        return result;
      }
      
      // Cas pour "2 unité oeuf"
      const quantityUnitMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s+(?:unité|unite|unites|unités)\s+(.+)$/i);
      if (quantityUnitMatch) {
        result.quantity = parseFloat(quantityUnitMatch[1].replace(',', '.'));
        result.unit = 'unité';
        result.food = quantityUnitMatch[2].trim();
        return result;
      }
      
      // Cas pour "10 cl lait"
      const liquidMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s+(cl|ml|l|g|kg)\s+(.+)$/i);
      if (liquidMatch) {
        result.quantity = parseFloat(liquidMatch[1].replace(',', '.'));
        result.unit = liquidMatch[2].toLowerCase();
        result.food = liquidMatch[3].trim();
        return result;
      }
      
      // Cas pour nombre seulement (grammes implicites)
      if (/^\d+$/.test(cleanedText)) {
        result.quantity = parseInt(cleanedText);
        result.unit = 'g'; // Grammes implicites
        result.food = ''; // Pas d'aliment spécifié
        return result;
      }
      
      // Cas général avec seulement une quantité et un aliment
      const generalMatch = cleanedText.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/);
      if (generalMatch) {
        result.quantity = parseFloat(generalMatch[1].replace(',', '.'));
        result.food = generalMatch[2].trim();
        return result;
      }
      
      // Si aucun pattern ne correspond, considérer tout comme l'aliment
      result.food = cleanedText;
      
      return result;
    }

    // Fonction auxiliaire pour gérer le reste du texte après extraction de la quantité
    function handleRemainingText(text, result) {
      // Cas spécial pour les unités explicites (g, kg, cl, ml, l)
      const unitMatch = text.match(/^(g|kg|cl|ml|l|càs|c\.?\s*à\s*s\.?|cs|càc|c\.?\s*à\s*c\.?|cc|pinc\.?|pincée|poignée)\s+(.+)$/i);
      if (unitMatch) {
        const unitText = unitMatch[1].toLowerCase();
        
        // Déterminer l'unité
        if (unitText === 'g' || unitText === 'kg' || unitText === 'cl' || unitText === 'ml' || unitText === 'l') {
          result.unit = unitText;
        } else if (unitText.includes('càs') || unitText.includes('c à s') || unitText.includes('cs')) {
          result.unit = 'cuillère à soupe';
        } else if (unitText.includes('càc') || unitText.includes('c à c') || unitText.includes('cc')) {
          result.unit = 'cuillère à café';
        } else if (unitText.includes('pinc') || unitText.includes('pincée')) {
          result.unit = 'pincée';
        } else if (unitText.includes('poignée')) {
          result.unit = 'poignée';
        }
        
        result.food = unitMatch[2].trim();
      } else {
        // S'il n'y a pas d'unité explicite, considérer tout comme l'aliment
        result.food = text;
      }
    }

    // Fonction améliorée pour trouver une unité par son nom ou pattern
    function findUnitByName(unitName, unitsList) {
      if (!unitName || !unitsList || !Array.isArray(unitsList)) return null;
      
      // Normaliser le nom de l'unité
      const normalizedName = unitName.toLowerCase().trim();
      
      // Patterns spécifiques à détecter pour les unités difficiles
      if (normalizedName === 'c à s' || normalizedName === 'cuillère à soupe' || 
          normalizedName === 'càs' || normalizedName === 'c.à.s' || 
          normalizedName === 'cs' || normalizedName === 'c. à s.') {
        
        // Recherche explicite de l'unité cuillère à soupe
        const tableSpoon = unitsList.find(u => 
          (u.name && u.name.toLowerCase().includes('cuill') && u.name.toLowerCase().includes('soupe')) ||
          (u.abbreviation && (u.abbreviation.toLowerCase() === 'càs' || u.abbreviation.toLowerCase() === 'cs'))
        );
        
        if (tableSpoon) {
          return tableSpoon;
        }
      }
      
      if (normalizedName === 'c à c' || normalizedName === 'cuillère à café' || 
          normalizedName === 'càc' || normalizedName === 'c.à.c' || 
          normalizedName === 'cc' || normalizedName === 'c. à c.') {
        
        // Recherche explicite de l'unité cuillère à café
        const teaSpoon = unitsList.find(u => 
          (u.name && u.name.toLowerCase().includes('cuill') && u.name.toLowerCase().includes('café')) ||
          (u.abbreviation && (u.abbreviation.toLowerCase() === 'càc' || u.abbreviation.toLowerCase() === 'cc'))
        );
        
        if (teaSpoon) {
          return teaSpoon;
        }
      }
      
      // Pour les autres unités, chercher par nom exact
      const exactMatch = unitsList.find(u => 
        (u.name && u.name.toLowerCase() === normalizedName) ||
        (u.pluralName && u.pluralName.toLowerCase() === normalizedName) ||
        (u.abbreviation && u.abbreviation.toLowerCase() === normalizedName)
      );
      
      if (exactMatch) {
        return exactMatch;
      }
      
      // Si pas de correspondance exacte, chercher par inclusion
      const inclusionMatch = unitsList.find(u => 
        (u.name && u.name.toLowerCase().includes(normalizedName)) ||
        (u.pluralName && u.pluralName.toLowerCase().includes(normalizedName)) ||
        (u.abbreviation && u.abbreviation.toLowerCase().includes(normalizedName))
      );
      
      if (inclusionMatch) {
        return inclusionMatch;
      }
      
      // Mappings pour les cas spéciaux
      const unitMappings = {
        'c à s': 'cas',
        'c a s': 'cas',
        'cas': 'cas',
        'cs': 'cas',
        'cuillère à soupe': 'cas',
        'cuilleres a soupe': 'cas',
        'cuillères à soupe': 'cas',
        'c à c': 'cac',
        'c a c': 'cac',
        'cac': 'cac',
        'cc': 'cac',
        'cuillère à café': 'cac',
        'cuilleres a cafe': 'cac',
        'cuillères à café': 'cac',
        'g': 'gramme',
        'gramme': 'gramme',
        'grammes': 'gramme',
        'kg': 'kilogramme',
        'cl': 'centilitre',
        'ml': 'millilitre',
        'l': 'litre',
        'litre': 'litre',
        'litres': 'litre',
        'unité': 'unité',
        'unite': 'unité',
        'unités': 'unité',
        'unites': 'unité',
        'tranche': 'tranche',
        'tranches': 'tranche',
      };
      
      // Rechercher par nom mappé
      const mappedName = unitMappings[normalizedName];
      if (mappedName) {
        const mappedMatch = unitsList.find(u => 
          (u.name && u.name.toLowerCase().includes(mappedName)) ||
          (u.pluralName && u.pluralName.toLowerCase().includes(mappedName))
        );
        
        if (mappedMatch) {
          return mappedMatch;
        }
      }
      
      return null;
    }

    // Amélioration pour vérifier directement les unités spéciales au début de optimizeIngredients
    function checkForSpecialUnits(unitsList) {
      // Vérifier la présence de cuillère à soupe
      const casExists = unitsList.some(u => 
        (u.name && u.name.toLowerCase().includes('cuill') && u.name.toLowerCase().includes('soupe')) ||
        (u.abbreviation && ['cas', 'càs', 'cs'].includes(u.abbreviation.toLowerCase()))
      );
      
      // Vérifier la présence de cuillère à café
      const cacExists = unitsList.some(u => 
        (u.name && u.name.toLowerCase().includes('cuill') && u.name.toLowerCase().includes('café')) ||
        (u.abbreviation && ['cac', 'càc', 'cc'].includes(u.abbreviation.toLowerCase()))
      );
            
      // Si les unités n'existent pas, afficher un avertissement
      if (!casExists || !cacExists) {
        console.warn("ATTENTION: Certaines unités essentielles ne sont pas disponibles dans la base de données!");
        
        // Lister toutes les unités pour débogage
        unitsList.forEach(u => {
        });
      }
    }



    // Fonction améliorée pour trouver un aliment par son nom
    function findFoodByName(foodName, foodsList) {
      if (!foodName || !foodsList || !Array.isArray(foodsList)) return null;
      
      const normalizedName = foodName.toLowerCase().trim();
      
      // Liste des aliments composés à traiter spécialement
      const compoundFoods = {
        'pommes de terre': 'pomme de terre',
        'pomme de terre': 'pomme de terre',
        'pdt': 'pomme de terre',
        'pommes': 'pomme',
        'tomates': 'tomate',
        'carottes': 'carotte',
        'oignons': 'oignon',
        'sauce pesto': 'pesto'
      };
      
      // Vérifier si nous avons affaire à un aliment composé connu
      let searchName = normalizedName;
      for (const [compound, normalized] of Object.entries(compoundFoods)) {
        if (normalizedName.includes(compound)) {
          searchName = normalized;
          break;
        }
      }
      
      // Recherche par correspondance exacte (priorité maximale)
      const exactMatch = foodsList.find(food => {
        return food.name && food.name.toLowerCase() === searchName;
      });
      
      if (exactMatch) {
        return exactMatch;
      }
      
      // Recherche pour "pommes de terre" spécifiquement
      if (normalizedName.includes('pommes de terre') || normalizedName.includes('pomme de terre') || normalizedName === 'pdt') {
        const potatoMatch = foodsList.find(food => {
          const foodLower = food.name.toLowerCase();
          return foodLower.includes('pomme de terre') || foodLower.includes('pommes de terre');
        });
        
        if (potatoMatch) {
          return potatoMatch;
        }
      }
      
      // Recherche pour sauce pesto
      if (normalizedName.includes('pesto') || normalizedName.includes('sauce pesto')) {
        const pestoMatch = foodsList.find(food => {
          const foodLower = food.name.toLowerCase();
          return foodLower.includes('pesto');
        });
        
        if (pestoMatch) {
          return pestoMatch;
        }
      }
      
      // Recherche plus stricte par début de mot
      const startsWithMatch = foodsList.find(food => {
        if (!food.name) return false;
        return food.name.toLowerCase().startsWith(searchName);
      });
      
      if (startsWithMatch) {
        return startsWithMatch;
      }
      
      // Recherche par mot entier (évite les correspondances partielles comme "pomme" pour "pomme de terre")
      const wordMatch = foodsList.find(food => {
        if (!food.name) return false;
        const foodLower = food.name.toLowerCase();
        const foodWords = foodLower.split(/\s+/);
        const searchWords = searchName.split(/\s+/);
        
        // Pour chaque mot de la recherche, vérifier s'il correspond à un mot entier de l'aliment
        return searchWords.every(searchWord => {
          return foodWords.some(foodWord => foodWord === searchWord);
        });
      });
      
      if (wordMatch) {
        return wordMatch;
      }
      
      // Recherche standard par inclusion
      const inclusionMatch = foodsList.find(food => {
        if (!food.name) return false;
        return food.name.toLowerCase().includes(searchName);
      });
      
      if (inclusionMatch) {
        return inclusionMatch;
      }
      
      // Recherche inversée (si l'aliment contient le terme recherché)
      const reversedMatch = foodsList.find(food => {
        if (!food.name) return false;
        return searchName.includes(food.name.toLowerCase());
      });
      
      if (reversedMatch) {
        return reversedMatch;
      }
      
      return null;
    }


    // Fonction pour formater l'affichage d'un ingrédient
    function formatIngredientDisplay(ingredient) {
      let display = '';
      
      // Ajouter la quantité si présente
      if (ingredient.quantity !== null && ingredient.quantity !== undefined) {
        display += ingredient.quantity;
      }
      
      // Ajouter l'unité si présente
      if (ingredient.unit) {
        const unitName = ingredient.unit.abbreviation || ingredient.unit.name;
        if (unitName) {
          display += display ? ' ' + unitName : unitName;
        }
      }
      
      // Ajouter le nom de l'aliment si présent
      if (ingredient.food && ingredient.food.name) {
        display += display ? ' ' + ingredient.food.name : ingredient.food.name;
      }
      
      // Ajouter la note si présente (seulement si c'est une vraie note, pas le texte complet)
      if (ingredient.note) {
        // Vérifier si la note est déjà entre parenthèses
        const noteText = ingredient.note.trim();
        
        // Si la note n'est pas déjà entre parenthèses et ne contient pas l'aliment
        if (!(noteText.startsWith('(') && noteText.endsWith(')')) &&
            !(ingredient.food && noteText.includes(ingredient.food.name))) {
          
          // Vérifier si la note ne contient pas déjà la quantité et l'unité
          const hasQuantityAndUnit = 
            (ingredient.quantity !== null && noteText.includes(String(ingredient.quantity))) ||
            (ingredient.unit && ingredient.unit.name && noteText.includes(ingredient.unit.name));
          
          // N'ajouter la note que si elle ne répète pas les informations déjà présentes
          if (!hasQuantityAndUnit) {
            display += ' (' + noteText + ')';
          }
        }
      }
      
      return display.trim();
    }


    // Construire l'affichage optimisé amélioré
    const buildOptimizedDisplay = (optimized) => {
      // Construire clairement l'affichage avec la quantité et l'unité
      let displayText = '';
      
      // Ajout de la quantité - traiter les fractions de façon spéciale
      if (optimized.quantity !== null && optimized.quantity !== undefined) {
        // Vérifier si c'est une fraction simple
        if (optimized.quantity === 0.5) {
          displayText += '1/2';
        } else if (optimized.quantity === 0.25) {
          displayText += '1/4';
        } else if (optimized.quantity === 0.75) {
          displayText += '3/4';
        } else if (optimized.quantity === 0.33 || optimized.quantity === 1/3) {
          displayText += '1/3';
        } else if (optimized.quantity === 0.67 || optimized.quantity === 2/3) {
          displayText += '2/3';
        } else {
          // Pour les autres valeurs, utiliser le format standard
          const isInteger = Number.isInteger(optimized.quantity);
          displayText += isInteger ? optimized.quantity : optimized.quantity.toFixed(2).replace(/\.00$/, '');
        }
      }
      
      // Ajout de l'unité
      if (optimized.unit) {
        const unitName = optimized.unit.abbreviation || optimized.unit.name;
        if (unitName) {
          displayText += ' ' + unitName;
        }
      }
      
      // Ajout du nom de l'aliment avec minuscule au début
      if (optimized.food && optimized.food.name) {
        const foodName = optimized.food.name;
        // S'assurer que le nom commence par une minuscule pour la cohérence
        const formattedFoodName = foodName.charAt(0).toLowerCase() + foodName.slice(1);
        displayText += ' ' + formattedFoodName;
      }
      
      // Ajout de la note si disponible
      if (optimized.note) {
        // Vérifier que la note ne contient pas déjà le nom de l'aliment
        let shouldAddNote = true;
        
        if (optimized.food && optimized.food.name) {
          const foodNameLower = optimized.food.name.toLowerCase();
          const noteLower = optimized.note.toLowerCase();
          
          // Si la note contient déjà le nom de l'aliment, ne pas l'ajouter
          if (noteLower.includes(foodNameLower)) {
            shouldAddNote = false;
          }
        }
        
        if (shouldAddNote) {
          // Vérifier si la note est déjà entre parenthèses
          if (optimized.note.startsWith('(') && optimized.note.endsWith(')')) {
            displayText += ' ' + optimized.note;
          } else {
            displayText += ' (' + optimized.note + ')';
          }
        }
      }
      
      return displayText.trim();
    };
    
    // Inverser la sélection d'un ingrédient
    const toggleIngredient = (index) => {
      comparisonData.value[index].use = !comparisonData.value[index].use;
    };
    
    // Préparer les données de comparaison
    const prepareComparisonData = async () => {
      if (!props.originalRecipe || !optimizedRecipe.value) return;
      
      const originalIngredients = props.originalRecipe.recipeIngredient || [];
      const optimizedIngredients = optimizedRecipe.value.recipeIngredient || [];
      
      // Réinitialiser les données de comparaison
      comparisonData.value = [];
      
      // Charger une page d'aliments pour les suggestions initiales
      if (foods.value.length === 0) {
        await loadReferenceData();
        checkForSpecialUnits(units.value);
      }
      
      // Initialisation des données de comparaison pour chaque ingrédient
      for (let i = 0; i < Math.min(originalIngredients.length, optimizedIngredients.length); i++) {
        const original = originalIngredients[i];
        const optimized = optimizedIngredients[i];
        
        // Pour l'ingrédient original, on peut nettoyer un texte si nécessaire
        let originalDisplay = original.display || original.originalText || '';
        if (originalDisplay.match(/^1\s+(?:\d+|\d+\/\d+|\d+\.\d+|\d+\s+\w+)/)) {
          originalDisplay = originalDisplay.replace(/^1\s+/, '');
        }
        
        // Construire la chaîne d'affichage pour l'optimisé via notre fonction
        let optimizedDisplay = buildOptimizedDisplay(optimized);
        
        // Déterminer la qualité de la correspondance
        let matchQuality = null;
        
        // Vérifier si l'ingrédient est déjà optimisé
        let isAlreadyOptimized = false;
        
        // Un ingrédient est considéré comme déjà optimisé si:
        // 1. Il a un food avec un id défini dans l'original
        // 2. Il a une unité avec un id défini dans l'original
        // 3. Il a une quantité définie dans l'original
        // Ne tient compte que de l'ingrédient (food.id) et de la quantité
        if (
          original.food && original.food.id &&
          (original.quantity !== null && original.quantity !== undefined)
        ) {
          // même food.id ET même quantité → déjà optimisé
          if (
            optimized.food && optimized.food.id === original.food.id &&
            optimized.quantity === original.quantity
          ) {
            isAlreadyOptimized = true;
          }
        }
        
        if (optimized.food && optimized.food.id) {
          // Vérifier si l'ID de l'aliment correspond à un aliment existant dans la base
          const foodExists = foods.value.some(f => f.id === optimized.food.id);
          
          if (foodExists) {
            matchQuality = 'Exact';
          } else {
            matchQuality = 'Partiel';
          }
        } else if (optimized.food && optimized.food.name && 
                  (!original.food || optimized.food.name !== original.food.name)) {
          matchQuality = 'Partiel';
        }
        
        if (!matchQuality && optimized.unit && optimized.unit.id && 
            (!original.unit || optimized.unit.id !== original.unit.id)) {
          matchQuality = 'Unité';
        }
        
        // S'assurer que les propriétés sont bien définies pour l'affichage dans le tableau
        if (!optimized.quantity && optimized.quantity !== 0) {
          // Tenter d'extraire la quantité de la note si elle n'est pas définie
          const quantityMatch = optimized.note?.match(/^(\d+(?:[\/.,]\d+)?)/);
          if (quantityMatch) {
            optimized.quantity = parseFloat(quantityMatch[1].replace(',', '.'));
          }
        }
        
        // Ajouter tous les ingrédients pour permettre la visualisation complète
        // Pour les correspondances partielles ou d'unité, ne pas utiliser par défaut
        const useByDefault = isAlreadyOptimized ? false : !(matchQuality === 'Partiel' || matchQuality === 'Unité');
        
        // Si l'ingrédient est déjà optimisé, on peut forcer matchQuality à null pour ne pas afficher de badge inutile
        if (isAlreadyOptimized) {
          matchQuality = null;
        }
        
        // Créer un nouvel objet totalement indépendant pour cet ingrédient
        const newIngredient = {
          // Données de base
          original: originalDisplay,
          optimized: optimizedDisplay,
          use: useByDefault, // Désactivé par défaut si déjà optimisé
          matchQuality,
          isAlreadyOptimized, // Nouveau flag pour marquer les ingrédients déjà optimisés
          originalIndex: i,
          
          // Références aux objets originaux (copie profonde pour éviter les références partagées)
          originalObject: JSON.parse(JSON.stringify(original)),
          optimizedObject: {
            // S'assurer que les propriétés sont toujours initialisées, même si null
            quantity: optimized.quantity || 0,
            unit: optimized.unit || null,
            food: optimized.food || null,
            note: optimized.note || null,
            display: optimizedDisplay
          }
        };
        
        // Ajouter ce nouvel ingrédient isolé au tableau
        comparisonData.value.push(newIngredient);
      }
      
      if (comparisonData.value.length === 0) {
        error.value = true;
        errorMessage.value = "Aucune optimisation n'a pu être effectuée. Les ingrédients sont déjà bien structurés.";
        return;
      }
      
      // Vérifier si tous les ingrédients sont déjà optimisés
      const allOptimized = comparisonData.value.every(item => item.isAlreadyOptimized);
      if (allOptimized) {
        error.value = true;
        errorMessage.value = "Tous les ingrédients sont déjà optimisés. Aucune modification nécessaire.";
      }
    };
    
    // Ouvrir l'éditeur d'ingrédient pour un index donné
    const openIngredientEditor = (index) => {
      // Copie profonde de l'ingrédient pour éviter de modifier directement l'original
      editingIngredient.value = JSON.parse(JSON.stringify(comparisonData.value[index].optimizedObject));
      editingIngredientIndex.value = index;
      
      // Initialiser les champs de recherche
      editingUnitInput.value = editingIngredient.value.unit ? editingIngredient.value.unit.name : '';
      editingFoodInput.value = editingIngredient.value.food ? editingIngredient.value.food.name : '';
      
      // Marquer cet ingrédient comme "à utiliser" automatiquement
      comparisonData.value[index].use = true;
    };
    
    // Fermer l'éditeur d'ingrédient
    const closeIngredientEditor = () => {
      editingIngredientIndex.value = null;
      editingIngredient.value = null;
      editingUnitInput.value = '';
      editingFoodInput.value = '';
      showUnitDropdown.value = false;
      showFoodDropdown.value = false;
    };
    
    // Enregistrer les modifications de l'ingrédient en cours d'édition
    const saveEditingIngredient = () => {
      if (editingIngredientIndex.value === null || !editingIngredient.value) return;
      
      // Mettre à jour l'ingrédient dans les données de comparaison
      comparisonData.value[editingIngredientIndex.value].optimizedObject = editingIngredient.value;
      
      // Reconstruire l'affichage optimisé
      comparisonData.value[editingIngredientIndex.value].optimized = buildOptimizedDisplay(editingIngredient.value);
      
      // Activer l'utilisation de cet ingrédient (déjà fait lors de l'ouverture)
      comparisonData.value[editingIngredientIndex.value].use = true;
      
      // Fermer l'éditeur
      closeIngredientEditor();
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
            const { quantity, unit, food, note } = comparison.optimizedObject;
            
            // Mettre à jour ces propriétés dans la recette finale
            finalRecipe.recipeIngredient[index].quantity = quantity;
            finalRecipe.recipeIngredient[index].unit = unit;
            finalRecipe.recipeIngredient[index].food = food;
            finalRecipe.recipeIngredient[index].note = note;
            // Générer l'affichage à partir des données optimisées
            finalRecipe.recipeIngredient[index].display = buildOptimizedDisplay(comparison.optimizedObject);
            finalRecipe.recipeIngredient[index].referenceId = props.originalRecipe.recipeIngredient[index].referenceId || "";
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
    
    // Génération d'UUID pour les ingrédients
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    onMounted(() => {
      // Si automatiquement affiché suite à une importation, charger directement
      if (props.skipAutoOptimization) {
        optimizeIngredients(); // L'optimisation sera sautée grâce à skipAutoOptimization=true
      }
    });
    
    return {
      isOptimizing,
      isUpdating,
      optimizedRecipe,
      error,
      errorMessage,
      success,
      comparisonData,
      currentFoodsPage,
      hasMoreFoods,
      isLoadingMoreFoods,
      units,
      foods,
      optimizeIngredients,
      toggleIngredient,
      applyOptimizations,
      cancel,
      getMatchQualityClass,
      
      // Gestion de l'édition d'ingrédient
      editingIngredientIndex,
      editingIngredient,
      editingUnitInput,
      editingFoodInput,
      showUnitDropdown,
      showFoodDropdown,
      openIngredientEditor,
      closeIngredientEditor,
      saveEditingIngredient,
      parseIngredientText,
      findUnitByName,
      findFoodByName,
      formatIngredientDisplay,

      // Méthodes pour les dropdowns d'unités
      openUnitDropdown,
      closeUnitDropdown,
      filteredUnits,
      handleUnitSelection,
      clearUnit,
      
      // Méthodes pour les dropdowns d'aliments
      openFoodDropdown,
      closeFoodDropdown,
      filteredFoods,
      handleFoodInputEnter,
      selectFood,
      handleFoodDropdownScroll,
  
      
      // Autres utilitaires
      buildOptimizedDisplay,
      generateUUID
    };
  }
};
</script>