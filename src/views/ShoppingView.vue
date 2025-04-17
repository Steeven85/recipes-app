<template>
  <div>
    <!-- Modal de confirmation pour purger la liste -->
    <div v-if="showClearConfirmation" class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <!-- Fond semi-transparent -->
        <div 
          class="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          @click="showClearConfirmation = false"
        >
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <!-- Modal -->
        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div class="sm:flex sm:items-start">
              <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 class="text-lg leading-6 font-medium text-gray-900">
                  Purger la liste de courses
                </h3>
                <div class="mt-2">
                  <p class="text-sm text-gray-500">
                    Êtes-vous sûr de vouloir supprimer tous les articles de votre liste de courses ? 
                    Cette action ne peut pas être annulée.
                  </p>
                </div>
                <div class="mt-2">
                  <div class="flex items-center">
                    <input 
                      id="keep-checked-items" 
                      type="checkbox" 
                      v-model="keepCheckedItemsOnClear"
                      class="h-4 w-4 text-emerald-600 border-gray-300 rounded"
                    />
                    <label for="keep-checked-items" class="ml-2 block text-sm text-gray-700">
                      Conserver les articles déjà cochés
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button 
              @click="clearShoppingList"
              class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Purger la liste
            </button>
            <button 
              @click="showClearConfirmation = false"
              class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- En-tête avec contrôles adaptés au mobile -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Liste de Courses</h1>
      
      <!-- Contrôles version mobile (empilés verticalement) -->
      <div class="md:hidden space-y-2">
        <!-- Vue par catégorie / recette (boutons plus grands) -->
        <div class="border rounded-lg overflow-hidden w-full">
          <button 
            @click="viewMode = 'category'"
            :class="[
              'px-4 py-3 w-1/2 font-medium',
              viewMode === 'category' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'
            ]"
          >
            <span class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Catégories
            </span>
          </button>
          <button 
            @click="viewMode = 'recipe'"
            :class="[
              'px-4 py-3 w-1/2 font-medium',
              viewMode === 'recipe' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700'
            ]"
          >
            <span class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Recettes
            </span>
          </button>
        </div>
        
        <!-- Barre d'actions (flex horizontal) -->
        <div class="flex space-x-2">
          <button 
            @click="toggleCompletedItems"
            class="flex-1 px-4 py-3 border rounded-lg flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {{ showCompleted ? 'Masquer les articles cochés' : 'Afficher les articles cochés' }}
          </button>
          
          <button 
            v-if="items.length > 0"
            @click="showClearConfirmation = true"
            class="flex-1 px-4 py-3 border rounded-lg bg-red-50 text-red-700 flex items-center justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Purger
          </button>
        </div>
      </div>
      
      <!-- Contrôles version desktop (flex horizontal) -->
      <div class="hidden md:flex md:space-x-2">
        <!-- Vue par catégorie / recette -->
        <div class="border rounded-lg overflow-hidden">
          <button 
            @click="viewMode = 'category'"
            :class="[
              'px-4 py-2 border-r',
              viewMode === 'category' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            Par catégorie
          </button>
          <button 
            @click="viewMode = 'recipe'"
            :class="[
              'px-4 py-2',
              viewMode === 'recipe' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            Par recette
          </button>
        </div>
        <button 
          @click="toggleCompletedItems"
          class="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {{ showCompleted ? 'Masquer complétés' : 'Afficher complétés' }}
        </button>
        <button 
          v-if="items.length > 0"
          @click="showClearConfirmation = true"
          class="px-4 py-2 border rounded-lg bg-red-50 hover:bg-red-100 text-red-700 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Purger la liste
        </button>
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-4 md:p-6">
      <!-- État de chargement -->
      <div v-if="loading" class="flex justify-center py-12">
        <svg class="animate-spin h-10 w-10 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      
      <!-- État d'erreur -->
      <div v-else-if="error" class="text-center py-8">
        <div class="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p class="text-lg font-medium">Erreur lors du chargement de la liste</p>
        <p class="text-gray-500 mb-4">{{ errorMessage }}</p>
        <button 
          @click="loadShoppingList"
          class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Réessayer
        </button>
      </div>
      
      <!-- Contenu principal -->
      <div v-else>
        <!-- Liste vide -->
        <div v-if="items.length === 0" class="text-center py-12">
          <p class="text-gray-500">Votre liste de courses est vide.</p>
          <div class="flex flex-col items-center gap-2 mt-4">
            <button 
              @click="generateShoppingList"
              class="px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 w-full md:w-auto"
            >
              Générer depuis le planning
            </button>
          </div>
        </div>
        
        <!-- Vue par catégorie -->
        <div v-else-if="viewMode === 'category'" class="mt-2">
          <div v-for="(groupItems, category) in groupedItems" :key="category" class="mb-6">
            <h3 class="font-medium text-lg mb-2 text-gray-700 border-b pb-1">{{ category }}</h3>
            
            <div v-for="item in filteredItemsByCategory(category)" :key="item.id" class="py-3 border-b">
              <!-- Version mobile (flex-col) -->
              <div class="md:hidden flex items-start">
                <div class="flex-shrink-0 mt-1">
                  <input 
                    type="checkbox" 
                    :checked="item.checked"
                    @change="toggleItem(item)"
                    class="h-6 w-6 text-emerald-600 rounded"
                  />
                </div>
                
                <div class="ml-3 flex-grow">
                  <div class="flex justify-between mb-1">
                    <p :class="{'line-through text-gray-400': item.checked}" class="font-medium">
                      {{ getFoodName(item.food) || item.name }}
                    </p>
                    
                    <button @click="removeItem(item.id)" class="text-red-500 p-1 -mt-1 -mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <div class="flex justify-between items-center">
                    <p class="text-sm text-gray-500">
                      {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                    </p>
                    
                    <!-- Badge de recette -->
                    <div v-if="item.recipeId" class="px-2 py-1 text-xs bg-gray-100 rounded text-gray-600">
                      {{ getRecipeName(item.recipeId) }}
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Version desktop (flex-row) -->
              <div class="hidden md:flex md:items-center">
                <input 
                  type="checkbox" 
                  :checked="item.checked"
                  @change="toggleItem(item)"
                  class="h-5 w-5 text-emerald-600 rounded"
                />
                
                <div class="ml-3 flex-grow">
                  <p :class="{'line-through text-gray-400': item.checked}">
                    {{ getFoodName(item.food) || item.name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                  </p>
                </div>
                
                <!-- Afficher la recette source si disponible -->
                <div v-if="item.recipeId" class="mr-2 px-2 py-1 text-xs bg-gray-100 rounded text-gray-600">
                  {{ getRecipeName(item.recipeId) }}
                </div>
                
                <button @click="removeItem(item.id)" class="text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Vue par recette -->
        <div v-else-if="viewMode === 'recipe'" class="mt-2">
          <!-- Message d'aide si aucun article n'est lié à une recette -->
          <div v-if="Object.keys(groupedByRecipe).length === 0 && items.length > 0" class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div class="flex flex-col md:flex-row md:items-start">
              <div class="flex-shrink-0 mb-3 md:mb-0 md:mt-1">
                <svg class="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="md:ml-3">
                <p class="text-sm text-blue-700">
                  Aucun article n'est associé à une recette. Pour voir la liste par recette, utilisez d'abord "Générer depuis le planning" pour créer une liste à partir de vos recettes planifiées.
                </p>
                <div class="mt-2 flex flex-col sm:flex-row gap-2">
                  <button 
                    @click="generateShoppingList"
                    class="px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 text-blue-800 rounded"
                  >
                    Générer depuis le planning
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Items sans recette liée -->
          <div v-if="itemsWithoutRecipe.length > 0" class="mb-6">
            <h3 class="font-medium text-lg mb-2 text-gray-700 border-b pb-1">Ajouts manuels</h3>
            
            <div v-for="item in filteredItemsWithoutRecipe" :key="item.id" class="py-3 border-b">
              <!-- Version mobile (flex-col) -->
              <div class="md:hidden flex items-start">
                <div class="flex-shrink-0 mt-1">
                  <input 
                    type="checkbox" 
                    :checked="item.checked"
                    @change="toggleItem(item)"
                    class="h-6 w-6 text-emerald-600 rounded"
                  />
                </div>
                
                <div class="ml-3 flex-grow">
                  <div class="flex justify-between mb-1">
                    <p :class="{'line-through text-gray-400': item.checked}" class="font-medium">
                      {{ getFoodName(item.food) || item.name }}
                    </p>
                    
                    <button @click="removeItem(item.id)" class="text-red-500 p-1 -mt-1 -mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <p class="text-sm text-gray-500">
                    {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                  </p>
                </div>
              </div>
              
              <!-- Version desktop (flex-row) -->
              <div class="hidden md:flex md:items-center">
                <input 
                  type="checkbox" 
                  :checked="item.checked"
                  @change="toggleItem(item)"
                  class="h-5 w-5 text-emerald-600 rounded"
                />
                
                <div class="ml-3 flex-grow">
                  <p :class="{'line-through text-gray-400': item.checked}">
                    {{ getFoodName(item.food) || item.name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                  </p>
                </div>
                
                <button @click="removeItem(item.id)" class="text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <!-- Items groupés par recette -->
          <div v-for="(recipeItems, recipeId) in groupedByRecipe" :key="recipeId" class="mb-6">
            <h3 class="font-medium text-lg mb-2 text-gray-700 border-b pb-1 flex flex-col md:flex-row md:items-center">
              <span>{{ getRecipeName(recipeId) }}</span>
              <!-- Badge pour indiquer le nombre d'items -->
              <span class="mt-1 md:mt-0 md:ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-800 rounded-full inline-block">
                {{ filterItemsByRecipe(recipeId).length }} ingrédient(s)
              </span>
            </h3>
            
            <div v-for="item in filterItemsByRecipe(recipeId)" :key="item.id" class="py-3 border-b">
              <!-- Version mobile (flex-col) -->
              <div class="md:hidden flex items-start">
                <div class="flex-shrink-0 mt-1">
                  <input 
                    type="checkbox" 
                    :checked="item.checked"
                    @change="toggleItem(item)"
                    class="h-6 w-6 text-emerald-600 rounded"
                  />
                </div>
                
                <div class="ml-3 flex-grow">
                  <div class="flex justify-between mb-1">
                    <p :class="{'line-through text-gray-400': item.checked}" class="font-medium">
                      {{ getFoodName(item.food) || item.name }}
                    </p>
                    
                    <button @click="removeItem(item.id)" class="text-red-500 p-1 -mt-1 -mr-1">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  <p class="text-sm text-gray-500">
                    {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                  </p>
                </div>
              </div>
              
              <!-- Version desktop (flex-row) -->
              <div class="hidden md:flex md:items-center">
                <input 
                  type="checkbox" 
                  :checked="item.checked"
                  @change="toggleItem(item)"
                  class="h-5 w-5 text-emerald-600 rounded"
                  />
                
                <div class="ml-3 flex-grow">
                  <p :class="{'line-through text-gray-400': item.checked}">
                    {{ getFoodName(item.food) || item.name }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                  </p>
                </div>
                
                <button @click="removeItem(item.id)" class="text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Formulaire d'ajout d'article adapté au mobile -->
        <div class="mt-6">
          <h3 class="font-medium text-lg mb-3">Ajouter un article</h3>
          
          <!-- Version mobile (empilé verticalement) -->
          <form @submit.prevent="addNewItem" class="md:hidden flex flex-col space-y-3">
            <input 
              v-model="newItem.name"
              type="text"
              placeholder="Nouvel article"
              class="w-full border rounded-lg px-3 py-3 text-base"
              required
            />
            
            <div class="flex space-x-2">
              <input 
                v-model.number="newItem.quantity"
                type="number"
                placeholder="Qté"
                class="w-1/3 border rounded-lg px-3 py-3 text-base"
                min="1"
                required
              />
              <select 
                v-model="newItem.unit"
                class="w-2/3 border rounded-lg px-3 py-3 text-base"
              >
                <option value="unité">unité</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="ml">ml</option>
                <option value="L">L</option>
              </select>
            </div>
            
            <select 
              v-model="newItem.category"
              class="w-full border rounded-lg px-3 py-3 text-base"
            >
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            
            <button 
              type="submit"
              class="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 text-base font-medium"
            >
              Ajouter
            </button>
          </form>
          
          <!-- Version desktop (flex row) -->
          <form @submit.prevent="addNewItem" class="hidden md:flex md:flex-wrap md:gap-2">
            <input 
              v-model="newItem.name"
              type="text"
              placeholder="Nouvel article"
              class="flex-grow border rounded-lg px-3 py-2 min-w-[200px]"
              required
            />
            <input 
              v-model.number="newItem.quantity"
              type="number"
              placeholder="Qté"
              class="w-20 border rounded-lg px-3 py-2"
              min="1"
              required
            />
            <select 
              v-model="newItem.unit"
              class="border rounded-lg px-3 py-2"
            >
              <option value="unité">unité</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
            </select>
            <select 
              v-model="newItem.category"
              class="border rounded-lg px-3 py-2"
            >
              <option v-for="category in categories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
            <button 
              type="submit"
              class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
            >
              Ajouter
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { shoppingService, recipeService } from '../services/api';
import axiosInstance from '../services/axiosInstance';

export default {
  setup() {
    const router = useRouter();
    const items = ref([]);
    const recipes = ref({});  // Pour stocker les infos des recettes
    const loading = ref(true);
    const error = ref(false);
    const errorMessage = ref('');
    const showCompleted = ref(true);
    const viewMode = ref('category'); // 'category' ou 'recipe'
    const showClearConfirmation = ref(false);
    const keepCheckedItemsOnClear = ref(true); // Option pour conserver les articles cochés lors de la purge
    
    const newItem = ref({
      name: '',
      quantity: 1,
      unit: 'unité',
      category: 'Divers',
      checked: false
    });

    // Catégories prédéfinies pour organiser les articles
    const categories = [
      'Fruits et Légumes',
      'Viandes et Poissons',
      'Produits Laitiers',
      'Épicerie',
      'Boissons',
      'Divers'
    ];

    const categoryKeywords = {
      'Fruits et Légumes': ['pomme', 'banane', 'carotte', 'tomate', 'salade', 'fruit', 'légume'],
      'Viandes et Poissons': ['poulet', 'boeuf', 'saumon', 'thon', 'viande', 'poisson'],
      'Produits Laitiers': ['lait', 'fromage', 'yaourt', 'beurre', 'crème'],
      'Épicerie': ['riz', 'pâtes', 'farine', 'sucre', 'sel', 'huile'],
      'Boissons': ['eau', 'jus', 'vin', 'bière', 'soda']
    };

    onMounted(async () => {
      await loadShoppingList();
    });

    // Fonction pour extraire le nom d'un aliment
    const getFoodName = (food) => {
      if (!food) return 'Article sans nom';
      
      if (typeof food === 'string') {
        if (food.includes('"name"')) {
          const match = food.match(/"name"\s*:\s*"([^"]+)"/);
          if (match && match[1]) {
            return match[1];
          }
        }
        return food;
      }
      
      if (typeof food === 'object' && food !== null) {
        return food.name || 'Article sans nom';
      }
      
      return 'Article sans nom';
    };

    // Fonction pour extraire le nom d'une unité
    const getUnitDisplay = (unit) => {
      if (!unit) return 'unité';
      
      if (typeof unit === 'string') {
        if (unit.includes('"name"')) {
          const match = unit.match(/"name"\s*:\s*"([^"]+)"/);
          if (match && match[1]) {
            return match[1];
          }
        }
        return unit;
      }
      
      if (typeof unit === 'object' && unit !== null) {
        return unit.name || 'unité';
      }
      
      return 'unité';
    };

    // Fonction pour récupérer le nom d'une recette à partir de son ID
    const getRecipeName = (recipeId) => {
      if (!recipeId) return 'Recette inconnue';
      
      // Si nous avons déjà les informations de la recette
      if (recipes.value[recipeId]) {
        return recipes.value[recipeId].name || 'Recette #' + recipeId;
      }
      
      // Sinon, retourner un placeholder et charger les infos en arrière-plan
      fetchRecipeInfo(recipeId);
      return 'Recette #' + recipeId;
    };

    // Fonction pour charger les informations d'une recette
    const fetchRecipeInfo = async (recipeId) => {
      if (!recipeId || recipes.value[recipeId]) return;
      
      try {
        const response = await recipeService.getById(recipeId);
        if (response && response.data) {
          recipes.value[recipeId] = response.data;
        }
      } catch (error) {
        console.error(`Erreur lors du chargement de la recette ${recipeId}`, error);
        // Ne pas bloquer l'UI en cas d'erreur
        recipes.value[recipeId] = { name: 'Recette #' + recipeId };
      }
    };

    const loadShoppingList = async () => {
      loading.value = true;
      error.value = false;
      errorMessage.value = '';
      
      try {
        // Utilisation de l'API de shopping
        const response = await shoppingService.getShoppingList();
        console.log('Réponse API liste de courses:', response.data);
        
        // Vérification du type de la réponse pour éviter les problèmes de parsing
        if (typeof response.data === 'string' && response.data.includes('<!doctype html>')) {
          throw new Error('Le serveur a renvoyé une page HTML au lieu des données JSON attendues.');
        }
        
        // Gestion sécurisée des différentes structures de données possibles
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
            // Tentative de trouver un tableau dans la réponse
            const possibleArrays = Object.values(response.data).filter(val => Array.isArray(val));
            if (possibleArrays.length > 0) {
              itemsData = possibleArrays[0];
            }
          }
        }
        
        // Afficher les données extraites
        console.log('Articles extraits:', itemsData);
        console.log('Structure de données du premier article:', itemsData.length > 0 ? JSON.stringify(itemsData[0], null, 2) : 'Aucun article');
        
        if (itemsData.length === 0) {
          console.warn('Aucun élément trouvé dans la réponse:', response.data);
        }
        
        // Vérifier si les articles ont la propriété recipeId
        const articlesAvecRecipeId = itemsData.filter(item => item.recipeId);
        console.log(`Articles avec recipeId: ${articlesAvecRecipeId.length}/${itemsData.length}`);
        
        // Examiner si les recipeId sont présents mais sous une autre forme
        if (articlesAvecRecipeId.length === 0 && itemsData.length > 0) {
          console.log('Inspection des propriétés du premier article:');
          
          const firstItem = itemsData[0];
          for (const [key, value] of Object.entries(firstItem)) {
            if (key.toLowerCase().includes('recipe')) {
              console.log(`Propriété candidate pour recipeId: ${key} = ${JSON.stringify(value)}`);
            }
          }
          
          // Vérifier des structures plus profondes comme notes ou extras
          if (firstItem.extras) console.log('extras:', firstItem.extras);
          if (firstItem.note) console.log('note:', firstItem.note);
          if (firstItem.notes) console.log('notes:', firstItem.notes);
          if (firstItem.recipe) console.log('recipe:', firstItem.recipe);
          if (firstItem.metadata) console.log('metadata:', firstItem.metadata);
        }
        
        // Stocker les données
        items.value = itemsData;
        
        // Ajouter la recherche alternative de l'ID recette
        // Stocker les données avec une adaptation complète pour extraire recipeId
        items.value = items.value.map(item => {
          // Si l'article a déjà un recipeId valide, on le garde tel quel
          if (item.recipeId) return item;
          
          // Créer une copie pour éviter de modifier l'original
          const adaptedItem = {...item};
          
          // Cas 1: recipeReferences (structure observée dans l'API)
          if (item.recipeReferences && Array.isArray(item.recipeReferences) && item.recipeReferences.length > 0) {
            adaptedItem.recipeId = item.recipeReferences[0].recipeId;
            // Optionnel: stocker toutes les références pour un usage ultérieur
            adaptedItem.allRecipeIds = item.recipeReferences.map(ref => ref.recipeId);
          }
          
          // Cas 2: objet recipe avec ID
          if (!adaptedItem.recipeId && item.recipe) {
            if (typeof item.recipe === 'string') {
              adaptedItem.recipeId = item.recipe;
            } else if (typeof item.recipe === 'object' && item.recipe !== null) {
              adaptedItem.recipeId = item.recipe.id || item.recipe._id;
            }
          }
          
          // Cas 3: recipeReference (au singulier)
          if (!adaptedItem.recipeId && item.recipeReference) {
            if (typeof item.recipeReference === 'string') {
              adaptedItem.recipeId = item.recipeReference;
            } else if (typeof item.recipeReference === 'object' && item.recipeReference !== null) {
              adaptedItem.recipeId = item.recipeReference.id || item.recipeReference._id;
            }
          }
          
          // Cas 4: recherche dans des conteneurs de données (extras, metadata, etc.)
          if (!adaptedItem.recipeId) {
            const possibleContainers = ['extras', 'metadata', 'note', 'notes', 'data', 'source'];
            for (const container of possibleContainers) {
              if (item[container]) {
                if (typeof item[container] === 'object' && item[container] !== null) {
                  const containerId = item[container].recipeId || item[container].recipe_id;
                  if (containerId) {
                    adaptedItem.recipeId = containerId;
                    break;
                  }
                } else if (typeof item[container] === 'string' && item[container].includes('recipe:')) {
                  const match = item[container].match(/recipe:([a-zA-Z0-9-_]+)/);
                  if (match && match[1]) {
                    adaptedItem.recipeId = match[1];
                    break;
                  }
                }
              }
            }
          }
          
          // Cas 5: recherche dans toutes les propriétés dont le nom contient "recipe"
          if (!adaptedItem.recipeId) {
            for (const [key, value] of Object.entries(item)) {
              if (key.toLowerCase().includes('recipe') && !key.toLowerCase().includes('name')) {
                if (typeof value === 'string') {
                  adaptedItem.recipeId = value;
                  break;
                } else if (typeof value === 'object' && value !== null && (value.id || value._id)) {
                  adaptedItem.recipeId = value.id || value._id;
                  break;
                }
              }
            }
          }
          return adaptedItem;
        });

        // Revérifier après adaptation
        const articlesAvecRecipeIdApresAdaptation = items.value.filter(item => item.recipeId);
        console.log(`Articles avec recipeId après adaptation: ${articlesAvecRecipeIdApresAdaptation.length}/${itemsData.length}`);
        
        // Charger les infos des recettes associées
        const recipeIds = [...new Set(items.value
          .filter(item => item.recipeId)
          .map(item => item.recipeId))];
        
        console.log('RecipeIds trouvés:', recipeIds);
        
        // Précharger les infos des recettes
        for (const recipeId of recipeIds) {
          fetchRecipeInfo(recipeId);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement de la liste de courses', error);
        error.value = true;
        errorMessage.value = error.message || 'Impossible de charger la liste de courses.';
        
        // Si nous sommes en mode développement, fournir des données de test
        if (process.env.NODE_ENV === 'development') {
          useMockData();
        }
      } finally {
        loading.value = false;
      }
    };
    
    // Fonction pour utiliser des données de test en cas d'erreur
    const useMockData = (forceTestData = false) => {
      // Si forceTestData est vrai, on utilise toujours les données de test
      // Sinon, on ne les utilise qu'en mode développement et en cas d'erreur
      if (!forceTestData && process.env.NODE_ENV !== 'development') return;
      
      const mockItems = [
        { id: '1', name: 'Pommes', quantity: 6, unit: 'unité', checked: false, recipeId: 'recipe-1' },
        { id: '2', name: 'Lait', quantity: 1, unit: 'L', checked: false, recipeId: 'recipe-1' },
        { id: '3', name: 'Pain', quantity: 2, unit: 'unité', checked: true },
        { id: '4', name: 'Poulet', quantity: 500, unit: 'g', checked: false, recipeId: 'recipe-2' },
        { id: '5', name: 'Pâtes', quantity: 1, unit: 'kg', checked: false, recipeId: 'recipe-2' },
        { id: '6', name: 'Chocolat', quantity: 200, unit: 'g', checked: false },
        { id: '7', name: 'Tomates', quantity: 4, unit: 'unité', checked: false, recipeId: 'recipe-3' },
        { id: '8', name: 'Basilic', quantity: 1, unit: 'botte', checked: false, recipeId: 'recipe-3' },
        { id: '9', name: 'Mozzarella', quantity: 1, unit: 'unité', checked: false, recipeId: 'recipe-3' }
      ];
      
      items.value = mockItems;
      
      // Ajouter des recettes de test
      recipes.value = {
        'recipe-1': { name: 'Tarte aux pommes', description: 'Délicieuse tarte aux pommes maison' },
        'recipe-2': { name: 'Poulet aux pâtes', description: 'Un plat simple et rapide' },
        'recipe-3': { name: 'Salade Caprese', description: 'Salade italienne avec tomate et mozzarella' }
      };
      
      console.log('Utilisation de données de test avec recettes');
    };
    
    const toast = ref({
      show: false,
      message: '',
      type: 'success',
      timeout: null
    });

    const determineCategory = (itemName) => {
      if (!itemName) return 'Divers';
      
      const lowerName = itemName.toLowerCase();
      
      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
          return category;
        }
      }
      
      return 'Divers';
    };

    const groupedItems = computed(() => {
      const grouped = {};
      
      // Initialiser toutes les catégories qui ont des articles
      items.value.forEach(item => {
        // Déterminer la catégorie en utilisant soit food, soit name
        let category = 'Divers';
        if (item.food) {
          const foodName = getFoodName(item.food);
          category = determineCategory(foodName);
        } else if (item.name) {
          category = determineCategory(item.name);
        }
        
        if (!grouped[category]) {
          grouped[category] = [];
        }
        grouped[category].push(item);
      });
      
      return grouped;
    });

    // Items sans recette liée
    const itemsWithoutRecipe = computed(() => {
      return items.value.filter(item => !item.recipeId);
    });

    // Filtrer les items sans recette en fonction de showCompleted
    const filteredItemsWithoutRecipe = computed(() => {
      if (showCompleted.value) {
        return itemsWithoutRecipe.value;
      }
      return itemsWithoutRecipe.value.filter(item => !item.checked);
    });

    // Items groupés par recette
    const groupedByRecipe = computed(() => {
      const grouped = {};
      
      items.value.forEach(item => {
        // Déterminer l'ID de recette à partir de plusieurs sources possibles
        let recipeId = item.recipeId;
        
        // Si pas d'ID directement disponible, chercher dans d'autres propriétés
        if (!recipeId) {
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
          grouped[recipeId].push({...item, recipeId}); // S'assurer que recipeId est présent
        }
      });
      
      return grouped;
    });

    // Filtre les items par recette et selon showCompleted
    const filterItemsByRecipe = (recipeId) => {
      const recipeItems = items.value.filter(item => item.recipeId === recipeId);
      
      if (showCompleted.value) {
        return recipeItems;
      }
      
      return recipeItems.filter(item => !item.checked);
    };

    const filteredItemsByCategory = (category) => {
      if (showCompleted.value) {
        return groupedItems.value[category] || [];
      }
      return (groupedItems.value[category] || []).filter(item => !item.checked);
    };

    const toggleItem = async (item) => {
      try {
        // Optimistic UI update
        const previousState = item.checked;
        item.checked = !item.checked;
        
        try {
          await shoppingService.updateShoppingItem(item.id, { checked: item.checked });
        } catch (apiError) {
          // Rollback if API call fails
          console.error('Erreur lors de la mise à jour de l\'article', apiError);
          item.checked = previousState;
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'article', error);
      }
    };

    const removeItem = async (itemId) => {
      try {
        // Optimistic UI update
        const removedItem = items.value.find(item => item.id === itemId);
        const removedIndex = items.value.findIndex(item => item.id === itemId);
        items.value = items.value.filter(item => item.id !== itemId);
        
        try {
          await shoppingService.removeShoppingItem(itemId);
        } catch (apiError) {
          // Rollback if API call fails
          console.error('Erreur lors de la suppression de l\'article', apiError);
          if (removedItem && removedIndex !== -1) {
            items.value.splice(removedIndex, 0, removedItem);
          }
        }
      } catch (error) {
        console.error('Erreur lors de la suppression de l\'article', error);
      }
    };

    const addNewItem = async () => {
      if (!newItem.value.name.trim()) return;
      
      try {
        // Créer un ID temporaire pour l'interface
        const tempId = 'temp_' + Date.now();
        
        // Ajouter immédiatement à l'UI avec l'ID temporaire
        const tempItem = {
          id: tempId,
          name: newItem.value.name,
          quantity: newItem.value.quantity,
          unit: newItem.value.unit,
          category: newItem.value.category,
          checked: false
        };
        
        items.value.push(tempItem);
        
        // Réinitialiser le formulaire
        const itemToAdd = { ...newItem.value };
        newItem.value = { 
          name: '', 
          quantity: 1, 
          unit: 'unité', 
          category: 'Divers',
          checked: false
        };
        
        try {
          // Appel API
          const response = await shoppingService.addToShoppingList({
            name: itemToAdd.name,
            quantity: itemToAdd.quantity,
            unit: itemToAdd.unit,
            checked: false
          });
          
          // Mettre à jour l'item avec l'ID réel retourné par l'API
          if (response.data && response.data.id) {
            const index = items.value.findIndex(i => i.id === tempId);
            if (index !== -1) {
              items.value[index] = { 
                ...response.data,
                category: itemToAdd.category
              };
            }
          }
        } catch (apiError) {
          console.error('Erreur lors de l\'ajout de l\'article', apiError);
          // Supprimer l'item temporaire en cas d'échec
          items.value = items.value.filter(i => i.id !== tempId);
        }
      } catch (error) {
        console.error('Erreur lors de l\'ajout d\'un nouvel article', error);
      }
    };

    const toggleCompletedItems = () => {
      showCompleted.value = !showCompleted.value;
    };
    
    /**
     * Purge la liste de courses en fonction des options choisies
     */
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
        
        // Optimistic UI: supprimer d'abord de l'interface
        if (keepCheckedItemsOnClear.value) {
          // Conserver uniquement les articles cochés
          items.value = items.value.filter(item => item.checked);
        } else {
          // Vider complètement la liste
          items.value = [];
        }
        
        // Fermer la modal de confirmation
        showClearConfirmation.value = false;
        
        // Appels API: supprimer un par un les articles
        const itemIds = itemsToRemove.map(item => item.id);
        
        // Option 1: Suppression séquentielle (plus fiable mais plus lente)
        for (const itemId of itemIds) {
          try {
            await shoppingService.removeShoppingItem(itemId);
          } catch (error) {
            console.error(`Erreur lors de la suppression de l'article ${itemId}:`, error);
          }
        }
        
        // Option 2 (alternative): Suppression en parallèle (plus rapide mais risque de surcharge API)
        // await Promise.all(itemIds.map(id => shoppingService.removeShoppingItem(id).catch(e => console.error(`Erreur lors de la suppression de l'article ${id}:`, e))));
        
        // Recharger la liste pour synchroniser avec le serveur
        // Seulement si nécessaire, car nous avons déjà mis à jour l'UI de façon optimiste
        // await loadShoppingList();
        
      } catch (error) {
        console.error('Erreur lors de la purge de la liste de courses:', error);
        error.value = true;
        errorMessage.value = 'Erreur lors de la purge de la liste de courses. Veuillez réessayer.';
      } finally {
        loading.value = false;
      }
    };
    
    const generateShoppingList = async () => {
      loading.value = true;
      try {
        console.log('Génération de la liste de courses depuis le planning...');
        
        // 1. Récupérer les identifiants des recettes du planning
        const today = new Date();
        const startDate = formatDate(today);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        const formattedEndDate = formatDate(endDate);
        
        const mealPlanResponse = await recipeService.getMealPlan(startDate, formattedEndDate);
        
        const recipeIds = new Set();
        if (mealPlanResponse.data && mealPlanResponse.data.items) {
          mealPlanResponse.data.items.forEach(meal => {
            if (meal.recipe && meal.recipe.id) {
              recipeIds.add(meal.recipe.id);
            }
          });
        }
        
        if (recipeIds.size === 0) {
          throw new Error('Aucune recette trouvée dans le planning pour générer la liste');
        }
        
        // 2. Récupérer la liste de courses principale
        const listResponse = await shoppingService.getMainShoppingList();
        const mainList = listResponse.data.items?.[0];
        
        if (!mainList || !mainList.id) {
          throw new Error('Aucune liste de courses valide trouvée');
        }
        
        // 3. Pour chaque recette, ajouter à la liste de courses
        const recipePromises = Array.from(recipeIds).map(recipeId => {
          // Utiliser le format exact attendu par l'API
          return axiosInstance.post(`/households/shopping/lists/${mainList.id}/recipe`, [{
            recipeId: recipeId,
            recipeIncrementQuantity: 1,
            recipeIngredients: [] // L'API extraira les ingrédients de la recette
          }]);
        });
        
        await Promise.all(recipePromises);
        
        // 4. Recharger la liste de courses
        await loadShoppingList();
        
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

    // Fonction pour afficher des notifications
    const showToast = (message, type = 'success') => {
      // Si cette fonction n'existe pas déjà dans votre composant, ajoutez-la
      console.log(`Toast: ${message} (${type})`);
      // Ici, vous pourriez implémenter une notification visuelle
      // Exemple simple avec alert:
      if (type === 'error') {
        alert(`Erreur: ${message}`);
      } else {
        alert(message);
      }
    };

    return {
      items,
      loading,
      error,
      errorMessage,
      showCompleted,
      viewMode,
      newItem,
      categories,
      groupedItems,
      groupedByRecipe,
      itemsWithoutRecipe,
      filteredItemsWithoutRecipe,
      filteredItemsByCategory,
      filterItemsByRecipe,
      toggleItem,
      removeItem,
      addNewItem,
      toggleCompletedItems,
      loadShoppingList,
      generateShoppingList,
      router,
      getFoodName,
      getUnitDisplay,
      getRecipeName,
      showClearConfirmation,
      keepCheckedItemsOnClear,
      clearShoppingList
    };
  }
}
</script>

<style scoped>
/* Animation pour le chargement */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Animation pour l'ajout d'items */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>