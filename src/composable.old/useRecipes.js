import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRecipeStore } from '../stores/recipeStore';

/**
 * Composable pour gérer une recette individuelle
 * @param {string|null} initialId - ID de la recette initiale (optionnel)
 * @returns {Object} - État et méthodes pour la gestion d'une recette
 */
export function useRecipe(initialId = null) {
  const recipeStore = useRecipeStore();
  const recipeId = ref(initialId);
  const loading = ref(false);
  const error = ref(null);
  
  // Récupérer la recette du store
  const recipe = computed(() => {
    if (!recipeId.value) return null;
    return recipeStore.getRecipeById(recipeId.value);
  });
  
  // État favori
  const isFavorite = computed(() => {
    if (!recipeId.value) return false;
    return recipeStore.isFavorite(recipeId.value);
  });
  
  // Détails complets chargés
  const detailsLoaded = computed(() => {
    if (!recipe.value) return false;
    return recipe.value._detailsLoaded === true;
  });
  
  // Catégories de la recette
  const categories = computed(() => {
    if (!recipe.value || !recipe.value.recipeCategory) return [];
    return recipe.value.recipeCategory.filter(cat => cat && cat.id);
  });
  
  // Charger une recette par ID
  const loadRecipe = async (id, options = {}) => {
    if (!id) return;
    
    recipeId.value = id;
    const { api, force = false } = options;
    
    // Si la recette est déjà dans le store et que les détails sont chargés
    const existingRecipe = recipeStore.getRecipeById(id);
    if (existingRecipe && existingRecipe._detailsLoaded && !force) {
      recipeStore.setCurrentRecipe(existingRecipe);
      return existingRecipe;
    }
    
    // Sinon, charger depuis l'API
    if (!api) return;
    
    try {
      loading.value = true;
      error.value = null;
      
      const response = await api.getById(id);
      
      if (response.data) {
        // Marquer les détails comme chargés
        const recipeData = { ...response.data, _detailsLoaded: true };
        
        // Mettre à jour le store
        recipeStore.updateRecipe(id, recipeData);
        recipeStore.setCurrentRecipe(recipeData);
        
        return recipeData;
      }
    } catch (err) {
      console.error(`Erreur lors du chargement de la recette ${id}:`, err);
      error.value = err;
    } finally {
      loading.value = false;
    }
    
    return null;
  };
  
  // Charger par slug
  const loadRecipeBySlug = async (slug, options = {}) => {
    if (!slug) return;
    
    const { api, force = false } = options;
    
    // Vérifier dans le store d'abord
    const existingRecipe = recipeStore.getRecipeBySlug(slug);
    if (existingRecipe && existingRecipe._detailsLoaded && !force) {
      recipeId.value = existingRecipe.id;
      recipeStore.setCurrentRecipe(existingRecipe);
      return existingRecipe;
    }
    
    // Sinon, charger depuis l'API
    if (!api) return;
    
    try {
      loading.value = true;
      error.value = null;
      
      const response = await api.getBySlug(slug);
      
      if (response.data) {
        // Marquer les détails comme chargés
        const recipeData = { ...response.data, _detailsLoaded: true };
        recipeId.value = recipeData.id;
        
        // Mettre à jour le store
        recipeStore.updateRecipe(recipeData.id, recipeData);
        recipeStore.setCurrentRecipe(recipeData);
        
        return recipeData;
      }
    } catch (err) {
      console.error(`Erreur lors du chargement de la recette par slug ${slug}:`, err);
      error.value = err;
    } finally {
      loading.value = false;
    }
    
    return null;
  };
  
  // Sauvegarder les modifications
  const saveRecipe = async (updatedData, options = {}) => {
    if (!recipeId.value || !updatedData) return null;
    
    const { api } = options;
    
    try {
      loading.value = true;
      error.value = null;
      
      // Si pas d'API, mise à jour locale uniquement
      if (!api) {
        recipeStore.updateRecipe(recipeId.value, updatedData);
        return recipeStore.getRecipeById(recipeId.value);
      }
      
      // Sinon, envoyer à l'API
      const response = await api.updateRecipe(recipeId.value, updatedData);
      
      if (response.data) {
        // Mettre à jour le store avec les données retournées
        const recipeData = { ...response.data, _detailsLoaded: true };
        recipeStore.updateRecipe(recipeId.value, recipeData);
        
        return recipeData;
      }
    } catch (err) {
      console.error(`Erreur lors de la sauvegarde de la recette ${recipeId.value}:`, err);
      error.value = err;
    } finally {
      loading.value = false;
    }
    
    return null;
  };
  
  // Toggle favori
  const toggleFavorite = () => {
    if (!recipeId.value) return;
    recipeStore.toggleFavorite(recipeId.value);
    return isFavorite.value;
  };
  
  // Gestion des catégories
  const addCategory = (category) => {
    if (!recipeId.value || !category || !category.id) return false;
    return recipeStore.addCategoryToRecipe(recipeId.value, category);
  };
  
  const removeCategory = (categoryId) => {
    if (!recipeId.value || !categoryId) return false;
    return recipeStore.removeCategoryFromRecipe(recipeId.value, categoryId);
  };
  
  // Charger la recette initiale si ID fourni
  onMounted(() => {
    if (recipeId.value) {
      const existingRecipe = recipeStore.getRecipeById(recipeId.value);
      if (existingRecipe) {
        recipeStore.setCurrentRecipe(existingRecipe);
      }
    }
  });
  
  return {
    recipeId,
    recipe,
    loading,
    error,
    isFavorite,
    detailsLoaded,
    categories,
    loadRecipe,
    loadRecipeBySlug,
    saveRecipe,
    toggleFavorite,
    addCategory,
    removeCategory
  };
}

