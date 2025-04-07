import axiosInstance from './axiosInstance';
import axios from 'axios';

/**
 * Service pour les opérations liées aux recettes
 */
export const recipeService = {
  /**
   * Récupère toutes les recettes avec pagination optionnelle
   * @param {Object} options - Options de pagination
   * @param {Number} options.page - Numéro de page
   * @param {Number} options.perPage - Nombre d'éléments par page
   * @param {Object} config - Configuration axios
   * @returns {Promise<Object>} Données paginées des recettes
   */
  async getAll(options = {}, config = {}) {
    const { page = 1, perPage = 100 } = options;
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('perPage', perPage);
    
    if (options.orderBy) {
      params.append('orderBy', options.orderBy);
    }
    
    if (options.orderDirection) {
      params.append('orderDirection', options.orderDirection);
    }
    
    return axiosInstance.get('/recipes', { 
      params,
      ...config,
      cache: true // Activer la mise en cache
    });
  },
  
  /**
   * Récupère une recette par son slug ou ID
   * @param {String} slugOrId - Slug ou ID de la recette
   * @param {Object} config - Configuration axios
   * @returns {Promise<Object>} Données de la recette
   */
  async getBySlug(slugOrId, config = {}) {
    if (!slugOrId) {
      throw new Error('Identifiant de recette manquant');
    }
    
    try {
      return await axiosInstance.get(`/recipes/${slugOrId}`, {
        ...config,
        cache: true // Activer la mise en cache
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Recette non trouvée');
      }
      throw error;
    }
  },

  /**
   * Alias de getBySlug
   */
  getById(id, config = {}) {
    return this.getBySlug(id, config);
  },
  
  /**
   * Récupère le plan de repas pour une période donnée
   * @param {String} startDate - Date de début (YYYY-MM-DD)
   * @param {String} endDate - Date de fin (YYYY-MM-DD)
   * @param {Object} config - Configuration axios
   * @returns {Promise<Object>} Plan de repas
   */
  async getMealPlan(startDate, endDate, config = {}) {
    if (!startDate || !endDate) {
      throw new Error('Dates de début et de fin requises');
    }
    
    try {
      return await axiosInstance.get('/households/mealplans', {
        params: { start_date: startDate, end_date: endDate },
        ...config,
        cache: false // Désactiver explicitement le cache pour avoir les données fraîches
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du plan de repas', error);
      throw new Error('Impossible de récupérer le plan de repas');
    }
  },
  
  /**
   * Ajoute un repas au plan
   * @param {Object} payload - Données du repas
   * @returns {Promise<Object>} Repas ajouté
   */
  async addToMealPlan(payload) {
    if (!payload.date || !payload.recipeId) {
      throw new Error('Date et ID de recette requis');
    }
    
    try {
      // Construction du payload selon la spécification
      const mealData = {
        date: payload.date,
        entryType: payload.type || 'dinner', // Utiliser entryType
        recipeId: payload.recipeId,
        title: payload.title || '',
        text: payload.description || '',
        // Ces champs peuvent être nécessaires, mais sont généralement gérés côté serveur
        // id: 0, 
        // groupId: null,
        // userId: null
      };
      
      console.log('Payload pour ajout au plan de repas:', mealData);
      
      // IMPORTANT : Utiliser POST si création, PUT si mise à jour
      const response = await axiosInstance.post('/households/mealplans', mealData);
      
      console.log('Réponse de l\'API pour ajout au plan:', response);
      
      return response;
    } catch (error) {
      console.error('Erreur détaillée lors de l\'ajout au plan de repas', {
        errorMessage: error.message,
        errorResponse: error.response ? error.response.data : 'Pas de réponse détaillée',
        payload: payload
      });
      
      // Gestion détaillée des erreurs de validation
      if (error.response && error.response.data && error.response.data.detail) {
        const errorDetails = error.response.data.detail
          .map(detail => detail.msg)
          .join(', ');
        
        throw new Error(`Erreur de validation : ${errorDetails}`);
      }
      
      throw error;
    }
  },
  
  /**
   * Supprime un repas du plan
   * @param {String} id - ID du repas
   * @returns {Promise<void>}
   */
  async removeFromMealPlan(id) {
    if (!id) {
      throw new Error('ID du repas requis');
    }
    
    try {
      return await axiosInstance.delete(`/households/mealplans/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du repas', error);
      throw new Error('Impossible de supprimer le repas du planning');
    }
  },
  
  /**
   * Met à jour une recette
   * @param {String} id - ID de la recette
   * @param {Object} payload - Données de la recette
   * @returns {Promise<Object>} Recette mise à jour
   */
  async updateRecipe(id, payload) {
    if (!id) {
      throw new Error('ID de recette manquant');
    }
    
    try {
      const slug = payload.slug || id;
      
      // Préparation du payload pour l'API Mealie
      const preparedPayload = this.prepareRecipePayload(payload);
      
      console.log(`Mise à jour de la recette avec slug: ${slug}`);
      console.log('Payload préparé:', JSON.stringify(preparedPayload, null, 2));
      
      return await axiosInstance.patch(`/recipes/${slug}`, preparedPayload);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette', error);
      
      // Essai avec une autre approche si la première échoue
      if (error.response && error.response.status === 500) {
        try {
          console.log("Tentative avec une approche alternative...");
          
          // Récupération de la recette actuelle
          const currentRecipe = await this.getBySlug(id);
          
          // Fusion des données actuelles avec les modifications
          const mergedPayload = {
            ...currentRecipe.data,
            name: payload.name,
            description: payload.description,
            // Conserver la structure originale pour les parties problématiques
            recipeIngredient: payload.recipeIngredient.map(ingredient => {
              // Si nous avons des ingrédients textuels, les utiliser directement
              if (typeof ingredient === 'string') {
                return ingredient;
              }
              
              // Sinon, construire un format compatible avec l'API
              const foodName = ingredient.food?.name || ingredient.foodName || '';
              const unitName = ingredient.unit?.name || ingredient.unitName || '';
              const quantity = ingredient.quantity || '';
              
              // Selon l'API, envoyer soit un objet complet soit une chaîne
              return {
                food: { name: foodName },
                unit: { name: unitName },
                quantity: quantity,
                note: ingredient.note || ''
              };
            }),
            recipeInstructions: payload.recipeInstructions
          };
          
          // Nettoyer le payload
          const cleanPayload = Object.fromEntries(
            Object.entries(mergedPayload).filter(([_, value]) => value !== undefined)
          );
          
          console.log('Payload alternatif:', JSON.stringify(cleanPayload, null, 2));
          
          // Essai avec une approche PUT complète au lieu de PATCH
          return await axiosInstance.put(`/recipes/${id}`, cleanPayload);
        } catch (alternativeError) {
          console.error('Erreur lors de la tentative alternative', alternativeError);
          throw new Error('Impossible de mettre à jour la recette');
        }
      }
      
      throw new Error('Impossible de mettre à jour la recette');
    }
  },

  /**
   * Prépare le payload d'une recette pour l'API
   * @param {Object} payload - Données brutes de la recette
   * @returns {Object} Payload préparé pour l'API
   */
  prepareRecipePayload(payload) {
    // Filtrer les propriétés sensibles ou lues seules
    const filteredPayload = { ...payload };
    
    // Liste des propriétés à exclure du payload
    const excludedProps = [
      'id', 'userId', 'groupId', 'householdId', 
      'assets', 'comments', 'createdAt', 'updatedAt',
      'dateAdded', 'dateUpdated', '_detailsLoaded'
    ];
    
    // Supprimer les propriétés exclues
    excludedProps.forEach(prop => {
      delete filteredPayload[prop];
    });
    
    // Normaliser les ingrédients
    if (filteredPayload.recipeIngredient) {
      filteredPayload.recipeIngredient = filteredPayload.recipeIngredient.map(ingredient => {
        // Si l'ingrédient est déjà une chaîne, le conserver tel quel
        if (typeof ingredient === 'string') {
          return ingredient;
        }
        
        // Simplifier les objets d'ingrédients
        return {
          quantity: ingredient.quantity || null,
          unit: { name: ingredient.unit?.name || ingredient.unitName || '' },
          food: { name: ingredient.food?.name || ingredient.foodName || '' },
          note: ingredient.note || ''
        };
      });
    }
    
    // Nettoyer les instructions pour qu'elles soient compatibles avec l'API
    if (filteredPayload.recipeInstructions) {
      filteredPayload.recipeInstructions = filteredPayload.recipeInstructions.map((instruction, index) => {
        // Si l'instruction est une chaîne, la convertir en objet
        if (typeof instruction === 'string') {
          return { text: instruction };
        }
        
        // Garder les propriétés essentielles
        return {
          text: instruction.text || '',
          // Positions à partir de 1 pour respecter les conventions d'UI
          position: index + 1
        };
      });
    }
    
    return filteredPayload;
  },
  
  /**
   * Crée une nouvelle recette
   * @param {Object} payload - Données de la recette
   * @returns {Promise<Object>} Recette créée
   */
  async createRecipe(payload) {
    try {
      return await axiosInstance.post('/recipes', payload);
    } catch (error) {
      console.error('Erreur lors de la création de la recette', error);
      throw new Error('Impossible de créer la recette');
    }
  },
  
  /**
   * Supprime une recette
   * @param {String} id - ID ou slug de la recette
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteRecipe(id) {
    if (!id) {
      throw new Error('ID de recette manquant');
    }
    
    try {
      console.log(`Suppression de la recette avec ID/slug: ${id}`);
      return await axiosInstance.delete(`/recipes/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la recette', error);
      throw new Error('Impossible de supprimer la recette');
    }
  },

  /**
   * Télécharge l'image d'une recette
   * @param {String} recipeId - ID de la recette
   * @param {File} imageFile - Fichier image
   * @returns {Promise<Object>} Résultat du téléchargement
   */
  async uploadRecipeImage(recipeId, imageFile) {
    if (!recipeId || !imageFile) {
      throw new Error('ID de recette et fichier image requis');
    }
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      return await axiosInstance.put(`/recipes/${recipeId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image', error);
      throw new Error('Impossible de télécharger l\'image de la recette');
    }
  },
  
  /**
   * Importe une recette depuis une URL
   * @param {String} url - URL de la recette à importer
   * @returns {Promise<Object>} Recette importée
   */
  async importRecipeFromUrl(url) {
    if (!url) {
      throw new Error('URL requise');
    }
    
    try {
      // Préparer le payload pour l'API d'importation de Mealie
      const payload = {
        url: url
      };
      
      console.log("Tentative d'importation de recette depuis URL:", url);
      
      // Utiliser l'endpoint exact pour l'importation
      const response = await axiosInstance.post('/recipes/create/url', payload);
      console.log("Réponse d'importation:", response);
      return response;
    } catch (error) {
      console.error('Erreur lors de l\'importation de la recette', error);
      throw error;
    }
  },
  
  /**
   * Ajoute une recette à la liste de courses
   * @param {String} recipeId - ID de la recette
   * @returns {Promise<Object>} Résultat de l'ajout
   */
  async addRecipeToShoppingList(recipeId) {
    if (!recipeId) {
      throw new Error('ID de recette requis');
    }
    
    try {
      // D'abord récupérer la liste de courses principale
      const listResponse = await shoppingService.getMainShoppingList();
      const mainList = listResponse.data.items?.[0];
      
      if (!mainList || !mainList.id) {
        throw new Error('Aucune liste de courses trouvée');
      }
      
      // Préparer le payload pour l'API Mealie
      const payload = {
        recipeId: recipeId,
        recipeScale: 1 // Échelle par défaut
      };
      
      // Appeler l'API pour ajouter la recette à la liste
      return await shoppingService.addRecipeIngredientsToList(mainList.id, payload);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la recette à la liste de courses', error);
      throw error;
    }
  },
  /**
   * Récupère toutes les catégories de recettes
   * @param {Object} options Options pour la requête axios
   * @returns {Promise} Promesse contenant la réponse de l'API
   */
  getCategories(options = {}) {
    return axiosInstance.get('/organizers/categories', options);
  },

  /**
   * Récupère une catégorie par son slug
   * @param {string} slug Slug de la catégorie
   * @param {Object} options Options pour la requête axios
   * @returns {Promise} Promesse contenant la réponse de l'API
   */
  getCategoryBySlug(slug, options = {}) {
    return axiosInstance.get(`/organizers/categories/${slug}`, options);
  },

  /**
   * Crée une nouvelle catégorie
   * @param {Object} category Données de la catégorie à créer
   * @returns {Promise} Promesse contenant la réponse de l'API
   */
  createCategory(category) {
    return axiosInstance.post('/organizers/categories', category);
  },
  
  /**
   * Met à jour une catégorie existante
   * @param {string} categoryId ID de la catégorie à mettre à jour
   * @param {Object} categoryData Nouvelles données de la catégorie
   * @returns {Promise} Promesse contenant la réponse de l'API
   */
  updateCategory(categoryId, categoryData) {
    return axiosInstance.put(`/organizers/categories/${categoryId}`, categoryData);
  },
  
  /**
   * Supprime une catégorie
   * @param {string} categoryId ID de la catégorie à supprimer
   * @returns {Promise} Promesse contenant la réponse de l'API
   */
  deleteCategory(categoryId) {
    return axiosInstance.delete(`/organizers/categories/${categoryId}`);
  },
  
  /**
   * Récupère les recettes en filtrant par catégorie
   * Cette méthode n'utilise pas l'endpoint spécifique des catégories
   * mais plutôt le filtrage sur l'endpoint des recettes
   * @param {string} categoryId ID de la catégorie
   * @param {Object} options Options pour la requête axios
   * @returns {Promise} Promesse contenant la réponse de l'API
   */
  getRecipesByCategory(categoryId, options = {}) {
    const params = {
      categories: categoryId,
      requireAllCategories: false,
      ...options.params
    };
    
    return axiosInstance.get('/recipes', {
      ...options,
      params
    });
  }
};
  


/**
 * Service pour les opérations liées aux listes de courses
 */
export const shoppingService = {
  /**
   * Récupère la liste de courses principale
   * @returns {Promise<Object>} Liste de courses principale
   */
  async getMainShoppingList() {
    try {
      return await axiosInstance.get('/households/shopping/lists?page=1&perPage=1');
    } catch (error) {
      console.error('Erreur lors de la récupération de la liste de courses', error);
      throw new Error('Impossible de récupérer la liste de courses principale');
    }
  },
  
  /**
   * Ajoute une recette à la liste de courses avec le format attendu par l'API
   * @param {String} listId - ID de la liste de courses
   * @param {Object} recipeRef - Référence à la recette avec {recipeId, recipeScale}
   * @returns {Promise<Object>} Résultat de l'ajout
   */
  async addRecipeToList(listId, recipeRef) {
    if (!listId || !recipeRef || !recipeRef.recipeId) {
      throw new Error('ID de liste et ID de recette requis');
    }
    
    try {
      // S'assurer que le format est correct selon l'API
      const payload = {
        recipeId: recipeRef.recipeId,
        recipeScale: recipeRef.recipeScale || 1
      };
      
      console.log(`Ajout de la recette ${payload.recipeId} à la liste ${listId}`);
      
      return await axiosInstance.post(`/households/shopping/lists/${listId}/recipe`, payload);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la recette à la liste', error);
      
      // Afficher les détails de l'erreur pour le débogage
      if (error.response) {
        console.error('Détails de l\'erreur API:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw error;
    }
  },

  /**
   * Ajoute plusieurs recettes à une liste de courses
   * @param {String} listId - ID de la liste de courses
   * @param {Array} recipes - Tableau de recettes {recipeId, recipeScale}
   * @returns {Promise<Object>} Résultat de l'ajout
   */
  async addMultipleRecipesToList(listId, recipes) {
    if (!listId || !recipes || !Array.isArray(recipes) || recipes.length === 0) {
      throw new Error('ID de liste et tableau de recettes requis');
    }
    
    try {
      // Convertir au format attendu par l'API
      const formattedRecipes = recipes.map(recipe => ({
        recipeId: recipe.recipeId,
        recipeScale: recipe.recipeScale || 1
      }));
      
      // Utiliser le format correct pour l'API
      // Version 1: Envoyer un tableau de recettes
      // return await axiosInstance.post(`/households/shopping/lists/${listId}/recipes`, formattedRecipes);
      
      // Version 2: Envoi séquentiel (plus fiable)
      const results = [];
      for (const recipe of formattedRecipes) {
        const result = await this.addRecipeToList(listId, recipe);
        results.push(result);
      }
      return results;
    } catch (error) {
      console.error('Erreur lors de l\'ajout des recettes à la liste', error);
      throw error;
    }
  },
  
  /**
   * Récupère les articles d'une liste de courses
   * @param {String} listId - ID de la liste (optionnel, utilise la liste principale par défaut)
   * @returns {Promise<Object>} Articles de la liste
   */
  async getShoppingList(listId = null) {
    try {
      if (listId) {
        return await axiosInstance.get(`/households/shopping/lists/${listId}`);
      }
      
      // Récupérer la liste principale puis ses articles
      const listResponse = await this.getMainShoppingList();
      const mainList = listResponse.data.items?.[0];
      
      if (!mainList || !mainList.id) {
        throw new Error('Aucune liste de courses trouvée');
      }
      
      return await axiosInstance.get(`/households/shopping/lists/${mainList.id}`);
    } catch (error) {
      console.error('Erreur lors de la récupération des articles', error);
      throw new Error('Impossible de récupérer les articles de la liste de courses');
    }
  },
  
  /**
   * Ajoute un article à la liste de courses
   * @param {Object} item - Données de l'article
   * @param {String} listId - ID de la liste (optionnel)
   * @returns {Promise<Object>} Article ajouté
   */
  async addToShoppingList(item, listId = null) {
    try {
      // Si pas de listId, récupérer la liste principale
      if (!listId) {
        const listResponse = await this.getMainShoppingList();
        listId = listResponse.data.items?.[0]?.id;
        
        if (!listId) {
          throw new Error('Aucune liste de courses trouvée');
        }
      }
      
      return await axiosInstance.post(`/households/shopping/lists/${listId}/items`, item);
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la liste de courses', error);
      throw new Error('Impossible d\'ajouter l\'article à la liste de courses');
    }
  },
  
  /**
   * Met à jour un article de la liste
   * @param {String} itemId - ID de l'article
   * @param {Object} data - Données à mettre à jour
   * @param {String} listId - ID de la liste (optionnel)
   * @returns {Promise<Object>} Article mis à jour
   */
  async updateShoppingItem(itemId, data, listId = null) {
    if (!itemId) {
      throw new Error('ID d\'article requis');
    }
    
    try {
      // Si pas de listId, récupérer la liste principale
      if (!listId) {
        const listResponse = await this.getMainShoppingList();
        listId = listResponse.data.items?.[0]?.id;
        
        if (!listId) {
          throw new Error('Aucune liste de courses trouvée');
        }
      }
      
      return await axiosInstance.put(`/households/shopping/lists/${listId}/items/${itemId}`, data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article', error);
      throw new Error('Impossible de mettre à jour l\'article');
    }
  },
  
  /**
   * Supprime un article de la liste
   * @param {String} itemId - ID de l'article
   * @param {String} listId - ID de la liste (optionnel)
   * @returns {Promise<void>}
   */
  async removeShoppingItem(itemId, listId = null) {
    if (!itemId) {
      throw new Error('ID d\'article requis');
    }
    
    try {
      // Si pas de listId, récupérer la liste principale
      if (!listId) {
        const listResponse = await this.getMainShoppingList();
        listId = listResponse.data.items?.[0]?.id;
        
        if (!listId) {
          throw new Error('Aucune liste de courses trouvée');
        }
      }
      
      return await axiosInstance.delete(`/households/shopping/items/${itemId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article', error);
      throw new Error('Impossible de supprimer l\'article');
    }
  },
  
  /**
   * Génère une liste de courses à partir du plan de repas
   * @param {String} startDate - Date de début (YYYY-MM-DD)
   * @param {String} endDate - Date de fin (YYYY-MM-DD)
   * @returns {Promise<Object>} Résultat de la génération
   */
  async generateShoppingListFromMealPlan(startDate, endDate) {
    try {
      return await axiosInstance.post('/households/shopping/generate', { 
        start_date: startDate, 
        end_date: endDate 
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la liste', error);
      throw new Error('Impossible de générer la liste de courses');
    }
  }
};

/**
 * Service pour les opérations liées aux unités et ingrédients
 */
export const referenceService = {
  /**
   * Récupère toutes les unités disponibles
   * @returns {Promise<Object>} Unités disponibles
   */
  async getUnits() {
    try {
      return await axiosInstance.get('/units');
    } catch (error) {
      console.error('Erreur lors de la récupération des unités', error);
      throw new Error('Impossible de récupérer les unités');
    }
  },
  
  /**
   * Récupère tous les aliments disponibles
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Object>} Aliments disponibles
   */
  async getFoods(options = {}) {
    const { page = 1, perPage = 100, query = '' } = options;
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('perPage', perPage);
    
    if (query) {
      params.append('search', query);
    }
    
    try {
      return await axiosInstance.get('/foods', { params });
    } catch (error) {
      console.error('Erreur lors de la récupération des aliments', error);
      throw new Error('Impossible de récupérer les aliments');
    }
  },
  
  /**
   * Récupère toutes les catégories disponibles
   * @returns {Promise<Object>} Catégories disponibles
   */
  async getCategories() {
    try {
      return await axiosInstance.get('/categories');
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories', error);
      throw new Error('Impossible de récupérer les catégories');
    }
  },
  
  /**
   * Récupère tous les tags disponibles
   * @returns {Promise<Object>} Tags disponibles
   */
  async getTags() {
    try {
      return await axiosInstance.get('/tags');
    } catch (error) {
      console.error('Erreur lors de la récupération des tags', error);
      throw new Error('Impossible de récupérer les tags');
    }
  }
};