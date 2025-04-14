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


  
  async scrapeRecipeImage(slug, recipeUrl) {
    if (!slug || !recipeUrl) {
      throw new Error("Le slug et l'URL de la recette sont requis");
    }
    try {
      const payload = {
        includeTags: true,
        url: recipeUrl
      };
      // On suppose que l'endpoint est '/recipes/{slug}/image'
      return await axiosInstance.post(`/recipes/${slug}/image`, payload);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'image via scraping", error);
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
        performTime: payload.performTime || currentRecipe.performTime,
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
   * Importe une recette depuis une URL avec analyse des ingrédients
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
      const importResponse = await axiosInstance.post('/recipes/create/url', payload);
      
      // Si l'importation a réussi et renvoie une recette
      if (importResponse && importResponse.data) {
        let recipeId = null;
        let recipeSlug = null;
        let recipeData = null;
        
        // Extraire l'ID et le slug de la recette selon le format de réponse
        if (typeof importResponse.data === 'object') {
          recipeId = importResponse.data.id;
          recipeSlug = importResponse.data.slug;
          recipeData = importResponse.data;
        } else if (typeof importResponse.data === 'string') {
          // Si l'API renvoie un slug ou un ID comme chaîne
          // Déterminer si c'est un slug ou un ID en cherchant des tirets
          if (importResponse.data.includes('-')) {
            recipeSlug = importResponse.data;
          } else {
            recipeId = importResponse.data;
          }
        }
        
        console.log(`Recette importée - ID: ${recipeId}, Slug: ${recipeSlug}`);
        
        // Si on n'a pas encore les données complètes de la recette, les récupérer
        if (!recipeData) {
          try {
            // Essayer d'abord avec le slug si disponible
            if (recipeSlug) {
              console.log("Récupération des détails de la recette par slug:", recipeSlug);
              const recipeResponse = await this.getBySlug(recipeSlug);
              if (recipeResponse && recipeResponse.data) {
                recipeData = recipeResponse.data;
                // S'assurer d'avoir l'ID si pas déjà récupéré
                if (!recipeId && recipeData.id) {
                  recipeId = recipeData.id;
                }
              }
            }
            // Si pas de données récupérées avec le slug, essayer avec l'ID
            else if (recipeId) {
              console.log("Récupération des détails de la recette par ID:", recipeId);
              const recipeResponse = await this.getById(recipeId);
              if (recipeResponse && recipeResponse.data) {
                recipeData = recipeResponse.data;
                // S'assurer d'avoir le slug si pas déjà récupéré
                if (!recipeSlug && recipeData.slug) {
                  recipeSlug = recipeData.slug;
                }
              }
            }
          } catch (fetchErr) {
            console.warn("Impossible de récupérer les détails de la recette après importation:", fetchErr);
            // Continuer malgré l'erreur - on utilisera la réponse d'importation originale
          }
        }
        
        // Si on a les données de recette et des ingrédients, les analyser localement
        let enhancedRecipeData = recipeData;
        if (recipeData && recipeData.recipeIngredient && recipeData.recipeIngredient.length > 0) {
          try {
            console.log("Analyse des ingrédients de la recette importée");
            // Analyser et restructurer les ingrédients (modifications locales uniquement)
            enhancedRecipeData = await this.parseAndUpdateRecipeIngredients(recipeData);
          } catch (parseErr) {
            console.warn("Erreur lors de l'analyse des ingrédients:", parseErr);
            // Continuer malgré l'erreur d'analyse, utiliser les données originales
          }
        }
        
        // Si nous avons analysé les données, créer une réponse enrichie
        if (enhancedRecipeData) {
          // Clone la réponse originale
          const enhancedResponse = { ...importResponse };
          // Remplacer les données par les données enrichies
          enhancedResponse.data = enhancedRecipeData;
          
          // Stocker les données enrichies dans le store
          if (window.recipeStore && typeof window.recipeStore.addRecipe === 'function') {
            try {
              window.recipeStore.addRecipe(enhancedRecipeData);
              console.log("Recette enrichie ajoutée au store");
            } catch (storeErr) {
              console.warn("Impossible d'ajouter la recette au store:", storeErr);
            }
          }
          
          return enhancedResponse;
        }
        
        // Sinon, retourner la réponse originale
        return importResponse;
      }
      
      return importResponse;
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
   * Analyse et optimise les ingrédients d'une recette en utilisant le slug au lieu de l'ID
   * @param {String} recipeIdOrSlug - ID ou slug de la recette à optimiser
   * @returns {Promise<Object>} Recette avec ingrédients optimisés
   */
  async optimizeRecipeIngredients(recipeIdOrSlug) {
    if (!recipeIdOrSlug) {
      throw new Error('Identifiant de recette requis');
    }
    
    try {
      // Déterminer si l'identifiant est un slug ou un ID
      const isSlug = recipeIdOrSlug.includes('-') && isNaN(recipeIdOrSlug.charAt(0));
      console.log(`Optimisation des ingrédients pour ${isSlug ? 'slug' : 'ID'}: ${recipeIdOrSlug}`);
      
      // Récupérer les détails de la recette (directement par slug si possible)
      let recipeResponse;
      if (isSlug) {
        recipeResponse = await this.getBySlug(recipeIdOrSlug);
      } else {
        recipeResponse = await this.getById(recipeIdOrSlug);
      }
      
      if (!recipeResponse || !recipeResponse.data) {
        throw new Error('Impossible de récupérer les détails de la recette');
      }
      
      const recipeData = recipeResponse.data;
      console.log(`Récupération réussie de la recette: ${recipeData.name} (Slug: ${recipeData.slug})`);
      
      // Vérifier si la recette a des ingrédients
      if (!recipeData.recipeIngredient || !Array.isArray(recipeData.recipeIngredient) || recipeData.recipeIngredient.length === 0) {
        throw new Error('La recette ne contient pas d\'ingrédients à optimiser');
      }
      
      // Extraire les textes d'ingrédients en nettoyant le format "1 [texte réel]"
      const ingredientTexts = recipeData.recipeIngredient.map(ingredient => {
        // Utiliser originalText si disponible
        if (ingredient.originalText && ingredient.originalText.trim()) {
          // Nettoyer le format "1 [texte réel]" si présent
          const text = ingredient.originalText.trim();
          // Si le texte commence par "1 " suivi d'une autre unité ou nombre, supprimer ce "1 "
          if (text.match(/^1\s+(?:\d+|\d+\/\d+|\d+\.\d+|\d+\s+\w+)/)) {
            return text.replace(/^1\s+/, '');
          }
          return text;
        }
        
        // Sinon, utiliser display
        if (ingredient.display && ingredient.display.trim()) {
          const text = ingredient.display.trim();
          // Nettoyer le même format dans display
          if (text.match(/^1\s+(?:\d+|\d+\/\d+|\d+\.\d+|\d+\s+\w+)/)) {
            return text.replace(/^1\s+/, '');
          }
          return text;
        }
        
        return '';
      }).filter(text => text); // Filtrer les textes vides
      
      if (ingredientTexts.length === 0) {
        console.warn("Aucun texte d'ingrédient à analyser");
        return recipeData;
      }
      
      console.log("Textes d'ingrédients nettoyés à analyser:", ingredientTexts);
      
      // Analyser les ingrédients via l'API de parsing
      const parseResponse = await this.parseIngredients({
        parser: 'nlp',
        ingredients: ingredientTexts
      });
      
      if (!parseResponse.data || !Array.isArray(parseResponse.data)) {
        throw new Error('Réponse invalide du parser d\'ingrédients');
      }
      
      // Récupérer les aliments existants pour la recherche de correspondance
      const foodsResponse = await referenceService.getFoods({ perPage: 1000 });
      const existingFoods = (foodsResponse.data && foodsResponse.data.items) ? foodsResponse.data.items : [];
      
      // Récupérer les unités existantes
      const unitsResponse = await referenceService.getUnits();
      const existingUnits = (unitsResponse.data && unitsResponse.data.items) ? unitsResponse.data.items : [];
      
      // Créer une copie profonde de la recette pour les modifications
      const optimizedRecipe = JSON.parse(JSON.stringify(recipeData));
      
      // Mapper les résultats d'analyse aux ingrédients
      const parsedResults = parseResponse.data;
      
      for (let i = 0; i < Math.min(parsedResults.length, optimizedRecipe.recipeIngredient.length); i++) {
        const originalIngredient = optimizedRecipe.recipeIngredient[i];
        const parsedResult = parsedResults[i];
        
        if (parsedResult && parsedResult.ingredient && parsedResult.confidence.average > 0.7) {
          const parsedIngredient = parsedResult.ingredient;
          
          // Mettre à jour la quantité uniquement si elle semble valide
          if (parsedIngredient.quantity !== undefined && parsedIngredient.quantity > 0) {
            originalIngredient.quantity = parsedIngredient.quantity;
          }
          
          // Mettre à jour l'unité avec recherche de correspondance
          if (parsedIngredient.unit) {
            // Si l'API a renvoyé une unité avec ID, l'utiliser directement
            if (parsedIngredient.unit.id) {
              originalIngredient.unit = parsedIngredient.unit;
            } 
            // Sinon, chercher une correspondance
            else if (parsedIngredient.unit.name) {
              const unitName = parsedIngredient.unit.name.toLowerCase();
              const matchingUnit = existingUnits.find(unit => 
                unit.name.toLowerCase() === unitName || 
                unit.abbreviation && unit.abbreviation.toLowerCase() === unitName ||
                unit.pluralName && unit.pluralName.toLowerCase() === unitName
              );
              
              if (matchingUnit) {
                originalIngredient.unit = matchingUnit;
                console.log(`Correspondance d'unité trouvée: ${matchingUnit.name}`);
              } else {
                originalIngredient.unit = parsedIngredient.unit;
              }
            }
          }
          
          // Rechercher une correspondance pour l'aliment
          if (parsedIngredient.food && parsedIngredient.food.name) {
            const foodName = parsedIngredient.food.name.toLowerCase();
            // Rechercher une correspondance exacte ou partielle
            const matchingFood = existingFoods.find(food => 
              food.name.toLowerCase() === foodName || 
              food.name.toLowerCase().includes(foodName) || 
              foodName.includes(food.name.toLowerCase())
            );
            
            if (matchingFood) {
              // Utiliser l'aliment existant trouvé
              originalIngredient.food = matchingFood;
              console.log(`Correspondance trouvée pour '${parsedIngredient.food.name}': ${matchingFood.name} (ID: ${matchingFood.id})`);
            } else if (!originalIngredient.food) {
              // Utiliser l'aliment analysé sans ID (sera créé lors de la mise à jour)
              originalIngredient.food = parsedIngredient.food;
              console.log(`Aucune correspondance trouvée pour '${parsedIngredient.food.name}'`);
            }
          }
          
          // Extraire les notes et commentaires si disponibles
          if (parsedIngredient.note) {
            originalIngredient.note = parsedIngredient.note;
          }
          
          // Conserver le referenceId original ou en générer un nouveau si nécessaire
          if (!originalIngredient.referenceId) {
            originalIngredient.referenceId = this.generateUUID();
          }
          
          // Mettre à jour l'affichage pour refléter les modifications
          originalIngredient.display = this.formatIngredientDisplay(originalIngredient);
        }
      }
      
      console.log("Ingrédients optimisés:", optimizedRecipe.recipeIngredient);
      
      return optimizedRecipe;
    } catch (error) {
      console.error('Erreur lors de l\'optimisation des ingrédients:', error);
      throw new Error('Impossible d\'optimiser les ingrédients de la recette');
    }
  },


  /**
   * Extrait la note d'un ingrédient depuis différentes sources possibles
   * @param {Object} ingredient - L'ingrédient à analyser
   * @returns {String} La note extraite
   */
  extractIngredientNote(ingredient) {
    // Si la note existe déjà, l'utiliser directement
    if (ingredient.note && ingredient.note.trim()) {
      return ingredient.note.trim();
    }
    
    // Essayer d'extraire la note depuis le originalText
    if (ingredient.originalText) {
      // Extraire le contenu entre parenthèses s'il existe
      const parenthesesMatch = ingredient.originalText.match(/\(([^)]+)\)/);
      if (parenthesesMatch && parenthesesMatch[1]) {
        return parenthesesMatch[1].trim();
      }
    }
    
    // Essayer d'extraire la note depuis le display
    if (ingredient.display) {
      // Même logique pour le display
      const parenthesesMatch = ingredient.display.match(/\(([^)]+)\)/);
      if (parenthesesMatch && parenthesesMatch[1]) {
        return parenthesesMatch[1].trim();
      }
    }
    
    return '';
  },

  /**
   * Met à jour une recette avec les ingrédients optimisés après validation par l'utilisateur
   * @param {String} recipeId - ID de la recette à mettre à jour
   * @param {Object} optimizedRecipe - Données de la recette avec ingrédients optimisés
   * @returns {Promise<Object>} Recette mise à jour
   */
  async updateRecipeWithOptimizedIngredients(recipeId, optimizedRecipe) {
    if (!recipeId || !optimizedRecipe) {
      throw new Error('ID de recette et données optimisées requis');
    }
    
    try {
      // D'abord récupérer la version originale de la recette
      const originalRecipeResponse = await this.getById(recipeId);
      if (!originalRecipeResponse || !originalRecipeResponse.data) {
        throw new Error('Impossible de récupérer la recette originale');
      }
      
      const originalRecipe = originalRecipeResponse.data;
      
      // Créer une copie du payload original pour préserver sa structure
      const payload = JSON.parse(JSON.stringify(originalRecipe));
      
      // Mise à jour uniquement des ingrédients
      if (optimizedRecipe.recipeIngredient && Array.isArray(optimizedRecipe.recipeIngredient)) {
        // Pour chaque ingrédient optimisé, maintenir la structure mais mettre à jour les valeurs
        payload.recipeIngredient = optimizedRecipe.recipeIngredient.map((ingredient, index) => {
          // Générer un nouveau referenceId pour chaque ingrédient pour éviter les conflits
          const referenceId = this.generateUUID();
          
          // Extraire la note de la parenthèse si présente
          let note = ingredient.note || '';
          if (ingredient.originalText) {
            const match = ingredient.originalText.match(/\(([^)]+)\)/);
            if (match && match[1]) {
              note = match[1].trim();
            }
          }
          
          // Formater l'affichage proprement
          let display = '';
          if (ingredient.quantity) {
            display += ingredient.quantity;
          }
          
          if (ingredient.unit) {
            const unitSymbol = ingredient.unit.abbreviation || ingredient.unit.name;
            if (unitSymbol) {
              display += ' ' + unitSymbol;
            }
          }
          
          if (ingredient.food && ingredient.food.name) {
            display += ' ' + ingredient.food.name;
          }
          
          if (note) {
            display += ' ' + note;
          }
          
          display = display.trim();
          
          // Retourner un ingrédient bien formaté
          return {
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            food: ingredient.food,
            note: note,
            isFood: true,
            disableAmount: false,
            display: display,
            title: null,
            originalText: ingredient.originalText || null,
            referenceId: referenceId
          };
        });
      }
      
      // Utiliser PUT avec le slug pour la mise à jour
      return await axiosInstance.put(`/recipes/${originalRecipe.slug}`, payload);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette avec les ingrédients optimisés:', error);
      
      // Afficher les détails de l'erreur pour le débogage
      if (error.response && error.response.data) {
        console.error('Détails de l\'erreur API:', error.response.data);
      }
      
      throw new Error('Impossible de mettre à jour la recette avec les ingrédients optimisés');
    }
  },

  /**
   * Formate l'affichage d'un ingrédient en fonction de ses propriétés
   * @param {Object} ingredient - L'ingrédient à formater
   * @returns {String} Chaîne formatée pour l'affichage
   */
  formatIngredientDisplay(ingredient) {
    let display = '';
    
    // Ajouter la quantité si présente
    if (ingredient.quantity) {
      display += ingredient.quantity;
    }
    
    // Ajouter l'unité si présente
    if (ingredient.unit) {
      const unitName = ingredient.unit.abbreviation || ingredient.unit.name;
      if (unitName) {
        display += display ? ' ' + unitName : unitName;
      }
    }
    
    // Ajouter le nom de l'aliment si présent
    if (ingredient.food && ingredient.food.name) {
      display += display ? ' ' + ingredient.food.name : ingredient.food.name;
    }
    
    // Ajouter la note si présente
    if (ingredient.note) {
      display += display ? ' ' + ingredient.note : ingredient.note;
    }
    
    return display.trim();
  },


  /**
   * Analyse les ingrédients d'une recette importée et tente de trouver des correspondances dans la base de données
   * @param {Object} recipeData - Données de la recette avec ingrédients à analyser
   * @returns {Promise<Object>} Recette avec ingrédients analysés (modifications locales uniquement)
   */
  async parseAndUpdateRecipeIngredients(recipeData) {
    if (!recipeData || !recipeData.recipeIngredient || !Array.isArray(recipeData.recipeIngredient)) {
      throw new Error('Données de recette invalides ou ingrédients manquants');
    }
    
    try {
      // Extraire les textes d'ingrédients à analyser
      const ingredientTexts = recipeData.recipeIngredient.map(ingredient => {
        // Essayer d'extraire le texte le plus pertinent
        if (ingredient.originalText && ingredient.originalText.trim()) {
          return ingredient.originalText.trim();
        } else if (ingredient.note && ingredient.note.trim()) {
          if (ingredient.display && ingredient.display.trim()) {
            // Combiner pour avoir une représentation complète
            return `${ingredient.display.trim()} (${ingredient.note.trim()})`;
          }
          return ingredient.note.trim();
        } else if (ingredient.display && ingredient.display.trim()) {
          return ingredient.display.trim();
        }
        return ''; // Fallback pour les ingrédients sans texte
      }).filter(text => text); // Filtrer les textes vides
      
      if (ingredientTexts.length === 0) {
        console.warn("Aucun texte d'ingrédient à analyser");
        return recipeData;
      }
      
      console.log("Textes d'ingrédients à analyser:", ingredientTexts);
      
      // Appeler l'API de parsing d'ingrédients
      const parseResponse = await this.parseIngredients({
        parser: 'nlp', // Utiliser le parser NLP pour une meilleure précision
        ingredients: ingredientTexts
      });
      
      if (!parseResponse.data || !Array.isArray(parseResponse.data)) {
        throw new Error('Réponse invalide du parser d\'ingrédients');
      }
      
      console.log("Résultats du parsing:", parseResponse.data);
      
      // Créer une copie des données de recette pour les modifications locales
      const updatedRecipeData = JSON.parse(JSON.stringify(recipeData));
      
      // Parcourir les résultats d'analyse pour enrichir les ingrédients existants
      // sans remplacer complètement les ingrédients (ce qui pourrait casser les références)
      const parsedResults = parseResponse.data;
      
      for (let i = 0; i < Math.min(parsedResults.length, recipeData.recipeIngredient.length); i++) {
        const parsedResult = parsedResults[i];
        const originalIngredient = recipeData.recipeIngredient[i];
        
        // Vérifier si l'analyse a produit un résultat valide
        if (parsedResult && parsedResult.ingredient && parsedResult.confidence.average > 0.7) {
          const parsedIngredient = parsedResult.ingredient;
          
          // Enrichir l'ingrédient existant avec les données analysées
          // mais conserver les ID et references qui existent déjà
          if (parsedIngredient.quantity !== undefined) {
            updatedRecipeData.recipeIngredient[i].quantity = parsedIngredient.quantity;
          }
          
          // Utiliser l'unité du parsing seulement si celle d'origine est null
          if (parsedIngredient.unit && !originalIngredient.unit) {
            updatedRecipeData.recipeIngredient[i].unit = parsedIngredient.unit;
          }
          
          // Ajouter des informations sur l'aliment si manquantes
          if (parsedIngredient.food && !originalIngredient.food) {
            updatedRecipeData.recipeIngredient[i].food = parsedIngredient.food;
          }
          
          // Ajouter une note si elle n'existe pas déjà
          if (parsedIngredient.note && !originalIngredient.note) {
            updatedRecipeData.recipeIngredient[i].note = parsedIngredient.note;
          }
          
          // Conserver le referenceId original
          // Le display peut être mis à jour pour refléter les changements
          updatedRecipeData.recipeIngredient[i].display = this.formatIngredientDisplay(updatedRecipeData.recipeIngredient[i]);
        }
      }
      
      console.log("Ingrédients enrichis (modifications locales uniquement):", updatedRecipeData.recipeIngredient);
      
      return updatedRecipeData;
    } catch (error) {
      console.error('Erreur lors de l\'analyse des ingrédients:', error);
      
      // Gestion détaillée des erreurs
      if (error.response && error.response.data) {
        console.error('Détails de l\'erreur API:', error.response.data);
      }
      
      throw new Error('Impossible d\'analyser les ingrédients');
    }
  },

  /**
   * Formate l'affichage d'un ingrédient en fonction de ses propriétés
   * @param {Object} ingredient - L'ingrédient à formater
   * @returns {String} Chaîne formatée pour l'affichage
   */
  formatIngredientDisplay(ingredient) {
    let display = '';
    
    // Ajouter la quantité si présente
    if (ingredient.quantity) {
      display += ingredient.quantity;
    }
    
    // Ajouter l'unité si présente
    if (ingredient.unit) {
      const unitName = ingredient.unit.abbreviation || ingredient.unit.name;
      if (unitName) {
        display += display ? ' ' + unitName : unitName;
      }
    }
    
    // Ajouter le nom de l'aliment si présent
    if (ingredient.food && ingredient.food.name) {
      display += display ? ' ' + ingredient.food.name : ingredient.food.name;
    }
    
    // Ajouter la note si présente
    if (ingredient.note) {
      display += display ? ' ' + ingredient.note : ingredient.note;
    }
    
    return display.trim();
  },

  /**
   * Génère un UUID v4 pour les referenceId des ingrédients
   * @returns {String} UUID généré
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
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


  /**
   * Analyse les ingrédients d'une recette et tente de les associer à la base de données d'ingrédients
   * @param {Object} recipeData - Données de la recette à analyser
   * @returns {Promise<Object>} Résultat de l'analyse avec les correspondances trouvées
   */
  async analyzeRecipeIngredients(recipeData) {
    if (!recipeData || !recipeData.recipeIngredient || !Array.isArray(recipeData.recipeIngredient)) {
      throw new Error('Données de recette invalides ou ingrédients manquants');
    }
    
    // Extraire les textes d'ingrédients pour l'analyse
    const ingredientTexts = recipeData.recipeIngredient.map(ingredient => {
      if (ingredient.originalText && ingredient.originalText.trim()) {
        return ingredient.originalText.trim();
      } else if (ingredient.display && ingredient.display.trim()) {
        return ingredient.display.trim();
      } else if (ingredient.note && ingredient.note.trim()) {
        return ingredient.note.trim();
      }
      return '';
    }).filter(text => text);
    
    if (ingredientTexts.length === 0) {
      throw new Error('Aucun ingrédient à analyser');
    }
    
    try {
      // 1. Analyser les ingrédients avec le parser NLP
      console.log("Analyse des ingrédients avec le parser NLP");
      const parseResponse = await this.parseIngredients({
        parser: 'nlp',
        ingredients: ingredientTexts
      });
      
      if (!parseResponse.data || !Array.isArray(parseResponse.data)) {
        throw new Error('Réponse invalide du parser d\'ingrédients');
      }
      
      const parsedResults = parseResponse.data;
      
      // 2. Pour chaque ingrédient analysé, chercher une correspondance dans la base de données
      const enhancedIngredients = [];
      
      for (let i = 0; i < Math.min(parsedResults.length, recipeData.recipeIngredient.length); i++) {
        const parsedResult = parsedResults[i];
        const originalIngredient = recipeData.recipeIngredient[i];
        
        // Créer une copie de l'ingrédient original pour les modifications
        const enhancedIngredient = { ...originalIngredient };
        
        // Si l'analyse a produit un résultat valide
        if (parsedResult && parsedResult.ingredient && parsedResult.confidence && parsedResult.confidence.average > 0.7) {
          const parsedIngredient = parsedResult.ingredient;
          
          // Appliquer les valeurs du parsing à l'ingrédient
          enhancedIngredient.quantity = parsedIngredient.quantity;
          enhancedIngredient.unit = parsedIngredient.unit; // L'unité du parser contient déjà l'ID
          enhancedIngredient.note = parsedIngredient.note || enhancedIngredient.note;
          
          // Chercher une correspondance pour l'aliment dans la base de données
          if (parsedIngredient.food && parsedIngredient.food.name) {
            try {
              const foodName = parsedIngredient.food.name;
              console.log(`Recherche d'une correspondance pour: "${foodName}"`);
              
              // Utiliser searchFoods pour trouver des correspondances
              const searchResponse = await this.searchFoods(foodName, { 
                limit: 5,
                exactMatch: false
              });
              
              if (searchResponse.data && searchResponse.data.items && searchResponse.data.items.length > 0) {
                // Trouver la meilleure correspondance
                const matchedFoods = searchResponse.data.items;
                
                // Ordonner par similarité de nom
                const sortedMatches = matchedFoods.sort((a, b) => {
                  const aSimilarity = this.calculateSimilarity(a.name.toLowerCase(), foodName.toLowerCase());
                  const bSimilarity = this.calculateSimilarity(b.name.toLowerCase(), foodName.toLowerCase());
                  return bSimilarity - aSimilarity; // Tri décroissant
                });
                
                // Si la meilleure correspondance a une similarité suffisante
                const bestMatch = sortedMatches[0];
                const similarity = this.calculateSimilarity(bestMatch.name.toLowerCase(), foodName.toLowerCase());
                
                if (similarity > 0.7) {
                  console.log(`Correspondance trouvée: "${bestMatch.name}" (${similarity.toFixed(2)})`);
                  enhancedIngredient.food = bestMatch;
                  enhancedIngredient.matchConfidence = similarity;
                } else {
                  // Garder l'aliment analysé sans ID (sera traité comme nouveau)
                  console.log(`Pas de correspondance pertinente pour "${foodName}"`);
                  enhancedIngredient.food = parsedIngredient.food;
                  enhancedIngredient.matchConfidence = 0;
                  enhancedIngredient.needsReview = true;
                }
                
                // Stocker les correspondances alternatives pour l'interface
                enhancedIngredient.alternativeFoods = sortedMatches.slice(0, 3).map(food => ({
                  ...food,
                  similarity: this.calculateSimilarity(food.name.toLowerCase(), foodName.toLowerCase())
                }));
              } else {
                // Aucune correspondance trouvée
                enhancedIngredient.food = parsedIngredient.food;
                enhancedIngredient.matchConfidence = 0;
                enhancedIngredient.needsReview = true;
              }
            } catch (searchErr) {
              console.warn(`Erreur lors de la recherche pour "${parsedIngredient.food.name}":`, searchErr);
              enhancedIngredient.food = parsedIngredient.food;
              enhancedIngredient.matchConfidence = 0;
              enhancedIngredient.needsReview = true;
            }
          }
          
          // Mettre à jour l'affichage formaté
          enhancedIngredient.display = this.formatIngredientDisplay(enhancedIngredient);
        } else {
          // Si l'analyse n'a pas réussi, marquer pour révision
          enhancedIngredient.needsReview = true;
        }
        
        enhancedIngredients.push(enhancedIngredient);
      }
      
      // 3. Retourner les ingrédients enrichis avec les métadonnées d'analyse
      return {
        originalRecipe: recipeData,
        enhancedIngredients: enhancedIngredients,
        analysisResults: parsedResults,
        needsReview: enhancedIngredients.some(ing => ing.needsReview)
      };
    } catch (error) {
      console.error('Erreur lors de l\'analyse et de la mise en correspondance des ingrédients:', error);
      throw error;
    }
  },

  /**
   * Calcule la similarité entre deux chaînes (score simple entre 0 et 1)
   * @param {String} str1 - Première chaîne
   * @param {String} str2 - Deuxième chaîne
   * @returns {Number} Score de similarité (0-1)
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Algorithme simple de similarité basé sur les sous-chaînes communes
    const longerStr = str1.length > str2.length ? str1 : str2;
    const shorterStr = str1.length > str2.length ? str2 : str1;
    
    // Si la chaîne courte est contenue dans la longue
    if (longerStr.includes(shorterStr)) {
      return shorterStr.length / longerStr.length;
    }
    
    // Chercher la plus longue sous-chaîne commune
    let longestCommon = 0;
    for (let i = 0; i < shorterStr.length; i++) {
      for (let j = i + 1; j <= shorterStr.length; j++) {
        const subStr = shorterStr.substring(i, j);
        if (longerStr.includes(subStr) && subStr.length > longestCommon) {
          longestCommon = subStr.length;
        }
      }
    }
    
    return longestCommon / longerStr.length;
  },

  /**
   * Met à jour une recette avec des ingrédients optimisés après révision
   * @param {String} recipeId - ID de la recette à mettre à jour
   * @param {Array} revisedIngredients - Ingrédients révisés
   * @returns {Promise<Object>} Recette mise à jour
   */
  async updateRecipeWithRevisedIngredients(recipeId, revisedIngredients) {
    if (!recipeId) {
      throw new Error('ID de recette requis');
    }
    
    if (!revisedIngredients || !Array.isArray(revisedIngredients)) {
      throw new Error('Ingrédients révisés requis');
    }
    
    try {
      // 1. Récupérer la recette complète
      const recipeResponse = await this.getById(recipeId);
      if (!recipeResponse || !recipeResponse.data) {
        throw new Error('Impossible de récupérer la recette');
      }
      
      const recipe = recipeResponse.data;
      
      // 2. Mettre à jour uniquement les ingrédients
      const updatedRecipe = {
        ...recipe,
        recipeIngredient: revisedIngredients
      };
      
      // 3. Faire la mise à jour en utilisant le slug pour plus de fiabilité
      console.log(`Mise à jour de la recette ${recipe.name} (${recipe.slug}) avec les ingrédients révisés`);
      const updateResponse = await axiosInstance.put(`/recipes/${recipe.slug}`, updatedRecipe);
      
      return updateResponse;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette avec les ingrédients révisés:', error);
      throw error;
    }
  },


  /**
   * Parse les ingrédients à partir d'un tableau de chaînes.
   * @param {Object} payload - Doit contenir :
   *   - parser : un identifiant (ex. "nlp" ou "brute")
   *   - ingredients : un tableau de chaînes d'ingrédients non analysés
   * @returns {Promise<Object>} Réponse de l’API avec les données parsées
   */
  async parseIngredients(payload) {
    try {
      return await axiosInstance.post('/parser/ingredients', payload);
    } catch (error) {
      console.error('Erreur lors du parsing des ingrédients', error);
      throw error;
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
  
  // Récupère toutes les unités disponibles
  async getUnits() {
    try {
      return await axiosInstance.get('/units');
    } catch (error) {
      console.error('Erreur lors de la récupération des unités', error);
      throw new Error('Impossible de récupérer les unités');
    }
  },

  /**
   * Crée une nouvelle unité.
   * On envoie toutes les informations pertinentes :
   * - name, pluralName, description, extras,
   * - fraction, abbreviation, pluralAbbreviation, useAbbreviation,
   * - et éventuellement aliases.
   * @param {Object} unitData - Données de l'unité à créer
   * @returns {Promise<Object>} La nouvelle unité créée
   */
  async createUnit(unitData) {
    if (!unitData || !unitData.name) {
      throw new Error("Le nom de l'unité est requis");
    }

    const payload = {
      name: unitData.name,
      pluralName: unitData.pluralName || null,
      description: unitData.description || "",
      extras: unitData.extras || {},
      fraction: unitData.fraction !== undefined ? unitData.fraction : false,
      abbreviation: unitData.abbreviation || "",
      pluralAbbreviation: unitData.pluralAbbreviation || "",
      useAbbreviation: unitData.useAbbreviation !== undefined ? unitData.useAbbreviation : false,
      aliases: unitData.aliases || []
    };

    try {
      return await axiosInstance.post('/units', payload);
    } catch (error) {
      console.error("Erreur lors de la création de l'unité", error);
      throw new Error("Impossible de créer l'unité");
    }
  },

  /**
   * Met à jour une unité existante.
   * @param {String} id - ID de l'unité à mettre à jour
   * @param {Object} unitData - Données à mettre à jour
   * @returns {Promise<Object>} La réponse de l'API
   */
  async updateUnit(id, unitData) {
    if (!id) {
      throw new Error("ID de l'unité manquant");
    }
    // Pour la mise à jour, on envoie un payload avec toutes les infos nécessaires
    const payload = {
      name: unitData.name,
      pluralName: unitData.pluralName || null,
      description: unitData.description || "",
      extras: unitData.extras || {},
      fraction: unitData.fraction !== undefined ? unitData.fraction : false,
      abbreviation: unitData.abbreviation || "",
      pluralAbbreviation: unitData.pluralAbbreviation || "",
      useAbbreviation: unitData.useAbbreviation !== undefined ? unitData.useAbbreviation : false,
      aliases: unitData.aliases || []
    };

    try {
      // Ici on utilise PUT, en supposant que l'API met à jour l'unité via PUT sur /units/{id}
      return await axiosInstance.put(`/units/${id}`, payload);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'unité", error);
      throw error;
    }
  },

  /**
   * Supprime une unité à partir de son ID
   * @param {String} id - ID de l'unité à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteUnit(id) {
    if (!id) {
      throw new Error("ID de l'unité manquant");
    }
    try {
      return await axiosInstance.delete(`/units/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'unité", error);
      throw error;
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
  },

  /**
   * Supprime un aliment (ingrédient) à partir de son ID
   * @param {String} id - ID de l'aliment à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteFood(id) {
    if (!id) {
      throw new Error("ID de l'aliment manquant");
    }
    try {
      return await axiosInstance.delete(`/foods/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'aliment", error);
      throw error;
    }
  },
  /**
   * Supprime une unité à partir de son ID
   * @param {String} id - ID de l'unité à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async deleteUnit(id) {
    if (!id) {
      throw new Error("ID de l'unité manquant");
    }
    try {
      return await axiosInstance.delete(`/units/${id}`);
    } catch (error) {
      console.error("Erreur lors de la suppression de l'unité", error);
      throw error;
    }
  },
  /**
   * Met à jour un aliment (ingrédient) en envoyant une requête PUT à l'API
   * @param {String} id - L'ID de l'aliment à mettre à jour
   * @param {Object} foodData - Les données modifiées de l'aliment
   * @returns {Promise<Object>} - La réponse de l'API
   */
  async updateFood(id, foodData) {
    if (!id) {
      throw new Error("ID de l'aliment manquant");
    }
    try {
      // Ici, j'utilise PUT. Si ton API préfère PATCH, adapte la méthode et l'URL en conséquence.
      return await axiosInstance.put(`/foods/${id}`, foodData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'aliment", error);
      throw error;
    }
  },


};