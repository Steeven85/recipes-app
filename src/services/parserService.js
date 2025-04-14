import axiosInstance from './axiosInstance';

export const parserService = {
  /**
   * Appelle l’API pour parser une liste d’ingrédients.
   * @param {Array} ingredients - Tableau de chaînes représentant les ingrédients
   * @param {String} parser - Le type de parser ("nlp" ou "brute")
   * @returns {Promise<Object>} Réponse de l’API (tableau d’objets parsés)
   */
  async parseIngredients(ingredients, parser = "brute") {
    const payload = {
      parser,
      ingredients,
    };

    // Par exemple, vous pouvez ajouter l'en-tête "Accept-Language" si nécessaire
    return axiosInstance.post('/api/parser/ingredients', payload, {
      headers: {
        "Accept-Language": "fr"
      }
    });
  }
};
