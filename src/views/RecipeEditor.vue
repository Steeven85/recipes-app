<template>
    <div class="recipe-editor">
      <!-- En-tête du formulaire avec boutons d'action -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold">{{ isNewRecipe ? 'Créer une nouvelle recette' : 'Modifier "' + recipe.name + '"' }}</h2>
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
        Recette {{ isNewRecipe ? 'créée' : 'modifiée' }} avec succès!
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
              <div v-else-if="recipe.id && !isNewRecipe" class="h-full w-full">
                <img 
                  :src="getRecipeImageUrl(recipe.id)" 
                  alt="Image actuelle" 
                  class="h-full w-full object-cover"
                  @error="handleImageError"
                />
              </div>
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
              <p>Cliquez pour {{ imagePreview || (!isNewRecipe && recipe.id) ? 'changer' : 'ajouter' }} une image</p>
              <p v-if="imageFile">{{ imageFile.name }}</p>
            </div>
          </div>
        </div>
  
        <!-- Nom de la recette -->
        <div class="mb-4">
          <label for="recipe-name" class="block text-sm font-medium text-gray-700 mb-1">Nom de la recette *</label>
          <input
            id="recipe-name"
            v-model="recipe.name"
            type="text"
            placeholder="Nom de votre recette"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            required
          />
        </div>
  
        <!-- Description -->
        <div class="mb-4">
          <label for="recipe-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="recipe-description"
            v-model="recipe.description"
            rows="3"
            placeholder="Décrivez votre recette"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="cook-time" class="block text-sm font-medium text-gray-700 mb-1">Cuisson (min)</label>
            <input
              id="cook-time"
              v-model.number="recipe.performTime"
              type="number"
              min="0"
              placeholder="30"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label for="servings" class="block text-sm font-medium text-gray-700 mb-1">Portions</label>
            <input
              id="servings"
              v-model.number="recipe.recipeServings"
              type="number"
              min="1"
              placeholder="4"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
              class="px-2 py-1 bg-emerald-100 rounded-md hover:bg-emerald-200 text-emerald-700 text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Ajouter
            </button>
          </div>
          
          <div v-if="loadingIngredients" class="text-center py-4">
            <svg class="animate-spin h-6 w-6 text-emerald-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
                    placeholder="Unité (optionnelle)"
                    class="w-full border border-gray-300 rounded p-2"
                    />
                    <div 
                    v-if="ingredient.showUnitDropdown" 
                    class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                    >
                    <!-- Option pour sélectionner aucune unité, mis en évidence -->
                    <div 
                        @mousedown.prevent="handleUnitSelection(index, {id: 'none', name: ''})"
                        class="p-2 hover:bg-gray-100 cursor-pointer bg-gray-50 text-gray-700 font-medium border-b border-gray-200"
                    >
                        -- Aucune unité --
                    </div>
                    
                    <!-- Liste des unités disponibles -->
                    <div 
                        v-for="unit in filteredUnits(ingredient.unitInput)" 
                        :key="unit.id" 
                        @mousedown.prevent="handleUnitSelection(index, unit)"
                        class="p-2 hover:bg-gray-100 cursor-pointer"
                    >
                        {{ unit.name }}
                    </div>
                    </div>
                </div>
                </div>
                
                <!-- Modification de la fonction pour effacer l'unité -->
                <button 
                v-if="ingredient.unitInput" 
                @click="clearUnit(index)"
                class="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                title="Effacer l'unité"
                >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                </button>

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
                            ? 'text-emerald-600 font-medium bg-emerald-50 hover:bg-emerald-100 flex items-center' 
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
                class="px-2 py-1 bg-emerald-100 rounded-md hover:bg-emerald-200 text-emerald-700 text-sm flex items-center"
                >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter
                </button>
            </div>
          
            <div v-for="(instruction, index) in recipe.recipeInstructions" :key="`ins-${index}`" class="mb-3">
                <div class="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
                <div class="flex justify-between items-center mb-2">
                    <div class="font-semibold text-emerald-600">
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
                
                <!-- Champ pour le résumé (optionnel) si présent dans l'objet instruction -->
                <input 
                    v-if="instruction.summary !== undefined"
                    v-model="instruction.summary" 
                    class="w-full mb-2 border border-emerald-500 rounded p-2 text-gray-700"
                    placeholder="Résumé de l'étape (optionnel)"
                />
                
                <!-- Champ pour le texte de l'instruction (toujours présent) -->
                <textarea 
                    v-model="instruction.text" 
                    class="w-full border border-emerald-500 rounded p-2 text-gray-700"
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
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800 border' 
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
              class="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700"
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
          class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
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
  </template>
  
  <script>
  import { ref, computed, onMounted, nextTick, reactive } from 'vue';
  import { recipeService, referenceService } from '../services/api';
  
  export default {
    name: 'RecipeEditor',
    emits: ['close', 'recipe-saved'],
    
    props: {
      // Si recipeData est fourni, on est en mode édition, sinon en mode création
      recipeData: {
        type: Object,
        default: null
      }
    },
    
    setup(props, { emit }) {
      const loading = ref(false);
      const error = ref(false);
      const errorMessage = ref('');
      const success = ref(false);
      const imageFile = ref(null);
      const imagePreview = ref(null);
      const loadingIngredients = ref(false);
      
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
      
      // Mode création vs édition
      const isNewRecipe = computed(() => !props.recipeData);
      
      // Conserver la recette originale pour comparaison lors des mises à jour partielles
      const originalRecipe = ref(null);
      
      // Modèle de recette
      const recipe = ref(initializeRecipe());
      
      // Initialisation de la recette
      function initializeRecipe() {
        if (props.recipeData) {
          // Mode édition: copie profonde du modèle fourni
          const recipeDataClone = JSON.parse(JSON.stringify(props.recipeData));
          
          // Conserver aussi la version originale pour les comparaisons ultérieures
          originalRecipe.value = JSON.parse(JSON.stringify(props.recipeData));
          
          // S'assurer que les champs requis existent
          ensureRecipeStructure(recipeDataClone);
          
          // Préparer les ingrédients pour l'édition
          prepareIngredientsForEditing(recipeDataClone);
          
          return recipeDataClone;
        } else {
          // Mode création: modèle vide
          return {
            name: '',
            description: '',
            prepTime: null,
            performTime: null,
            totalTime: null,
            recipeServings: 4,
            recipeYield: '4 portions',
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
          };
        }
      }
      
      // S'assurer que tous les champs nécessaires existent
      function ensureRecipeStructure(recipe) {
        if (!recipe.nutrition) {
          recipe.nutrition = {
            calories: null,
            carbohydrateContent: null,
            proteinContent: null,
            fatContent: null,
            fiberContent: null,
            sugarContent: null,
            sodiumContent: null
          };
        }
        
        if (!recipe.recipeIngredient) {
          recipe.recipeIngredient = [];
        }
        
        if (!recipe.recipeInstructions) {
          recipe.recipeInstructions = [];
        }
        
        if (!recipe.recipeCategory) {
          recipe.recipeCategory = [];
        }
        
        if (!recipe.recipeServings) {
          recipe.recipeServings = 4;
        }
        
        return recipe;
      }
      
      // Préparer les ingrédients pour l'édition
      function prepareIngredientsForEditing(recipe) {
        if (recipe.recipeIngredient && Array.isArray(recipe.recipeIngredient)) {
          recipe.recipeIngredient = recipe.recipeIngredient.map(ingredient => {
            // Initialiser les propriétés UI
            const preparedIngredient = { ...ingredient };
            
            // Initialiser unitInput avec le nom de l'unité
            if (ingredient.unit && ingredient.unit.name) {
              preparedIngredient.unitInput = ingredient.unit.name;
            } else {
              preparedIngredient.unitInput = '';
            }
            
            // Initialiser foodInput avec le nom de l'aliment
            if (ingredient.food && ingredient.food.name) {
              preparedIngredient.foodInput = ingredient.food.name;
            } else {
              preparedIngredient.foodInput = '';
            }
            
            // Ajouter les états des dropdowns
            preparedIngredient.showUnitDropdown = false;
            preparedIngredient.showFoodDropdown = false;
            
            // S'assurer que d'autres champs existent
            if (!preparedIngredient.note) preparedIngredient.note = '';
            if (preparedIngredient.quantity === undefined) preparedIngredient.quantity = 0;
            
            return preparedIngredient;
          });
        }
      }
      
      onMounted(async () => {
        // Charger les données de référence au montage du composant
        await loadReferenceData();
      });
      
      // Chargement des données de référence
      const loadReferenceData = async () => {
        loadingIngredients.value = true;
        
        try {
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
          
          // Charger TOUS les ingrédients en une fois
          await loadAllFoods('');
          
          // Charger les catégories (pour le reste de la recette)
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

  
      // Gestion d'erreur pour l'image
      const handleImageError = (e) => {
        console.log("Erreur de chargement d'image:", e);
        e.target.src = '/default-recipe.png'; // Image par défaut
      };
      
      // Récupération de l'URL de l'image d'une recette
      const getRecipeImageUrl = (recipeId, size = 'min-original.webp') => {
        return recipeService.getRecipeImageUrl(recipeId, size);
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
  

      const loadAllFoods = async (query = '') => {
        isLoadingMoreFoods.value = true;
        try {
          const perPage = 1000; // On charge jusqu’à 1000 ingrédients d’un coup
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

      const clearUnit = (index) => {
        recipe.value.recipeIngredient[index].unit = null;
        recipe.value.recipeIngredient[index].unitInput = '';
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
        let filteredList = [];
        
        // Ajouter l'option "Aucune unité" en haut de la liste
        filteredList.push({
            id: 'none',
            name: '-- Aucune unité --'
        });
        
        // Filtrer les unités normales
        if (!query) {
            filteredList = [...filteredList, ...units.value];
        } else {
            const lowerQuery = query.toLowerCase();
            const matches = units.value.filter(unit => 
            unit.name.toLowerCase().includes(lowerQuery)
            );
            filteredList = [...filteredList, ...matches];
        }
        
        return filteredList;
        };
  
      const selectUnit = (index, unit) => {
        if (!unit) {
            // Si aucune unité n'est sélectionnée
            recipe.value.recipeIngredient[index].unit = null;
            recipe.value.recipeIngredient[index].unitInput = '';
        } else {
            // Si une unité est sélectionnée
            recipe.value.recipeIngredient[index].unit = unit;
            recipe.value.recipeIngredient[index].unitInput = unit.name;
        }
        recipe.value.recipeIngredient[index].showUnitDropdown = false;
        };

        const handleUnitSelection = (index, unit) => {
        if (unit.id === 'none') {
            // Traiter comme "Aucune unité"
            recipe.value.recipeIngredient[index].unit = null;
            recipe.value.recipeIngredient[index].unitInput = '';
        } else {
            // Traiter comme une unité normale
            selectUnit(index, unit);
        }
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
  
      // Gestion des dropdowns d'aliments
      const openFoodDropdown = (index) => {
        // Affiche le dropdown pour cet ingrédient
        recipe.value.recipeIngredient[index].showFoodDropdown = true;
        
        // Si la liste n’a pas encore été chargée, charger tous les ingrédients
        if (foods.value.length === 0) {
          loadAllFoods(recipe.value.recipeIngredient[index].foodInput || '');
        } else if (recipe.value.recipeIngredient[index].foodInput) {
          // Si un terme de recherche existe, vous pouvez également filtrer en rechargeant (optionnel)
          loadAllFoods(recipe.value.recipeIngredient[index].foodInput);
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
  
      // Gestion des instructions
      const addNewInstruction = () => {
        recipe.value.recipeInstructions.push({
          text: '',
          summary: '',
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
          error.value = true;
          errorMessage.value = 'Impossible de créer la catégorie';
          setTimeout(() => {
            error.value = false;
          }, 3000);
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
  
      // Fonction utilitaire pour identifier les champs modifiés
      const getModifiedFields = (currentRecipe, originalRecipe) => {
        if (!originalRecipe) return currentRecipe; // Si pas d'original, retourner tout
        
        const modifiedFields = { id: currentRecipe.id };
        
        // Comparer les champs simples
        const simpleFields = ['name', 'description', 'prepTime', 'performTime', 'totalTime', 
                             'recipeServings', 'recipeYield', 'slug'];
        
        simpleFields.forEach(field => {
          if (JSON.stringify(currentRecipe[field]) !== JSON.stringify(originalRecipe[field])) {
            modifiedFields[field] = currentRecipe[field];
          }
        });
        
        // Comparer les tableaux et objets complexes
        if (JSON.stringify(currentRecipe.recipeIngredient) !== JSON.stringify(originalRecipe.recipeIngredient)) {
          modifiedFields.recipeIngredient = currentRecipe.recipeIngredient;
        }
        
        if (JSON.stringify(currentRecipe.recipeInstructions) !== JSON.stringify(originalRecipe.recipeInstructions)) {
          modifiedFields.recipeInstructions = currentRecipe.recipeInstructions;
        }
        
        if (JSON.stringify(currentRecipe.recipeCategory) !== JSON.stringify(originalRecipe.recipeCategory)) {
          modifiedFields.recipeCategory = currentRecipe.recipeCategory;
        }
        
        if (JSON.stringify(currentRecipe.nutrition) !== JSON.stringify(originalRecipe.nutrition)) {
          modifiedFields.nutrition = currentRecipe.nutrition;
        }
        
        return modifiedFields;
      };
  
      // Préparation et sauvegarde de la recette
      const prepareRecipeForSave = () => {
        const recipeToSave = { ...recipe.value };
        
        // Générer un slug si nécessaire
        if (!recipeToSave.slug) {
            recipeToSave.slug = recipeToSave.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        }
        
        // S'assurer que recipeYield existe
        if (!recipeToSave.recipeYield) {
            recipeToSave.recipeYield = `${recipeToSave.recipeServings || 4} portions`;
        }
        
        // S'assurer que tous les ingrédients ont un referenceId
        // et gérer correctement les unités vides
        recipeToSave.recipeIngredient.forEach(ingredient => {
            if (!ingredient.referenceId) {
            ingredient.referenceId = generateUUID();
            }
            
            // CORRECTION: Gérer correctement les unités vides
            // Ne pas définir d'unité par défaut si aucune n'est spécifiée
            if (!ingredient.unitInput || ingredient.unitInput.trim() === '') {
            ingredient.unit = null;
            } else if (!ingredient.unit) {
            // Si unitInput existe mais pas unit, créer l'objet unit
            ingredient.unit = { name: ingredient.unitInput };
            }
            
            // S'assurer que food existe
            if (!ingredient.foodInput || ingredient.foodInput.trim() === '') {
            ingredient.food = null;
            } else if (!ingredient.food) {
            // Si foodInput existe mais pas food, créer l'objet food
            ingredient.food = { name: ingredient.foodInput };
            }
        });
        
        return recipeToSave;
        };
  
        const saveRecipe = async () => {
          if (!recipe.value.name) {
            error.value = true;
            errorMessage.value = "Le nom de la recette est obligatoire";
            return;
          }
          
          loading.value = true;
          error.value = false;
          errorMessage.value = '';
          success.value = false;
          
          try {
            // Préparer la recette pour la sauvegarde
            const recipeToSave = prepareRecipeForSave();
            
            // Si on est en mode édition, identifier uniquement les champs modifiés
            let response;
            
            if (isNewRecipe.value) {
              // Mode création - utiliser POST avec l'objet complet
              response = await recipeService.createRecipe(recipeToSave);
            } else {
              // Mode édition - utiliser PATCH avec uniquement les champs modifiés
              const modifiedFields = getModifiedFields(recipeToSave, originalRecipe.value);
              
              // Vérifier si l'API supporte PATCH
              if (recipeService.updateRecipePartial) {
                console.log("Utilisation de PATCH avec les champs modifiés:", modifiedFields);
                response = await recipeService.updateRecipePartial(recipeToSave.id, modifiedFields);
              } else {
                // Si la méthode n'existe pas, utiliser PUT comme solution de secours
                console.log("API PATCH non disponible, utilisation de PUT avec l'objet complet");
                response = await recipeService.updateRecipe(recipeToSave.id, recipeToSave);
              }
            }
            
            if (response && response.data) {
              const savedRecipe = response.data;
              
              // Si une image a été uploadée, l'envoyer
              if (imageFile.value) {
                try {
                  await recipeService.uploadRecipeImageFixed(savedRecipe.slug, imageFile.value);
                  console.log("Image uploadée avec succès");
                } catch (imgErr) {
                  console.error("Erreur lors de l'upload de l'image:", imgErr);
                  // On continue malgré l'erreur d'image
                }
              }
              
              // Afficher le succès
              success.value = true;
              setTimeout(() => {
                success.value = false;
                
                // Émettre l'événement de sauvegarde réussie avec la recette sauvegardée
                emit('recipe-saved', savedRecipe);
                
                // Rediriger vers la page de détail avec le paramètre modified=true
                // Vérifier d'abord si le composant utilise un router ou s'il doit simplement émettre un événement
                if (router) {
                  // Si le router est disponible dans le composant
                  router.push(`/recipes/${savedRecipe.slug || savedRecipe.id}?modified=true`);
                } else {
                  // Si pas de router, émettre un événement supplémentaire pour la redirection
                  emit('redirect', {
                    path: `/recipes/${savedRecipe.slug || savedRecipe.id}`,
                    query: { modified: 'true' }
                  });
                }
              }, 1500);
            }
          } catch (err) {
            console.error('Erreur lors de la sauvegarde de la recette', err);
            error.value = true;
            
            // Extraire le message d'erreur
            if (err.response && err.response.data) {
              if (err.response.data.detail) {
                errorMessage.value = Array.isArray(err.response.data.detail) 
                  ? err.response.data.detail[0].msg 
                  : err.response.data.detail;
              } else {
                errorMessage.value = JSON.stringify(err.response.data);
              }
            } else {
              errorMessage.value = err.message || 'Impossible de sauvegarder la recette';
            }
          } finally {
            loading.value = false;
          }
        };
  
      // Fermeture du composant
      const close = () => {
        emit('close');
      };
  
      return {
        recipe,
        loading,
        error,
        errorMessage,
        success,
        isNewRecipe,
        imageFile,
        imagePreview,
        loadingIngredients,
        units,
        foods,
        availableCategories,
        showAddCategoryInput,
        newCategoryName,
        isLoadingMoreFoods,
        
        // Méthodes exposées
        close,
        saveRecipe,
        handleImageUpload,
        handleImageError,
        getRecipeImageUrl,
        
        // Gestion des ingrédients
        addNewIngredient,
        removeIngredient,
        openUnitDropdown,
        closeUnitDropdown,
        filteredUnits,
        selectUnit,
        handleUnitSelection,
        openFoodDropdown,
        closeFoodDropdown,
        filteredFoods,
        handleFoodInputEnter,
        selectFood,
        handleFoodDropdownScroll,
        
        // Gestion des instructions
        addNewInstruction,
        removeInstruction,
        moveInstructionUp,
        moveInstructionDown,
        
        // Gestion des catégories
        isSelectedCategory,
        toggleCategory,
        addNewCategory
        
      };
    }
  };
  </script>