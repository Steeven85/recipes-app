<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Mes Recettes</h1>
      <button 
        @click="showAddRecipeModal = true"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Ajouter une recette
      </button>
    </div>

    <!-- Barre de recherche avec debounce -->
    <div class="mb-6">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher une recette..."
        class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        @input="debouncedSearch"
      />
    </div>

    <!-- Modes d'affichage: Tous/Favoris -->
    <div class="flex mb-6">
      <button 
        @click="activeView = 'all'"
        class="px-4 py-2 rounded-lg mr-2"
        :class="activeView === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'"
      >
        Toutes les recettes
      </button>
      <button 
        @click="activeView = 'favorites'"
        class="px-4 py-2 rounded-lg flex items-center"
        :class="activeView === 'favorites' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
        </svg>
        Favoris
        <span v-if="recipeStore.favoritesCount > 0" class="ml-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold">
          {{ recipeStore.favoritesCount }}
        </span>
      </button>
    </div>

    <!-- Filtre par catégories -->
    <div class="mb-6">
      <div class="flex justify-between items-center mb-2">
        <button 
          @click="showCategoriesFilter = !showCategoriesFilter"
          class="flex items-center text-indigo-600 font-medium"
        >
          <span>Filtrer par catégorie</span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            class="h-5 w-5 ml-1 transition-transform" 
            :class="showCategoriesFilter ? 'transform rotate-180' : ''"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <!-- Section d'affichage de la catégorie sélectionnée (avec contrôles null) -->
        <div v-if="selectedCategory" class="flex items-center">
          <span class="text-sm text-gray-600 mr-2">
            Catégorie : 
            <span class="font-medium text-indigo-600">
              {{ (categories.find(c => c && c.id === selectedCategory)?.name) || 'Catégorie inconnue' }}
            </span>
          </span>
          <button 
            @click="clearCategoryFilter"
            class="text-gray-500 hover:text-gray-700"
            title="Effacer le filtre"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>

      <!-- Panneau déroulant des catégories -->
      <div 
        v-show="showCategoriesFilter" 
        class="bg-white rounded-lg shadow-md p-4 mb-4 transition-all duration-300 max-h-72 overflow-y-auto"
      >
        <div v-if="recipeStore.loading && categories.length === 0" class="text-gray-500 text-center py-2">
          <Spinner class="mx-auto h-6 w-6" />
        </div>
        <div v-else-if="categories.length === 0" class="text-gray-500 text-center py-2">
          Aucune catégorie trouvée
        </div>
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <!-- Utilisation de l'index comme clé de secours si l'id est manquant -->
          <button 
            v-for="(category, index) in categories" 
            :key="category?.id || `category-${index}`"
            @click="category && category.id && selectCategory(category.id)"
            class="px-3 py-2 rounded-full text-sm text-center transition-colors truncate"
            :class="selectedCategory === (category?.id || '') 
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
          >
            {{ category?.name || 'Catégorie sans nom' }}
            <span v-if="category?.count" class="ml-1 text-xs font-medium">
              ({{ category.count }})
            </span>
          </button>
        </div>
      </div>

    <!-- Chargement initial -->
    <div v-if="recipeStore.loading && !partiallyLoaded" class="flex justify-center py-12">
      <Spinner />
    </div>

    <!-- Indicateur de chargement en arrière-plan -->
    <div v-if="recipeStore.loading && partiallyLoaded" class="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-2">
      <Spinner class="h-6 w-6" />
    </div>

    <!-- Aucune recette trouvée -->
    <div v-if="!recipeStore.loading && displayedRecipes.length === 0" class="text-center py-12">
      <p class="text-gray-500">
        <span v-if="activeView === 'favorites'">Aucune recette favorite.</span>
        <span v-else-if="selectedCategory">Aucune recette dans cette catégorie.</span>
        <span v-else>Aucune recette trouvée.</span>
      </p>
      <div v-if="activeView === 'favorites'" class="mt-4">
        <p class="text-sm text-gray-500 mb-3">Cliquez sur l'icône de cœur pour ajouter des recettes à vos favoris</p>
        <button 
          @click="activeView = 'all'"
          class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
        >
          Voir toutes les recettes
        </button>
      </div>
      <div v-else-if="selectedCategory" class="mt-4">
        <button 
          @click="clearCategoryFilter"
          class="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200"
        >
          Voir toutes les recettes
        </button>
      </div>
    </div>

    <!-- Liste des recettes (filtrée selon la vue active) -->
    <div v-if="displayedRecipes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <RecipeCard 
        v-for="recipe in displayedRecipes" 
        :key="recipe.id"
        :recipe="recipe"
        @view="viewRecipe"
        @plan="planRecipe"
        @shop="shopRecipe"
        @favorite-toggle="handleFavoriteToggle"
      />
    </div>

    <!-- Bouton flottant pour aller en haut de la page -->
    <button 
      v-if="showScrollToTop"
      @click="scrollToTop"
      class="fixed bottom-16 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      aria-label="Retourner en haut de la page"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>

    <!-- Modal pour ajouter une recette -->
    <div v-if="showAddRecipeModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Ajouter une recette</h2>
            <button @click="showAddRecipeModal = false" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <button 
                @click="showUrlImport = true; showAddRecipeModal = false"
                class="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span class="font-medium">Importer depuis une URL</span>
              </button>

              <button 
                @click="showManualCreate = true; showAddRecipeModal = false"
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
      </div>
    </div>

    <!-- Modal pour importer via URL -->
    <div v-if="showUrlImport" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Importer depuis une URL</h2>
            <button @click="showUrlImport = false" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="urlImportStatus === 'error'" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ urlImportError }}
          </div>

          <div v-if="urlImportStatus === 'success'" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
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
                @click="showUrlImport = false"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                :disabled="urlImportStatus === 'loading'"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                :disabled="urlImportStatus === 'loading'"
              >
                <span v-if="urlImportStatus === 'loading'">
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
      </div>
    </div>

    <!-- Modal pour créer manuellement -->
    <div v-if="showManualCreate" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Créer une recette</h2>
            <button @click="showManualCreate = false" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="manualCreateStatus === 'error'" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ manualCreateError }}
          </div>

          <div v-if="manualCreateStatus === 'success'" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Recette créée avec succès !
          </div>

          <form @submit.prevent="createRecipeManually">
            <!-- Informations de base -->
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-3 text-gray-800">Informations de base</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label for="recipe-name" class="block text-sm font-medium text-gray-700 mb-1">Nom de la recette *</label>
                  <input
                    id="recipe-name"
                    v-model="newRecipe.name"
                    type="text"
                    placeholder="Nom de la recette"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label for="recipe-description" class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    id="recipe-description"
                    v-model="newRecipe.description"
                    placeholder="Description (optionnelle)"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    rows="2"
                  ></textarea>
                </div>
              </div>
              
              <!-- Sélection des catégories -->
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="category in categories"
                    :key="category?.id || index"
                    type="button"
                    @click="category && toggleRecipeCategory(category)"
                    class="px-3 py-1 rounded-full text-sm transition-colors border"
                    :class="category && newRecipe.recipeCategory.some(cat => cat && cat.id === category.id)
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'"
                  >
                    {{ category?.name || 'Sans nom' }}
                  </button>
                  
                  <!-- Bouton pour ajouter une nouvelle catégorie -->
                  <button
                    type="button"
                    @click="showAddCategoryModal = true"
                    class="px-3 py-1 rounded-full text-sm bg-white border border-dashed border-gray-400 text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Nouvelle catégorie
                  </button>
                </div>
              </div>
            </div>

            <!-- Temps de préparation et de cuisson -->
            <div class="mb-6">
              <h3 class="text-lg font-medium mb-3 text-gray-800">Temps</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label for="prep-time" class="block text-sm font-medium text-gray-700 mb-1">Préparation (min)</label>
                  <input
                    id="prep-time"
                    v-model.number="newRecipe.prepTime"
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
                    v-model.number="newRecipe.cookTime"
                    type="number"
                    min="0"
                    placeholder="30"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label for="servings" class="block text-sm font-medium text-gray-700 mb-1">Portions</label>
                  <input
                    id="servings"
                    v-model.number="newRecipe.recipeYield"
                    type="number"
                    min="1"
                    placeholder="4"
                    class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <!-- Ingrédients -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-medium text-gray-800">Ingrédients</h3>
                <button
                  type="button"
                  @click="addIngredient"
                  class="px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter
                </button>
              </div>
              <div v-for="(ingredient, index) in newRecipe.recipeIngredient" :key="`ing-${index}`" class="flex items-center mb-2">
                <input
                  v-model="newRecipe.recipeIngredient[index]"
                  type="text"
                  placeholder="200g de farine"
                  class="flex-grow border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  @click="removeIngredient(index)"
                  class="ml-2 text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Instructions -->
            <div class="mb-6">
              <div class="flex justify-between items-center mb-3">
                <h3 class="text-lg font-medium text-gray-800">Instructions</h3>
                <button
                  type="button"
                  @click="addInstruction"
                  class="px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700 text-sm flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter
                </button>
              </div>
              <div v-for="(instruction, index) in newRecipe.recipeInstructions" :key="`ins-${index}`" class="flex items-start mb-2">
                <div class="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-2 mt-1">
                  {{ index + 1 }}
                </div>
                <textarea
                  v-model="newRecipe.recipeInstructions[index].text"
                  rows="2"
                  placeholder="Décrivez cette étape"
                  class="flex-grow border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                ></textarea>
                <button
                  type="button"
                  @click="removeInstruction(index)"
                  class="ml-2 text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showManualCreate = false"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                :disabled="manualCreateStatus === 'loading'"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                :disabled="manualCreateStatus === 'loading'"
              >
                <span v-if="manualCreateStatus === 'loading'">
                  <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création...
                </span>
                <span v-else>Créer la recette</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Modal pour ajouter une catégorie -->
    <div v-if="showAddCategoryModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Nouvelle catégorie</h2>
            <button @click="showAddCategoryModal = false" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="addCategoryStatus === 'error'" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ addCategoryError }}
          </div>

          <div v-if="addCategoryStatus === 'success'" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            Catégorie créée avec succès !
          </div>

          <form @submit.prevent="createCategory">
            <div class="mb-4">
              <label for="category-name" class="block text-sm font-medium text-gray-700 mb-1">Nom de la catégorie</label>
              <input
                id="category-name"
                v-model="newCategoryName"
                type="text"
                placeholder="Ex: Desserts, Entrées, Plats principaux..."
                class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showAddCategoryModal = false"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                :disabled="addCategoryStatus === 'loading'"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center"
                :disabled="addCategoryStatus === 'loading'"
              >
                <span v-if="addCategoryStatus === 'loading'">
                  <svg class="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Création...
                </span>
                <span v-else>Créer la catégorie</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { recipeService, shoppingService } from '../services/api';
