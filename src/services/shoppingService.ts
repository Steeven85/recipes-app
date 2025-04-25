import axiosInstance from './axiosInstance';

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
   * Ajoute un article à la liste de courses en utilisant le format correct
   * @param {Object} item - Données de l'article
   * @param {String} listId - ID de la liste
   * @returns {Promise<Object>} Article ajouté
   */
  async addToShoppingList(item, listId) {
    if (!listId) {
      throw new Error('ID de liste requis');
    }
    
    try {
      // Formater l'article au format attendu par l'API
      const formattedItem = {
        id: "", // L'API générera un ID
        shoppingListId: listId,
        checked: item.checked || false,
        position: 0, // L'API ajustera ça
        isFood: true,
        quantity: item.quantity,
        note: item.note || "",
        labelId: item.labelId || "",
        unitId: item.unitId,
        foodId: item.foodId,
        unit: item.unit,
        food: item.food,
        label: item.label
      };
      
      // Utiliser l'endpoint /households/shopping/items/create-bulk
      return await axiosInstance.post(`/households/shopping/items/create-bulk`, [formattedItem]);
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la liste de courses', error);
      throw new Error('Impossible d\'ajouter l\'article à la liste de courses');
    }
  },
  
  /**
   * Met à jour un article de la liste
   * @param {Object} item - Article à mettre à jour
   * @returns {Promise<Object>} Article mis à jour
   */
  async updateShoppingItem(item) {
    if (!item || !item.id) {
      throw new Error('ID d\'article requis');
    }
    
    try {
      // Utiliser le format d'envoi bulk même pour une mise à jour unique
      return await axiosInstance.put(`/households/shopping/items`, [item]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'article', error);
      throw new Error('Impossible de mettre à jour l\'article');
    }
  },
  
  /**
   * Supprime un article de la liste
   * @param {String} itemId - ID de l'article
   * @returns {Promise<void>}
   */
  async removeShoppingItem(itemId) {
    if (!itemId) {
      throw new Error('ID d\'article requis');
    }
    
    try {
      return await axiosInstance.delete(`/households/shopping/items/${itemId}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'article', error);
      throw new Error('Impossible de supprimer l\'article');
    }
  },

  /**
   * Ajoute plusieurs articles à la liste de courses en une seule requête
   * @param {Array} items - Tableau d'articles à ajouter
   * @param {String} listId - ID de la liste
   * @returns {Promise<Object>} Résultat de l'ajout
   */
  async addBulkToShoppingList(items, listId) {
    if (!listId) {
      throw new Error('ID de liste requis');
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Liste d\'articles vide ou invalide');
    }
    
    try {
      // Formater tous les articles au format attendu par l'API
      const formattedItems = items.map(item => ({
        id: "", // L'API générera un ID
        shoppingListId: listId,
        checked: item.checked || false,
        position: 0,
        isFood: true,
        quantity: item.quantity,
        note: item.note || "",
        labelId: item.labelId || "",
        unitId: item.unitId,
        foodId: item.foodId,
        unit: item.unit,
        food: item.food,
        label: item.label
      }));
      
      // Utiliser l'endpoint create-bulk
      return await axiosInstance.post(`/households/shopping/items/create-bulk`, formattedItems);
    } catch (error) {
      console.error('Erreur lors de l\'ajout groupé à la liste de courses', error);
      throw new Error('Impossible d\'ajouter les articles à la liste de courses');
    }
  },
  
  /**
   * Met à jour plusieurs articles de la liste en une seule requête
   * @param {Array} items - Tableau d'articles à mettre à jour
   * @returns {Promise<Object>} Résultat de la mise à jour
   */
  async updateBulkShoppingItems(items) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Liste d\'articles vide ou invalide');
    }
    
    try {
      // S'assurer que tous les articles ont un ID
      if (items.some(item => !item.id)) {
        throw new Error('Tous les articles doivent avoir un ID');
      }
      
      return await axiosInstance.put(`/households/shopping/items`, items);
    } catch (error) {
      console.error('Erreur lors de la mise à jour groupée des articles', error);
      throw new Error('Impossible de mettre à jour les articles');
    }
  },

  /**
   * Purge la liste de courses (supprime tous les articles ou uniquement les non cochés)
   * @param {String} listId - ID de la liste
   * @param {Boolean} keepCheckedItems - Conserver les articles cochés
   * @returns {Promise<void>}
   */
  async clearShoppingList(listId, keepCheckedItems = false) {
    if (!listId) {
      throw new Error('ID de liste requis');
    }
    
    try {
      // 1. Récupérer les articles de la liste
      const response = await this.getShoppingList(listId);
      
      let itemsToRemove = [];
      
      // Déterminer quels articles supprimer
      if (response.data && response.data.listItems) {
        itemsToRemove = keepCheckedItems 
          ? response.data.listItems.filter(item => !item.checked)
          : response.data.listItems;
      } else if (Array.isArray(response.data)) {
        itemsToRemove = keepCheckedItems
          ? response.data.filter(item => !item.checked)
          : response.data;
      }
      
      // Si aucun article à supprimer, terminer
      if (itemsToRemove.length === 0) {
        return;
      }
      
      // 2. Supprimer les articles un par un
      for (const item of itemsToRemove) {
        await this.removeShoppingItem(item.id);
      }
    } catch (error) {
      console.error('Erreur lors de la purge de la liste de courses', error);
      throw new Error('Impossible de purger la liste de courses');
    }
  },

  /**
   * Ajoute une recette à la liste de courses
   * @param {String} recipeId - ID de la recette
   * @param {String} listId - ID de la liste
   * @param {Number} recipeScale - Échelle de la recette (multiplicateur)
   * @returns {Promise<Object>} Résultat de l'ajout
   */
  async addRecipeToShoppingList(recipeId, listId, recipeScale = 1) {
    if (!recipeId) {
      throw new Error('ID de recette requis');
    }
    
    if (!listId) {
      throw new Error('ID de liste requis');
    }
    
    try {
      return await axiosInstance.post(`/households/shopping/recipes/list/${listId}`, {
        recipeId: recipeId,
        recipeScale: recipeScale
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la recette à la liste', error);
      throw new Error('Impossible d\'ajouter la recette à la liste de courses');
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