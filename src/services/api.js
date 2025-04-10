import axiosInstance from './axiosInstance';
import axios from 'axios';

const imageUrlCache = new Map(); 
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
      
      
      // IMPORTANT : Utiliser POST si création, PUT si mise à jour
      const response = await axiosInstance.post('/households/mealplans', mealData);
            
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
   * Récupère l'URL de l'image d'une recette avec adaptation selon la taille de l'écran
   * @param {String} recipeId - ID de la recette
   * @param {String} size - Taille de l'image (default, min-original.webp, original.webp, etc.)
   * @returns {String} URL de l'image
   */

  /**
   * Récupère l'URL de l'image d'une recette avec gestion du cache
   * @param {Object|String} recipe - Objet recette ou ID de la recette
   * @param {String} size - Taille de l'image (min-original.webp, original.webp, etc.)
   * @param {String} defaultImage - Image par défaut si la recette n'a pas d'image
   * @param {Boolean} useCache - Utiliser le cache pour les URL
   * @returns {String} URL de l'image
   */
  getRecipeImageUrl(recipe, size = 'min-original.webp', defaultImage = '/default-recipe.png', useCache = true) {
    // Vérifier si la recette est valide
    if (!recipe) {
      return defaultImage;
    }
    
    // Extraire l'ID, que recipe soit un objet ou directement un ID
    const recipeId = typeof recipe === 'object' ? recipe.id : recipe;
    
    if (!recipeId) {
      return defaultImage;
    }
    
    // Vérifier le cache si activé
    if (useCache) {
      const cacheKey = `${recipeId}_${size}`;
      if (imageUrlCache.has(cacheKey)) {
        return imageUrlCache.get(cacheKey);
      }
    }
    
    // Construction du chemin relatif pour l'image
    const imagePath = `/media/recipes/${recipeId}/images/${size}`;
    
    // Utilisation du baseURL d'axiosInstance pour construire l'URL complète
    const imageUrl = `${axiosInstance.defaults.baseURL}${imagePath}`;
    
    // Mettre en cache si activé
    if (useCache) {
      const cacheKey = `${recipeId}_${size}`;
      imageUrlCache.set(cacheKey, imageUrl);
    }
    
    return imageUrl;
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
      // D'abord récupérer la recette complète actuelle
      const currentRecipeResponse = await this.getById(id);
      if (!currentRecipeResponse || !currentRecipeResponse.data) {
        throw new Error('Impossible de récupérer les données actuelles de la recette');
      }
      
      const currentRecipe = currentRecipeResponse.data;
      
      // Préparer les instructions avec les IDs existants
      let formattedInstructions = [];
      if (payload.recipeInstructions && Array.isArray(payload.recipeInstructions)) {
        // Si la recette actuelle a des instructions avec des IDs
        if (currentRecipe.recipeInstructions && 
            Array.isArray(currentRecipe.recipeInstructions) && 
            currentRecipe.recipeInstructions.length > 0) {
          
          // Si le nombre d'instructions est identique, réutiliser les IDs existants
          if (currentRecipe.recipeInstructions.length === payload.recipeInstructions.length) {
            formattedInstructions = payload.recipeInstructions.map((instruction, index) => {
              return {
                id: currentRecipe.recipeInstructions[index].id,
                text: instruction.text || '',
                title: instruction.title || '',
                summary: instruction.summary || '',
                ingredientReferences: currentRecipe.recipeInstructions[index].ingredientReferences || []
              };
            });
          } 
          // Si le nombre d'instructions a changé
          else {
            formattedInstructions = payload.recipeInstructions.map((instruction, index) => {
              // Réutiliser les IDs pour les instructions existantes
              if (index < currentRecipe.recipeInstructions.length) {
                return {
                  id: currentRecipe.recipeInstructions[index].id,
                  text: instruction.text || '',
                  title: instruction.title || '',
                  summary: instruction.summary || '',
                  ingredientReferences: currentRecipe.recipeInstructions[index].ingredientReferences || []
                };
              } 
              // Nouvelles instructions sans ID (l'API en générera)
              else {
                return {
                  text: instruction.text || '',
                  title: instruction.title || '',
                  summary: instruction.summary || '',
                  ingredientReferences: []
                };
              }
            });
          }
        } 
        // Si la recette actuelle n'a pas d'instructions, créer des nouvelles
        else {
          formattedInstructions = payload.recipeInstructions.map(instruction => {
            return {
              text: instruction.text || '',
              title: instruction.title || '',
              summary: instruction.summary || '',
              ingredientReferences: []
            };
          });
        }
      }
      
      // Préparer les ingrédients avec le bon format
      let formattedIngredients = [];
      if (payload.recipeIngredient && Array.isArray(payload.recipeIngredient)) {
        // Si la recette a déjà des ingrédients, préserver leurs referenceId
        if (currentRecipe.recipeIngredient && 
            Array.isArray(currentRecipe.recipeIngredient) && 
            currentRecipe.recipeIngredient.length > 0) {
          // Vérifier si le nombre d'ingrédients est identique
              formattedIngredients = payload.recipeIngredient.map(ingredient => {
                // Si l'ingrédient a un format simple
                if (typeof ingredient.quantity !== 'undefined') {
                  return {
                    quantity: ingredient.quantity || 0,
                    unit: ingredient.unit || null,
                    food: ingredient.food || null,
                    note: ingredient.note || '',
                    isFood: true,
                    disableAmount: false,
                    display: `${ingredient.quantity || ''} ${ingredient.unit?.name || ingredient.unitInput || ''} ${ingredient.food?.name || ingredient.foodInput || ''}`.trim(),
                    title: null,
                    originalText: null,
                    // Toujours utiliser une chaîne vide si pas de referenceId
                    referenceId: ingredient.referenceId || ""
                  };
                }
                
                // Pour les ingrédients avec format complet
                if (ingredient.referenceId === null || ingredient.referenceId === undefined) {
                  return {
                    ...ingredient,
                    referenceId: ""
                  };
                }
                
                return ingredient;
              });
        } 
        // Si la recette n'a pas encore d'ingrédients
        else {
          formattedIngredients = payload.recipeIngredient.map(ingredient => {
            // Si l'ingrédient a un format simple
            if (typeof ingredient.quantity !== 'undefined') {
              return {
                quantity: ingredient.quantity || 0,
                unit: ingredient.unit || null,
                food: ingredient.food || null,
                note: ingredient.note || '',
                isFood: true,
                disableAmount: false,
                display: `${ingredient.quantity || ''} ${ingredient.unit?.name || ingredient.unitInput || ''} ${ingredient.food?.name || ingredient.foodInput || ''} ${ingredient.note || ''}`.trim(),
                title: null,
                originalText: null
              };
            }
            // Si l'ingrédient a déjà le format complet
            return ingredient;
          });
        }
      } 
      // Si aucun ingrédient n'est fourni, utiliser un ingrédient par défaut
      else if (currentRecipe.recipeIngredient && Array.isArray(currentRecipe.recipeIngredient)) {
        formattedIngredients = currentRecipe.recipeIngredient;
      } else {
        formattedIngredients = [{
          quantity: 1,
          unit: null,
          food: null,
          note: "Ajoutez vos ingrédients",
          isFood: true,
          disableAmount: false,
          display: "1 Ajoutez vos ingrédients",
          title: null,
          originalText: null
        }];
      }
      
      // Traiter les données nutritionnelles
      let formattedNutrition = currentRecipe.nutrition || {}; {};
      
      if (payload.nutrition) {
        // Fusion avec conversion de type
        formattedNutrition = {
          ...formattedNutrition,
          ...payload.nutrition
        };
        // S'assurer que les valeurs numériques sont correctement typées
        Object.keys(formattedNutrition).forEach(key => {
          const value = formattedNutrition[key];
          if (value !== null && value !== undefined && value !== "") {
            formattedNutrition[key] = Number(value);
          } else {
            formattedNutrition[key] = null;
          }
        });
      }
      
      // Créer un payload complet en fusionnant les données actuelles et les modifications
      const completePayload = {
        ...currentRecipe,  // Garder tous les champs système et autres attributs
        name: payload.name || currentRecipe.name,
        description: payload.description || currentRecipe.description,
        prepTime: payload.prepTime || currentRecipe.prepTime,
        cookTime: payload.cookTime || currentRecipe.cookTime,
        totalTime: payload.totalTime || currentRecipe.totalTime,
        recipeYield: payload.recipeYield || currentRecipe.recipeYield,
        recipeServings: payload.recipeServings || currentRecipe.recipeServings || 4,
        recipeCategory: payload.recipeCategory || currentRecipe.recipeCategory,
        recipeIngredient: formattedIngredients,
        recipeInstructions: formattedInstructions,
        nutrition: formattedNutrition
      };
      
      // Log de débogage
      console.log("Envoi des données nutritionnelles:", completePayload.nutrition);
      
      // Utiliser la méthode PUT avec le slug comme dans l'exemple fonctionnel
      console.log("Envoi de la mise à jour avec PUT sur /recipes/" + currentRecipe.slug);
      return await axiosInstance.put(`/recipes/${currentRecipe.slug}`, completePayload);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette', error);
      
      // Erreur détaillée pour faciliter le débogage
      if (error.response && error.response.data) {
        console.error('Détails de l\'erreur API:', error.response.data);
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
   * Importe une recette depuis une URL
   * @param {String} url - URL de la recette à importer
   * @returns {Promise<Object>} Données de la recette importée
   */
  async importRecipeFromUrl(url) {
    if (!url) {
      throw new Error('URL requise');
    }
    
    try {
      // Le format du payload selon l'API Mealie
      const payload = { url: url };
      
      // Appel à l'API Mealie pour importer depuis une URL
      // L'endpoint exact peut varier selon votre installation de Mealie
      return await axiosInstance.post('/recipes/create/url', payload);
    } catch (error) {
      console.error('Erreur lors de l\'importation de la recette', error);
      
      // Gestion détaillée des erreurs pour faciliter le débogage
      if (error.response && error.response.data) {
        console.error('Détails de l\'erreur API:', error.response.data);
      }
      
      throw error;
    }
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
      return await axiosInstance.delete(`/recipes/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la recette', error);
      throw new Error('Impossible de supprimer la recette');
    }
  },


    
  
  async uploadRecipeImageFixed(slugOrId, imageFile) {
    if (!slugOrId || !imageFile) {
      throw new Error('Identifiant de recette et fichier image requis');
    }
    
    try {
      // Créer un FormData
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const extension = imageFile.name.split('.').pop() || 'jpg';
      formData.append('extension', extension);
      
      console.log(`Tentative d'upload pour ${slugOrId} avec extension ${extension}`);
      
      // Utiliser directement le token hardcodé pour tester
      const token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb25nX3Rva2VuIjp0cnVlLCJpZCI6IjA5MGZmMTQ0LTcxNmItNDUyOS05M2RhLTYzOTFiNWE5OTRhOSIsIm5hbWUiOiJBUFBMSVMiLCJpbnRlZ3JhdGlvbl9pZCI6ImdlbmVyaWMiLCJleHAiOjE5MDEzNjQ2NTd9.rnymUqY_UfEmwY8AqOQ-9bK5Rn2PIFTLea3mODCVBRo";
      console.log("Utilisation du token hardcodé:", token);
      
      // Utiliser axios directement avec le token hardcodé
      const baseURL = axiosInstance.defaults.baseURL || '';
      const url = `${baseURL}/recipes/${slugOrId}/image`;
      
      console.log("URL complète:", url);
      
      const response = await axios.put(url, formData, {
        headers: {
          'Accept': 'application/json',
          'Authorization': token
        }
      });
      
      console.log("Réponse de l'upload:", response);
      return response;
    } catch (error) {
      console.error("Erreur détaillée lors de l'upload:", error);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Données:", error.response.data);
        console.error("Headers envoyés:", error.config.headers);
      }
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
   * Met à jour partiellement une recette (PATCH)
   * @param {String} id - ID de la recette
   * @param {Object} partialData - Données partielles à mettre à jour
   * @returns {Promise<Object>} Recette mise à jour
   */
  async updateRecipePartial(id, partialData) {
    if (!id) {
      throw new Error('ID de recette manquant');
    }
    
    try {
      console.log("Mise à jour partielle de la recette avec PATCH:", partialData);
      
      // Vérifier les données minimales requises
      if (!partialData.name && !partialData.slug) {
        console.warn("Les données de mise à jour ne contiennent ni nom ni slug");
        
        // Tenter de récupérer le slug depuis l'API si non fourni
        if (!partialData.slug) {
          const currentRecipe = await this.getById(id);
          if (currentRecipe.data && currentRecipe.data.slug) {
            partialData.slug = currentRecipe.data.slug;
          }
        }
      }
      
      // Traiter spécifiquement les ingrédients si présents
      if (partialData.recipeIngredient) {
        partialData.recipeIngredient = partialData.recipeIngredient.map(ingredient => {
          // S'assurer que les referenceId sont des chaînes non nulles
          if (ingredient.referenceId === null || ingredient.referenceId === undefined) {
            ingredient.referenceId = "";
          }
          
          // IMPORTANT: Conserver les unités nulles explicitement
          // Ne pas modifier les valeurs null pour unit
          
          return ingredient;
        });
      }
      
      // Traiter les instructions si présentes
      if (partialData.recipeInstructions) {
        partialData.recipeInstructions = partialData.recipeInstructions.map((instruction, index) => {
          return {
            ...instruction,
            position: index + 1
          };
        });
      }
      
      // S'assurer que l'API comprend explicitement les valeurs null
      // Certaines API ignorent les propriétés null par défaut
      const headers = {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      };
      
      // Effectuer la requête PATCH
      return await axiosInstance.patch(`/recipes/${id}`, partialData, { headers });
    } catch (error) {
      console.error('Erreur lors de la mise à jour partielle de la recette', error);
      
      // Erreur détaillée pour faciliter le débogage
      if (error.response && error.response.data) {
        console.error('Détails de l\'erreur API:', error.response.data);
      }
      
      // Si PATCH n'est pas supporté (405 Method Not Allowed), on peut essayer avec PUT
      if (error.response && error.response.status === 405) {
        console.warn("PATCH non supporté par l'API, tentative avec PUT");
        return await this.updateRecipe(id, partialData);
      }
      
      throw new Error('Impossible de mettre à jour partiellement la recette');
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
   * Récupère tous les aliments disponibles avec support amélioré de pagination
   * @param {Object} options - Options de pagination et filtrage
   * @returns {Promise<Object>} Aliments disponibles
   */
  async getFoods(options = {}) {
    const { 
      page = 1, 
      perPage = 100, 
      query = '',
      orderBy = 'name',
      orderDirection = 'asc'
    } = options;
    
    const params = new URLSearchParams();
    
    params.append('page', page);
    params.append('perPage', perPage);
    
    if (query) {
      params.append('search', query);
    }
    
    // Ajouter les paramètres de tri
    if (orderBy) {
      params.append('orderBy', orderBy);
      params.append('orderDirection', orderDirection);
    }
    
    try {
      const response = await axiosInstance.get('/foods', { 
        params,
        // Désactiver le cache pour éviter les problèmes de pagination
        cache: false 
      });
      
      // Ajouter des logs pour le débogage
      console.log(`Chargement des ingrédients - page ${page}, ${perPage} par page`);
      if (response.data && response.data.pagination) {
        console.log(`Pagination: ${response.data.pagination.currentPage}/${response.data.pagination.totalPages}, 
                    Total: ${response.data.pagination.totalItems}`);
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la récupération des aliments', error);
      throw new Error('Impossible de récupérer les aliments');
    }
  },
  

  /**
   * Crée un nouvel aliment
   * @param {Object} foodData - Données de l'aliment à créer
   * @returns {Promise<Object>} Aliment créé
   */
  async createFood(foodData) {
    if (!foodData || !foodData.name) {
      throw new Error('Nom de l\'aliment requis');
    }
    
    try {
      // Formatage des données selon l'API
      const payload = {
        id: "", // Inclure un ID vide que l'API remplira
        name: foodData.name,
        description: foodData.description || '',
        // Ajoutez d'autres champs si nécessaires pour votre API
      };
      
      return await axiosInstance.post('/foods', payload);
    } catch (error) {
      console.error('Erreur lors de la création de l\'aliment', error);
      
      // Afficher les détails de l'erreur si disponibles
      if (error.response && error.response.data) {
        console.error('Détails de l\'erreur API:', error.response.data);
      }
      
      throw new Error('Impossible de créer l\'aliment');
    }
  },

  /**
   * Recherche des aliments avec des options avancées
   * @param {String} query - Terme de recherche
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Object>} Résultats de recherche
   */
  async searchFoods(query, options = {}) {
    const { limit = 30, exactMatch = false } = options;
    const params = new URLSearchParams();
    
    if (query) {
      params.append('search', query);
    }
    
    params.append('page', 1);
    params.append('perPage', limit);
    
    if (exactMatch) {
      params.append('exactMatch', 'true');
    }
    
    try {
      return await axiosInstance.get('/foods', { params });
    } catch (error) {
      console.error('Erreur lors de la recherche d\'aliments', error);
      throw new Error('Impossible de rechercher les aliments');
    }
  },

  async getIngredientReferenceId(foodId) {
    try {
      // Cette route est hypothétique - vous devez ajuster selon l'API de Mealie
      return await axiosInstance.get(`/foods/${foodId}/reference`);
    } catch (error) {
      console.error('Erreur lors de la récupération du referenceId', error);
      throw new Error('Impossible de récupérer le referenceId');
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