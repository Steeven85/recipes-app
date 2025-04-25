<template>
  <div class="bg-gray-50 min-h-screen pb-16">
    <!-- En-tête avec effet de parallaxe léger -->
    <div class="bg-gradient-to-r from-emerald-600 to-emerald-500 relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 class="text-3xl font-bold text-white">
            Mes Recettes
          </h1>
          
          <!-- Bouton élégant pour ajouter une recette -->
          <button 
            class="bg-white text-emerald-600 px-5 py-3 rounded-lg hover:bg-gray-50 transition-all transform hover:scale-105 shadow-md flex items-center group"
            @click="openRecipeCreateWizard"
          >
            <span class="mr-2">Ajouter une recette</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 transition-transform group-hover:rotate-90"
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
          </button>
        </div>
      </div>
      <!-- Formes décoratives -->
      <div class="absolute bottom-0 left-0 right-0 h-12 bg-gray-50 transform -translate-y-1/2 rounded-t-full opacity-20"></div>
    </div>

    <!-- Contenu principal -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4">
      <!-- Carte pour la recherche et les filtres -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-8 transition-all">
        <!-- Barre de recherche redessinée -->
        <div class="relative mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher une recette..."
            class="w-full border-0 bg-gray-50 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
            @input="debouncedSearch"
          >
        </div>

        <!-- Vue en onglets pour Tous/Favoris -->
        <div class="flex mb-6 border-b">
          <button 
            class="px-4 py-2 mr-2 border-b-2 font-medium text-sm transition-colors"
            :class="activeView === 'all' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeView = 'all'"
          >
            Toutes les recettes
          </button>
          <button 
            class="px-4 py-2 border-b-2 font-medium text-sm flex items-center transition-colors"
            :class="activeView === 'favorites' ? 'border-red-500 text-red-500' : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeView = 'favorites'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-4 w-4 mr-1"
              :class="activeView === 'favorites' ? 'fill-current' : ''"
              viewBox="0 0 20 20"
              :fill="activeView === 'favorites' ? 'currentColor' : 'none'"
              stroke="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                clip-rule="evenodd"
              />
            </svg>
            Favoris
            <span
              v-if="recipeStore.favoritesCount > 0"
              class="ml-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs font-medium"
            >
              {{ recipeStore.favoritesCount }}
            </span>
          </button>
        </div>

        <!-- Filtre par catégories modernisé -->
        <div>
          <button 
            class="flex items-center text-emerald-600 font-medium mb-2"
            @click="showCategoriesFilter = !showCategoriesFilter"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <span>Filtrer par catégorie</span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              class="h-5 w-5 ml-1 transition-transform" 
              :class="showCategoriesFilter ? 'transform rotate-180' : ''"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          
          <!-- Section d'affichage de la catégorie sélectionnée -->
          <div
            v-if="selectedCategory"
            class="flex items-center bg-emerald-50 text-emerald-700 rounded-full px-3 py-1 inline-flex mb-2"
          >
            <span class="text-sm mr-2">
              {{ (categories.find(c => c && c.id === selectedCategory)?.name) || 'Catégorie inconnue' }}
            </span>
            <button 
              class="text-emerald-500 hover:text-emerald-700"
              title="Effacer le filtre"
              @click="clearCategoryFilter"
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
        </div>
      </div>

      <!-- Panneau déroulant des catégories -->
      <div 
        v-show="showCategoriesFilter"
        class="bg-white rounded-xl shadow-md p-6 mb-8 transition-all duration-300 transform"
        :class="showCategoriesFilter ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'"
      >
        <div
          v-if="recipeStore.loading && categories.length === 0"
          class="text-center py-6"
        >
          <Spinner class="mx-auto h-8 w-8 text-emerald-600" />
        </div>
        <div
          v-else-if="categories.length === 0"
          class="text-gray-500 text-center py-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-12 w-12 mx-auto text-gray-400 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p>Aucune catégorie trouvée</p>
          <button
            class="mt-3 text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center"
            @click="showAddCategoryModal = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mr-1"
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
            Créer une catégorie
          </button>
        </div>
        <div
          v-else
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          <button 
            v-for="(category, index) in categories" 
            :key="category?.id || `category-${index}`"
            class="px-4 py-3 rounded-lg text-sm text-center transition-all transform hover:scale-105 truncate"
            :class="selectedCategory === (category?.id || '') 
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'"
            @click="category && category.id && selectCategory(category.id)"
          >
            {{ category?.name || 'Catégorie sans nom' }}
            <span
              v-if="category?.count"
              class="ml-1 text-xs font-medium"
              :class="selectedCategory === (category?.id || '') ? 'text-emerald-100' : 'text-gray-500'"
            >
              ({{ category.count }})
            </span>
          </button>
          
          <!-- Bouton pour ajouter une catégorie -->
          <button
            class="px-4 py-3 rounded-lg text-sm text-center border-2 border-dashed border-gray-300 text-gray-500 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
            @click="showAddCategoryModal = true"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5 mx-auto mb-1"
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
            Ajouter une catégorie
          </button>
        </div>
      </div>

      <!-- Chargement initial -->
      <div
        v-if="recipeStore.loading && !partiallyLoaded"
        class="flex flex-col items-center justify-center py-16"
      >
        <Spinner class="h-12 w-12 text-emerald-600 mb-4" />
        <p class="text-gray-500">Chargement de vos recettes en cours...</p>
      </div>

      <!-- Indicateur de chargement en arrière-plan -->
      <div
        v-if="recipeStore.loading && partiallyLoaded"
        class="fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-3 z-30"
      >
        <Spinner class="h-6 w-6 text-emerald-600" />
      </div>

      <!-- Aucune recette trouvée - design amélioré -->
      <div
        v-if="!recipeStore.loading && displayedRecipes.length === 0"
        class="bg-white rounded-xl shadow-md p-8 text-center"
      >
        <div class="max-w-md mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-16 w-16 mx-auto text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="1.5"
              d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
            />
          </svg>
          
          <p class="text-xl font-medium text-gray-700 mb-2">
            <span v-if="activeView === 'favorites'">Aucune recette favorite.</span>
            <span v-else-if="selectedCategory">Aucune recette dans cette catégorie.</span>
            <span v-else>Aucune recette trouvée.</span>
          </p>
          
          <p class="text-gray-500 mb-6">
            <span v-if="activeView === 'favorites'">
              Ajoutez des recettes à vos favoris pour les retrouver facilement.
            </span>
            <span v-else-if="selectedCategory">
              Essayez une autre catégorie ou ajoutez de nouvelles recettes.
            </span>
            <span v-else-if="searchQuery">
              Essayez d'autres termes de recherche ou explorez toutes vos recettes.
            </span>
            <span v-else>
              Commencez par ajouter votre première recette ci-dessous.
            </span>
          </p>
          
          <div class="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              v-if="activeView === 'favorites' || selectedCategory"
              class="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors inline-flex items-center justify-center"
              @click="activeView = 'all'; clearCategoryFilter()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
              Voir toutes les recettes
            </button>
            
            <button 
              class="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-flex items-center justify-center shadow-md"
              @click="openRecipeCreateWizard"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-1"
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
              Ajouter une recette
            </button>
          </div>
        </div>
      </div>

      <!-- Liste des recettes améliorée -->
      <div
        v-if="displayedRecipes.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <RecipeCard 
          v-for="recipe in displayedRecipes" 
          :key="recipe.id"
          :recipe="recipe"
          @view="viewRecipe"
          @plan="planRecipe"
          @shop="shopRecipe"
          @favorite-toggle="handleFavoriteToggle"
          class="transform transition-transform hover:scale-102"
        />
      </div>
    </div>

    <!-- FAB revisité pour retourner en haut -->
    <div 
      v-if="showScrollToTop" 
      class="fixed bottom-6 right-6 flex flex-col gap-3 z-30"
    >
      <button 
        class="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors transform hover:scale-110"
        aria-label="Ajouter une recette"
        @click="openRecipeCreateWizard"
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </button>

      <button 
        class="bg-white text-emerald-600 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-colors transform hover:scale-110"
        aria-label="Retourner en haut de la page"
        @click="scrollToTop"
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
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>

    <!-- Modal pour ajouter une recette - style amélioré -->
    <div
      v-if="showAddRecipeModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div 
        class="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all"
        :class="showAddRecipeModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
      >
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">
              Ajouter une recette
            </h2>
            <button
              class="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
              @click="showAddRecipeModal = false"
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
            <button 
              class="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-emerald-300 transition-colors"
              @click="showUrlImport = true; showAddRecipeModal = false"
            >
              <div class="flex items-center">
                <div class="bg-emerald-100 rounded-lg p-3 mr-4">
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
                </div>
                <div class="text-left">
                  <h3 class="font-medium text-gray-900">Importer depuis une URL</h3>
                  <p class="text-sm text-gray-500">Récupérer une recette depuis un site web</p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            <button 
              class="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-emerald-300 transition-colors"
              @click="showManualCreate = true; showAddRecipeModal = false"
            >
              <div class="flex items-center">
                <div class="bg-emerald-100 rounded-lg p-3 mr-4">
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
                </div>
                <div class="text-left">
                  <h3 class="font-medium text-gray-900">Créer manuellement</h3>
                  <p class="text-sm text-gray-500">Saisir tous les détails de votre recette</p>
                </div>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal pour ajouter une catégorie - style amélioré -->
    <div
      v-if="showAddCategoryModal"
      class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    >
      <div 
        class="bg-white rounded-xl shadow-xl w-full max-w-md transform transition-all"
        :class="showAddCategoryModal ? 'scale-100 opacity-100' : 'scale-95 opacity-0'"
      >
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-xl font-semibold text-gray-800">
              Nouvelle catégorie
            </h2>
            <button
              class="text-gray-500 hover:text-gray-700 rounded-full p-1 hover:bg-gray-100 transition-colors"
              @click="showAddCategoryModal = false"
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
            v-if="addCategoryStatus === 'error'"
            class="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4"
          >
            <div class="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
              {{ addCategoryError }}
            </div>
          </div>

          <div
            v-if="addCategoryStatus === 'success'"
            class="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4"
          >
            <div class="flex">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clip-rule="evenodd"
                />
              </svg>
              Catégorie créée avec succès !
            </div>
          </div>

          <form @submit.prevent="createCategory" class="space-y-4">
            <div>
              <label
                for="category-name"
                class="block text-sm font-medium text-gray-700 mb-1"
              >Nom de la catégorie</label>
              <input
                id="category-name"
                v-model="newCategoryName"
                type="text"
                placeholder="Ex: Desserts, Entrées, Plats principaux..."
                class="w-full border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none transition-colors"
                required
              >
              <p class="mt-1 text-sm text-gray-500">Choisissez un nom clair et descriptif.</p>
            </div>

            <div class="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                :disabled="addCategoryStatus === 'loading'"
                @click="showAddCategoryModal = false"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="bg-emerald-600 text-white px-5 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center min-w-[120px]"
                :disabled="addCategoryStatus === 'loading'"
              >
                <svg
                  v-if="addCategoryStatus === 'loading'"
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
                <span v-if="addCategoryStatus === 'loading'">Création...</span>
                <span v-else>Créer</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Wizard de création de recette -->
    <RecipeCreateWizard 
      v-if="showRecipeCreateWizard" 
      @close="showRecipeCreateWizard = false"
      @recipe-created="handleRecipeCreated"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { recipeService, shoppingService } from '@/services/api';
