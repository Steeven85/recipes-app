<template>
  <div class="max-w-screen-xl mx-auto px-4 py-6">
    <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
      <h1 class="text-2xl font-bold flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Planning des Repas
      </h1>
      <button 
        @click="generateShoppingList"
        class="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 flex items-center"
        :disabled="!hasMeals || generatingList"
        :class="{'opacity-50 cursor-not-allowed': !hasMeals || generatingList}"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span v-if="generatingList">Génération en cours...</span>
        <span v-else>Générer liste de courses</span>
      </button>
    </div>

    <div class="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
      <div class="flex justify-between items-center mb-6">
        <button 
          @click="previousWeek" 
          class="flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          :disabled="loading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="ml-1 hidden sm:inline">Semaine précédente</span>
        </button>
        
        <h2 class="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 hidden md:inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {{ formatWeekRange(startDate, endDate) }}
        </h2>
        
        <button 
          @click="nextWeek"
          class="flex items-center px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          :disabled="loading"
        >
          <span class="mr-1 hidden sm:inline">Semaine suivante</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin h-10 w-10 text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
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
          class="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
        >
          Réessayer
        </button>
      </div>
      
      <!-- Affichage mobile : Format horizontal avec défilement (Vue originale) -->
      <div class="block md:hidden">
        <!-- Navigation entre les jours (pour mobile) -->
        <div class="mb-4">
          <div class="flex justify-between items-center bg-white rounded-lg shadow-sm p-2 mb-3">
            <button 
              @click="previousDay" 
              class="p-2 text-gray-600"
              :disabled="currentDayIndex === 0"
              :class="{'opacity-50': currentDayIndex === 0}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div class="text-center">
              <p class="text-lg font-semibold" :class="{'text-gray-700 font-bold': isToday(weekDays[currentDayIndex].date)}">
                {{ formatDay(weekDays[currentDayIndex].date) }} {{ formatDate(weekDays[currentDayIndex].date) }}
              </p>
              <p class="text-sm text-gray-500">{{ formatFullDate(weekDays[currentDayIndex].date) }}</p>
            </div>
            <button 
              @click="nextDay" 
              class="p-2 text-gray-600"
              :disabled="currentDayIndex === 6"
              :class="{'opacity-50': currentDayIndex === 6}"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <!-- Affichage sous forme de petits onglets pour jours -->
          <div class="overflow-x-auto">
            <div class="grid grid-cols-7 gap-1 mb-4">
              <button 
                v-for="(day, index) in weekDays" 
                :key="day.date"
                @click="currentDayIndex = index" 
                class="p-1 rounded text-center text-xs transition-colors"
                :class="{
                  'bg-gray-100 border border-gray-300': currentDayIndex === index,
                  'bg-white border border-gray-200': currentDayIndex !== index,
                  'font-semibold': isToday(day.date)
                }"
              >
                <p class="text-xs" :class="{'text-gray-700': isToday(day.date)}">
                  {{ formatDay(day.date) }}
                </p>
                <p class="text-xs font-bold" :class="{'text-gray-700': isToday(day.date)}">
                  {{ formatDate(day.date) }}
                </p>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Affichage des repas du jour actif -->
        <div class="border rounded-lg p-3">    
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-sm font-medium">
              Repas planifiés
            </h3>
            <button 
              @click="openRecipeSelector(weekDays[currentDayIndex].date)"
              class="px-2 py-1 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-xs flex items-center"
            >
              <span class="mr-1">+</span> Ajouter
            </button>
          </div>
          
          <div v-if="weekDays[currentDayIndex].meals.length === 0" class="text-center py-8 text-gray-500">
            <p>Aucun repas planifié pour cette journée</p>
          </div>
          
          <TransitionGroup 
            name="meal-list" 
            tag="div" 
            class="space-y-3"
          >
            <div 
              v-for="meal in weekDays[currentDayIndex].meals" 
              :key="meal.id"
              class="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow transition-shadow"
            >
              <div class="flex items-start p-3">
                <div class="w-16 h-16 relative flex-shrink-0 mr-2 rounded overflow-hidden bg-gray-100">
                  <img 
                    :src="getRecipeImage(meal.recipe)"
                    :alt="meal.recipe.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center mb-1">
                    <span :class="getMealTypeClassesSober(meal.type)">
                      <span v-html="getMealTypeIcon(meal.type)" class="w-3.5 h-3.5"></span>
                      <span class="ml-1">{{ getMealTypeLabel(meal.type) }}</span>
                    </span>
                    <span v-if="meal.recipe.totalTime" class="ml-2 text-xs text-gray-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ meal.recipe.totalTime }} min
                    </span>
                  </div>
                  <h4 class="font-medium text-sm">{{ meal.recipe.name }}</h4>
                  
                  <div class="flex justify-between items-center mt-1">
                    <div class="flex space-x-1">
                      <button 
                        @click="openRecipeDetails(meal.recipe.id)"
                        class="px-2 py-1 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                        </svg>
                        Voir
                      </button>
                      <button 
                        @click="removeMeal(meal)"
                        class="px-2 py-1 text-xs border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
      
      <!-- Affichage PC : Format vertical avec jour sélectionné -->
      <div class="hidden md:block">
        <!-- Sélecteur de jours -->
        <div class="mb-6">
          <div class="grid grid-cols-7 gap-2">
            <button 
              v-for="(day, index) in weekDays" 
              :key="day.date"
              @click="currentDayIndex = index" 
              class="p-2 rounded-lg text-center transition-colors"
              :class="{
                'bg-gray-100 border-2 border-gray-500': currentDayIndex === index,
                'border border-gray-200 hover:bg-gray-50': currentDayIndex !== index,
                'font-semibold': isToday(day.date)
              }"
            >
              <p class="text-sm font-medium" :class="{'text-gray-700': isToday(day.date)}">
                {{ formatDay(day.date) }}
              </p>
              <p class="text-lg" :class="{'text-gray-700 font-bold': isToday(day.date)}">
                {{ formatDate(day.date) }}
              </p>
            </button>
          </div>
        </div>
        
        <!-- Affichage des repas du jour actif -->
        <div class="border rounded-lg p-4">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">
              {{ formatFullDate(weekDays[currentDayIndex].date) }}
            </h3>
            <button 
              @click="openRecipeSelector(weekDays[currentDayIndex].date)"
              class="px-3 py-1.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm flex items-center"
            >
              <span class="mr-1">+</span> Ajouter un repas
            </button>
          </div>
          
          <div v-if="weekDays[currentDayIndex].meals.length === 0" class="text-center py-10 text-gray-500">
            <p>Aucun repas planifié pour cette journée</p>
          </div>
          
          <TransitionGroup 
            name="meal-list" 
            tag="div" 
            class="space-y-4"
          >
            <div 
              v-for="meal in weekDays[currentDayIndex].meals" 
              :key="meal.id"
              class="bg-white border rounded-lg shadow-sm overflow-hidden hover:shadow transition-shadow"
            >
              <div class="flex items-start p-3">
                <!-- Image de la recette (plus grande) -->
                <div class="w-24 h-24 relative flex-shrink-0 mr-3 rounded overflow-hidden bg-gray-100">
                  <img 
                    :src="getRecipeImage(meal.recipe)"
                    :alt="meal.recipe.name"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    @error="handleImageError"
                  />
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-center mb-1">
                    <span :class="getMealTypeClassesSober(meal.type)">
                      <span v-html="getMealTypeIcon(meal.type)" class="w-3.5 h-3.5"></span>
                      <span class="ml-1">{{ getMealTypeLabel(meal.type) }}</span>
                    </span>
                    <span v-if="meal.recipe.totalTime" class="ml-2 text-sm text-gray-500 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ meal.recipe.totalTime }} min
                    </span>
                  </div>
                  
                  <h4 class="text-lg font-medium mb-1">{{ meal.recipe.name }}</h4>
                  
                  <p v-if="meal.recipe.description" class="text-sm text-gray-600 line-clamp-2 mb-2">
                    {{ meal.recipe.description }}
                  </p>
                  
                  <div class="flex space-x-2">
                    <button 
                      @click="openRecipeDetails(meal.recipe.id)"
                      class="px-3 py-1 text-sm border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                      </svg>
                      Voir la recette
                    </button>
                    <button 
                      @click="removeMeal(meal)"
                      class="px-3 py-1 text-sm border border-gray-200 text-gray-600 rounded hover:bg-gray-50 flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>
      </div>
    </div>
    
    <!-- Résumé de la semaine, visible sur mobile et PC -->
    <div class="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
      <h3 class="font-semibold mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Résumé de la semaine
      </h3>

      <!-- Conteneur défilable horizontalement si nécessaire -->
      <div class="overflow-x-auto">
        <!-- Utilisation de "w-max" afin que la largeur du contenu s'adapte au nombre de jours -->
        <div class="w-max space-y-3 md:space-y-3">
          <div v-for="day in weekDays" :key="day.date" class="flex items-center space-x-4 py-2 border-b last:border-b-0">
            <!-- Affichage de la date -->
            <div class="min-w-[80px] text-sm font-medium" :class="{'text-gray-700 font-bold': isToday(day.date)}">
              {{ formatDay(day.date) }} {{ formatDate(day.date) }}
            </div>
            <!-- Liste des repas pour la journée -->
            <div class="flex-1 flex flex-wrap gap-2">
              <template v-if="day.meals.length > 0">
                <div 
                  v-for="meal in day.meals" 
                  :key="meal.id"
                  :class="[
                    'text-xs px-2 py-1 rounded-full flex items-center cursor-pointer',
                    getMealTypeBackgroundClassSober(meal.type)
                  ]"
                  @click="currentDayIndex = weekDays.findIndex(d => d.date === day.date)"
                >
                  <span v-html="getMealTypeIcon(meal.type)" class="w-3 h-3 mr-1"></span>
                  <span class="truncate max-w-[150px]">{{ meal.recipe.name }}</span>
                </div>
              </template>
              <div v-else class="text-xs text-gray-500 italic">
                Aucun repas planifié
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
 
    <!-- Modal pour sélectionner une recette -->
    <Teleport to="body">
      <div v-if="showRecipeSelector" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-auto" @click.stop>
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
          
          <div class="mb-4 flex flex-col sm:flex-row gap-4">
            <div class="w-full sm:w-3/4">
              <div class="relative">
                <input 
                  type="text" 
                  v-model="recipeSearch" 
                  placeholder="Rechercher une recette..." 
                  class="w-full border rounded-lg pl-10 pr-3 py-2"
                  @input="debouncedSearch"
                  ref="searchInput"
                />
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div class="w-full sm:w-1/4">
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
            <div class="animate-spin h-8 w-8 text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          
          <div v-else-if="recipesError" class="text-center py-8 text-red-500">
            <p>{{ recipesError }}</p>
            <button 
              @click="loadRecipes" 
              class="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Réessayer
            </button>
          </div>
          
          <div v-else-if="filteredRecipes.length === 0" class="text-center py-8 text-gray-500">
            <p>Aucune recette trouvée</p>
          </div>
          
          <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div 
              v-for="recipe in filteredRecipes" 
              :key="recipe.id"
              class="border rounded-lg p-3 flex items-center hover:bg-gray-50 cursor-pointer transition-colors"
              @click="addRecipeToDay(recipe)"
            >
              <div class="w-16 h-16 relative flex-shrink-0 mr-3 rounded overflow-hidden bg-gray-100">
                <img 
                  :src="getRecipeImage(recipe)"
                  :alt="recipe.name"
                  class="w-full h-full object-cover"
                  loading="lazy"
                  @error="handleImageError"
                />
              </div>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium line-clamp-2">{{ recipe.name }}</h4>
                <div class="flex items-center text-xs text-gray-500">
                  <span v-if="recipe.totalTime" class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ formatCookTime(recipe.totalTime) }}
                  </span>
                  <span v-if="recipe.difficulty" class="ml-2 px-2 py-0.5 bg-gray-100 rounded">
                    {{ recipe.difficulty }}
                  </span>
                </div>
              </div>
              <div class="ml-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      class="fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg flex items-center z-50"
      :class="{ 'bg-green-600 text-white': toast.type === 'success', 'bg-red-600 text-white': toast.type === 'error' }"
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
    const currentDayIndex = ref(dayjs().day() % 7); // Jour actuel de la semaine (0-6)
    const toast = ref({
      show: false,
      message: '',
      type: 'success',
      timeout: null
    });
    const generatingList = ref(false);
    
    // Controller pour annuler les requêtes en cours
    let abortController = new AbortController();

    // Navigation entre les jours (pour mobile)
    const previousDay = () => {
      if (currentDayIndex.value > 0) {
        currentDayIndex.value -= 1;
      }
    };

    const nextDay = () => {
      if (currentDayIndex.value < 6) {
        currentDayIndex.value += 1;
      }
    };

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
      // Supposons ici que vous ayez déjà appliqué le filtre via recipeSearch
      let result = recipes.value;

      // Appliquer le tri selon le type de repas en utilisant le mapping
      result = result.slice().sort((a, b) => {
        // Récupérer le type (en minuscule) pour chaque recette, par défaut "dinner" si absent
        const aType = a.entryType ? a.entryType.toLowerCase() : 'dinner';
        const bType = b.entryType ? b.entryType.toLowerCase() : 'dinner';

        // Calculer l'ordre en se basant sur le mapping défini
        return (mealTypeOrder[aType] ?? 3) - (mealTypeOrder[bType] ?? 3);
      });

      return result;
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

    // Fonctions pour récupérer les informations de type de repas
    const getMealTypeClassesSober = (type) => {
      switch (type) {
        case 'breakfast':
          return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border-gray-200';
        case 'lunch':
          return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border-gray-200';
        case 'dinner':
          return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border-gray-200';
        case 'snack':
          return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border-gray-200';
        default:
          return 'inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border-gray-200';
      }
    };

    // Nouvelle fonction pour obtenir uniquement les classes de fond
    const getMealTypeBackgroundClassSober = (type) => {
      return 'bg-gray-100 text-gray-700';
    };

    const getMealTypeIcon = (type) => {
      switch (type) {
        case 'breakfast':
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 8h1a4 4 0 1 1 0 8h-1"></path>
            <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"></path>
            <line x1="6" x2="6" y1="2" y2="4"></line>
            <line x1="10" x2="10" y1="2" y2="4"></line>
            <line x1="14" x2="14" y1="2" y2="4"></line>
          </svg>`;
        case 'lunch':
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
            <path d="M7 2v20"></path>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
          </svg>`;
        case 'dinner':
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"></path>
            <path d="M7 21h10"></path>
            <path d="M12.007 12V3"></path>
          </svg>`;
        case 'snack':
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22a8 8 0 0 0 8-8"></path>
            <path d="M2 10s3.5 4 10 4 11.5-4 11.5-4"></path>
            <path d="M5 18a8 8 0 0 1 0-16h3.5c1.06 0 2.04.37 2.82 1l3.37 2.24a4 4 0 0 1 1.31 5.52 4 4 0 0 1-5.26 1.4L9 11"></path>
          </svg>`;
        default:
          return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
            <path d="M7 2v20"></path>
            <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"></path>
          </svg>`;
      }
    };

    const getMealTypeLabel = (type) => {
      switch (type) {
        case 'breakfast': return 'Petit-déj';
        case 'lunch': return 'Déjeuner';
        case 'dinner': return 'Dîner';
        case 'snack': return 'Collation';
        default: return 'Repas';
      }
    };

    // Surveiller les changements de route pour le paramètre recipeId
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
      
      // Initialiser le jour actif à aujourd'hui si possible
      const todayIndex = weekDays.value.findIndex(day => 
        isToday(day.date)
      );
      
      if (todayIndex !== -1) {
        currentDayIndex.value = todayIndex;
      }
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
        
        // Initialiser les jours de la semaine avec transformation des types de repas
        weekDays.value = Array.from({ length: 7 }, (_, i) => {
          const date = dayjs(startDate.value).add(i, 'day').format('YYYY-MM-DD');
          // Filtrer les repas pour ce jour et normaliser les types
          const dayMeals = mealPlanData.filter(meal => meal.date === date) || [];
          // Assurons-nous que chaque repas a un type valide
          dayMeals.forEach(meal => {
            // Si le type n'est pas défini, utilisez le type sélectionné par défaut
            if (!meal.type) {
              meal.type = meal.entryType || 'dinner';
            }
            meal.type = normalizeType(meal.type);
          });
          return {
            date,
            meals: dayMeals
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

    const mealTypeOrder = {
      breakfast: 0, // Petit-déj
      lunch: 1,     // Déjeuner
      snack: 2,     // Collation
      dinner: 3     // Dîner
    };

    // Fonction de normalisation des types de repas
    const normalizeType = (type) => {
      if (!type) return 'dinner';
      
      const lowerType = type.toLowerCase();
      
      if (lowerType.includes('petit') || lowerType.includes('breakfast') || lowerType === 'b') {
        return 'breakfast';
      } else if (lowerType.includes('déj') || lowerType.includes('dej') || lowerType.includes('lunch') || lowerType === 'l') {
        return 'lunch';
      } else if (lowerType.includes('dîn') || lowerType.includes('din') || lowerType.includes('dinner') || lowerType === 'd') {
        return 'dinner';
      } else if (lowerType.includes('coll') || lowerType.includes('snack') || lowerType === 's') {
        return 'snack';
      }
      
      return 'dinner';
    };

    const getRecipeImage = (recipe) => {
      // Vérifier si l'image est dans le cache
      if (imageCache.has(recipe.id)) {
        return imageCache.get(recipe.id);
      }
      
      // Utiliser le service pour récupérer l'URL de l'image
      const imageUrl = recipeService.getRecipeImageUrl(recipe, 'min-original.webp', '/default-recipe.png', true);
      
      // Mettre en cache l'URL de l'image
      imageCache.set(recipe.id, imageUrl);
      
      return imageUrl;
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
      return `${dayjs(start).format('D')} - ${dayjs(end).format('D')} ${dayjs(end).format('MMMM YYYY')}`;
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

        if (!response || !response.data) {
          throw new Error('Réponse invalide de l\'API');
        }

        const dayIndex = weekDays.value.findIndex(day => day.date === date);
        if (dayIndex !== -1) {
          // Créer une référence appropriée pour la recette dans la réponse avec le bon type
          const newMeal = {
            ...response.data,
            // S'assurer que le type est correctement défini
            type: selectedMealType.value || response.data.type || 'dinner',
            recipe: {
              id: recipe.id,
              name: recipe.name,
              totalTime: recipe.totalTime,
              description: recipe.description
            }
          };
          weekDays.value[dayIndex].meals.push(newMeal);
          
          // Définir le jour actif sur celui où on vient d'ajouter un repas
          currentDayIndex.value = dayIndex;
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

    // Fonction pour générer la liste de courses
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
        
        // 2. Pour chaque recette, récupérer ses détails complets
        const recipePromises = Array.from(recipeIds).map(id => recipeService.getById(id));
        const recipeResponses = await Promise.all(recipePromises);
        
        // 3. Récupérer la liste de courses principale
        const listResponse = await shoppingService.getMainShoppingList();
        const mainList = listResponse.data.items?.[0];
        
        if (!mainList || !mainList.id) {
          throw new Error('Aucune liste de courses valide trouvée');
        }
        
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
      openDateSelector,
      selectDate,
      showDateSelector,
      pendingRecipe,
      getMealTypeClassesSober,
      getMealTypeIcon,
      getMealTypeLabel,
      getMealTypeBackgroundClassSober,
      currentDayIndex,
      previousDay,
      nextDay
    };
  }
};
</script>

<style scoped>
/* Transition pour l'ajout et la suppression des repas */
.meal-list-enter-active,
.meal-list-leave-active {
  transition: all 0.3s ease;
}
.meal-list-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}
.meal-list-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* Support pour les textes tronqués sur plusieurs lignes */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Animation pour les toasts */
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

/* Assurer que les textes longs sont tronqués correctement */
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Animation pour les jours */
@keyframes highlight {
  0%, 100% {
    background-color: transparent;
  }
  50% {
    background-color: rgba(0, 0, 0, 0.05);
  }
}

.highlight-meal {
  animation: highlight 1.5s ease;
}

/* Assurer que le contenu reste masqué pendant le chargement */
[v-cloak] {
  display: none;
}

/* Améliorer l'apparence des jours sur mobile */
@media (max-width: 768px) {
  .grid-cols-7 {
    grid-template-columns: repeat(7, minmax(80px, 1fr));
  }
  
  .overflow-x-auto {
    -webkit-overflow-scrolling: touch;
    scroll-padding: 1rem;
    padding-bottom: 8px;
  }
  
  /* Masquer la barre de défilement mais permettre le défilement */
  .overflow-x-auto::-webkit-scrollbar {
    height: 6px;
  }
  .overflow-x-auto::-webkit-scrollbar-track {
    background: transparent;
  }
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
  }
  
  /* Style pour les cartes de jours sur mobile */
  .grid-cols-7 > div {
    min-width: 110px;
  }
}
/* Ajoutez ces styles à votre section <style scoped> */

/* Styles pour l'affichage mobile vertical */
@media (max-width: 768px) {
  /* Style pour les onglets de jours */
  .grid-cols-7 button {
    min-width: auto;
    height: auto;
  }
  
  /* Animations douces pour les changements de jour */
  .meal-list-enter-active,
  .meal-list-leave-active {
    transition: all 0.3s ease;
  }
  
  .meal-list-enter-from {
    opacity: 0;
    transform: translateY(-10px);
  }
  
  .meal-list-leave-to {
    opacity: 0;
    transform: translateX(10px);
  }
  
  /* Style pour les repas */
  .space-y-3 > * + * {
    margin-top: 0.75rem;
  }
  
  /* Style pour mettre en évidence le jour actif */
  .bg-gray-100.border.border-gray-300 {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  /* Style pour les boutons */
  .px-2.py-1.text-xs.border {
    white-space: nowrap;
  }
}

/* Style supplémentaire pour améliorer l'apparence */
.text-xs.rounded-full svg {
  width: 12px;
  height: 12px;
}

/* S'assurer que les images sont correctement affichées */
.w-16.h-16 img {
  object-fit: cover;
  width: 100%;
  height: 100%;
}
</style>