/**
 * Composable pour gérer une liste de recettes
 * @param {Object} options - Options de configuration
 * @returns {Object} - État et méthodes pour la gestion d'une liste de recettes
 */
export function useRecipeList(options = {}) {
  const recipeStore = useRecipeStore();
  const loading = ref(false);
  const error = ref(null);
  const page = ref(1);
  const hasMore = ref(true);
  const searchQuery = ref('');
  const selectedCategory = ref(null);
  const activeView = ref('all');
  
  // Options par défaut
  const {
    enableInfiniteScroll = false,
    perPage = 12,
    api = null,
    autoLoad = true
  } = options;
  
  // Abortcontroller pour annuler les requêtes en cours
  const abortController = ref(new AbortController());
  
  // Liste de recettes filtrée
  const filteredRecipes = computed(() => {
    // Si recherche active
    if (searchQuery.value.trim() !== '') {
      return recipeStore.searchRecipes(searchQuery.value, {
        favoriteOnly: activeView.value === 'favorites',
        matchAll: true
      });
    }
    
    // Si catégorie sélectionnée
    if (selectedCategory.value) {
      const categoryRecipes = recipeStore.getRecipesByCategory(selectedCategory.value);
      
      // Filtrer aussi par favoris si nécessaire
      if (activeView.value === 'favorites') {
        const favoritesSet = recipeStore.favoritesSet;
        return categoryRecipes.filter(recipe => favoritesSet.has(recipe.id));
      }
      
      return categoryRecipes;
    }
    
    // Si vue favoris uniquement
    if (activeView.value === 'favorites') {
      return recipeStore.favoriteRecipes;
    }
    
    // Vue par défaut: toutes les recettes
    return recipeStore.recipes;
  });
  
  // Pagination (pour l'affichage)
  const paginatedRecipes = computed(() => {
    const start = 0;
    const end = page.value * perPage;
    return filteredRecipes.value.slice(start, end);
  });
  
  // Recettes avec chargement par lots
  const loadRecipes = async (forceRefresh = false) => {
    if (!api) return;
    
    try {
      // Annuler les requêtes précédentes
      abortController.value.abort();
      abortController.value = new AbortController();
      
      loading.value = true;
      error.value = null;
      
      // Si première page ou refresh forcé
      if (page.value === 1 || forceRefresh) {
        // Vérifier si les données sont en cache et récentes
        if (recipeStore.hasRecipes && !forceRefresh) {
          loading.value = false;
          return recipeStore.recipes;
        }
        
        // Sinon, charger depuis l'API
        const response = await api.getAll({
          signal: abortController.value.signal,
          page: 1,
          perPage: perPage
        });
        
        if (response.data && response.data.items) {
          recipeStore.setBasicRecipes(response.data.items);
          
          // Vérifier s'il y a plus de pages
          hasMore.value = response.data.items.length >= perPage;
          
          // Charger les détails en arrière-plan
          loadRecipeDetails(response.data.items);
          
          return recipeStore.recipes;
        }
      } else {
        // Charger page suivante
        const response = await api.getAll({
          signal: abortController.value.signal,
          page: page.value,
          perPage: perPage
        });
        
        if (response.data && response.data.items) {
          // Ajouter au store
          const newRecipes = response.data.items.filter(
            recipe => !recipeStore.recipeIdIndex.has(recipe.id)
          );
          
          if (newRecipes.length > 0) {
            newRecipes.forEach(recipe => recipeStore.addRecipe({
              ...recipe,
              _detailsLoaded: false
            }));
            
            // Charger les détails en arrière-plan
            loadRecipeDetails(newRecipes);
          }
          
          // Vérifier s'il y a plus de pages
          hasMore.value = response.data.items.length >= perPage;
          
          return recipeStore.recipes;
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Erreur lors du chargement des recettes:', err);
        error.value = err;
      }
    } finally {
      loading.value = false;
    }
    
    return recipeStore.recipes;
  };
  
  // Charger la page suivante
  const loadMore = async () => {
    if (!hasMore.value || loading.value) return;
    
    page.value++;
    return loadRecipes();
  };
  
  // Charger les détails des recettes en arrière-plan
  const loadRecipeDetails = async (recipes) => {
    if (!api || !recipes || recipes.length === 0) return;
    
    const batchSize = 5; // Nombre de recettes à charger en parallèle
    
    for (let i = 0; i < recipes.length; i += batchSize) {
      const batch = recipes.slice(i, i + batchSize);
      
      // Chargement en parallèle
      await Promise.all(
        batch.map(async (recipe) => {
          try {
            // Ne pas recharger si déjà chargé
            if (recipe._detailsLoaded) return;
            
            const response = await api.getById(recipe.id, {
              signal: abortController.value.signal
            });
            
            if (response.data) {
              recipeStore.updateRecipe(recipe.id, {
                ...response.data,
                _detailsLoaded: true
              });
            }
          } catch (err) {
            if (err.name !== 'AbortError') {
              console.warn(`Erreur lors du chargement des détails pour ${recipe.id}:`, err);
            }
          }
        })
      );
    }
  };
  
  // Recherche de recettes
  const search = (query) => {
    searchQuery.value = query;
    page.value = 1; // Réinitialiser la pagination
    
    // Ajouter à l'historique de recherche si non vide
    if (query && query.trim() !== '') {
      recipeStore.addToSearchHistory(query);
    }
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    searchQuery.value = '';
    selectedCategory.value = null;
    activeView.value = 'all';
    page.value = 1;
  };
  
  // Définir la catégorie sélectionnée
  const selectCategory = (categoryId) => {
    selectedCategory.value = categoryId;
    recipeStore.selectCategory(categoryId);
    page.value = 1; // Réinitialiser la pagination
  };
  
  // Changer la vue active
  const updateActiveView = (view) => {
    activeView.value = view;
    page.value = 1; // Réinitialiser la pagination
  };
  
  // Configuration de l'infinite scroll
  const setupInfiniteScroll = () => {
    if (!enableInfiniteScroll) return;
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore.value && !loading.value) {
          loadMore();
        }
      });
    }, {
      root: null,
      rootMargin: '100px',
      threshold: 0.1
    });
    
    // Observer l'élément déclencheur
    const loadMoreTrigger = document.getElementById('infinite-scroll-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }
    
    // Nettoyer l'observer à la destruction
    onUnmounted(() => {
      if (loadMoreTrigger) {
        observer.unobserve(loadMoreTrigger);
      }
      observer.disconnect();
      abortController.value.abort();
    });
  };
  
  // Écouteur pour la catégorie sélectionnée
  watch(selectedCategory, async (newCategoryId) => {
    if (newCategoryId) {
      // Si la catégorie n'est pas dans le cache, la charger
      const hasCategory = recipeStore.categoryRecipes[newCategoryId]?.length > 0;
      
      if (!hasCategory && api) {
        try {
          loading.value = true;
          
          const response = await api.getRecipesByCategory(newCategoryId, {
            signal: abortController.value.signal
          });
          
          if (response.data && response.data.items) {
            recipeStore.updateRecipesForCategory(newCategoryId, response.data.items);
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error(`Erreur lors du chargement des recettes pour la catégorie ${newCategoryId}:`, err);
            error.value = err;
          }
        } finally {
          loading.value = false;
        }
      }
    }
  });
  
  // Charger les données au montage
  onMounted(() => {
    if (autoLoad) {
      loadRecipes();
    }
    
    // Configurer infinite scroll si activé
    if (enableInfiniteScroll) {
      setupInfiniteScroll();
    }
  });
  
  // Nettoyer à la destruction
  onUnmounted(() => {
    abortController.value.abort();
  });
  
  return {
    loading,
    error,
    page,
    hasMore,
    searchQuery,
    selectedCategory,
    activeView,
    filteredRecipes,
    paginatedRecipes,
    loadRecipes,
    loadMore,
    search,
    resetFilters,
    selectCategory,
    updateActiveView
  };
}

