<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Étape 0: Choix du mode de création -->
      <div v-if="currentStep === 0" class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Ajouter une recette</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <button 
              @click="chooseImportMethod('url')"
              class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span class="font-medium">Importer depuis une URL</span>
            </button>

            <button 
              @click="chooseImportMethod('manual')"
              class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span class="font-medium">Créer manuellement</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Étape URL: Importation depuis URL -->
      <div v-if="currentStep === 'url'" class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Importer depuis une URL</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage }}
        </div>

        <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
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
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <p class="mt-1 text-sm text-gray-500">Collez l'URL d'une recette en ligne</p>
          </div>

          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="currentStep = 0"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              :disabled="loading"
            >
              Retour
            </button>
            <button
              type="submit"
              class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
              :disabled="loading"
            >
              <span v-if="loading">
                <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importation...
              </span>
              <span v-else>Importer</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Étape 1: Création initiale de la recette -->
      <div v-if="currentStep === 1" class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Créer une nouvelle recette</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="createInitialRecipe">
          <div class="mb-4">
            <label for="recipe-name" class="block text-sm font-medium text-gray-700 mb-1">Nom de la recette *</label>
            <input
              id="recipe-name"
              v-model="recipe.name"
              type="text"
              placeholder="Nom de votre nouvelle recette"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
              ref="recipeNameInput"
            />
          </div>

          <div class="flex justify-end space-x-2">
            <button
              type="button"
              @click="currentStep = 0"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              :disabled="loading"
            >
              Retour
            </button>
            <button
              type="submit"
              class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
              :disabled="loading"
            >
              <span v-if="loading">
                <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création...
              </span>
              <span v-else>Continuer</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Étape 2: Édition complète de la recette -->
      <div v-if="currentStep === 2" class="p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Modifier "{{ recipe.name }}"</h2>
          <button @click="close" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {{ errorMessage }}
        </div>

        <div v-if="success" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Recette créée avec succès!
        </div>

        <div class="mb-6">
          <!-- Image de la recette -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <div class="flex items-center">
              <div class="relative h-32 w-32 bg-gray-100 rounded-lg overflow-hidden">
                <img 
                  v-if="imagePreview" 
                  :src="imagePreview" 
                  alt="Aperçu de l'image" 
                  class="h-full w-full object-cover"
                />
                <div v-else class="flex items-center justify-center h-full text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  @change="handleImageUpload"
                />
              </div>
              <div class="ml-4 text-sm text-gray-500">
                <p>Cliquez pour ajouter une image</p>
                <p v-if="imageFile">{{ imageFile.name }}</p>
              </div>
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label for="recipe-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="recipe-description"
              v-model="recipe.description"
              rows="3"
              placeholder="Décrivez votre recette"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            ></textarea>
          </div>

          <!-- Temps et portions -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label for="prep-time" class="block text-sm font-medium text-gray-700 mb-1">Préparation (min)</label>
              <input
                id="prep-time"
                v-model.number="recipe.prepTime"
                type="number"
                min="0"
                placeholder="20"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label for="cook-time" class="block text-sm font-medium text-gray-700 mb-1">Cuisson (min)</label>
              <input
                id="cook-time"
                v-model.number="recipe.cookTime"
                type="number"
                min="0"
                placeholder="30"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label for="total-time" class="block text-sm font-medium text-gray-700 mb-1">Temps total (min)</label>
              <input
                id="total-time"
                v-model.number="recipe.totalTime"
                type="number"
                min="0"
                placeholder="50"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label for="servings" class="block text-sm font-medium text-gray-700 mb-1">Portions</label>
              <input
                id="servings"
                v-model.number="recipe.recipeYield"
                type="number"
                min="1"
                placeholder="4"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Ingrédients -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-medium text-gray-800">Ingrédients</h3>
              <button
                type="button"
                @click="addNewIngredient"
                class="px-2 py-1 bg-indigo-100 rounded-md hover:bg-indigo-200 text-indigo-700 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter
              </button>
            </div>
            
            <div v-if="loadingIngredients" class="text-center py-4">
              <svg class="animate-spin h-6 w-6 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p class="mt-2 text-sm text-gray-500">Chargement des ingrédients...</p>
            </div>
            
            <div v-else>
              <div v-for="(ingredient, index) in recipe.recipeIngredient" :key="`ing-${index}`" class="mb-3 p-3 bg-gray-50 rounded-lg">
                <div class="grid grid-cols-12 gap-2">
                  <!-- Quantité -->
                  <div class="col-span-2">
                    <input 
                      v-model.number="ingredient.quantity" 
                      type="number" 
                      min="0" 
                      step="0.1"
                      placeholder="Qté"
                      class="w-full border border-gray-300 rounded p-2 text-center"
                    />
                  </div>
                  
                  <!-- Unité -->
                  <div class="col-span-3">
                    <div class="relative">
                      <input 
                        v-model="ingredient.unitInput"
                        @input="ingredient.unit = null"
                        @focus="openUnitDropdown(index)" 
                        @blur="closeUnitDropdown(index, $event)"
                        placeholder="Unité"
                        class="w-full border border-gray-300 rounded p-2"
                      />
                      <div 
                        v-if="ingredient.showUnitDropdown" 
                        class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        <div 
                          v-for="unit in filteredUnits(ingredient.unitInput)" 
                          :key="unit.id" 
                          @mousedown.prevent="selectUnit(index, unit)"
                          class="p-2 hover:bg-gray-100 cursor-pointer"
                        >
                          {{ unit.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Ingrédient -->
                  <div class="col-span-5">
                    <div class="relative">
                      <input 
                        v-model="ingredient.foodInput"
                        @input="ingredient.food = null"
                        @focus="openFoodDropdown(index)" 
                        @blur="closeFoodDropdown(index, $event)"
                        @keydown.enter.prevent="handleFoodInputEnter(index, ingredient.foodInput)"
                        placeholder="Ingrédient"
                        class="w-full border border-gray-300 rounded p-2"
                      />
                      <div 
                        v-if="ingredient.showFoodDropdown" 
                        class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                        @scroll="handleFoodDropdownScroll($event, index)"
                      >
                        <!-- Message si aucun ingrédient trouvé -->
                        <div v-if="filteredFoods(ingredient.foodInput).length === 0" class="p-3 text-gray-500 text-center">
                          Aucun ingrédient trouvé
                        </div>
                        
                        <!-- Liste d'ingrédients -->
                        <div 
                          v-for="food in filteredFoods(ingredient.foodInput)" 
                          :key="food.id" 
                          @mousedown.prevent="selectFood(index, food)"
                          :class="[
                            'p-2 cursor-pointer',
                            food.isNewFood 
                              ? 'text-indigo-600 font-medium bg-indigo-50 hover:bg-indigo-100 flex items-center' 
                              : food.isLoadMoreIndicator
                                ? 'text-gray-600 bg-gray-100 font-medium text-center'
                                : 'hover:bg-gray-100'
                          ]"
                        >
                          <!-- Icône plus pour nouvel ingrédient -->
                          <svg v-if="food.isNewFood" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          
                          <!-- Indicateur de chargement pour "Charger plus" -->
                          <div v-if="food.isLoadMoreIndicator && isLoadingMoreFoods" class="flex justify-center items-center">
                            <svg class="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          
                          {{ food.name }}
                        </div>
                        
                        <!-- Indicateur de chargement en cours -->
                        <div v-if="isLoadingMoreFoods && !filteredFoods(ingredient.foodInput).some(f => f.isLoadMoreIndicator)" class="p-2 text-center text-gray-500 bg-gray-50">
                          <svg class="animate-spin h-4 w-4 mx-auto mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Chargement des ingrédients...
                        </div>
                        
                        <!-- Pied de liste avec info -->
                        <div v-if="filteredFoods(ingredient.foodInput).length > 0 && !filteredFoods(ingredient.foodInput).some(f => f.isNewFood)" class="p-2 text-xs text-gray-500 border-t border-gray-200 bg-gray-50">
                          Tapez le nom complet et appuyez sur Entrée pour créer un nouvel ingrédient
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Supprimer -->
                  <div class="col-span-2 flex justify-center items-center">
                    <button 
                      @click="removeIngredient(index)" 
                      class="text-red-500 hover:text-red-700"
                      title="Supprimer cet ingrédient"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- Note (optionnel) -->
                <div class="mt-2">
                  <input 
                    v-model="ingredient.note" 
                    placeholder="Note (optionnel)"
                    class="w-full border border-gray-300 rounded p-2 text-sm"
                  />
                </div>
              </div>
              
              <!-- Message quand aucun ingrédient -->
              <div v-if="recipe.recipeIngredient.length === 0" class="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                Cliquez sur "Ajouter" pour commencer à saisir des ingrédients
              </div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-medium text-gray-800">Instructions</h3>
              <button
                type="button"
                @click="addNewInstruction"
                class="px-2 py-1 bg-indigo-100 rounded-md hover:bg-indigo-200 text-indigo-700 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter
              </button>
            </div>
            
            <div v-for="(instruction, index) in recipe.recipeInstructions" :key="`ins-${index}`" class="mb-3">
              <div class="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                <div class="flex justify-between items-center mb-2">
                  <div class="font-semibold text-indigo-600">
                    Étape {{ index + 1 }}
                  </div>
                  <!-- Boutons réordonner/supprimer -->
                  <div class="flex space-x-2">
                    <button 
                      @click="moveInstructionUp(index)"
                      :disabled="index === 0"
                      :class="{'opacity-50 cursor-not-allowed': index === 0}"
                      class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Déplacer vers le haut"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      @click="moveInstructionDown(index)" 
                      :disabled="index === recipe.recipeInstructions.length - 1"
                      :class="{'opacity-50 cursor-not-allowed': index === recipe.recipeInstructions.length - 1}"
                      class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Déplacer vers le bas"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                    <button 
                      @click="removeInstruction(index)"
                      class="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Supprimer cette étape"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- Texte de l'instruction -->
                <textarea 
                  v-model="instruction.text" 
                  class="w-full border border-indigo-200 rounded p-2 text-gray-700"
                  placeholder="Décrivez cette étape de préparation..."
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <!-- Message quand aucune instruction -->
            <div v-if="recipe.recipeInstructions.length === 0" class="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
              Cliquez sur "Ajouter" pour commencer à saisir les instructions
            </div>
          </div>

          <!-- Section Valeurs Nutritionnelles -->
          <div class="mb-6">
            <div class="mb-3">
              <h3 class="text-lg font-medium text-gray-800">Valeurs Nutritionnelles</h3>
            </div>
            
            <div class="p-4 rounded-lg space-y-4">
              <p class="text-sm text-gray-600">Les valeurs nutritionnelles sont pour une portion.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="calories" class="block text-sm font-medium text-gray-700 mb-1">Calories (kcal)</label>
                  <input
                    id="calories"
                    v-model.number="recipe.nutrition.calories"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label for="carbs" class="block text-sm font-medium text-gray-700 mb-1">Glucides (g)</label>
                  <input
                    id="carbs"
                    v-model.number="recipe.nutrition.carbohydrateContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label for="protein" class="block text-sm font-medium text-gray-700 mb-1">Protéines (g)</label>
                  <input
                    id="protein"
                    v-model.number="recipe.nutrition.proteinContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label for="fat" class="block text-sm font-medium text-gray-700 mb-1">Lipides (g)</label>
                  <input
                    id="fat"
                    v-model.number="recipe.nutrition.fatContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label for="fiber" class="block text-sm font-medium text-gray-700 mb-1">Fibres (g)</label>
                  <input
                    id="fiber"
                    v-model.number="recipe.nutrition.fiberContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label for="sugar" class="block text-sm font-medium text-gray-700 mb-1">Sucres (g)</label>
                  <input
                    id="sugar"
                    v-model.number="recipe.nutrition.sugarContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label for="sodium" class="block text-sm font-medium text-gray-700 mb-1">Sodium (mg)</label>
                  <input
                    id="sodium"
                    v-model.number="recipe.nutrition.sodiumContent"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Catégories -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Catégories</label>
            <div class="flex flex-wrap gap-2 mb-2">
              <span 
                v-for="category in availableCategories" 
                :key="category.id"
                @click="toggleCategory(category)"
                :class="[
                  'px-3 py-1 rounded-full text-sm cursor-pointer',
                  isSelectedCategory(category) 
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800 border' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent'
                ]"
              >
                {{ category.name }}
              </span>
              
              <button
                type="button"
                @click="showAddCategoryInput = !showAddCategoryInput"
                class="px-3 py-1 rounded-full text-sm border border-dashed border-gray-400 text-gray-700 hover:bg-gray-50 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouvelle catégorie
              </button>
            </div>
            
            <!-- Ajout de nouvelle catégorie -->
            <div v-if="showAddCategoryInput" class="flex items-center mt-2">
              <input 
                v-model="newCategoryName" 
                type="text" 
                placeholder="Nom de la nouvelle catégorie" 
                class="flex-grow border rounded-lg px-3 py-2 mr-2"
              />
              <button 
                @click="addNewCategory" 
                class="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700"
                :disabled="!newCategoryName.trim()"
              >
                Ajouter
              </button>
              <button 
                @click="showAddCategoryInput = false" 
                class="ml-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end space-x-2">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            :disabled="loading"
          >
            Annuler
          </button>
          <button
            @click="saveRecipe"
            class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
            :disabled="loading"
          >
            <span v-if="loading">
              <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enregistrement...
            </span>
            <span v-else>Enregistrer</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { recipeService, referenceService } from '../services/api';