import { useRecipeStore } from '../stores/recipeStore';
import Spinner from '../components/Spinner.vue';
import RecipeCard from '../components/RecipeCard.vue';

// Créer une fonction de debounce réutilisable
const useDebounce = (fn, delay = 300) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};

export default {
  components: {
    Spinner,
    RecipeCard
  },
  setup() {
    const recipeStore = useRecipeStore();
    const partiallyLoaded = ref(false);
    const searchQuery = ref('');
    const router = useRouter();
    
    // État pour le mode d'affichage (toutes les recettes ou favoris)
    const activeView = ref('all');
    
    // État pour le bouton de scroll
    const showScrollToTop = ref(false);
    
    // Modals et états pour l'ajout de recettes
    const showAddRecipeModal = ref(false);
    const showUrlImport = ref(false);
    const showManualCreate = ref(false);
    const recipeUrl = ref('');
    const urlImportStatus = ref('idle'); // idle, loading, success, error
    const urlImportError = ref('');
    const manualCreateStatus = ref('idle'); // idle, loading, success, error
    const manualCreateError = ref('');

    // Nouvelle recette pour la création manuelle
    const newRecipe = ref({
      name: '',
      description: '',
      prepTime: null,
      cookTime: null,
      recipeYield: 4,
      recipeIngredient: ['', ''],
      recipeInstructions: [
        { text: '' },
        { text: '' }
      ],
      recipeCategory: [] // Ajout pour gérer les catégories
    });
    
    // === États pour les catégories ===
    const categories = ref([]);
    const selectedCategory = ref(null);
    const showCategoriesFilter = ref(false);
    const showAddCategoryModal = ref(false);
    const newCategoryName = ref('');
    const addCategoryStatus = ref('idle'); // idle, loading, success, error
    const addCategoryError = ref('');
    
    // Initialiser les favoris depuis le localStorage
    onMounted(() => {
      recipeStore.init();
      
      // Ajouter un écouteur de scroll pour le bouton de retour en haut
      window.addEventListener('scroll', handleScroll);
      
      // Charger les catégories
      loadCategories();
    });
    
    onUnmounted(() => {
      window.removeEventListener('scroll', handleScroll);
    });
    
    // Gérer le défilement pour afficher/masquer le bouton de retour en haut
    const handleScroll = () => {
      showScrollToTop.value = window.scrollY > 300;
    };
    
    // Fonction pour défiler vers le haut de la page
    const scrollToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };
    
    // Pour l'optimisation du chargement par lots
    const BATCH_SIZE = 8; // Augmenté pour un meilleur équilibre entre latence et throughput
    let abortController = new AbortController();

    // Debounce la recherche pour éviter des rendus excessifs
    const debouncedSearch = useDebounce(() => {
      // La recherche est déjà réactive grâce au computed
    }, 300);

    // == Méthodes pour gérer les catégories ==
    
    // Chargement des catégories
    const loadCategories = async () => {
      try {
        // Appel API correct
        const response = await recipeService.getCategories();
        console.log('Réponse API catégories:', response.data);
        
        // Selon la documentation Mealie, la réponse contient un tableau d'objets
        if (response && response.data) {
          // Vérifier si c'est un tableau ou s'il contient une propriété items
          let categoriesArray = [];
          
          if (Array.isArray(response.data)) {
            categoriesArray = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            categoriesArray = response.data.items;
          }
          
          // Filtrer les catégories nulles ou sans ID pour éviter les erreurs
          const validCategories = categoriesArray.filter(cat => cat && cat.id);
          categories.value = validCategories;
          
          // Si une catégorie était sélectionnée, vérifier qu'elle existe toujours
          if (selectedCategory.value) {
            const exists = categories.value.some(cat => cat.id === selectedCategory.value);
            if (!exists) {
              selectedCategory.value = null;
            }
          }
        } else {
          // Réinitialiser en cas de données invalides
          categories.value = [];
          console.warn('Réponse de l\'API des catégories invalide ou vide');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des catégories', error);
        // Si l'API échoue, extraire les catégories des recettes comme fallback
        extractCategoriesFromRecipes();
      }
    };
    
    // Extraction des catégories depuis les recettes (méthode de secours)
    const extractCategoriesFromRecipes = () => {
      const uniqueCategories = new Map();
      
      // S'assurer que les recettes existent
      if (!recipeStore.recipes || !Array.isArray(recipeStore.recipes)) {
        categories.value = [];
        return;
      }
      
      recipeStore.recipes.forEach(recipe => {
        if (recipe && recipe.recipeCategory && Array.isArray(recipe.recipeCategory)) {
          recipe.recipeCategory.forEach(category => {
            if (category && category.id) {
              uniqueCategories.set(category.id, category);
            }
          });
        }
      });
      
      categories.value = Array.from(uniqueCategories.values());
    };
    
    // Sélectionner une catégorie pour filtrer
    const selectCategory = (categoryId) => {
      if (!categoryId) return;
      
      if (selectedCategory.value === categoryId) {
        // Si on clique sur la catégorie déjà sélectionnée, on désélectionne
        selectedCategory.value = null;
        recipeStore.selectCategory(null);
      } else {
        selectedCategory.value = categoryId;
        recipeStore.selectCategory(categoryId);
        
        // Optionnel: charger plus de détails pour cette catégorie
        loadRecipesByCategory(categoryId);
      }
      
      // Fermer le panneau des catégories
      showCategoriesFilter.value = false;
    };
    
    // Effacer le filtre de catégorie
    const clearCategoryFilter = () => {
      selectedCategory.value = null;
      recipeStore.selectCategory(null);
    };
    
    // Chargement des recettes par catégorie
    const loadRecipesByCategory = async (categoryId) => {
      if (!categoryId) return;
      
      try {
        // Utiliser l'appel API correct avec l'ID de la catégorie
        const response = await recipeService.getRecipesByCategory(categoryId);
        console.log('Réponse des recettes par catégorie:', response.data);
        
        if (response.data) {
          // Adapter selon la structure réelle de réponse de l'API
          // Basé sur le log, la réponse contient une propriété 'items'
          const categoryRecipes = response.data.items || [];
          
          // Mettre à jour le store avec les recettes de cette catégorie
          if (Array.isArray(categoryRecipes) && categoryRecipes.length > 0) {
            recipeStore.updateRecipesForCategory(categoryId, categoryRecipes);
          }
        }
      } catch (error) {
        console.error(`Erreur lors du chargement des recettes pour la catégorie ${categoryId}`, error);
      }
    };
    
    // Créer une nouvelle catégorie
    const createCategory = async () => {
      if (!newCategoryName.value.trim()) return;
      
      addCategoryStatus.value = 'loading';
      addCategoryError.value = '';
      
      try {
        // Créer un slug à partir du nom
        const slug = newCategoryName.value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Créer la payload selon la structure attendue par Mealie
        const categoryPayload = {
          name: newCategoryName.value.trim(),
          slug: slug
        };
        
        // Appel à l'API pour créer la catégorie
        const response = await recipeService.createCategory(categoryPayload);
        
        if (response && response.data) {
          // Ajouter la nouvelle catégorie à la liste
          const newCategory = response.data;
          categories.value.push(newCategory);
          recipeStore.addCategory(newCategory);
          
          // Ajouter automatiquement cette catégorie à la recette en cours si on est dans le formulaire
          if (showManualCreate.value) {
            newRecipe.value.recipeCategory.push({
              id: newCategory.id,
              name: newCategory.name,
              slug: newCategory.slug
            });
          }
          
          // Réinitialiser le formulaire
          newCategoryName.value = '';
          addCategoryStatus.value = 'success';
          
          // Fermer le modal après un court délai
          setTimeout(() => {
            showAddCategoryModal.value = false;
            addCategoryStatus.value = 'idle';
          }, 1500);
        }
      } catch (error) {
        console.error('Erreur lors de la création de la catégorie', error);
        addCategoryStatus.value = 'error';
        
        if (error.response && error.response.data) {
          addCategoryError.value = error.response.data.detail || 'Impossible de créer cette catégorie.';
        } else {
          addCategoryError.value = 'Erreur lors de la création. Veuillez réessayer.';
        }
      }
    };
    
    // Ajouter/retirer une catégorie à la recette en cours de création
    const toggleRecipeCategory = (category) => {
      if (!category || !category.id) return;
      
      const index = newRecipe.value.recipeCategory.findIndex(cat => cat && cat.id === category.id);
      if (index === -1) {
        // Ajouter la catégorie
        newRecipe.value.recipeCategory.push({
          id: category.id,
          name: category.name || 'Sans nom',
          slug: category.slug || ''
        });
      } else {
        // Retirer la catégorie
        newRecipe.value.recipeCategory.splice(index, 1);
      }
    };

    // Charge les détails des recettes par lots, de manière optimisée
    const loadRecipeDetailsInBatches = async (recipeList) => {
      const signal = abortController.signal;
      const totalRecipes = recipeList.length;
      let loadedRecipes = [];
      
      // Diviser les recettes en lots
      for (let i = 0; i < totalRecipes; i += BATCH_SIZE) {
        if (signal.aborted) return;
        
        const batch = recipeList.slice(i, i + BATCH_SIZE);
        
        // Processus de traitement par lot optimisé
        const batchPromises = batch.map(async (recipe) => {
          // Éviter les requêtes inutiles si les détails sont déjà chargés
          if (recipe._detailsLoaded) return recipe;
          
          try {
            const detailResponse = await recipeService.getBySlug(recipe.slug, { signal });
            return { ...recipe, ...detailResponse.data, _detailsLoaded: true };
          } catch (err) {
            if (!signal.aborted) {
              console.warn(`Erreur lors du chargement des détails pour ${recipe.name}:`, err);
            }
            return { ...recipe, _detailsLoaded: false };
          }
        });
        
        // Exécuter les requêtes en parallèle
        const batchResults = await Promise.all(batchPromises);
        
        // Ajouter ce lot au résultat et mettre à jour
        loadedRecipes = [...loadedRecipes, ...batchResults];
        
        // Optimisation: mettre à jour le store par lots, pas à chaque recette
        recipeStore.updateRecipes(batchResults);
        
        // Activer le mode "partiellement chargé" après le premier lot
        if (i === 0 && !partiallyLoaded.value) {
          partiallyLoaded.value = true;
          
          // Donner à l'interface utilisateur le temps de se mettre à jour
          await nextTick();
        }
      }
      
      return loadedRecipes;
    };

    onMounted(async () => {
      try {
        recipeStore.setLoading(true);
        
        // Vérifier si nous avons déjà des recettes récentes dans le store
        const hasRecentRecipes = recipeStore.hasRecipes;
        
        if (hasRecentRecipes) {
          partiallyLoaded.value = true;
          await nextTick();
          recipeStore.setLoading(false);
          
          // Rafraîchissement en arrière-plan pour avoir les données à jour
          recipeService.getAll().then(listResponse => {
            const recipeList = listResponse.data.items;
            recipeStore.refreshBasicRecipes(recipeList);
          }).catch(err => console.warn('Erreur lors du rafraîchissement en arrière-plan', err));
          
          return;
        }

        // Récupération rapide de la liste des recettes
        const listResponse = await recipeService.getAll();
        const recipeList = listResponse.data.items;
        
        // Mettre à jour avec les informations de base immédiatement
        recipeStore.setBasicRecipes(recipeList);
        partiallyLoaded.value = true;
        await nextTick();
        
        // Charger les détails par lots en arrière-plan
        await loadRecipeDetailsInBatches(recipeList);
      } catch (error) {
        console.error('Erreur de chargement', error);
        recipeStore.setError(error);
      } finally {
        recipeStore.setLoading(false);
      }
    });
    
    // Nettoyer les requêtes en cours si le composant est démonté
    onUnmounted(() => {
      abortController.abort();
    });

    // Gérer le changement d'état favori
    const handleFavoriteToggle = ({ recipeId, isFavorite }) => {
      // La mise à jour du store est déjà gérée dans le composant RecipeCard
      // Ici, on peut ajouter une logique supplémentaire si nécessaire
      console.log(`Recette ${recipeId} est maintenant ${isFavorite ? 'favorite' : 'non favorite'}`);
    };

    // Filtrer les recettes avec une recherche optimisée
    const filteredRecipes = computed(() => {
      if (!searchQuery.value.trim()) return recipeStore.recipes;
      
      const query = searchQuery.value.toLowerCase().trim();
      const terms = query.split(/\s+/).filter(term => term.length > 0);
      
      // Recherche multi-termes plus intelligente
      if (terms.length === 0) return recipeStore.recipes;
      
      return recipeStore.recipes.filter(recipe => {
        // Score de pertinence
        let score = 0;
        const name = recipe.name.toLowerCase();
        const description = recipe.description?.toLowerCase() || '';
        
        for (const term of terms) {
          // Nom correspond exactement (score élevé)
          if (name === term) score += 10;
          // Nom commence par le terme (score élevé)
          if (name.startsWith(term)) score += 8;
          // Nom contient le terme (score moyen)
          if (name.includes(term)) score += 5;
          // Description contient le terme (score bas)
          if (description.includes(term)) score += 2;
          // Tags contiennent le terme
          if (recipe.tags?.some(tag => tag.name?.toLowerCase()?.includes(term))) score += 3;
          // Catégories contiennent le terme
          if (recipe.recipeCategory?.some(cat => cat.name?.toLowerCase()?.includes(term))) score += 4;
        }
        
        return score > 0;
      }).sort((a, b) => {
        // Tri par pertinence en fonction du nom qui contient les termes
        const aContains = terms.every(term => a.name.toLowerCase().includes(term));
        const bContains = terms.every(term => b.name.toLowerCase().includes(term));
        
        if (aContains && !bContains) return -1;
        if (!aContains && bContains) return 1;
        return 0;
      });
    });
    
    // Recettes à afficher selon le mode actif (tous, favoris, ou catégorie)
    const displayedRecipes = computed(() => {
      // Filtrer d'abord selon la recherche
      let filtered = filteredRecipes.value || [];
      
      // Filtrer selon la catégorie sélectionnée
      if (selectedCategory.value) {
        filtered = filtered.filter(recipe => {
          // Vérifier que recipe et recipeCategory existent et sont valides
          if (!recipe || !recipe.recipeCategory) return false;
          
          // Vérifier que recipeCategory est un tableau
          if (!Array.isArray(recipe.recipeCategory)) return false;
          
          // Filtrer les recettes qui contiennent la catégorie sélectionnée
          return recipe.recipeCategory.some(cat => cat && cat.id === selectedCategory.value);
        });
      }
      
      // Puis filtrer selon le mode d'affichage actif
      if (activeView.value === 'favorites') {
        return filtered.filter(recipe => recipe && recipe.id && recipeStore.isFavorite(recipe.id));
      }
      
      return filtered;
    });

    // Navigation avec préchargement
    const viewRecipe = (recipeOrId) => {
      // Déterminez si nous avons reçu un objet ou juste un ID
      const isObject = typeof recipeOrId === 'object' && recipeOrId !== null;
      
      // Si c'est juste un ID, récupérez l'objet complet depuis le store
      const recipe = isObject ? recipeOrId : recipeStore.getRecipeById(recipeOrId);
      
      if (!recipe) {
        console.error("Recette invalide ou introuvable");
        return;
      }
      
      recipeStore.setCurrentRecipe(recipe);
      
      if (!recipe._detailsLoaded) {
        // Utilisez le slug si disponible, sinon l'ID
        const identifier = recipe.slug || recipe.id;
        if (identifier) {
          recipeService.getBySlug(identifier)
            .then(response => {
              recipeStore.updateRecipe(recipe.id, { 
                ...response.data,
                _detailsLoaded: true 
              });
            })
            .catch(err => console.warn('Erreur de préchargement', err));
        }
      }
      
      // Assurez-vous d'utiliser le bon identifiant pour la navigation
      router.push(`/recipes/${recipe.id}`);
    };
    
    // Observer les changements dans la recherche pour revenir à "toutes les recettes" si nécessaire
    watch(searchQuery, (newValue) => {
      if (newValue && activeView.value === 'favorites' && 
          displayedRecipes.value.length === 0 && recipeStore.favoriteRecipes.length > 0) {
        // Si on cherche quelque chose et qu'il n'y a pas de favoris correspondants, revenir à tous
        activeView.value = 'all';
      }
    });

    const planRecipe = (recipe) => {
      // Naviguez vers le planificateur et passez la recette
      router.push({
        name: 'planner', 
        query: { 
          recipeId: recipe.id, 
          recipeName: recipe.name 
        }
      });
    };

    const shopRecipe = (recipe) => {
      // Ajoutez la recette à la liste de courses
      try {
        // Utilisez le service approprié pour ajouter les ingrédients à la liste de courses
        shoppingService.addRecipeToShoppingList(recipe.id);
        
        // Naviguez vers la liste de courses
        router.push('/shopping');
      } catch (error) {
        console.error('Erreur lors de l\'ajout à la liste de courses', error);
        // Optionnel : affichez un toast d'erreur
      }
    };

    // Méthode importFromUrl avec route correcte pour votre application
    const importFromUrl = async () => {
      if (!recipeUrl.value) return;
      
      urlImportStatus.value = 'loading';
      urlImportError.value = '';
      
      try {
        // Appel à l'API Mealie pour importer depuis une URL
        const response = await recipeService.importRecipeFromUrl(recipeUrl.value);
        
        console.log("Réponse d'importation complète:", response);
        
        if (response && response.data) {
          // Succès de l'importation
          urlImportStatus.value = 'success';
          
          // Analyse complète de la réponse pour trouver l'ID ou le slug
          const responseData = response.data;
          
          // Essayer de localiser l'ID ou le slug dans différentes structures possibles
          let recipeId = null;
          let slug = null;
          
          // Tentative 1: Slug direct (préféré pour la route edit)
          if (responseData.slug) {
            slug = responseData.slug;
            recipeId = responseData.id || responseData.slug;
          } 
          // Tentative 2: ID direct
          else if (responseData.id) {
            recipeId = responseData.id;
            // Si pas de slug mais ID, on peut parfois utiliser l'ID comme slug
            slug = responseData.id;
          }
          // Tentative 3: Objet recipe imbriqué
          else if (responseData.recipe) {
            if (responseData.recipe.slug) {
              slug = responseData.recipe.slug;
              recipeId = responseData.recipe.id || responseData.recipe.slug;
            } else if (responseData.recipe.id) {
              recipeId = responseData.recipe.id;
              slug = responseData.recipe.id;
            }
          }
          // Tentative 4: Vérifier si la réponse est une chaîne (parfois l'ID est directement retourné)
          else if (typeof responseData === 'string' && responseData.trim() !== '') {
            recipeId = responseData;
            slug = responseData;
          }
          
          if (slug || recipeId) {
            // Utiliser le slug si disponible, sinon l'ID
            const routeParam = slug || recipeId;
            console.log("Paramètre de route identifié:", routeParam);
            
            // Réinitialiser le formulaire
            setTimeout(() => {
              recipeUrl.value = '';
              urlImportStatus.value = 'idle';
              showUrlImport.value = false;
              
              // Utiliser la route nommée 'recipe-edit' qui attend un paramètre 'slug'
              router.push({
                name: 'recipe-edit',
                params: { slug: routeParam }
              });
            }, 1500);
          } else {
            console.error("Impossible de déterminer l'identifiant de la recette importée:", responseData);
            
            // Même sans identifiant, on peut considérer que l'importation a réussi
            setTimeout(() => {
              recipeUrl.value = '';
              urlImportStatus.value = 'idle';
              showUrlImport.value = false;
              
              // Rediriger vers la liste des recettes (route principale)
              router.push({ name: 'recipes' });
              
              // Et rafraîchir les données
              recipeStore.setLoading(true);
              recipeService.getAll().then(response => {
                if (response.data && response.data.items) {
                  recipeStore.setBasicRecipes(response.data.items);
                }
                recipeStore.setLoading(false);
              }).catch(err => {
                console.error("Erreur lors du rechargement des recettes:", err);
                recipeStore.setLoading(false);
              });
            }, 1500);
          }
        } else {
          // Réponse vide ou invalide
          throw new Error('Réponse invalide de l\'API lors de l\'importation');
        }
      } catch (error) {
        console.error('Erreur lors de l\'importation de la recette', error);
        urlImportStatus.value = 'error';
        
        if (error.response && error.response.data) {
          // Récupération du message d'erreur de l'API
          urlImportError.value = error.response.data.detail || 'Impossible d\'importer cette recette. Vérifiez l\'URL.';
        } else {
          urlImportError.value = 'Erreur lors de l\'importation. Vérifiez l\'URL et réessayez.';
        }
      }
    };
    
    // Méthodes pour la création manuelle de recettes
    const addIngredient = () => {
      newRecipe.value.recipeIngredient.push('');
    };
    
    const removeIngredient = (index) => {
      newRecipe.value.recipeIngredient.splice(index, 1);
      // Toujours garder au moins un ingrédient
      if (newRecipe.value.recipeIngredient.length === 0) {
        newRecipe.value.recipeIngredient.push('');
      }
    };
    
    const addInstruction = () => {
      newRecipe.value.recipeInstructions.push({ text: '' });
    };
    
    const removeInstruction = (index) => {
      newRecipe.value.recipeInstructions.splice(index, 1);
      // Toujours garder au moins une instruction
      if (newRecipe.value.recipeInstructions.length === 0) {
        newRecipe.value.recipeInstructions.push({ text: '' });
      }
    };
    
    const createRecipeManually = async () => {
      // Validation basique
      if (!newRecipe.value.name) return;
      
      manualCreateStatus.value = 'loading';
      manualCreateError.value = '';
      
      try {
        // Nettoyage des ingrédients et instructions vides
        const cleanIngredients = newRecipe.value.recipeIngredient.filter(ing => ing.trim() !== '');
        const cleanInstructions = newRecipe.value.recipeInstructions
          .filter(ins => ins.text.trim() !== '')
          .map((ins, index) => ({ 
            ...ins, 
            position: index + 1 // Ajouter la position
          }));
        
        // Calcul du temps total
        const prepTime = newRecipe.value.prepTime || 0;
        const cookTime = newRecipe.value.cookTime || 0;
        const totalTime = prepTime + cookTime;
        
        // Création du slug à partir du nom
        const slug = newRecipe.value.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        
        // Construction du payload conforme à l'API Mealie
        const recipePayload = {
          name: newRecipe.value.name,
          description: newRecipe.value.description || '',
          prepTime: prepTime,
          cookTime: cookTime,
          totalTime: totalTime,
          recipeYield: newRecipe.value.recipeYield || null,
          recipeIngredient: cleanIngredients,
          recipeInstructions: cleanInstructions,
          slug: slug,
          recipeCategory: newRecipe.value.recipeCategory, // Inclure les catégories
          // Autres champs optionnels
          categories: [],
          tags: [],
          notes: [],
          dateAdded: new Date().toISOString(),
          dateUpdated: new Date().toISOString()
        };
        
        // Appel à l'API pour créer la recette
        const response = await recipeService.createRecipe(recipePayload);
        
        if (response && response.data) {
          // Succès de la création
          manualCreateStatus.value = 'success';
          
          // Mise à jour du store
          const newRecipeData = response.data;
          recipeStore.addRecipe(newRecipeData);
          
          // Réinitialisation du formulaire après quelques secondes
          setTimeout(() => {
            newRecipe.value = {
              name: '',
              description: '',
              prepTime: null,
              cookTime: null,
              recipeYield: 4,
              recipeIngredient: ['', ''],
              recipeInstructions: [
                { text: '' },
                { text: '' }
              ],
              recipeCategory: []
            };
            manualCreateStatus.value = 'idle';
            showManualCreate.value = false;
            
            // Rediriger vers la recette nouvellement créée
            router.push(`/recipes/${newRecipeData.id}`);
          }, 1500);
        }
      } catch (error) {
        console.error('Erreur lors de la création de la recette', error);
        manualCreateStatus.value = 'error';
        
        if (error.response && error.response.data) {
          manualCreateError.value = error.response.data.detail || 'Impossible de créer cette recette. Vérifiez les informations.';
        } else {
          manualCreateError.value = 'Erreur lors de la création. Vérifiez les informations et réessayez.';
        }
      }
    };

    return {
      recipeStore,
      partiallyLoaded,
      searchQuery,
      filteredRecipes,
      displayedRecipes,
      activeView,
      viewRecipe,
      debouncedSearch,
      planRecipe,
      shopRecipe,
      handleFavoriteToggle,
      showScrollToTop,
      scrollToTop,
      
      // États et méthodes pour l'ajout de recettes
      showAddRecipeModal,
      showUrlImport,
      showManualCreate,
      recipeUrl,
      urlImportStatus,
      urlImportError,
      manualCreateStatus,
      manualCreateError,
      newRecipe,
      
      importFromUrl,
      createRecipeManually,
      addIngredient,
      removeIngredient,
      addInstruction,
      removeInstruction,
      
      // Catégories
      categories,
      selectedCategory,
      showCategoriesFilter,
      selectCategory,
      clearCategoryFilter,
      
      // Modal catégorie
      showAddCategoryModal,
      newCategoryName,
      addCategoryStatus,
      addCategoryError,
      createCategory,
      toggleRecipeCategory
    };
  }
};
</script>