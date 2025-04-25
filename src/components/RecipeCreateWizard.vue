<template>
  <div class="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Étape 0: Choix du mode de création -->
      <div
        v-if="currentStep === 0"
        class="p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800">
            Ajouter une recette
          </h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="close"
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

        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <button 
              class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              @click="chooseImportMethod('url')"
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
              @click="chooseImportMethod('manual')"
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
          </div>
        </div>
      </div>

      <!-- Étape URL: Importation depuis URL -->
      <div
        v-if="currentStep === 'url'"
        class="p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800">
            Importer depuis une URL
          </h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="close"
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
          v-if="error"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="success"
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

          <!-- Affichage du statut de l'importation -->
          <div
            v-if="loading"
            class="mb-4"
          >
            <div class="flex items-center text-emerald-700">
              <svg
                class="animate-spin h-5 w-5 mr-2"
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
              <span>{{ importStatus }}</span>
            </div>
            
            <!-- Explication du processus d'importation -->
            <div class="mt-3 bg-emerald-50 rounded-lg p-4 text-sm">
              <h3 class="font-medium text-emerald-800 mb-2">
                Améliorations de l'importation
              </h3>
              <p class="text-gray-700 mb-2">
                Notre système analyse automatiquement les ingrédients de la recette pour vous offrir une expérience optimale :
              </p>
              <ul class="list-disc pl-5 text-gray-700">
                <li>Identification précise des quantités</li>
                <li>Reconnaissance des unités de mesure</li>
                <li>Liaison automatique avec les ingrédients de votre base de données</li>
                <li>Séparation des notes et instructions spécifiques</li>
              </ul>
            </div>
          </div>

          <div class="flex justify-end space-x-2">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              :disabled="loading"
              @click="currentStep = 0"
            >
              Retour
            </button>
            <button
              type="submit"
              class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
              :disabled="loading"
            >
              <span v-if="loading">
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
                Importation...
              </span>
              <span v-else>Importer</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Étape 1: Création initiale de la recette -->
      <div
        v-if="currentStep === 1"
        class="p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800">
            Créer une nouvelle recette
          </h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="close"
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
          v-if="error"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {{ errorMessage }}
        </div>

        <form @submit.prevent="createInitialRecipe">
          <div class="mb-4">
            <label
              for="recipe-name"
              class="block text-sm font-medium text-gray-700 mb-1"
            >Nom de la recette *</label>
            <input
              id="recipe-name"
              ref="recipeNameInput"
              v-model="recipe.name"
              type="text"
              placeholder="Nom de votre nouvelle recette"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              required
            >
          </div>

          <div class="flex justify-end space-x-2">
            <button
              type="button"
              class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              :disabled="loading"
              @click="currentStep = 0"
            >
              Retour
            </button>
            <button
              type="submit"
              class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
              :disabled="loading"
            >
              <span v-if="loading">
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
                Création...
              </span>
              <span v-else>Continuer</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Étape 2: Édition complète de la recette -->
      <div
        v-if="currentStep === 2"
        class="p-6"
      >
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold text-gray-800">
            Modifier "{{ recipe.name }}"
          </h2>
          <button
            class="text-gray-500 hover:text-gray-700"
            @click="close"
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
          v-if="error"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
        >
          {{ errorMessage }}
        </div>

        <div
          v-if="success"
          class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4"
        >
          Recette créée avec succès!
        </div>

        <div class="mb-6">
          <!-- Image de la recette -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Image</label>
            <!-- Zone de drop, paste et clic -->
            <div 
              class="relative border-dashed border-2 p-4 text-center rounded cursor-pointer"
              @dragover.prevent
              @drop.prevent="handleDrop"
              @paste.prevent="handlePaste"
              @click="triggerFileInput"
            >
              <template v-if="!imagePreview">
                <p class="text-gray-400">
                  Glissez-déposez une image ici,<br>ou cliquez pour sélectionner un fichier
                </p>
              </template>
              <template v-else>
                <img
                  :src="imagePreview"
                  alt="Aperçu de l'image"
                  class="mx-auto h-32 w-32 object-cover rounded"
                >
              </template>
              <input 
                ref="fileInput" 
                type="file" 
                accept="image/*"
                class="absolute inset-0 opacity-0"
                @change="handleImageUpload"
              >
            </div>
        
            <!-- Option pour importer via URL -->
            <div class="mt-4">
              <input 
                v-model="manualImageUrl" 
                type="text" 
                placeholder="Saisissez l'URL de l'image" 
                class="border p-2 rounded w-full"
              >
              <button 
                type="button"
                class="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
                @click="loadImageFromUrl"
              >
                Charger l'image depuis l'URL
              </button>
            </div>
        
            <div
              v-if="imageFile"
              class="mt-1 text-sm text-gray-500"
            >
              Fichier sélectionné : {{ imageFile.name }}
            </div>
          </div>

          <!-- Description -->
          <div class="mb-4">
            <label
              for="recipe-description"
              class="block text-sm font-medium text-gray-700 mb-1"
            >Description</label>
            <textarea
              id="recipe-description"
              v-model="recipe.description"
              rows="3"
              placeholder="Décrivez votre recette"
              class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <!-- Temps et portions -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label
                for="prep-time"
                class="block text-sm font-medium text-gray-700 mb-1"
              >Préparation (min)</label>
              <input
                id="prep-time"
                v-model.number="recipe.prepTime"
                type="number"
                min="0"
                placeholder="20"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
            </div>
            <div>
              <label
                for="cook-time"
                class="block text-sm font-medium text-gray-700 mb-1"
              >Cuisson (min)</label>
              <input
                id="cook-time"
                v-model.number="recipe.performTime"
                type="number"
                min="0"
                placeholder="30"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
            </div>
            <div>
              <label
                for="total-time"
                class="block text-sm font-medium text-gray-700 mb-1"
              >Temps total (min)</label>
              <input
                id="total-time"
                v-model.number="recipe.totalTime"
                type="number"
                min="0"
                placeholder="50"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
            </div>
            <div>
              <label
                for="servings"
                class="block text-sm font-medium text-gray-700 mb-1"
              >Portions</label>
              <input
                id="servings"
                v-model.number="recipe.recipeYield"
                type="number"
                min="1"
                placeholder="4"
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
            </div>
          </div>

          <!-- Ingrédients -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-medium text-gray-800">
                Ingrédients
              </h3>
              <button
                type="button"
                class="px-2 py-1 bg-emerald-100 rounded-md hover:bg-emerald-200 text-emerald-700 text-sm flex items-center"
                @click="addNewIngredient"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
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
                Ajouter
              </button>
            </div>
            
            <div
              v-if="loadingIngredients"
              class="text-center py-4"
            >
              <svg
                class="animate-spin h-6 w-6 text-emerald-600 mx-auto"
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
              <p class="mt-2 text-sm text-gray-500">
                Chargement des ingrédients...
              </p>
            </div>
            
            <div v-else>
              <div
                v-for="(ingredient, index) in recipe.recipeIngredient"
                :key="`ing-${index}`"
                class="mb-3 p-3 bg-gray-50 rounded-lg"
              >
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
                    >
                  </div>
                  
                  <!-- Unité -->
                  <div class="col-span-3">
                    <div class="relative">
                      <input 
                        v-model="ingredient.unitInput"
                        placeholder="Unité"
                        class="w-full border border-gray-300 rounded p-2" 
                        @input="ingredient.unit = null"
                        @focus="openUnitDropdown(index)"
                        @blur="closeUnitDropdown(index, $event)"
                      >
                      <div 
                        v-if="ingredient.showUnitDropdown" 
                        class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        <div 
                          v-for="unit in filteredUnits(ingredient.unitInput)" 
                          :key="unit.id" 
                          class="p-2 hover:bg-gray-100 cursor-pointer"
                          @mousedown.prevent="selectUnit(index, unit)"
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
                        placeholder="Ingrédient"
                        class="w-full border border-gray-300 rounded p-2" 
                        @input="ingredient.food = null"
                        @focus="openFoodDropdown(index)"
                      >
                      <div 
                        v-if="ingredient.showFoodDropdown" 
                        class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
                      >
                        <div 
                          v-for="food in filteredFoods(ingredient.foodInput)" 
                          :key="food.id" 
                          class="p-2 hover:bg-gray-100 cursor-pointer"
                          @mousedown.prevent="selectFood(index, food)"
                        >
                          {{ food.name }}
                        </div>
                        <div
                          v-if="filteredFoods(ingredient.foodInput).length === 0"
                          class="p-3 text-gray-500 text-center"
                        >
                          Aucun ingrédient trouvé
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Supprimer -->
                  <div class="col-span-2 flex justify-center items-center">
                    <button 
                      class="text-red-500 hover:text-red-700" 
                      title="Supprimer cet ingrédient"
                      @click="removeIngredient(index)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
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
                  >
                </div>
              </div>
              
              <!-- Message quand aucun ingrédient -->
              <div
                v-if="recipe.recipeIngredient.length === 0"
                class="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg"
              >
                Cliquez sur "Ajouter" pour commencer à saisir des ingrédients
              </div>
            </div>
          </div>

          <!-- Instructions -->
          <div class="mb-6">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-medium text-gray-800">
                Instructions
              </h3>
              <button
                type="button"
                class="px-2 py-1 bg-emerald-100 rounded-md hover:bg-emerald-200 text-emerald-700 text-sm flex items-center"
                @click="addNewInstruction"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
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
                Ajouter
              </button>
            </div>
            
            <div
              v-for="(instruction, index) in recipe.recipeInstructions"
              :key="`ins-${index}`"
              class="mb-3"
            >
              <div class="bg-emerald-50 p-4 rounded-lg border-l-4 border-emerald-500">
                <div class="flex justify-between items-center mb-2">
                  <div class="font-semibold text-emerald-600">
                    Étape {{ index + 1 }}
                  </div>
                  <!-- Boutons réordonner/supprimer -->
                  <div class="flex space-x-2">
                    <button 
                      :disabled="index === 0"
                      :class="{'opacity-50 cursor-not-allowed': index === 0}"
                      class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Déplacer vers le haut"
                      @click="moveInstructionUp(index)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                    <button 
                      :disabled="index === recipe.recipeInstructions.length - 1" 
                      :class="{'opacity-50 cursor-not-allowed': index === recipe.recipeInstructions.length - 1}"
                      class="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                      title="Déplacer vers le bas"
                      @click="moveInstructionDown(index)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                    <button 
                      class="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Supprimer cette étape"
                      @click="removeInstruction(index)"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        class="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fill-rule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clip-rule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <!-- Champ pour le résumé de l'étape -->
                <input 
                  v-model="instruction.summary" 
                  class="w-full mb-2 border border-emerald-500 rounded p-2 text-gray-700"
                  placeholder="Résumé de l'étape (optionnel)"
                >

                <!-- Champ pour le texte complet de l'instruction -->
                <textarea 
                  v-model="instruction.text" 
                  class="w-full border border-emerald-500 rounded p-2 text-gray-700"
                  placeholder="Décrivez cette étape de préparation..."
                  rows="3"
                />
              </div>
            </div>
            
            <!-- Message quand aucune instruction -->
            <div
              v-if="recipe.recipeInstructions.length === 0"
              class="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg"
            >
              Cliquez sur "Ajouter" pour commencer à saisir les instructions
            </div>
          </div>

          <!-- Section Valeurs Nutritionnelles -->
          <div class="mb-6">
            <div class="mb-3">
              <h3 class="text-lg font-medium text-gray-800">
                Valeurs Nutritionnelles
              </h3>
            </div>
            
            <div class="p-4 rounded-lg space-y-4">
              <p class="text-sm text-gray-600">
                Les valeurs nutritionnelles sont pour une portion.
              </p>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    for="calories"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Calories (kcal)</label>
                  <input
                    id="calories"
                    v-model.number="recipe.nutrition.calories"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
                </div>
                
                <div>
                  <label
                    for="carbs"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Glucides (g)</label>
                  <input
                    id="carbs"
                    v-model.number="recipe.nutrition.carbohydrateContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
                </div>
                
                <div>
                  <label
                    for="protein"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Protéines (g)</label>
                  <input
                    id="protein"
                    v-model.number="recipe.nutrition.proteinContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
                </div>
                
                <div>
                  <label
                    for="fat"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Lipides (g)</label>
                  <input
                    id="fat"
                    v-model.number="recipe.nutrition.fatContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
                </div>
                
                <div>
                  <label
                    for="fiber"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Fibres (g)</label>
                  <input
                    id="fiber"
                    v-model.number="recipe.nutrition.fiberContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
                </div>
                
                <div>
                  <label
                    for="sugar"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Sucres (g)</label>
                  <input
                    id="sugar"
                    v-model.number="recipe.nutrition.sugarContent"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
                </div>
                
                <div>
                  <label
                    for="sodium"
                    class="block text-sm font-medium text-gray-700 mb-1"
                  >Sodium (mg)</label>
                  <input
                    id="sodium"
                    v-model.number="recipe.nutrition.sodiumContent"
                    type="number"
                    min="0"
                    placeholder="0"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:outline-none"
                  >
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
                :class="[
                  'px-3 py-1 rounded-full text-sm cursor-pointer',
                  isSelectedCategory(category) 
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-800 border' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-transparent'
                ]"
                @click="toggleCategory(category)"
              >
                {{ category.name }}
              </span>
              
              <button
                type="button"
                class="px-3 py-1 rounded-full text-sm border border-dashed border-gray-400 text-gray-700 hover:bg-gray-50 flex items-center"
                @click="showAddCategoryInput = !showAddCategoryInput"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-4 w-4 mr-1"
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
                Nouvelle catégorie
              </button>
            </div>
            
            <!-- Ajout de nouvelle catégorie -->
            <div
              v-if="showAddCategoryInput"
              class="flex items-center mt-2"
            >
              <input 
                v-model="newCategoryName" 
                type="text" 
                placeholder="Nom de la nouvelle catégorie" 
                class="flex-grow border rounded-lg px-3 py-2 mr-2"
              >
              <button 
                class="bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700" 
                :disabled="!newCategoryName.trim()"
                @click="addNewCategory"
              >
                Ajouter
              </button>
              <button 
                class="ml-2 text-gray-500 hover:text-gray-700" 
                @click="showAddCategoryInput = false"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5"
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
          </div>
        </div>

        <div class="flex justify-end space-x-2">
          <button
            type="button"
            class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            :disabled="loading"
            @click="close"
          >
            Annuler
          </button>
          <button
            class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 flex items-center"
            :disabled="loading"
            @click="saveRecipe"
          >
            <span v-if="loading">
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
import { recipeService, referenceService } from '@/services/api';
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
    const manualImageUrl = ref('');
    const fileInput = ref(null);
    const importStatus = ref('');
    
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
      performTime: null,
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
    
    // Déclenchement de la boîte de dialogue fichier
    const triggerFileInput = () => {
      fileInput.value.click();
    };

    // Importation depuis URL
    const importFromUrl = async () => {
      if (!recipeUrl.value.trim()) return;
      
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      success.value = false;
      importStatus.value = 'Importation de la recette...';
      
      try {
        const response = await recipeService.importRecipeFromUrl(recipeUrl.value);
        
        if (response && response.data) {
          importStatus.value = 'Importation réussie!';
          
          // Stocker la recette importée dans le store sans optimisation
          if (response.data.id) {
            // Ajouter au store
            recipeStore.addRecipe(response.data);
            
            // Redirection vers la page de la recette avec un paramètre pour afficher l'optimiseur
            setTimeout(() => {
              let redirectTarget;
              if (response.data.slug) {
                redirectTarget = `/recipes/${response.data.slug}?showOptimizer=true`;
              } else {
                redirectTarget = `/recipes/${response.data.id}?showOptimizer=true`;
              }
              
              emit('recipe-created', response.data.slug || response.data.id);
              router.push(redirectTarget);
            }, 1500);
          } else {
            throw new Error("ID de recette manquant dans la réponse");
          }
          
          success.value = true;
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
        
        // Charger la page d'ingrédients
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
        const perPage = 1000; // Nombre d'éléments par page
               
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

    // Recherche d'ingrédients
    const searchFoods = async (query) => {
      // Réinitialiser la pagination et la liste des ingrédients
      currentFoodsPage.value = 1;
      hasMoreFoods.value = true;
      foods.value = [];
      isLoadingMoreFoods.value = true; // Indiquer le début du chargement

      try {
        // Boucle tant qu'il y a des pages à charger
        while (hasMoreFoods.value) {
          await loadNextPageOfFoods(query);
        }
      } catch (err) {
        console.error("Erreur lors de la recherche d'ingrédients", err);
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
                
        // Création de la recette
        const createResponse = await recipeService.createRecipe(payload);
        
        let recipeId = null;
        let recipeSlug = slug;
        
        // Récupération des données renvoyées par l'API
        if (createResponse && createResponse.data) {
          if (typeof createResponse.data === 'string') {
            // Si l'API renvoie un string (le slug) au lieu d'un objet
            recipeSlug = createResponse.data;
          } else {
            // Si l'API renvoie un objet comme prévu
            recipeId = createResponse.data.id;
            recipeSlug = createResponse.data.slug || slug;
          }
        }
        
        // Attendre un peu pour laisser le temps à l'API de finaliser la création
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Récupération explicite et garantie des données de la recette créée
        let recipeData = null;
        
        // Récupérer par ID si disponible
        if (recipeId) {
          try {
            const detailResponse = await recipeService.getById(recipeId);
            if (detailResponse && detailResponse.data) {
              recipeData = detailResponse.data;
            }
          } catch (idErr) {
            console.warn("Impossible de récupérer la recette par ID:", idErr);
          }
        }
        
        // Si pas de recipeData, essayer avec le slug
        if (!recipeData && recipeSlug) {
          try {
            const slugResponse = await recipeService.getBySlug(recipeSlug);
            if (slugResponse && slugResponse.data) {
              recipeData = slugResponse.data;
            }
          } catch (slugErr) {
            console.warn("Impossible de récupérer la recette par slug:", slugErr);
          }
        }
        
        // Mise à jour de l'objet recipe
        if (recipeData) {
          // Si on a récupéré les données complètes
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
      let filtered;
      if (!query) {
        // Si aucune recherche n'est effectuée, retourne une copie triée de la liste complète
        filtered = [...units.value];
      } else {
        const lowerQuery = query.toLowerCase();
        filtered = units.value.filter(unit =>
          unit.name.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Trier en ordre croissant
      filtered.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      
      return filtered;
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
        const response = await referenceService.getFoods({
          page: 1,
          perPage: 1000,  // On charge tous les ingrédients en une seule page
          query: query
        });
        
        if (response.data && Array.isArray(response.data.items)) {
          // Trie alphabétique des ingrédients
          foods.value = response.data.items.sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
          );
        }
      } catch (err) {
        console.error("Erreur lors du chargement des ingrédients", err);
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
      // Affiche le dropdown pour cet ingrédient
      recipe.value.recipeIngredient[index].showFoodDropdown = true;
      
      // Charger la liste qu'une seule fois (si elle ne l'est pas déjà)
      loadFoodsOnce();
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
        // Sans terme, afficher tous les ingrédients chargés
        matches = [...foods.value];
      } else {
        matches = foods.value.filter(food => {
          const foodName = food.name.toLowerCase();
          // On accepte une correspondance exacte, début ou inclusion
          if (foodName === lowerQuery) return true;
          if (foodName.startsWith(lowerQuery)) return true;
          if (foodName.includes(lowerQuery)) return true;
          // Autorise la recherche par mots individuels
          const words = lowerQuery.split(/\s+/);
          return words.every(word => foodName.includes(word));
        });
      }
      
      // Trie par ordre alphabétique ou selon la pertinence
      matches.sort((a, b) => a.name.localeCompare(b.name));
      
      // Optionnel : Tu peux limiter le nombre affiché (ex. 100) pour des raisons de performance
      const limitedMatches = matches.slice(0, 1000);
      
      // Si aucun ingrédient ne correspond exactement et qu'un terme est saisi, propose de créer un nouvel ingrédient
      if (lowerQuery && (limitedMatches.length === 0 || 
          !limitedMatches.some(food => food.name.toLowerCase() === lowerQuery))) {
        limitedMatches.push({
          id: 'new',
          name: `Créer "${query}"`,
          isNewFood: true
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
        } else {
          // Si l'API ne fournit pas de referenceId, laisser Mealie s'en charger
          recipe.value.recipeIngredient[index].referenceId = ""; // ou null, selon ce que l'API attend
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
        summary: '',  // Nouveau champ résumé
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

    // Gérer le drop (glisser-déposer) d'un fichier
    const handleDrop = (event) => {
      const file = event.dataTransfer.files[0];
      if (file) previewFile(file);
    };

    // Gérer le copier-coller (paste) d'une image
    const handlePaste = (event) => {
      const items = event.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) {
          const file = items[i].getAsFile();
          if (file) {
            previewFile(file);
            break;
          }
        }
      }
    };

    // Fonction commune pour afficher l'aperçu d'une image sélectionnée
    const previewFile = (file) => {
      if (!file.type.match('image.*')) {
        alert("Le fichier sélectionné n'est pas une image");
        return;
      }
      imageFile.value = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    // Charger l'image à partir de l'URL saisie
    const loadImageFromUrl = () => {
      if (manualImageUrl.value.trim()) {
        imagePreview.value = manualImageUrl.value.trim();
        imageFile.value = null; // Dans ce cas, aucun fichier n'est sélectionné
      }
    };    

    // Sauvegarde de la recette avec récupération des données et redirection optimisée
    const saveRecipe = async () => {
      
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
        const updateResponse = await recipeService.updateRecipe(recipe.value.id, recipe.value);
        
        // Upload de l'image si présente
        if (imageFile.value) {
          try {
            await recipeService.uploadRecipeImageFixed(recipe.value.slug, imageFile.value);
          } catch (imgErr) {
            console.error("Erreur lors de l'upload de l'image:", imgErr);
            // Continuer malgré l'erreur d'image
          }
        }
        
        // Récupération explicite et garantie des données à jour
        let updatedRecipeData = null;
        
        try {
          // Première tentative avec l'ID
          const updatedResponse = await recipeService.getById(recipe.value.id);
          if (updatedResponse && updatedResponse.data) {
            updatedRecipeData = updatedResponse.data;
          }
        } catch (idErr) {
          console.warn("Impossible de récupérer la recette par ID:", idErr);
          
          // Seconde tentative avec le slug si disponible
          if (recipe.value.slug) {
            try {
              const slugResponse = await recipeService.getBySlug(recipe.value.slug);
              if (slugResponse && slugResponse.data) {
                updatedRecipeData = slugResponse.data;
              }
            } catch (slugErr) {
              console.error("Impossible de récupérer la recette par slug:", slugErr);
            }
          }
        }
        
        // Mettre à jour les données si la récupération a réussi
        if (updatedRecipeData) {
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
          
          // Ajouter une version "complète" de la recette au store
          recipeStore.addRecipe({
            ...recipe.value,
            _detailsLoaded: true  // Marquer les détails comme chargés
          });
          
          // Attendre un peu pour que le store se synchronise
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
      handleDrop,
      handlePaste,
      imageFile,
      imagePreview,
      manualImageUrl,
      fileInput,
      triggerFileInput,
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
      isLoadingMoreFoods,
      hasMoreFoods,
      currentFoodsPage,
      importStatus
    };
  }
};
</script>