import { useRecipeStore } from '../stores/recipeStore';

export default {
  name: 'RecipeCreateWizard',
  emits: ['close', 'recipe-created'],
  
  setup(props, { emit }) {
    const router = useRouter();
    const recipeStore = useRecipeStore();
    const currentStep = ref(0); // Commencer à l'étape de choix (0)
    const loading = ref(false);
    const error = ref(false);
    const errorMessage = ref('');
    const success = ref(false);
    const imageFile = ref(null);
    const imagePreview = ref(null);
    const loadingIngredients = ref(false);
    const recipeNameInput = ref(null);
    const recipeUrl = ref('');
    
    // Variables pour la pagination des ingrédients
    const currentFoodsPage = ref(1);
    const hasMoreFoods = ref(true);
    const isLoadingMoreFoods = ref(false);
    
    // Référence de données
    const units = ref([]);
    const foods = ref([]);
    const availableCategories = ref([]);
    const showAddCategoryInput = ref(false);
    const newCategoryName = ref('');
    
    // Modèle de recette
    const recipe = ref({
      name: '',
      description: '',
      prepTime: null,
      cookTime: null,
      totalTime: null,
      recipeYield: 4,
      recipeIngredient: [],
      recipeInstructions: [],
      recipeCategory: [],
      nutrition: {
        calories: null,
        carbohydrateContent: null,
        proteinContent: null,
        fatContent: null,
        fiberContent: null,
        sugarContent: null,
        sodiumContent: null
      },
      id: null,
      slug: ''
    });
    
    onMounted(() => {
      // Focus sur le champ approprié selon l'étape
      nextTick(() => {
        if (currentStep.value === 1 && recipeNameInput.value) {
          recipeNameInput.value.focus();
        }
      });
      // Précharger plus d'ingrédients
      if (currentStep.value === 2) {
        loadReferenceData();
      }
    });
    
    // Fonction pour choisir la méthode d'importation
    const chooseImportMethod = (method) => {
      if (method === 'manual') {
        currentStep.value = 1; // Aller à l'étape 1 (saisie du nom)
        
        // Focus sur le champ de nom après le changement d'étape
        nextTick(() => {
          if (recipeNameInput.value) {
            recipeNameInput.value.focus();
          }
        });
      } else if (method === 'url') {
        currentStep.value = 'url'; // Aller à l'étape d'import par URL
      }
    };
    
    // Importation depuis URL
    const importFromUrl = async () => {
      if (!recipeUrl.value.trim()) return;
      
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      
      try {
        const response = await recipeService.importRecipeFromUrl(recipeUrl.value);
        
        if (response && response.data) {
          success.value = true;
          
          // Recherche de l'ID ou du slug dans la réponse
          let recipeId = null;
          let recipeSlug = null;
          
          if (typeof response.data === 'object') {
            recipeId = response.data.id;
            recipeSlug = response.data.slug;
          } else if (typeof response.data === 'string') {
            recipeId = response.data;
          }
          
          // Redirection après un délai
          setTimeout(() => {
            if (recipeId) {
              // Mettre à jour le store (optionnel)
              recipeService.getById(recipeId).then(detailResponse => {
                if (detailResponse && detailResponse.data) {
                  recipeStore.addRecipe(detailResponse.data);
                }
              }).catch(err => console.warn('Erreur lors du chargement des détails', err));
              
              // Émettre l'événement
              emit('recipe-created', recipeId);
              
              // Rediriger vers la recette
              router.push(`/recipes/${recipeId}`);
            } else {
              // Si pas d'ID trouvé, retourner à la liste des recettes
              emit('recipe-created');
              router.push('/recipes');
            }
          }, 1500);
        } else {
          throw new Error('Réponse invalide de l\'API');
        }
      } catch (err) {
        console.error('Erreur lors de l\'importation depuis URL', err);
        error.value = true;
        errorMessage.value = err.message || 'Impossible d\'importer depuis cette URL. Vérifiez l\'URL et réessayez.';
      } finally {
        loading.value = false;
      }
    };

    // État pour afficher/masquer la section nutrition
    const showNutritionSection = ref(false);

    // Fonction pour basculer l'affichage de la section nutrition
    const toggleNutritionSection = () => {
      showNutritionSection.value = !showNutritionSection.value;
    };

    // Chargement des données de référence
    const loadReferenceData = async () => {
      loadingIngredients.value = true;
      
      try {
        // Charger les unités
        const unitsResponse = await referenceService.getUnits();
        if (unitsResponse.data && Array.isArray(unitsResponse.data.items)) {
          units.value = unitsResponse.data.items;
        } else {
          units.value = [];
        }
        
        // Réinitialiser les variables de pagination
        currentFoodsPage.value = 1;
        hasMoreFoods.value = true;
        
        // Charger la première page d'ingrédients
        await loadNextPageOfFoods();
        
        // Charger les catégories
        const categoriesResponse = await recipeService.getCategories();
        if (categoriesResponse.data && Array.isArray(categoriesResponse.data.items)) {
          availableCategories.value = categoriesResponse.data.items;
        } else {
          availableCategories.value = [];
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données de référence', err);
        error.value = true;
        errorMessage.value = 'Impossible de charger les données de référence. Réessayez plus tard.';
      } finally {
        loadingIngredients.value = false;
      }
    };

    // Chargement progressif des ingrédients
    const loadNextPageOfFoods = async (query = '') => {
      if (isLoadingMoreFoods.value || !hasMoreFoods.value) return;
      
      isLoadingMoreFoods.value = true;
      
      try {
        const perPage = 100; // Nombre d'éléments par page
        
        console.log(`Chargement de la page ${currentFoodsPage.value} d'ingrédients avec requête: "${query}"`);
        
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
            
            console.log(`Page ${currentFoodsPage.value}/${response.data.pagination.totalPages}, 
                        Total: ${response.data.pagination.totalItems}, 
                        Plus de pages: ${hasMoreFoods.value}`);
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
    const handleFoodDropdownScroll = (event, index) => {
      const dropdown = event.target;
      
      // Vérifier si l'utilisateur est proche du bas de la liste
      if (dropdown.scrollHeight - dropdown.scrollTop <= dropdown.clientHeight + 50) {
        // Charger la page suivante si on n'est pas déjà en train de charger
        if (!isLoadingMoreFoods.value && hasMoreFoods.value) {
          // Important: utiliser la valeur de recherche actuelle de l'ingrédient
          const searchQuery = recipe.value.recipeIngredient[index]?.foodInput || '';
          loadNextPageOfFoods(searchQuery);
        }
      }
    };

    // Recherche d'ingrédients
    const searchFoods = async (query) => {
      // Réinitialiser la pagination
      currentFoodsPage.value = 1;
      hasMoreFoods.value = true;
      foods.value = [];
      isLoadingMoreFoods.value = true; // Indiquer le chargement
      
      try {
        // Charger la première page avec la requête
        await loadNextPageOfFoods(query);
      } catch (err) {
        console.error('Erreur lors de la recherche d\'ingrédients', err);
      } finally {
        isLoadingMoreFoods.value = false;
      }
    };

    // Étape 1: Création initiale de la recette avec récupération garantie
    const createInitialRecipe = async () => {
      if (!recipe.value.name.trim()) return;
      
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      
      try {
        // Génération du slug à partir du nom
        const slug = recipe.value.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Payload minimal pour la création initiale
        const payload = {
          name: recipe.value.name,
          slug: slug
        };
        
        console.log("Tentative de création initiale de recette avec payload:", payload);
        
        // Création de la recette
        const createResponse = await recipeService.createRecipe(payload);
        console.log("Réponse de création de recette:", createResponse);
        
        let recipeId = null;
        let recipeSlug = slug;
        
        // Récupération des données renvoyées par l'API
        if (createResponse && createResponse.data) {
          if (typeof createResponse.data === 'string') {
            // Si l'API renvoie un string (le slug) au lieu d'un objet
            recipeSlug = createResponse.data;
            console.log("Slug reçu de l'API:", recipeSlug);
          } else {
            // Si l'API renvoie un objet comme prévu
            recipeId = createResponse.data.id;
            recipeSlug = createResponse.data.slug || slug;
            console.log("Recette créée avec succès, ID:", recipeId, "Slug:", recipeSlug);
          }
        }
        
        // Attendre un peu pour laisser le temps à l'API de finaliser la création
        console.log("Attente de 500ms pour que l'API traite la création...");
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Récupération explicite et garantie des données de la recette créée
        console.log("Récupération des données complètes de la recette...");
        let recipeData = null;
        
        // Récupérer par ID si disponible
        if (recipeId) {
          try {
            console.log("Tentative de récupération par ID:", recipeId);
            const detailResponse = await recipeService.getById(recipeId);
            if (detailResponse && detailResponse.data) {
              recipeData = detailResponse.data;
              console.log("Recette récupérée par ID avec succès");
            }
          } catch (idErr) {
            console.warn("Impossible de récupérer la recette par ID:", idErr);
          }
        }
        
        // Si pas de recipeData, essayer avec le slug
        if (!recipeData && recipeSlug) {
          try {
            console.log("Tentative de récupération par slug:", recipeSlug);
            const slugResponse = await recipeService.getBySlug(recipeSlug);
            if (slugResponse && slugResponse.data) {
              recipeData = slugResponse.data;
              console.log("Recette récupérée par slug avec succès");
            }
          } catch (slugErr) {
            console.warn("Impossible de récupérer la recette par slug:", slugErr);
          }
        }
        
        // Mise à jour de l'objet recipe
        if (recipeData) {
          // Si on a récupéré les données complètes
          console.log("Mise à jour avec les données complètes:", recipeData);
          recipe.value = recipeData;
        } else {
          // Si on a échoué à récupérer les données complètes, utiliser ce qu'on a
          console.warn("Impossible de récupérer les données complètes, utilisation des données partielles");
          recipe.value = {
            ...recipe.value,
            id: recipeId || null,
            slug: recipeSlug || slug
          };
        }
        
        console.log("Objet recipe final:", recipe.value);
        
        // Passage à l'étape 2
        currentStep.value = 2;
        
        // Chargement des données de référence maintenant que nous sommes à l'étape 2
        loadReferenceData();
      } catch (err) {
        console.error('Erreur lors de la création initiale de la recette', err);
        error.value = true;
        errorMessage.value = err.message || 'Impossible de créer la recette. Vérifiez le nom et réessayez.';
      } finally {
        loading.value = false;
      }
    };

    const ensureStringReferenceIds = () => {
      recipe.value.recipeIngredient.forEach(ingredient => {
        // Remplacer les valeurs null par des chaînes vides
        if (ingredient.referenceId === null || ingredient.referenceId === undefined) {
          ingredient.referenceId = "";
        }
      });
    };

    // Génération d'UUID pour les ingrédients
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    // Gestion des ingrédients
    const addNewIngredient = () => {
      recipe.value.recipeIngredient.push({
        quantity: 0,
        unit: null,
        food: null,
        unitInput: '',
        foodInput: '',
        note: '',
        showUnitDropdown: false,
        showFoodDropdown: false,
        referenceId: generateUUID(), // Générer un UUID dès la création
        isFood: true,
        disableAmount: false
      });
    };

    const removeIngredient = (index) => {
      recipe.value.recipeIngredient.splice(index, 1);
    };

    // Gestion des dropdowns d'unités
    const openUnitDropdown = (index) => {
      recipe.value.recipeIngredient[index].showUnitDropdown = true;
    };

    const closeUnitDropdown = (index, event) => {
      // Fermer avec délai pour permettre la sélection
      setTimeout(() => {
        if (recipe.value.recipeIngredient[index]) {
          recipe.value.recipeIngredient[index].showUnitDropdown = false;
        }
      }, 200);
    };

    const filteredUnits = (query) => {
      if (!query) return units.value;
      const lowerQuery = query.toLowerCase();
      return units.value.filter(unit => unit.name.toLowerCase().includes(lowerQuery));
    };

    const selectUnit = (index, unit) => {
      recipe.value.recipeIngredient[index].unit = unit;
      recipe.value.recipeIngredient[index].unitInput = unit.name;
      recipe.value.recipeIngredient[index].showUnitDropdown = false;
    };

    /**
     * Gère l'appui sur la touche Entrée dans le champ ingrédient
     */
    const handleFoodInputEnter = (index, foodName) => {
      if (!foodName || !foodName.trim()) return;
      
      // Rechercher si l'ingrédient existe déjà
      const exactMatch = foods.value.find(food => 
        food.name.toLowerCase() === foodName.toLowerCase()
      );
      
      if (exactMatch) {
        // Si l'ingrédient existe, le sélectionner
        selectFood(index, exactMatch);
      } else {
        // Sinon, proposer de créer un nouvel ingrédient
        createNewFood(index, foodName.trim());
      }
    };

    // Fonction pour charger plus d'ingrédients (méthode traditionnelle)
    const loadMoreFoods = async (query = '') => {
      if (loadingIngredients.value) return;
      
      loadingIngredients.value = true;
      
      try {
        // Utiliser une taille de page plus grande
        const response = await referenceService.getFoods({
          page: 1,
          perPage: 1000,
          query: query
        });
        
        if (response.data && Array.isArray(response.data.items)) {
          // Trier les ingrédients par ordre alphabétique
          foods.value = response.data.items.sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
        }
      } catch (err) {
        console.error('Erreur lors du chargement des ingrédients', err);
      } finally {
        loadingIngredients.value = false;
      }
    };

    // Rafraîchissement de la liste des ingrédients
    const refreshFoodsList = async () => {
      try {
        const response = await referenceService.getFoods({
          page: 1,
          perPage: 500
        });
        
        if (response.data && Array.isArray(response.data.items)) {
          foods.value = response.data.items;
        }
      } catch (err) {
        console.error('Erreur lors du rafraîchissement des ingrédients', err);
      }
    };

    // Gestion des dropdowns d'aliments
    const openFoodDropdown = (index) => {
      recipe.value.recipeIngredient[index].showFoodDropdown = true;
      
      // Si nous avons une requête de recherche, effectuer une recherche
      if (recipe.value.recipeIngredient[index].foodInput) {
        // Stocker le terme de recherche pour la pagination future
        const searchQuery = recipe.value.recipeIngredient[index].foodInput;
        searchFoods(searchQuery);
      } else {
        // Si pas de recherche, juste charger la première page d'ingrédients
        if (foods.value.length === 0 || currentFoodsPage.value === 1) {
          // Réinitialiser et charger la première page
          currentFoodsPage.value = 1;
          loadNextPageOfFoods('');
        }
      }
    };

    const closeFoodDropdown = (index, event) => {
      // Fermer avec délai pour permettre la sélection
      setTimeout(() => {
        if (recipe.value.recipeIngredient[index]) {
          recipe.value.recipeIngredient[index].showFoodDropdown = false;
        }
      }, 200);
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

    // S'assurer que tous les ingrédients ont un UUID
    const updateIngredientsWithUUID = () => {
      if (recipe.value.recipeIngredient && Array.isArray(recipe.value.recipeIngredient)) {
        let modified = false;
        
        recipe.value.recipeIngredient.forEach(ingredient => {
          if (!ingredient.referenceId || ingredient.referenceId === "") {
            ingredient.referenceId = generateUUID();
            modified = true;
          }
        });
        
        if (modified) {
          console.log("UUID générés pour les ingrédients existants");
        }
      }
    };

    // Création d'un nouvel ingrédient
    const createNewFood = async (index, foodName) => {
      try {
        loading.value = true;
        
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
          // et s'assurer qu'il a un UUID pour referenceId
          recipe.value.recipeIngredient[index].food = newFood;
          recipe.value.recipeIngredient[index].foodInput = newFood.name;
          recipe.value.recipeIngredient[index].referenceId = generateUUID();
          
          // Message de succès optionnel
          success.value = true;
          setTimeout(() => {
            success.value = false;
          }, 3000);
        }
      } catch (err) {
        console.error('Erreur lors de la création de l\'ingrédient', err);
        error.value = true;
        errorMessage.value = 'Impossible de créer l\'ingrédient. Veuillez réessayer.';
        setTimeout(() => {
          error.value = false;
        }, 3000);
      } finally {
        loading.value = false;
      }
    };

    // Sélection d'un aliment dans la liste déroulante
    const selectFood = (index, food) => {
      // Si c'est l'indicateur de chargement, charger plus d'ingrédients
      if (food.isLoadMoreIndicator) {
        loadNextPageOfFoods(recipe.value.recipeIngredient[index]?.foodInput || '');
        return;
      }
      
      if (food.isNewFood) {
        // Code pour créer un nouvel ingrédient
        const foodName = recipe.value.recipeIngredient[index].foodInput;
        createNewFood(index, foodName);
      } else {
        // Mettre à jour l'ingrédient
        recipe.value.recipeIngredient[index].food = food;
        recipe.value.recipeIngredient[index].foodInput = food.name;
        
        // S'assurer qu'un UUID est assigné
        if (!recipe.value.recipeIngredient[index].referenceId || 
            recipe.value.recipeIngredient[index].referenceId === "") {
          recipe.value.recipeIngredient[index].referenceId = generateUUID();
        }
      }
      recipe.value.recipeIngredient[index].showFoodDropdown = false;
    };

    // Récupération de l'identifiant de référence pour un ingrédient
    const getIngredientReferenceId = async (index, foodId) => {
      if (!foodId) return;
      
      try {
        // Option 1: Faire une requête pour obtenir l'UUID de l'ingrédient
        const response = await referenceService.getIngredientReferenceId(foodId);
        
        if (response && response.data && response.data.referenceId) {
          // Si l'API fournit un referenceId, l'utiliser
          recipe.value.recipeIngredient[index].referenceId = response.data.referenceId;
          console.log(`ReferenceId récupéré de l'API pour l'ingrédient ${index}:`, response.data.referenceId);
        } else {
          // Si l'API ne fournit pas de referenceId, laisser Mealie s'en charger
          recipe.value.recipeIngredient[index].referenceId = ""; // ou null, selon ce que l'API attend
          console.log(`Pas de referenceId disponible pour l'ingrédient ${index}, l'API s'en chargera`);
        }
      } catch (err) {
        console.error(`Erreur lors de la récupération du referenceId pour l'ingrédient ${index}:`, err);
        // En cas d'erreur, laisser Mealie s'en charger
        recipe.value.recipeIngredient[index].referenceId = ""; // ou null, selon ce que l'API attend
      }
    };

    // Gestion des instructions
    const addNewInstruction = () => {
      recipe.value.recipeInstructions.push({
        text: '',
        position: recipe.value.recipeInstructions.length + 1
      });
    };

    const removeInstruction = (index) => {
      recipe.value.recipeInstructions.splice(index, 1);
      
      // Mise à jour des positions
      recipe.value.recipeInstructions.forEach((instruction, idx) => {
        instruction.position = idx + 1;
      });
    };

    const moveInstructionUp = (index) => {
      if (index === 0) return;
      
      const temp = recipe.value.recipeInstructions[index];
      recipe.value.recipeInstructions[index] = recipe.value.recipeInstructions[index - 1];
      recipe.value.recipeInstructions[index - 1] = temp;
      
      // Mise à jour des positions
      recipe.value.recipeInstructions.forEach((instruction, idx) => {
        instruction.position = idx + 1;
      });
    };

    const moveInstructionDown = (index) => {
      if (index === recipe.value.recipeInstructions.length - 1) return;
      
      const temp = recipe.value.recipeInstructions[index];
      recipe.value.recipeInstructions[index] = recipe.value.recipeInstructions[index + 1];
      recipe.value.recipeInstructions[index + 1] = temp;
      
      // Mise à jour des positions
      recipe.value.recipeInstructions.forEach((instruction, idx) => {
        instruction.position = idx + 1;
      });
    };

    // Gestion des catégories
    const isSelectedCategory = (category) => {
      return recipe.value.recipeCategory.some(c => c.id === category.id);
    };

    const toggleCategory = (category) => {
      const index = recipe.value.recipeCategory.findIndex(c => c.id === category.id);
      
      if (index === -1) {
        // Ajouter la catégorie
        recipe.value.recipeCategory.push({
          id: category.id,
          name: category.name,
          slug: category.slug
        });
      } else {
        // Retirer la catégorie
        recipe.value.recipeCategory.splice(index, 1);
      }
    };

    // Ajout d'une nouvelle catégorie
    const addNewCategory = async () => {
      if (!newCategoryName.value.trim()) return;
      
      try {
        // Génération du slug pour la catégorie
        const slug = newCategoryName.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Création de la catégorie via l'API
        const response = await recipeService.createCategory({
          name: newCategoryName.value.trim(),
          slug: slug
        });
        
        // Ajout de la catégorie créée à la liste et sélection
        if (response && response.data) {
          const newCategory = response.data;
          availableCategories.value.push(newCategory);
          recipe.value.recipeCategory.push({
            id: newCategory.id,
            name: newCategory.name,
            slug: newCategory.slug
          });
          
          // Réinitialisation
          newCategoryName.value = '';
          showAddCategoryInput.value = false;
        }
      } catch (err) {
        console.error('Erreur lors de la création de la catégorie', err);
        // Optionnel: afficher un message d'erreur
      }
    };

    // Gestion de l'upload d'image
    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      // Validation du type de fichier
      if (!file.type.match('image.*')) {
        alert('Veuillez sélectionner une image');
        return;
      }
      
      // Limite de taille (5 Mo)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop volumineuse (max 5 Mo)');
        return;
      }
      
      // Prévisualisation
      imageFile.value = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Sauvegarde de la recette avec récupération des données et redirection optimisée
    const saveRecipe = async () => {
      console.log("Tentative de sauvegarde de la recette. Données actuelles:", recipe.value);
      
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      success.value = false;
      
      try {
        // Vérifier si l'ID est présent
        if (!recipe.value.id) {
          error.value = true;
          errorMessage.value = "ID de recette manquant. Veuillez réessayer la création.";
          loading.value = false;
          return;
        }
        
        // Générer des UUID pour tous les ingrédients qui n'en ont pas ou qui ont une chaîne vide
        recipe.value.recipeIngredient.forEach(ingredient => {
          if (!ingredient.referenceId || ingredient.referenceId === "") {
            ingredient.referenceId = generateUUID();
          }
        });
        
        // S'assurer que recipeServings a une valeur
        if (!recipe.value.recipeServings) {
          recipe.value.recipeServings = recipe.value.recipeYield || 4;
        }
        
        // Sauvegarde de la recette
        console.log("Envoi de la mise à jour vers l'API...");
        const updateResponse = await recipeService.updateRecipe(recipe.value.id, recipe.value);
        console.log("Réponse de mise à jour:", updateResponse);
        
        // Upload de l'image si présente
        if (imageFile.value) {
          try {
            await recipeService.uploadRecipeImageFixed(recipe.value.slug, imageFile.value);
            console.log("Image uploadée avec succès");
          } catch (imgErr) {
            console.error("Erreur lors de l'upload de l'image:", imgErr);
            // Continuer malgré l'erreur d'image
          }
        }
        
        // Récupération explicite et garantie des données à jour
        console.log("Récupération des données mises à jour depuis le serveur...");
        let updatedRecipeData = null;
        
        try {
          // Première tentative avec l'ID
          const updatedResponse = await recipeService.getById(recipe.value.id);
          if (updatedResponse && updatedResponse.data) {
            updatedRecipeData = updatedResponse.data;
            console.log("Recette récupérée par ID avec succès");
          }
        } catch (idErr) {
          console.warn("Impossible de récupérer la recette par ID:", idErr);
          
          // Seconde tentative avec le slug si disponible
          if (recipe.value.slug) {
            try {
              const slugResponse = await recipeService.getBySlug(recipe.value.slug);
              if (slugResponse && slugResponse.data) {
                updatedRecipeData = slugResponse.data;
                console.log("Recette récupérée par slug avec succès");
              }
            } catch (slugErr) {
              console.error("Impossible de récupérer la recette par slug:", slugErr);
            }
          }
        }
        
        // Mettre à jour les données si la récupération a réussi
        if (updatedRecipeData) {
          console.log("Mise à jour de la recette avec les données récupérées:", updatedRecipeData);
          recipe.value = updatedRecipeData;
        } else {
          console.warn("Les données n'ont pas pu être récupérées, utilisation des données de la réponse de mise à jour");
          // Utiliser les données de la réponse de mise à jour si disponibles
          if (updateResponse && updateResponse.data) {
            recipe.value = updateResponse.data;
          }
        }
        
        // Afficher le succès
        success.value = true;
        
        // Émission de l'événement de création réussie
        emit('recipe-created', recipe.value.id);
        
        // S'assurer que le store est correctement mis à jour avant la redirection
        if (recipe.value && recipe.value.id) {
          console.log("Mise à jour du store de recettes avant redirection");
          
          // Ajouter une version "complète" de la recette au store
          recipeStore.addRecipe({
            ...recipe.value,
            _detailsLoaded: true  // Marquer les détails comme chargés
          });
          
          // Attendre un peu pour que le store se synchronise
          console.log("Délai avant redirection pour permettre la synchronisation des données");
          setTimeout(() => {
            // Fermer le modal
            emit('close');
            
            // Redirection vers la page de détail avec un paramètre pour forcer le rechargement
            router.push({
              path: `/recipes/${recipe.value.id}`,
              query: { refresh: Date.now() }  // Paramètre unique pour éviter la mise en cache
            });
          }, 1000);  // Délai suffisant pour la synchronisation et pour voir le message de succès
        }
      } catch (err) {
        console.error('Erreur lors de la sauvegarde de la recette', err);
        error.value = true;
        
        // Extraire les détails de l'erreur si disponibles
        if (err.response && err.response.data) {
          console.error("Détails de l'erreur API:", err.response.data);
          
          // Vérifier s'il y a des détails d'erreur spécifiques pour les ingrédients
          if (err.response.data.detail && Array.isArray(err.response.data.detail)) {
            const ingredientErrors = err.response.data.detail.filter(detail => 
              detail.loc && detail.loc.includes("recipeIngredient")
            );
            
            if (ingredientErrors.length > 0) {
              errorMessage.value = `Erreur avec les ingrédients: ${ingredientErrors[0].msg}`;
            } else if (err.response.data.detail[0]?.msg) {
              errorMessage.value = `Erreur API: ${err.response.data.detail[0].msg}`;
            } else {
              errorMessage.value = "Erreur API: vérifiez les données de la recette";
            }
          } else if (err.response.data.detail) {
            errorMessage.value = `Erreur API: ${err.response.data.detail}`;
          } else if (typeof err.response.data === 'string') {
            errorMessage.value = `Erreur API: ${err.response.data}`;
          } else {
            errorMessage.value = err.message || 'Impossible de sauvegarder la recette. Vérifiez les données et réessayez.';
          }
        } else {
          errorMessage.value = err.message || 'Impossible de sauvegarder la recette. Vérifiez les données et réessayez.';
        }
      } finally {
        loading.value = false;
      }
    };

    // Fermeture du modal
    const close = () => {
      // Si une recette a été créée à l'étape 1 mais pas complétée, la supprimer
      if (currentStep.value === 2 && recipe.value.id && !success.value) {
        // Demander confirmation
        if (confirm('Voulez-vous abandonner la création de cette recette ?')) {
          recipeService.deleteRecipe(recipe.value.id).catch(err => {
            console.error('Erreur lors de la suppression de la recette', err);
          });
        } else {
          return; // Annulation de la fermeture
        }
      }
      
      emit('close');
    };

    return {
      currentStep,
      recipe,
      loading,
      error,
      errorMessage,
      success,
      recipeUrl,
      chooseImportMethod,
      importFromUrl,
      createInitialRecipe,
      close,
      addNewIngredient,
      removeIngredient,
      openUnitDropdown,
      closeUnitDropdown,
      filteredUnits,
      selectUnit,
      openFoodDropdown,
      closeFoodDropdown,
      filteredFoods,
      selectFood,
      addNewInstruction,
      removeInstruction,
      moveInstructionUp,
      moveInstructionDown,
      handleImageUpload,
      imageFile,
      imagePreview,
      loadingIngredients,
      recipeNameInput,
      availableCategories,
      isSelectedCategory,
      toggleCategory,
      showAddCategoryInput,
      newCategoryName,
      addNewCategory,
      saveRecipe,
      showNutritionSection,
      toggleNutritionSection,
      // Il est crucial d'exposer ces fonctions et variables pour éviter les erreurs
      handleFoodDropdownScroll,
      isLoadingMoreFoods,
      hasMoreFoods,
      currentFoodsPage
    };
  }
};
</script>