/**
 * Composable pour gérer les catégories de recettes
 * @param {Object} options - Options de configuration
 * @returns {Object} - État et méthodes pour la gestion des catégories
 */
export function useRecipeCategories(options = {}) {
  const recipeStore = useRecipeStore();
  const loading = ref(false);
  const error = ref(null);
  
  const { api = null, autoLoad = true } = options;
  
  // Catégories disponibles
  const categories = computed(() => recipeStore.categories);
  
  // Catégories utilisées dans les recettes
  const usedCategories = computed(() => recipeStore.usedCategories);
  
  // Catégories populaires (triées par nombre de recettes)
  const popularCategories = computed(() => recipeStore.popularCategories(5));
  
  // Charger toutes les catégories
  const loadCategories = async () => {
    if (!api) return;
    
    try {
      loading.value = true;
      error.value = null;
      
      const response = await api.getCategories();
      
      if (response.data) {
        const categoriesData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.items || []);
        
        recipeStore.setCategories(categoriesData);
        return categoriesData;
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
      error.value = err;
      
      // Fallback: extraire des recettes existantes
      const extractedCategories = recipeStore.usedCategories;
      if (extractedCategories.length > 0) {
        recipeStore.setCategories(extractedCategories);
        return extractedCategories;
      }
    } finally {
      loading.value = false;
    }
    
    return [];
  };
  
  // Créer une nouvelle catégorie
  const createCategory = async (categoryData) => {
    if (!api || !categoryData || !categoryData.name) return null;
    
    try {
      loading.value = true;
      error.value = null;
      
      // Créer un slug à partir du nom si non fourni
      if (!categoryData.slug) {
        categoryData.slug = categoryData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      
      const response = await api.createCategory(categoryData);
      
      if (response.data) {
        const newCategory = response.data;
        recipeStore.addCategory(newCategory);
        return newCategory;
      }
    } catch (err) {
      console.error('Erreur lors de la création de la catégorie:', err);
      error.value = err;
    } finally {
      loading.value = false;
    }
    
    return null;
  };
  
  // Supprimer une catégorie
  const deleteCategory = async (categoryId) => {
    if (!api || !categoryId) return false;
    
    try {
      loading.value = true;
      error.value = null;
      
      await api.deleteCategory(categoryId);
      recipeStore.removeCategory(categoryId);
      return true;
    } catch (err) {
      console.error(`Erreur lors de la suppression de la catégorie ${categoryId}:`, err);
      error.value = err;
      return false;
    } finally {
      loading.value = false;
    }
  };
  
  // Charger au montage si autoLoad est activé
  onMounted(() => {
    if (autoLoad) {
      loadCategories();
    }
  });
  
  return {
    loading,
    error,
    categories,
    usedCategories,
    popularCategories,
    loadCategories,
    createCategory,
    deleteCategory
  };
}