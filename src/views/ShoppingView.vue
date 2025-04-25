<template>
  <div class="min-h-screen bg-gray-50 py-6">
    <div class="max-w-4xl mx-auto px-4 sm:px-6">
      <!-- Modal de confirmation pour purger la liste -->
      <div
        v-if="showClearConfirmation"
        class="fixed inset-0 z-50 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <!-- Fond avec effet blur -->
          <div 
            class="fixed inset-0 bg-gray-500 bg-opacity-75 backdrop-blur-sm transition-opacity" 
            aria-hidden="true"
            @click="showClearConfirmation = false"
          ></div>

          <!-- Modal centered -->
          <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <div class="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div>
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  class="h-6 w-6 text-red-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-5">
                <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                  Purger la liste de courses
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer tous les articles de votre liste de courses? 
                    Cette action ne peut pas être annulée.
                  </p>
                </div>
                <div class="mt-4">
                  <div class="flex items-center justify-center">
                    <input 
                      id="keep-checked-items" 
                      v-model="keepCheckedItemsOnClear" 
                      type="checkbox"
                      class="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    >
                    <label
                      for="keep-checked-items"
                      class="ml-2 block text-sm text-gray-700"
                    >
                      Conserver les articles déjà cochés
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3">
              <button 
                type="button"
                class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:text-sm transition duration-150 ease-in-out"
                @click="clearShoppingList"
              >
                Purger la liste
              </button>
              <button 
                type="button"
                class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:text-sm transition duration-150 ease-in-out"
                @click="showClearConfirmation = false"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Header with animated card effect -->
      <div class="mb-6 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div class="px-4 py-5 sm:px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <h1 class="text-2xl font-bold">
              Liste de Courses
            </h1>
            
            <!-- Mobile actions -->
            <div class="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div class="flex space-x-2">
                <button 
                  class="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50 transition duration-150 ease-in-out flex items-center"
                  @click="toggleCompletedItems"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      v-if="showCompleted"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                    <path
                      v-else
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      v-if="!showCompleted"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>{{ showCompleted ? 'Masquer cochés' : 'Tout afficher' }}</span>
                </button>
                <button 
                  v-if="items.length > 0"
                  class="px-3 py-1.5 bg-red-500 rounded-md text-sm font-medium shadow-sm hover:bg-red-600 transition duration-150 ease-in-out flex items-center"
                  @click="showClearConfirmation = true"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Purger
                </button>
              </div>
            </div>
          </div>
        </div>
      
        <!-- View mode tabs with pill design -->
        <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div class="flex justify-center">
            <div class="inline-flex rounded-md shadow-sm p-1 bg-white border">
              <button 
                :class="[
                  'relative px-4 py-2 rounded-md text-sm font-medium focus:outline-none transition-all duration-200 ease-in-out',
                  viewMode === 'category' 
                    ? 'bg-emerald-500 text-white shadow-sm z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                ]"
                @click="viewMode = 'category'"
              >
                <span class="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1.5"
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
                  Par catégorie
                </span>
              </button>
              <button 
                :class="[
                  'relative px-4 py-2 rounded-md text-sm font-medium focus:outline-none transition-all duration-200 ease-in-out',
                  viewMode === 'recipe' 
                    ? 'bg-emerald-500 text-white shadow-sm z-10' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                ]"
                @click="viewMode = 'recipe'"
              >
                <span class="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4 mr-1.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Par recette
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Main content card -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <!-- Loading state -->
        <div
          v-if="loading"
          class="flex flex-col items-center justify-center py-16"
        >
          <svg
            class="animate-spin h-12 w-12 text-emerald-500 mb-4"
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
          <p class="text-gray-500 text-lg">Chargement de votre liste...</p>
        </div>
        
        <!-- Error state -->
        <div
          v-else-if="error"
          class="flex flex-col items-center justify-center py-16 px-4"
        >
          <div class="text-red-500 mb-4 bg-red-50 p-3 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">
            Erreur lors du chargement
          </h2>
          <p class="text-gray-500 mb-6 text-center">
            {{ errorMessage }}
          </p>
          <button 
            class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            @click="loadShoppingList"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Réessayer
            </span>
          </button>
        </div>
        
        <!-- Empty state -->
        <div
          v-else-if="items.length === 0"
          class="flex flex-col items-center justify-center py-16 px-4"
        >
          <div class="bg-emerald-50 p-3 rounded-full text-emerald-500 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-2">Votre liste est vide</h2>
          <p class="text-gray-500 mb-6 text-center">
            Ajoutez des articles manuellement ou générez une liste depuis votre planning de repas.
          </p>
          <button 
            class="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            @click="generateShoppingList"
          >
            <span class="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Générer depuis le planning
            </span>
          </button>
        </div>
        
        <!-- Content - View by category -->
        <div
          v-else-if="viewMode === 'category'"
          class="px-4 py-5 sm:p-6 divide-y divide-gray-100"
        >
          <transition-group 
            tag="div" 
            name="list"
            class="space-y-6"
          >
            <div
              v-for="(groupItems, category) in groupedItems"
              :key="category"
              class="pt-6 first:pt-0"
            >
              <!-- Category header -->
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 rounded-full mr-3 bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <CategoryIcon :category="category" />
                </div>
                <h3 class="font-semibold text-lg text-gray-800">
                  {{ category }}
                  <span class="ml-2 text-xs font-normal text-gray-500">
                    {{ filteredItemsByCategory(category).length }} articles
                  </span>
                </h3>
              </div>
              
              <!-- Category items -->
              <transition-group 
                tag="ul" 
                name="list-item"
                class="divide-y divide-gray-100"
              >
                <li
                  v-for="item in filteredItemsByCategory(category)"
                  :key="item.id"
                  class="py-3 group"
                >
                  <!-- Desktop layout -->
                  <div class="flex items-center group">
                    <div class="relative inline-block">
                      <input 
                        type="checkbox" 
                        :checked="item.checked"
                        class="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors duration-150"
                      >
                      <div 
                        @click="toggleItem(item)"
                        class="absolute inset-0 cursor-pointer z-10"
                      ></div>
                    </div>
                    
                    <div class="ml-3 flex-grow">
                      <p 
                        :class="{'line-through text-gray-400': item.checked, 'text-gray-800': !item.checked}"
                        class="font-medium transition-colors duration-200"
                      >
                        {{ getFoodName(item.food) || item.name }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                      </p>
                    </div>
                    
                    <!-- Recipe badge -->
                    <div
                      v-if="item.recipeId"
                      class="mr-3 px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors duration-150"
                    >
                      {{ getRecipeName(item.recipeId) }}
                    </div>
                    
                    <button
                      class="text-gray-400 hover:text-red-500 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      @click="removeItem(item.id)"
                      aria-label="Supprimer l'article"
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
                </li>
              </transition-group>
            </div>
          </transition-group>
        </div>
        
        <!-- Content - View by recipe -->
        <div
          v-else-if="viewMode === 'recipe'"
          class="px-4 py-5 sm:p-6 divide-y divide-gray-100"
        >
          <!-- No recipe item notification -->
          <div
            v-if="Object.keys(groupedByRecipe).length === 0 && items.length > 0"
            class="bg-blue-50 rounded-lg p-4 mb-6"
          >
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3 flex-1 md:flex md:justify-between">
                <p class="text-sm text-blue-700">
                  Aucun article n'est associé à une recette. Utilisez "Générer depuis le planning" pour créer une liste à partir de vos recettes planifiées.
                </p>
                <p class="mt-3 text-sm md:mt-0 md:ml-6">
                  <button 
                    class="whitespace-nowrap font-medium text-blue-700 hover:text-blue-600 transition duration-150 ease-in-out flex items-center"
                    @click="generateShoppingList"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Générer
                    <span class="sr-only">depuis le planning</span>
                  </button>
                </p>
              </div>
            </div>
          </div>
        
          <!-- Items without recipe -->
          <div
            v-if="itemsWithoutRecipe.length > 0"
            class="pt-6 first:pt-0"
          >
            <div class="flex items-center mb-3">
              <div class="w-8 h-8 rounded-full mr-3 bg-gray-100 flex items-center justify-center text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 class="font-semibold text-lg text-gray-800">
                Ajouts manuels
                <span class="ml-2 text-xs font-normal text-gray-500">
                  {{ filteredItemsWithoutRecipe.length }} articles
                </span>
              </h3>
            </div>
            
            <!-- Manual items -->
            <transition-group 
              tag="ul" 
              name="list-item"
              class="divide-y divide-gray-100"
            >
              <li
                v-for="item in filteredItemsWithoutRecipe"
                :key="item.id"
                class="py-3 group"
              >
                <div class="flex items-center group">
                  <div class="relative inline-block">
                    <input 
                      type="checkbox" 
                      :checked="item.checked"
                      class="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors duration-150"
                    >
                    <div 
                      @click="toggleItem(item)"
                      class="absolute inset-0 cursor-pointer z-10"
                    ></div>
                  </div>
                  
                  <div class="ml-3 flex-grow">
                    <p 
                      :class="{'line-through text-gray-400': item.checked, 'text-gray-800': !item.checked}"
                      class="font-medium transition-colors duration-200"
                    >
                      {{ getFoodName(item.food) || item.name }}
                    </p>
                    <p class="text-sm text-gray-500">
                      {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                    </p>
                  </div>
                  
                  <button
                    class="text-gray-400 hover:text-red-500 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                    @click="removeItem(item.id)"
                    aria-label="Supprimer l'article"
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
              </li>
            </transition-group>
          </div>
          
          <!-- Items grouped by recipe -->
          <transition-group 
            tag="div" 
            name="list"
            class="space-y-6"
          >
            <div
              v-for="(recipeItems, recipeId) in groupedByRecipe"
              :key="recipeId"
              class="pt-6"
            >
            <div class="flex items-center mb-3">
                <div class="w-8 h-8 rounded-full mr-3 bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 class="font-semibold text-lg text-gray-800">
                  {{ getRecipeName(recipeId) }}
                  <span class="ml-2 text-xs font-normal text-gray-500">
                    {{ filterItemsByRecipe(recipeId).length }} ingrédients
                  </span>
                </h3>
              </div>
              
              <!-- Recipe items -->
              <transition-group 
                tag="ul" 
                name="list-item"
                class="divide-y divide-gray-100"
              >
                <li
                  v-for="item in filterItemsByRecipe(recipeId)"
                  :key="item.id"
                  class="py-3 group"
                >
                  <div class="flex items-center group">
                    <div class="relative inline-block">
                      <input 
                        type="checkbox" 
                        :checked="item.checked"
                        class="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors duration-150"
                      >
                      <div 
                        @click="toggleItem(item)"
                        class="absolute inset-0 cursor-pointer z-10"
                      ></div>
                    </div>
                    
                    <div class="ml-3 flex-grow">
                      <p 
                        :class="{'line-through text-gray-400': item.checked, 'text-gray-800': !item.checked}"
                        class="font-medium transition-colors duration-200"
                      >
                        {{ getFoodName(item.food) || item.name }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                      </p>
                    </div>
                    
                    <button
                      class="text-gray-400 hover:text-red-500 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      @click="removeItem(item.id)"
                      aria-label="Supprimer l'article"
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
                </li>
              </transition-group>
            </div>
          </transition-group>
        </div>
        
        <!-- Add item form -->
        <div class="bg-gray-50 px-4 py-5 sm:p-6 border-t border-gray-100">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Ajouter un article
          </h3>
          
          <!-- Mobile form -->
          <form
            class="md:hidden space-y-3"
            @submit.prevent="addNewItem"
          >
            <div>
              <label for="mobile-food-select" class="block text-sm font-medium text-gray-700 mb-1">Aliment</label>
              <select 
                id="mobile-food-select"
                v-model="newItem.foodId"
                class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                required
              >
                <option value="" disabled>Sélectionnez un aliment</option>
                <optgroup 
                  v-for="(foodList, category) in groupedFoods" 
                  :key="category" 
                  :label="category"
                >
                  <option 
                    v-for="food in foodList" 
                    :key="food.id" 
                    :value="food.id"
                  >
                    {{ food.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label for="mobile-quantity-input" class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                <input 
                  id="mobile-quantity-input"
                  v-model.number="newItem.quantity"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="Quantité"
                  class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  required
                >
              </div>
              
              <div>
                <label for="mobile-unit-select" class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                <select 
                  id="mobile-unit-select"
                  v-model="newItem.unitId"
                  class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  required
                >
                  <option value="" disabled>Sélectionnez</option>
                  <option 
                    v-for="unit in units" 
                    :key="unit.id" 
                    :value="unit.id"
                  >
                    {{ unit.abbreviation || unit.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div>
              <label for="mobile-note-input" class="block text-sm font-medium text-gray-700 mb-1">Note (optionnelle)</label>
              <input 
                id="mobile-note-input"
                v-model="newItem.note"
                type="text"
                placeholder="Ex: bio, frais, etc."
                class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              >
            </div>
            
            <button 
              type="submit"
              :disabled="formLoading"
              class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50"
            >
              <svg 
                v-if="formLoading" 
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg 
                v-else
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 mr-1.5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {{ formLoading ? 'Ajout en cours...' : 'Ajouter à la liste' }}
            </button>
          </form>
          
          <!-- Desktop form -->
          <form
            class="hidden md:flex flex-wrap items-end gap-3"
            @submit.prevent="addNewItem"
          >
            <div class="w-full sm:w-auto flex-grow">
              <label for="food-select" class="block text-sm font-medium text-gray-700 mb-1">Aliment</label>
              <select 
                id="food-select"
                v-model="newItem.foodId"
                class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                required
              >
                <option value="" disabled>Sélectionnez un aliment</option>
                <optgroup 
                  v-for="(foodList, category) in groupedFoods" 
                  :key="category" 
                  :label="category"
                >
                  <option 
                    v-for="food in foodList" 
                    :key="food.id" 
                    :value="food.id"
                  >
                    {{ food.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            
            <div class="w-24">
              <label for="quantity-input" class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
              <input 
                id="quantity-input"
                v-model.number="newItem.quantity"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Qté"
                class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                required
              >
            </div>
            
            <div class="w-32">
              <label for="unit-select" class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <select 
                id="unit-select"
                v-model="newItem.unitId"
                class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                required
              >
                <option value="" disabled>Sélectionnez</option>
                <option 
                  v-for="unit in units" 
                  :key="unit.id" 
                  :value="unit.id"
                >
                  {{ unit.name }} {{ unit.abbreviation ? `(${unit.abbreviation})` : '' }}
                </option>
              </select>
            </div>
            
            <div class="w-full sm:w-40">
              <label for="note-input" class="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <input 
                id="note-input"
                v-model="newItem.note"
                type="text"
                placeholder="Ex: bio, frais..."
                class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
              >
            </div>
            
            <button 
              type="submit"
              :disabled="formLoading"
              class="inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out disabled:opacity-50"
            >
              <svg 
                v-if="formLoading" 
                class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg 
                v-else
                xmlns="http://www.w3.org/2000/svg" 
                class="h-5 w-5 mr-1.5" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {{ formLoading ? 'Ajout en cours...' : 'Ajouter' }}
            </button>
          </form>
        </div>
      </div>
      
      <!-- Toast notification -->
      <transition
        enter-active-class="transform ease-out duration-300 transition"
        enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
        leave-active-class="transition ease-in duration-200"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="toast.visible"
          class="fixed bottom-0 right-0 mb-4 mr-4 z-50"
        >
          <div 
            :class="[
              'max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto overflow-hidden',
              toast.type === 'success' ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500'
            ]"
          >
            <div class="p-4">
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <svg 
                    v-if="toast.type === 'success'"
                    class="h-6 w-6 text-emerald-500" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <svg 
                    v-else
                    class="h-6 w-6 text-red-500" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div class="ml-3 w-0 flex-1 pt-0.5">
                  <p class="text-sm font-medium text-gray-900">
                    {{ toast.message }}
                  </p>
                </div>
                <div class="ml-4 flex-shrink-0 flex">
                  <button
                    @click="closeToast"
                    class="rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                  >
                    <span class="sr-only">Fermer</span>
                    <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { shoppingService, recipeService, referenceService } from '@/services/api';
import axiosInstance from '@/services/axiosInstance';

// Composant d'icône de catégorie sans JSX
const CategoryIcon = {
  props: {
    category: {
      type: String,
      required: true
    }
  },
  render() {
    // Fonction pour créer un SVG avec path
    const createSvgIcon = (pathD) => {
      return h('svg', {
        xmlns: 'http://www.w3.org/2000/svg',
        class: 'h-4 w-4',
        fill: 'none',
        viewBox: '0 0 24 24',
        stroke: 'currentColor'
      }, [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: pathD
        })
      ]);
    };
    
    // Icônes par catégorie
    const iconPaths = {
      'Fruits et Légumes': 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'Viandes et Poissons': 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
      'Produits Laitiers': 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
      'Épicerie': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      'Boissons': 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    };

    // Icône par défaut si la catégorie n'est pas reconnue
    const defaultPath = 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z';
    
    return createSvgIcon(iconPaths[this.category] || defaultPath);
  }
};

export default {
  name: 'ShoppingList',
  components: {
    CategoryIcon
  },
  setup() {
    const router = useRouter();
    
    // ======== État ========
    const items = ref([]);
    const foods = ref([]);
    const units = ref([]);
    const mainListId = ref(null); // Stocker l'ID de la liste principale
    const recipes = ref({});
    const loading = ref(true);
    const formLoading = ref(false);
    const error = ref(false);
    const errorMessage = ref('');
    const showCompleted = ref(true);
    const viewMode = ref('category');
    const showClearConfirmation = ref(false);
    const keepCheckedItemsOnClear = ref(true);
    
    // État pour le toast
    const toast = ref({
      visible: false,
      message: '',
      type: 'success',
      timeout: null
    });
    
    // Formulaire pour nouvel article
    const newItem = ref({
      foodId: '',
      quantity: 1,
      unitId: '',
      note: ''
    });
    
    // ======== Données calculées ========
    // Grouper les aliments par catégorie
    const groupedFoods = computed(() => {
      const grouped = {};
      
      foods.value.forEach(food => {
        // Déterminer la catégorie de l'aliment
        let category = 'Divers';
        
        if (food.label && food.label.name) {
          category = food.label.name;
        }
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        
        grouped[category].push(food);
      });
      
      return grouped;
    });
    
    // Groupement des articles par catégorie
    const groupedItems = computed(() => {
      const grouped = {};
      
      items.value.forEach(item => {
        // Déterminer la catégorie
        let category = 'Divers';
        
        if (item.label && item.label.name) {
          category = item.label.name;
        } else if (item.food && item.food.label && item.food.label.name) {
          category = item.food.label.name;
        }
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        
        grouped[category].push(item);
      });
      
      return grouped;
    });
    
    // Articles sans recette associée
    const itemsWithoutRecipe = computed(() => 
      items.value.filter(item => !item.recipeId)
    );
    
    // Filtrage des articles sans recette selon l'option d'affichage
    const filteredItemsWithoutRecipe = computed(() => {
      if (showCompleted.value) {
        return itemsWithoutRecipe.value;
      }
      return itemsWithoutRecipe.value.filter(item => !item.checked);
    });
    
    // Groupement des articles par recette
    const groupedByRecipe = computed(() => {
      const grouped = {};
      
      items.value.forEach(item => {
        // Déterminer l'ID de recette
        let recipeId = item.recipeId;
        
        if (!recipeId && item.recipeReferences && item.recipeReferences.length > 0) {
          recipeId = item.recipeReferences[0].recipeId;
        } else if (!recipeId) {
          if (item.recipe && item.recipe.id) {
            recipeId = item.recipe.id;
          } else if (item.recipeReference) {
            if (typeof item.recipeReference === 'string') {
              recipeId = item.recipeReference;
            } else if (typeof item.recipeReference === 'object' && item.recipeReference.id) {
              recipeId = item.recipeReference.id;
            }
          } else if (item.extras && item.extras.recipeId) {
            recipeId = item.extras.recipeId;
          }
        }
        
        if (recipeId) {
          if (!grouped[recipeId]) {
            grouped[recipeId] = [];
          }
          grouped[recipeId].push({...item, recipeId});
        }
      });
      
      return grouped;
    });
    
    // ======== Fonctions de filtrage ========
    // Filtrage par recette avec option de visibilité des complétés
    const filterItemsByRecipe = (recipeId) => {
      const recipeItems = items.value.filter(item => {
        if (item.recipeId === recipeId) return true;
        if (item.recipeReferences && item.recipeReferences.length > 0) {
          return item.recipeReferences.some(ref => ref.recipeId === recipeId);
        }
        return false;
      });
      
      if (showCompleted.value) {
        return recipeItems;
      }
      
      return recipeItems.filter(item => !item.checked);
    };
    
    // Filtrage par catégorie avec option de visibilité des complétés
    const filteredItemsByCategory = (category) => {
      if (showCompleted.value) {
        return groupedItems.value[category] || [];
      }
      return (groupedItems.value[category] || []).filter(item => !item.checked);
    };
    
    // ======== Fonctions utilitaires ========
    // Extraction du nom d'un aliment à partir de différents formats
    const getFoodName = (food) => {
      if (!food) return 'Article sans nom';
      
      if (typeof food === 'string') {
        if (food.includes('"name"')) {
          const match = food.match(/"name"\s*:\s*"([^"]+)"/);
          if (match && match[1]) return match[1];
        }
        return food;
      }
      
      if (typeof food === 'object' && food !== null) {
        return food.name || 'Article sans nom';
      }
      
      return 'Article sans nom';
    };
    
    // Extraction du nom d'une unité à partir de différents formats
    const getUnitDisplay = (unit) => {
      if (!unit) return 'unité';
      
      if (typeof unit === 'string') {
        if (unit.includes('"name"')) {
          const match = unit.match(/"name"\s*:\s*"([^"]+)"/);
          if (match && match[1]) return match[1];
        }
        return unit;
      }
      
      if (typeof unit === 'object' && unit !== null) {
        return unit.abbreviation || unit.name || 'unité';
      }
      
      return 'unité';
    };
    
    // Récupération du nom d'une recette à partir de son ID
    const getRecipeName = (recipeId) => {
      if (!recipeId) return 'Recette inconnue';
      
      if (recipes.value[recipeId]) {
        return recipes.value[recipeId].name || `Recette #${recipeId}`;
      }
      
      // Récupérer l'info en arrière-plan
      fetchRecipeInfo(recipeId);
      return `Recette #${recipeId}`;
    };
    
          // Fonctions pour le toast
    const showToast = (message, type = 'success') => {
      // Effacer le timeout précédent si existant
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
      }
      
      // Définir le nouveau toast
      toast.value = {
        visible: true,
        message,
        type,
        timeout: setTimeout(() => {
          closeToast();
        }, 3000)
      };
    };
    
    // Fonction pour fermer le toast
    const closeToast = () => {
      toast.value.visible = false;
      if (toast.value.timeout) {
        clearTimeout(toast.value.timeout);
        toast.value.timeout = null;
      }
    };
    
    // ======== Fonctions d'API ========
    // Récupération des informations sur une recette
    const fetchRecipeInfo = async (recipeId) => {
      if (!recipeId || recipes.value[recipeId]) return;
      
      try {
        const response = await recipeService.getById(recipeId);
        if (response && response.data) {
          recipes.value[recipeId] = response.data;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de la recette ${recipeId}`, error);
        // Fallback pour éviter des erreurs d'UI
        recipes.value[recipeId] = { name: `Recette #${recipeId}` };
      }
    };
    
    // Chargement de la liste de courses
    const loadShoppingList = async () => {
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      
      try {
        // 1. Récupérer la liste principale
        const listResponse = await shoppingService.getMainShoppingList();
        const mainList = listResponse.data.items?.[0];
        
        if (!mainList || !mainList.id) {
          throw new Error('Aucune liste de courses trouvée');
        }
        
        // Stocker l'ID de la liste principale
        mainListId.value = mainList.id;
        
        // 2. Récupérer les articles de la liste
        const response = await shoppingService.getShoppingList(mainList.id);
        
        // Vérifier que la réponse n'est pas une page HTML
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          throw new Error('Le serveur a renvoyé une page HTML au lieu des données JSON attendues.');
        }
        
        // Extraire les données avec gestion de différentes structures possibles
        let itemsData = [];
        
        if (Array.isArray(response.data)) {
          itemsData = response.data;
        } else if (response.data && typeof response.data === 'object') {
          if (response.data.listItems) {
            itemsData = response.data.listItems;
          } else if (Array.isArray(response.data.items)) {
            itemsData = response.data.items;
          } else if (response.data.data && Array.isArray(response.data.data.items)) {
            itemsData = response.data.data.items;
          } else {
            // Recherche de tableau dans la réponse
            const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              itemsData = possibleArrays[0];
            }
          }
        }
        
        if (itemsData.length === 0) {
          console.warn('Aucun élément trouvé dans la réponse:', response.data);
        }
        
        // Stocker les articles
        items.value = itemsData;
        
        // 3. Charger la liste des aliments
        await loadFoods();
        
        // 4. Charger la liste des unités
        await loadUnits();
        
        // Précharger les informations des recettes référencées
        const recipeIds = new Set();
        
        items.value.forEach(item => {
          // Extraire les IDs de recettes des références
          if (item.recipeReferences && Array.isArray(item.recipeReferences)) {
            item.recipeReferences.forEach(ref => {
              if (ref.recipeId) recipeIds.add(ref.recipeId);
            });
          }
          
          // Cas 2: objet recipe avec ID
          if (item.recipe && item.recipe.id) {
            recipeIds.add(item.recipe.id);
          }
          
          // Cas 3: recipeId direct
          if (item.recipeId) {
            recipeIds.add(item.recipeId);
          }
        });
        
        // Précharger les infos des recettes
        for (const recipeId of recipeIds) {
          fetchRecipeInfo(recipeId);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement de la liste de courses', error);
        error.value = true;
        errorMessage.value = error.message || 'Impossible de charger la liste de courses.';
      } finally {
        loading.value = false;
      }
    };
    
    // Chargement des aliments
    const loadFoods = async () => {
      try {
        const response = await referenceService.getFoods({ perPage: 500 });
        
        if (response && response.data) {
          // Extraire les aliments selon la structure de la réponse
          if (Array.isArray(response.data)) {
            foods.value = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            foods.value = response.data.items;
          }
        } else {
          console.warn('Format de réponse inattendu pour les aliments:', response);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des aliments', error);
        showToast('Erreur lors du chargement des aliments', 'error');
      }
    };
    
    // Chargement des unités
    const loadUnits = async () => {
      try {
        const response = await referenceService.getUnits();
        
        if (response && response.data) {
          // Extraire les unités selon la structure de la réponse
          if (Array.isArray(response.data)) {
            units.value = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            units.value = response.data.items;
          }
        } else {
          console.warn('Format de réponse inattendu pour les unités:', response);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des unités', error);
        showToast('Erreur lors du chargement des unités', 'error');
      }
    };
    
    // ======== Fonctions d'interaction ========
    // Basculer l'état coché/non-coché d'un article 
    const toggleItem = async (item) => {
      try {
        // Mise à jour optimiste de l'interface
        const previousState = item.checked;
        item.checked = !item.checked;
        
        try {
          // Créer une copie complète de l'article avec l'état mis à jour
          // S'assurer que toutes les propriétés nécessaires sont incluses
          const updatedItem = {
            ...item,
            checked: item.checked
          };
          
          // S'assurer que shoppingListId est présent
          if (!updatedItem.shoppingListId && mainListId.value) {
            updatedItem.shoppingListId = mainListId.value;
          }
          
          // Vérifier et consolider les informations d'aliment si nécessaire
          if (updatedItem.food && typeof updatedItem.food === 'object') {
            // S'assurer que l'ID de l'aliment est correctement défini
            if (updatedItem.food.id) {
              updatedItem.foodId = updatedItem.food.id;
            }
          }
          
          // Envoyer l'article mis à jour à l'API
          await axiosInstance.put(`/households/shopping/items`, [updatedItem]);
          
          // La mise à jour a réussi, pas besoin de recharger toute la liste
        } catch (apiError) {
          // Retour à l'état précédent en cas d'erreur
          console.error('Erreur lors de la mise à jour de l\'article', apiError);
          item.checked = previousState;
          
          showToast('Erreur lors de la mise à jour de l\'article', 'error');
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'article', error);
      }
    };
    
    // Supprimer un article
    const removeItem = async (itemId) => {
      try {
        // Mise à jour optimiste de l'interface
        const removedItem = items.value.find(item => item.id === itemId);
        const removedIndex = items.value.findIndex(item => item.id === itemId);
        items.value = items.value.filter(item => item.id !== itemId);
        
        try {
          // Utiliser l'endpoint /households/shopping/items/{itemId} directement
          await axiosInstance.delete(`/households/shopping/items/${itemId}`);
          
          showToast('Article supprimé', 'success');
        } catch (apiError) {
          // Retour à l'état précédent en cas d'erreur
          console.error('Erreur lors de la suppression de l\'article', apiError);
          showToast('Erreur lors de la suppression de l\'article', 'error');
          
          if (removedItem && removedIndex !== -1) {
            items.value.splice(removedIndex, 0, removedItem);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'article', error);
      }
    };
    
    // Ajouter un nouvel article avec le bon format d'API
    const addNewItem = async () => {
      if (!newItem.value.foodId || !newItem.value.unitId) {
        showToast('Veuillez sélectionner un aliment et une unité', 'error');
        return;
      }
      
      formLoading.value = true;
      
      try {
        // Vérifier qu'on a bien l'ID de la liste
        if (!mainListId.value) {
          const listResponse = await shoppingService.getMainShoppingList();
          mainListId.value = listResponse.data.items?.[0]?.id;
          
          if (!mainListId.value) {
            throw new Error('Aucune liste de courses trouvée');
          }
        }
        
        // Récupérer l'aliment et l'unité sélectionnés
        const selectedFood = foods.value.find(f => f.id === newItem.value.foodId);
        const selectedUnit = units.value.find(u => u.id === newItem.value.unitId);
        
        if (!selectedFood || !selectedUnit) {
          throw new Error('Aliment ou unité invalide');
        }
        
        // Construire le payload au format attendu
        const newItemPayload = {
          id: "", // L'API générera un ID
          shoppingListId: mainListId.value,
          checked: false,
          position: 0, // L'API ajustera ça
          isFood: true,
          quantity: newItem.value.quantity,
          note: newItem.value.note || "",
          labelId: selectedFood.labelId || "",
          unitId: selectedUnit.id,
          foodId: selectedFood.id,
          unit: selectedUnit,
          food: selectedFood,
          label: selectedFood.label
        };
        
        // Appeler l'API avec le bon endpoint et format
        const response = await axiosInstance.post(`/households/shopping/items/create-bulk`, [newItemPayload]);
        
        // Mettre à jour la liste localement
        if (response.data) {
          // Si la réponse contient l'item créé, l'ajouter à la liste
          if (Array.isArray(response.data) && response.data[0]) {
            items.value.push(response.data[0]);
            showToast('Article ajouté à la liste', 'success');
          } else {
            // Sinon recharger toute la liste
            await loadShoppingList();
            showToast('Article ajouté à la liste', 'success');
          }
        }
        
        // Réinitialiser le formulaire
        newItem.value = {
          foodId: '',
          quantity: 1,
          unitId: '',
          note: ''
        };
        
      } catch (error) {
        console.error('Erreur lors de l\'ajout de l\'article', error);
        showToast('Erreur lors de l\'ajout de l\'article', 'error');
      } finally {
        formLoading.value = false;
      }
    };
    
    // Basculer l'affichage des articles complétés
    const toggleCompletedItems = () => {
      showCompleted.value = !showCompleted.value;
    };
    
    // Purger la liste selon les options choisies
    const clearShoppingList = async () => {
      try {
        loading.value = true;
        const itemsToRemove = keepCheckedItemsOnClear.value
          ? items.value.filter(item => !item.checked) // Uniquement les articles non cochés
          : items.value; // Tous les articles
        
        // Si aucun article à supprimer, fermer simplement la modal
        if (itemsToRemove.length === 0) {
          showClearConfirmation.value = false;
          return;
        }
        
        // Mise à jour optimiste de l'interface
        if (keepCheckedItemsOnClear.value) {
          // Conserver uniquement les articles cochés
          items.value = items.value.filter(item => item.checked);
        } else {
          // Vider complètement la liste
          items.value = [];
        }
        
        // Fermer la modal de confirmation
        showClearConfirmation.value = false;
        
        // Supprimer les articles via l'API
        const itemIds = itemsToRemove.map(item => item.id);
        
        for (const itemId of itemIds) {
          try {
            // Utiliser l'endpoint directement
            await axiosInstance.delete(`/households/shopping/items/${itemId}`);
          } catch (error) {
            console.error(`Erreur lors de la suppression de l'article ${itemId}:`, error);
          }
        }
        
        showToast(
          keepCheckedItemsOnClear.value
            ? 'Articles non cochés supprimés'
            : 'Liste entièrement vidée',
          'success'
        );
      } catch (error) {
        console.error('Erreur lors de la purge de la liste de courses:', error);
        error.value = true;
        errorMessage.value = 'Erreur lors de la purge de la liste de courses. Veuillez réessayer.';
        showToast('Erreur lors de la purge de la liste', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Générer la liste depuis le planning de repas
    const generateShoppingList = async () => {
      loading.value = true;
      
      try {
        // 1. Récupérer les recettes du planning
        const today = new Date();
        const startDate = formatDate(today);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        const formattedEndDate = formatDate(endDate);
        
        // Appeler le service pour générer la liste
        await shoppingService.generateShoppingListFromMealPlan(startDate, formattedEndDate);
        
        // Recharger la liste mise à jour
        await loadShoppingList();
        
        showToast('Liste générée à partir du planning', 'success');
      } catch (error) {
        console.error('Erreur lors de la génération de la liste', error);
        
        if (error.response) {
          console.error('Détails de l\'erreur API:', {
            status: error.response.status,
            data: error.response.data
          });
        }
        
        error.value = true;
        errorMessage.value = error.message || 'Impossible de générer la liste de courses.';
        showToast('Erreur lors de la génération de la liste', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Utilitaire pour formater la date en YYYY-MM-DD
    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    // Initialisation
    onMounted(async () => {
      await loadShoppingList();
    });
    
    // Exposer les données et méthodes au template
    return {
      // État
      items,
      foods,
      units,
      loading,
      formLoading,
      error,
      errorMessage,
      showCompleted,
      viewMode,
      newItem,
      showClearConfirmation,
      keepCheckedItemsOnClear,
      toast,
      mainListId,
      
      // Données calculées
      groupedItems,
      groupedFoods,
      groupedByRecipe,
      itemsWithoutRecipe,
      filteredItemsWithoutRecipe,
      
      // Méthodes de filtrage
      filteredItemsByCategory,
      filterItemsByRecipe,
      
      // Utilitaires
      getFoodName,
      getUnitDisplay,
      getRecipeName,
      
      // Interactions
      toggleItem,
      removeItem,
      addNewItem,
      toggleCompletedItems,
      loadShoppingList,
      generateShoppingList,
      clearShoppingList,
      closeToast,
      
      // Navigation
      router
    };
  }
}
</script>

<style scoped>
/* Animations pour les transitions de liste */
.list-enter-active,
.list-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.list-item-enter-active, 
.list-item-leave-active {
  transition: all 0.3s ease;
}
.list-item-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>