import { useRecipeStore } from '../stores/recipeStore';
import Spinner from '../components/Spinner.vue';
import RecipeCard from '../components/RecipeCard.vue';
import RecipeCreateWizard from '../components/RecipeCreateWizard.vue';

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
    RecipeCard,
    RecipeCreateWizard
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
      performTime: null,
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
      // Naviguez vers le planificateur en transmettant seulement les infos de la recette
      router.push({
        name: 'planner', 
        query: { 
          recipeId: recipe.id, 
          recipeName: recipe.name,
          showDateSelector: 'true' // Ajout d'un flag pour ouvrir le sélecteur de date
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

   
    // Méthodes pour la création manuelle de recettes
    const addIngredient = () => {
      newRecipe.value.recipeIngredient.push('');
    };
    

    // État pour le wizard de création de recette
    const showRecipeCreateWizard = ref(false);
    
    // Gestionnaire pour ouvrir le wizard au lieu du modal existant
    const openRecipeCreateWizard = () => {
      showRecipeCreateWizard.value = true;
      showAddRecipeModal.value = false; // Fermer l'ancien modal si ouvert
    };
    
    // Gestionnaire pour la création réussie d'une recette
    const handleRecipeCreated = (recipeId) => {
      // Rafraîchir la liste des recettes
      recipeStore.setLoading(true);
      recipeService.getAll().then(response => {
        if (response.data && response.data.items) {
          recipeStore.refreshBasicRecipes(response.data.items);
        }
        recipeStore.setLoading(false);
      }).catch(err => {
        console.error("Erreur lors du rechargement des recettes:", err);
        recipeStore.setLoading(false);
      });
      
      // Fermer le wizard
      showRecipeCreateWizard.value = false;
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
        const performTime = newRecipe.value.performTime || 0;
        const totalTime = prepTime + performTime;
        
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
          performTime: performTime,
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
              performTime: null,
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
      toggleRecipeCategory,
      showRecipeCreateWizard,
      openRecipeCreateWizard,
      handleRecipeCreated
    };
  }
};
</script>