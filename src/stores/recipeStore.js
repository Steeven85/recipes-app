import { defineStore } from 'pinia';

export const useRecipeStore = defineStore('recipes', {
  state: () => ({
    // Recettes et leurs métadonnées
    allRecipes: [],
    currentRecipe: null,
    favorites: [],
    
    // États de chargement et cache
    loading: false,
    detailsLoading: false,
    error: null,
    lastFetched: null,
    cacheDuration: 15 * 60 * 1000, // 15 minutes en millisecondes
    
    // Index pour recherche rapide
    recipeIdIndex: new Map(),  // Permet O(1) access par ID
    
    // Nouvelle propriété pour la gestion des catégories
    categoryRecipes: {}, // Stockage des recettes par ID de catégorie
    categories: [],      // Liste de toutes les catégories disponibles
    selectedCategory: null, // Catégorie actuellement sélectionnée
  }),
  
  getters: {
    // Alias pour rétrocompatibilité
    recipes: (state) => state.allRecipes,
    
    // Vérification du cache avec détection de date d'expiration
    hasRecipes: (state) => {
      return state.allRecipes.length > 0 && 
        state.lastFetched && 
        (Date.now() - state.lastFetched < state.cacheDuration);
    },
    
    // Optimisé: O(1) recherche par ID au lieu de O(n)
    getRecipeById: (state) => (id) => {
      // Vérifier d'abord dans currentRecipe pour un accès ultra-rapide
      if (state.currentRecipe && state.currentRecipe.id === id) {
        return state.currentRecipe;
      }
      
      // Utiliser l'index pour O(1) au lieu de .find() qui est O(n)
      return state.recipeIdIndex.get(id) || 
             state.allRecipes.find(recipe => recipe.id === id);
    },
    
    // Vérifier si tous les détails sont chargés
    allDetailsLoaded: (state) => {
      return state.allRecipes.every(recipe => recipe._detailsLoaded === true);
    },
    
    // Ajoutez une vérification de sécurité pour s'assurer que favorites existe
    favoritesSet: (state) => {
      return new Set(state.favorites || []);
    },
    
    // Modifiez également le getter isFavorite pour plus de sécurité
    isFavorite: (state) => (id) => {
      if (!state.favorites) return false;
      return state.favorites.includes(id);
    },

    favoriteRecipes: (state) => {
      // Utiliser un Set pour vérification O(1)
      const favSet = new Set(state.favorites);
      return state.allRecipes.filter(recipe => favSet.has(recipe.id));
    },
    
    favoritesCount: (state) => {
      return state.favorites.length;
    },
    
    // Ajout: index de recherche par mots-clés
    searchIndex: (state) => {
      const index = new Map();
      
      state.allRecipes.forEach(recipe => {
        // Extraire les termes de recherche pertinents
        const terms = [
          ...recipe.name.toLowerCase().split(/\s+/),
          ...(recipe.description?.toLowerCase().split(/\s+/) || []),
          ...(recipe.tags?.map(tag => tag.name?.toLowerCase()) || [])
        ].filter(Boolean);
        
        // Indexer chaque terme
        terms.forEach(term => {
          if (!index.has(term)) {
            index.set(term, new Set());
          }
          index.get(term).add(recipe.id);
        });
      });
      
      return index;
    },
    
    // NOUVELLES MÉTHODES POUR LES CATÉGORIES
    
    // Recettes pour une catégorie spécifique
    getRecipesByCategory: (state) => (categoryId) => {
      // Si nous avons déjà chargé les recettes pour cette catégorie
      if (state.categoryRecipes[categoryId] && state.categoryRecipes[categoryId].length > 0) {
        return state.categoryRecipes[categoryId];
      }
      
      // Sinon, filtrer les recettes existantes
      return state.allRecipes.filter(recipe => 
        recipe.recipeCategory && 
        recipe.recipeCategory.some(cat => cat.id === categoryId)
      );
    },
    
    // Récupérer une catégorie par son ID
    getCategoryById: (state) => (categoryId) => {
      return state.categories.find(cat => cat.id === categoryId);
    },
    
    // Vérifier si une recette appartient à une catégorie
    recipeHasCategory: (state) => (recipeId, categoryId) => {
      const recipe = state.allRecipes.find(r => r.id === recipeId);
      return recipe && 
             recipe.recipeCategory && 
             recipe.recipeCategory.some(cat => cat.id === categoryId);
    },
    
    // Obtenir toutes les catégories utilisées dans les recettes actuelles
    usedCategories: (state) => {
      const categoryMap = new Map();
      
      state.allRecipes.forEach(recipe => {
        if (recipe.recipeCategory && recipe.recipeCategory.length > 0) {
          recipe.recipeCategory.forEach(category => {
            if (!categoryMap.has(category.id)) {
              categoryMap.set(category.id, {
                ...category,
                count: 1
              });
            } else {
              const existing = categoryMap.get(category.id);
              categoryMap.set(category.id, {
                ...existing,
                count: (existing.count || 0) + 1
              });
            }
          });
        }
      });
      
      return Array.from(categoryMap.values());
    }
  },
  
  actions: {
    // === Actions de chargement des recettes ===
    
    // Définir les recettes de base (sans détails)
    setBasicRecipes(recipes) {
      const basicRecipes = recipes.map(recipe => ({
        ...recipe,
        _detailsLoaded: false
      }));
      
      this.allRecipes = basicRecipes;
      this._rebuildIndex();
      this.lastFetched = Date.now();
      this.detailsLoading = true;
    },
    
    // Rafraîchir les recettes de base sans perdre les détails déjà chargés
    refreshBasicRecipes(recipes) {
      // Créer un dictionnaire des nouvelles recettes
      const newRecipesDict = {};
      recipes.forEach(recipe => {
        newRecipesDict[recipe.id] = recipe;
      });
      
      // Fusionner avec les données existantes
      this.allRecipes = this.allRecipes.map(existingRecipe => {
        const newData = newRecipesDict[existingRecipe.id];
        if (!newData) return existingRecipe; // Garder l'existant si pas de mise à jour
        
        delete newRecipesDict[existingRecipe.id]; // Marquer comme traité
        
        // Fusionner en préservant les détails
        return {
          ...newData,
          // Préserver les champs détaillés si déjà chargés
          ...(existingRecipe._detailsLoaded ? {
            recipeIngredient: existingRecipe.recipeIngredient,
            recipeInstructions: existingRecipe.recipeInstructions,
            nutrition: existingRecipe.nutrition,
            _detailsLoaded: true
          } : { _detailsLoaded: false })
        };
      });
      
      // Ajouter les nouvelles recettes qui n'existaient pas avant
      const newRecipes = Object.values(newRecipesDict).map(recipe => ({
        ...recipe,
        _detailsLoaded: false
      }));
      
      if (newRecipes.length > 0) {
        this.allRecipes = [...this.allRecipes, ...newRecipes];
      }
      
      this._rebuildIndex();
      this.lastFetched = Date.now();
    },
    
    // Définir les recettes complètes (avec détails)
    setRecipes(recipes) {
      const completeRecipes = recipes.map(recipe => ({
        ...recipe,
        _detailsLoaded: true
      }));
      
      this.allRecipes = completeRecipes;
      this._rebuildIndex();
      this.lastFetched = Date.now();
      this.detailsLoading = false;
    },
    
    // Mettre à jour progressivement les recettes (pour le chargement par lots)
    updateRecipes(updatedRecipes) {
      // Utiliser un Map pour une recherche O(1)
      const updatedDict = new Map();
      updatedRecipes.forEach(recipe => {
        updatedDict.set(recipe.id, { ...recipe, _detailsLoaded: true });
      });
      
      this.allRecipes = this.allRecipes.map(recipe => {
        return updatedDict.get(recipe.id) || recipe;
      });
      
      this._rebuildIndex();
      this.lastFetched = Date.now();
      
      if (this.allRecipes.every(recipe => recipe._detailsLoaded)) {
        this.detailsLoading = false;
      }
    },
    
    // Méthode interne pour reconstruire l'index d'ID
    _rebuildIndex() {
      // Reconstruire l'index pour une recherche O(1)
      this.recipeIdIndex.clear();
      this.allRecipes.forEach(recipe => {
        this.recipeIdIndex.set(recipe.id, recipe);
      });
    },
    
    // === Actions de gestion d'une recette spécifique ===
    
    // Définir la recette actuellement consultée
    setCurrentRecipe(recipe) {
      this.currentRecipe = recipe;
    },
    
    // Mise à jour d'une recette spécifique optimisée
    updateRecipe(id, updatedData) {
      // Mise à jour dans l'index d'abord (O(1)) si il existe
      const indexedRecipe = this.recipeIdIndex.get(id);
      if (indexedRecipe) {
        const updatedRecipe = { ...indexedRecipe, ...updatedData };
        this.recipeIdIndex.set(id, updatedRecipe);
      }
      
      // Mise à jour dans le tableau principal
      const index = this.allRecipes.findIndex(recipe => recipe.id === id);
      if (index !== -1) {
        this.allRecipes[index] = { ...this.allRecipes[index], ...updatedData };
      }
      
      // Si c'est la recette actuelle, mettre à jour aussi
      if (this.currentRecipe && this.currentRecipe.id === id) {
        this.currentRecipe = { ...this.currentRecipe, ...updatedData };
      }
    },
    
    // Ajout d'une seule recette
    addRecipe(recipe) {
      // Vérifier d'abord dans l'index O(1)
      if (this.recipeIdIndex.has(recipe.id)) {
        this.updateRecipe(recipe.id, { ...recipe, _detailsLoaded: true });
      } else {
        // Ajouter la nouvelle recette
        const newRecipe = { ...recipe, _detailsLoaded: true };
        this.allRecipes.push(newRecipe);
        this.recipeIdIndex.set(recipe.id, newRecipe);
      }
    },
    
    // Suppression d'une recette
    removeRecipe(id) {
      this.allRecipes = this.allRecipes.filter(recipe => recipe.id !== id);
      this.recipeIdIndex.delete(id);
      
      // Si la recette était en favoris, la retirer aussi
      this.removeFavorite(id);
      
      // Si c'était la recette courante, la réinitialiser
      if (this.currentRecipe && this.currentRecipe.id === id) {
        this.currentRecipe = null;
      }
    },
    
    // === Actions de gestion des favoris ===
    
    // Ajout d'une recette aux favoris avec optimisation Set
    addFavorite(id) {
      if (!this.favorites.includes(id)) {
        this.favorites.push(id);
        this.saveFavoritesToLocalStorage();
      }
    },
    
    // Retrait d'une recette des favoris
    removeFavorite(id) {
      const index = this.favorites.indexOf(id);
      if (index !== -1) {
        this.favorites.splice(index, 1);
        this.saveFavoritesToLocalStorage();
      }
    },
    
    // Bascule l'état favori d'une recette
    toggleFavorite(id) {
      const index = this.favorites.indexOf(id);
      if (index !== -1) {
        this.favorites.splice(index, 1);
      } else {
        this.favorites.push(id);
      }
      this.saveFavoritesToLocalStorage();
    },
    
    // === Actions de gestion du localStorage ===
    
    // Sauvegarde les favoris dans le localStorage avec gestion d'erreur améliorée
    saveFavoritesToLocalStorage() {
      try {
        localStorage.setItem('recipe-favorites', JSON.stringify(this.favorites));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des favoris :', error);
        // Tentative de nettoyage si dépassement de quota
        if (error.name === 'QuotaExceededError') {
          try {
            localStorage.removeItem('recipe-favorites');
            localStorage.setItem('recipe-favorites', JSON.stringify(this.favorites));
          } catch (retryError) {
            console.error('Échec après tentative de nettoyage :', retryError);
          }
        }
      }
    },
    
    // Charge les favoris depuis le localStorage avec validation
    loadFavoritesFromLocalStorage() {
      try {
        const savedFavorites = localStorage.getItem('recipe-favorites');
        if (savedFavorites) {
          const parsed = JSON.parse(savedFavorites);
          // Validation: s'assurer que c'est un tableau
          if (Array.isArray(parsed)) {
            this.favorites = parsed;
          } else {
            console.warn('Format de favoris incorrect, réinitialisation');
            this.favorites = [];
            this.saveFavoritesToLocalStorage();
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des favoris :', error);
        this.favorites = [];
      }
    },
    
    // === Actions d'utilité et de gestion d'état ===
    
    // Vider le cache avec nettoyage amélioré
    clearCache() {
      this.allRecipes = [];
      this.lastFetched = null;
      this.currentRecipe = null;
      this.recipeIdIndex.clear();
      this.categoryRecipes = {}; // Vider aussi le cache des catégories
    },
    
    // Définir l'état de chargement
    setLoading(value) {
      this.loading = value;
    },
    
    // Définir une erreur
    setError(error) {
      this.error = error;
    },
    
    // Initialiser le store
    init() {
      this.loadFavoritesFromLocalStorage();
    },
    
    // === NOUVELLES ACTIONS POUR LA GESTION DES CATÉGORIES ===
    
    // Définir les catégories disponibles
    setCategories(categories) {
      this.categories = categories;
    },
    
    // Sélectionner une catégorie pour le filtrage
    selectCategory(categoryId) {
      this.selectedCategory = categoryId;
    },
    
    // Mettre à jour les recettes pour une catégorie spécifique
    updateRecipesForCategory(categoryId, recipes) {
      // S'assurer que toutes les recettes ont le flag _detailsLoaded
      const processedRecipes = recipes.map(recipe => ({
        ...recipe,
        _detailsLoaded: true
      }));
      
      // Mise à jour du cache des recettes par catégorie
      this.categoryRecipes[categoryId] = processedRecipes;
      
      // Mise à jour du store principal de recettes
      processedRecipes.forEach(recipe => {
        const index = this.allRecipes.findIndex(r => r.id === recipe.id);
        if (index !== -1) {
          // Mettre à jour la recette existante
          this.allRecipes[index] = {
            ...this.allRecipes[index],
            ...recipe,
            _detailsLoaded: true
          };
        } else {
          // Ajouter la nouvelle recette
          this.allRecipes.push({
            ...recipe,
            _detailsLoaded: true
          });
        }
        
        // Mettre à jour l'index
        this.recipeIdIndex.set(recipe.id, recipe);
      });
    },
    
    // Ajouter une catégorie à une recette
    addCategoryToRecipe(recipeId, category) {
      const recipeIndex = this.allRecipes.findIndex(r => r.id === recipeId);
      if (recipeIndex === -1) return false;
      
      if (!this.allRecipes[recipeIndex].recipeCategory) {
        this.allRecipes[recipeIndex].recipeCategory = [];
      }
      
      // Vérifier si la catégorie est déjà présente
      const catIndex = this.allRecipes[recipeIndex].recipeCategory.findIndex(c => c.id === category.id);
      if (catIndex === -1) {
        this.allRecipes[recipeIndex].recipeCategory.push(category);
        
        // Mettre à jour l'index
        this.recipeIdIndex.set(recipeId, this.allRecipes[recipeIndex]);
        
        // Si c'est la recette actuelle, mettre à jour aussi
        if (this.currentRecipe && this.currentRecipe.id === recipeId) {
          this.currentRecipe.recipeCategory = [...this.allRecipes[recipeIndex].recipeCategory];
        }
        
        return true;
      }
      
      return false;
    },
    
    // Supprimer une catégorie d'une recette
    removeCategoryFromRecipe(recipeId, categoryId) {
      const recipeIndex = this.allRecipes.findIndex(r => r.id === recipeId);
      if (recipeIndex === -1 || !this.allRecipes[recipeIndex].recipeCategory) return false;
      
      const initialLength = this.allRecipes[recipeIndex].recipeCategory.length;
      this.allRecipes[recipeIndex].recipeCategory = this.allRecipes[recipeIndex].recipeCategory.filter(
        cat => cat.id !== categoryId
      );
      
      // Mettre à jour l'index
      this.recipeIdIndex.set(recipeId, this.allRecipes[recipeIndex]);
      
      // Si c'est la recette actuelle, mettre à jour aussi
      if (this.currentRecipe && this.currentRecipe.id === recipeId) {
        this.currentRecipe.recipeCategory = [...this.allRecipes[recipeIndex].recipeCategory];
      }
      
      return this.allRecipes[recipeIndex].recipeCategory.length !== initialLength;
    },
    
    // Filtrer les recettes par catégorie (utilise les données en cache ou filtre les recettes existantes)
    filterByCategory(categoryId) {
      if (!categoryId) {
        this.selectedCategory = null;
        return this.allRecipes;
      }
      
      this.selectedCategory = categoryId;
      
      // Si nous avons déjà chargé les recettes pour cette catégorie
      if (this.categoryRecipes[categoryId] && this.categoryRecipes[categoryId].length > 0) {
        return this.categoryRecipes[categoryId];
      }
      
      // Sinon, filtrer les recettes existantes
      return this.allRecipes.filter(recipe => 
        recipe.recipeCategory && 
        recipe.recipeCategory.some(cat => cat.id === categoryId)
      );
    },
    
    // Ajouter une nouvelle catégorie à la liste
    addCategory(category) {
      // Vérifier si la catégorie existe déjà
      const existingIndex = this.categories.findIndex(c => c.id === category.id);
      if (existingIndex !== -1) {
        // Mettre à jour la catégorie existante
        this.categories[existingIndex] = { ...this.categories[existingIndex], ...category };
      } else {
        // Ajouter la nouvelle catégorie
        this.categories.push(category);
      }
    },
    
    // Supprimer une catégorie de la liste
    removeCategory(categoryId) {
      this.categories = this.categories.filter(c => c.id !== categoryId);
      
      // Supprimer également du cache
      if (this.categoryRecipes[categoryId]) {
        delete this.categoryRecipes[categoryId];
      }
      
      // Si c'était la catégorie sélectionnée, réinitialiser
      if (this.selectedCategory === categoryId) {
        this.selectedCategory = null;
      }
    }
  },
  
  // Configuration de persistance
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'recipe-store',
        storage: localStorage,
        paths: ['favorites', 'lastFetched', 'selectedCategory'] // Ajouter selectedCategory
      }
    ]
  }
});