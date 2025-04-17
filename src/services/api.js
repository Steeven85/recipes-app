 import axiosInstance from './axiosInstance';
import axios from 'axios';

const imageUrlCache = new Map(); 


// ======================================================
// Fonctions utilitaires pour le matching d'aliments
// ======================================================

/**
 * Recherche asynchrone de la meilleure correspondance pour un aliment dans une liste existante.
 * On procède de la manière suivante :
 * - Recherche d'une correspondance exacte dans existingFoods.
 * - Calcul d'un score via découpage en tokens et similarité.
 * - Si le score est en dessous de 1 (i.e. correspondance partielle), on lance une recherche via API
 *   (exemple ici avec referenceService.searchFoods) pour trouver éventuellement un meilleur candidat.
 *
 *
 * Améliorations pour findBestFoodMatch avec gestion spéciale pour viandes et ingrédients composés
 *
*
 * Recherche asynchrone de la meilleure correspondance pour un aliment en utilisant les données existantes.
 * Version finale améliorée.
 * @param {String} foodName Nom d'aliment recherché
 * @param {Array} existingFoods Liste d'aliments de la base de données
 * @param {Array} existingUnits Liste d'unités de la base de données
 * @returns {Promise<Object|null>} Objet { food, score } ou null si aucun candidat n'est trouvé.
 */
async function findBestFoodMatch(foodName, existingFoods, existingUnits = []) {
  if (!foodName || !existingFoods || existingFoods.length === 0) {
    return null;
  }

  // Préparer un nom d'aliment nettoyé (sans accents, en minuscules)
  const normalizedFoodName = normalizeString(foodName.toLowerCase().trim());
  console.log(`Recherche normalisée pour: "${normalizedFoodName}"`);
  
  // Construire l'ensemble des termes d'unités
  const unitTerms = new Set();
  if (existingUnits && existingUnits.length > 0) {
    existingUnits.forEach(unit => {
      if (unit.name) unitTerms.add(normalizeString(unit.name.toLowerCase()));
      if (unit.pluralName) unitTerms.add(normalizeString(unit.pluralName.toLowerCase()));
      if (unit.abbreviation) unitTerms.add(normalizeString(unit.abbreviation.toLowerCase()));
      if (unit.pluralAbbreviation) unitTerms.add(normalizeString(unit.pluralAbbreviation.toLowerCase()));
    });
  }
  
  // Ajouter des abréviations communes qui pourraient manquer
  const commonAbbr = ['g', 'kg', 'ml', 'l', 'cl', 'cas', 'cac', 'cs', 'cc', 'gou', 'gou.', 'c.a.s', 'c.a.c'];
  commonAbbr.forEach(abbr => unitTerms.add(abbr));
  
  // Nettoyer le nom de l'aliment en retirant les unités et expressions parasites
  const cleanedFoodName = cleanFoodName(normalizedFoodName, unitTerms);
  console.log(`Nom d'aliment nettoyé: "${cleanedFoodName}"`);
  
  // Définir des catégories d'aliments et leurs variations pour améliorer la recherche
  const foodCategories = {
    'viande': {
      base: ['viande', 'boeuf', 'bœuf', 'porc', 'agneau', 'mouton', 'volaille', 'poulet', 'dinde', 'canard', 'veau'],
      variations: ['hache', 'haché', 'émincé', 'emince', 'filet', 'steak', 'côte', 'cote', 'escalope', 'cuisse', 'aile']
    },
    'legume': {
      base: ['legume', 'légume', 'tomate', 'carotte', 'oignon', 'ail', 'pomme de terre', 'salade', 'laitue'],
      variations: ['frais', 'fraiche', 'cru', 'cuite', 'surgelé', 'surgele', 'en conserve']
    }
  };
  
  // Identifier la catégorie de l'aliment et ses composants
  const words = cleanedFoodName.split(/\s+/);
  const foodComponents = {
    category: null,
    base: null,
    variation: null
  };
  
  // Analyser chaque mot pour identifier la composition de l'aliment
  for (const word of words) {
    for (const [category, terms] of Object.entries(foodCategories)) {
      if (terms.base.includes(word)) {
        foodComponents.category = category;
        foodComponents.base = word;
      }
      if (terms.variations.includes(word)) {
        foodComponents.variation = word;
      }
    }
  }
  
  // 1. Recherche de correspondance exacte
  const exactMatch = existingFoods.find(food => {
    if (!food.name) return false;
    return normalizeString(food.name.toLowerCase()) === cleanedFoodName;
  });
  
  if (exactMatch) {
    console.log(`Correspondance exacte trouvée: "${exactMatch.name}"`);
    return { food: exactMatch, score: 1 };
  }
  
  // 2. Cas spécial pour "boeuf haché" et variations similaires
  if (cleanedFoodName.includes('boeuf') && cleanedFoodName.includes('hache')) {
    // Chercher d'abord une correspondance directe comme "boeuf haché"
    const beefMatch = existingFoods.find(food => {
      if (!food.name) return false;
      const normalizedName = normalizeString(food.name.toLowerCase());
      return (normalizedName.includes('boeuf') && normalizedName.includes('hache')) ||
             (normalizedName.includes('viande') && normalizedName.includes('hache')) ||
             (normalizedName === 'boeuf hache') || 
             (normalizedName === 'viande hachee');
    });
    
    if (beefMatch) {
      console.log(`Correspondance spéciale pour viande hachée: "${beefMatch.name}"`);
      return { food: beefMatch, score: 0.95 };
    }
    
    // Si pas de correspondance directe, chercher "viande hachée" ou similaire
    const beefVariants = ['viande hachee', 'steak hache', 'boeuf hache', 'viande de boeuf'];
    for (const variant of beefVariants) {
      const variantMatch = existingFoods.find(food => {
        if (!food.name) return false;
        return normalizeString(food.name.toLowerCase()).includes(variant);
      });
      
      if (variantMatch) {
        console.log(`Correspondance variante pour boeuf haché: "${variantMatch.name}"`);
        return { food: variantMatch, score: 0.9 };
      }
    }
  }
  
  // 3. Recherche par composants pour les aliments composés
  if (foodComponents.base && foodComponents.variation) {
    // Rechercher les aliments qui contiennent à la fois la base et la variation
    const composedMatches = existingFoods.filter(food => {
      if (!food.name) return false;
      const normalizedName = normalizeString(food.name.toLowerCase());
      return normalizedName.includes(foodComponents.base) && 
             normalizedName.includes(foodComponents.variation);
    });
    
    if (composedMatches.length > 0) {
      // Trier par longueur pour favoriser les noms plus courts (généralement plus précis)
      composedMatches.sort((a, b) => a.name.length - b.name.length);
      console.log(`Correspondance par composants: "${composedMatches[0].name}"`);
      return { food: composedMatches[0], score: 0.9 };
    }
  }
  
  // 4. Construire un index de mots pour chaque aliment
  const foodWordIndex = new Map();
  existingFoods.forEach(food => {
    if (!food.name) return;
    
    const words = normalizeString(food.name.toLowerCase()).split(/\s+/);
    words.forEach(word => {
      if (word.length < 2) return; // Ignorer les mots trop courts
      
      if (!foodWordIndex.has(word)) {
        foodWordIndex.set(word, []);
      }
      foodWordIndex.get(word).push(food);
    });
  });
  
  // 5. Trouver les aliments qui contiennent des mots du terme recherché
  const searchWords = cleanedFoodName.split(/\s+/);
  const candidateFoods = new Map(); // Map pour stocker les candidats et leur score initial
  
  searchWords.forEach(word => {
    if (word.length < 2) return; // Ignorer les mots trop courts
    
    // Chercher les aliments contenant ce mot
    if (foodWordIndex.has(word)) {
      foodWordIndex.get(word).forEach(food => {
        if (!candidateFoods.has(food.id)) {
          candidateFoods.set(food.id, { food, score: 0 });
        }
        // Incrémenter le score pour chaque mot correspondant
        candidateFoods.get(food.id).score += 0.2;
      });
    }
  });
  
  // 6. Si aucun candidat n'est trouvé, chercher par similarité globale
  if (candidateFoods.size === 0) {
    existingFoods.forEach(food => {
      const similarity = calculateSimilarity(cleanedFoodName, normalizeString(food.name.toLowerCase()));
      if (similarity > 0.4) { // Seuil de similarité minimum
        candidateFoods.set(food.id, { food, score: similarity });
      }
    });
  }
  
  // 7. Règles spéciales pour termes courts ou ingrédients difficiles
  if (candidateFoods.size === 0 || cleanedFoodName.length <= 5) {
    existingFoods.forEach(food => {
      if (!food.name) return;
      
      const normalizedName = normalizeString(food.name.toLowerCase());
      
      // Pour les aliments courts comme "ail", "riz", etc.
      if (cleanedFoodName.length <= 5 && normalizedName.includes(cleanedFoodName)) {
        const score = 0.5 + (cleanedFoodName.length / normalizedName.length) * 0.3;
        
        // Favoriser les correspondances exactes aux extrémités des mots
        if (normalizedName.startsWith(cleanedFoodName) || normalizedName.endsWith(cleanedFoodName)) {
          candidateFoods.set(food.id, { food, score: score + 0.1 });
        } else {
          candidateFoods.set(food.id, { food, score });
        }
      }
      
      // Recherche par mot-clé unique pour les aliments composés
      if (searchWords.length === 1 && searchWords[0].length >= 3) {
        const searchWord = searchWords[0];
        const foodWords = normalizedName.split(/\s+/);
        
        if (foodWords.includes(searchWord)) {
          // Score proportionnel à l'importance du mot dans le nom
          const wordImportance = searchWord.length / normalizedName.length;
          candidateFoods.set(food.id, { food, score: 0.6 + wordImportance * 0.3 });
        }
      }
    });
  }
  
  // 8. Affiner les scores des candidats
  for (const [id, candidate] of candidateFoods.entries()) {
    const food = candidate.food;
    const normalizedName = normalizeString(food.name.toLowerCase());
    
    // Bonus pour mots entiers correspondants
    const foodWords = normalizedName.split(/\s+/);
    const exactWordMatches = searchWords.filter(word => foodWords.includes(word)).length;
    
    if (exactWordMatches > 0) {
      const wordMatchRatio = exactWordMatches / searchWords.length;
      candidate.score += 0.1 * exactWordMatches + (wordMatchRatio * 0.2);
    }
    
    // Bonus si le nom de l'aliment contient entièrement le terme recherché
    if (normalizedName.includes(cleanedFoodName)) {
      candidate.score += 0.2;
      
      // Bonus supplémentaire si c'est au début ou à la fin (indiquant souvent l'ingrédient principal)
      if (normalizedName.startsWith(cleanedFoodName) || normalizedName.endsWith(cleanedFoodName)) {
        candidate.score += 0.1;
      }
    }
    
    // Bonus si les longueurs sont similaires
    const lengthRatio = Math.min(normalizedName.length, cleanedFoodName.length) / 
                        Math.max(normalizedName.length, cleanedFoodName.length);
    candidate.score += lengthRatio * 0.1;
    
    // Malus pour les noms très longs ou trop différents
    if (normalizedName.length > cleanedFoodName.length * 3) {
      candidate.score -= 0.1;
    }
    
    // Plafonner le score à 1
    candidate.score = Math.min(1, candidate.score);
  }
  
  // 9. Trouver le meilleur candidat
  let bestMatch = null;
  let bestScore = 0;
  
  for (const [id, candidate] of candidateFoods.entries()) {
    if (candidate.score > bestScore) {
      bestScore = candidate.score;
      bestMatch = candidate.food;
    }
  }
  
  // 10. Gestion spéciale des catégories si toujours pas de bonne correspondance
  if (bestScore < 0.6 && foodComponents.base) {
    // Chercher par catégorie de base (viande, légume, etc.)
    const categoryMatches = existingFoods.filter(food => {
      if (!food.name) return false;
      const normalizedName = normalizeString(food.name.toLowerCase());
      return normalizedName.includes(foodComponents.base);
    });
    
    if (categoryMatches.length > 0) {
      // Trier par similarité avec le terme complet
      categoryMatches.sort((a, b) => {
        const aSim = calculateSimilarity(cleanedFoodName, normalizeString(a.name.toLowerCase()));
        const bSim = calculateSimilarity(cleanedFoodName, normalizeString(b.name.toLowerCase()));
        return bSim - aSim;
      });
      
      // Utiliser le meilleur match par catégorie si son score est meilleur
      const categoryScore = calculateSimilarity(cleanedFoodName, normalizeString(categoryMatches[0].name.toLowerCase()));
      if (categoryScore > bestScore) {
        bestMatch = categoryMatches[0];
        bestScore = categoryScore;
      }
    }
  }
  
  // Seuil minimum pour considérer une correspondance valide
  const threshold = 0.5;
  
  if (bestScore >= threshold && bestMatch) {
    console.log(`Meilleure correspondance: "${bestMatch.name}" avec score ${bestScore.toFixed(2)}`);
    return { food: bestMatch, score: bestScore };
  }
  
  console.log(`Aucune correspondance satisfaisante trouvée. Meilleur score: ${bestScore.toFixed(2)}`);
  return null;
}

/**
 * Fonction dédiée pour traiter les fractions, y compris les cas spéciaux
 * @param {String} text Texte contenant potentiellement des fractions
 * @returns {Number|null} Valeur numérique extraite ou null
 */
function extractFraction(text) {
  if (!text) return null;
  
  // Détection explicite pour les cas les plus problématiques
  if (text.includes('¹/₄')) return 0.25;
  if (text.includes('¹/₂')) return 0.5;
  if (text.includes('¹/₃')) return 0.333;
  if (text.includes('²/₃')) return 0.667;
  if (text.includes('¾')) return 0.75;
  if (text.includes('½')) return 0.5;
  if (text.includes('¼')) return 0.25;
  
  // Essayer de capturer les autres fractions en notation standard
  const fractionMatch = text.match(/(\d+)\/(\d+)/);
  if (fractionMatch && fractionMatch[1] && fractionMatch[2]) {
    const numerator = parseInt(fractionMatch[1], 10);
    const denominator = parseInt(fractionMatch[2], 10);
    if (denominator !== 0) {
      return numerator / denominator;
    }
  }
  
  return null;
}

/**
 * Fonction utilitaire pour convertir les fractions Unicode et textuelles en valeurs numériques
 * @param {String} text Texte contenant potentiellement des fractions
 * @returns {Number|null} Valeur numérique ou null si pas de conversion possible
 */
function parseQuantityWithFractions(text) {
  if (!text) return null;
  
  // Normaliser les espaces
  const normalizedText = text.trim().replace(/\s+/g, ' ');
  
  // 1. Cas des fractions Unicode comme ¼, ½, ¾, etc.
  const fractionMap = {
    '¼': 0.25,
    '½': 0.5,
    '¾': 0.75,
    '⅓': 0.333,
    '⅔': 0.667,
    '⅕': 0.2,
    '⅖': 0.4,
    '⅗': 0.6,
    '⅘': 0.8,
    '⅙': 0.167,
    '⅚': 0.833,
    '⅛': 0.125,
    '⅜': 0.375,
    '⅝': 0.625,
    '⅞': 0.875
  };
  
  // Détecter les fractions Unicode
  for (const [fraction, value] of Object.entries(fractionMap)) {
    if (normalizedText === fraction) {
      console.log(`Fraction Unicode détectée: ${fraction} -> ${value}`);
      return value;
    }
    
    // Cas mixte: nombre entier suivi d'une fraction Unicode (ex: "1 ½")
    const mixedPattern = new RegExp(`^(\\d+)\\s*${fraction}$`);
    const mixedMatch = normalizedText.match(mixedPattern);
    if (mixedMatch) {
      const wholeNumber = parseInt(mixedMatch[1], 10);
      const result = wholeNumber + value;
      console.log(`Fraction mixte détectée: ${normalizedText} -> ${result}`);
      return result;
    }
  }
  
  // 2. Détecter les fractions écrites avec des chiffres en exposant/indice (ex: ¹/₄, ¹/₂)
  const superSubscriptPattern = /^(?:(\d+)\s+)?([¹²³⁴⁵⁶⁷⁸⁹]+)\s*[\/\u2044]\s*([₀₁₂₃₄₅₆₇₈₉]+)$/;
  const ssMatch = normalizedText.match(superSubscriptPattern);
  
  if (ssMatch) {
    // Convertir les chiffres en exposant/indice en nombres
    const superscriptMap = {'¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9};
    const subscriptMap = {'₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9};
    
    let wholeNumber = ssMatch[1] ? parseInt(ssMatch[1], 10) : 0;
    
    // Convertir le numérateur
    let numerator = 0;
    for (const char of ssMatch[2]) {
      if (superscriptMap[char]) {
        numerator = numerator * 10 + superscriptMap[char];
      }
    }
    
    // Convertir le dénominateur
    let denominator = 0;
    for (const char of ssMatch[3]) {
      if (subscriptMap[char]) {
        denominator = denominator * 10 + subscriptMap[char];
      }
    }
    
    if (denominator > 0) {
      const result = wholeNumber + (numerator / denominator);
      console.log(`Fraction exposant/indice détectée: ${normalizedText} -> ${result}`);
      return result;
    }
  }
  
  // 3. Détecter les fractions traditionnelles (ex: "1/4", "1/2")
  const fractionPattern = /^(?:(\d+)\s+)?(\d+)\s*[\/\u2044]\s*(\d+)$/;
  const fractionMatch = normalizedText.match(fractionPattern);
  
  if (fractionMatch) {
    const wholeNumber = fractionMatch[1] ? parseInt(fractionMatch[1], 10) : 0;
    const numerator = parseInt(fractionMatch[2], 10);
    const denominator = parseInt(fractionMatch[3], 10);
    
    if (denominator > 0) {
      const result = wholeNumber + (numerator / denominator);
      console.log(`Fraction traditionnelle détectée: ${normalizedText} -> ${result}`);
      return result;
    }
  }
  
  // 4. Cas simple: juste un nombre
  if (/^\d+(\.\d+)?$/.test(normalizedText)) {
    const result = parseFloat(normalizedText);
    return result;
  }
  
  // Aucun format reconnu
  return null;
}


/**
 * Normalise une chaîne en retirant les accents et caractères spéciaux
 * @param {String} str Chaîne à normaliser
 * @returns {String} Chaîne normalisée
 */
function normalizeString(str) {
  if (!str) return '';
  
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retire les accents
    .replace(/œ/g, 'oe')             // Remplace œ par oe
    .replace(/[^\w\s]/g, '')         // Retire caractères spéciaux
    .trim();
}

/**
 * Nettoie le nom d'un aliment en retirant les unités et expressions parasites
 * Version améliorée
 * @param {String} foodName Nom d'aliment à nettoyer
 * @param {Set} unitTerms Ensemble des termes d'unités à rechercher
 * @returns {String} Nom nettoyé
 */
function cleanFoodName(foodName, unitTerms) {
  if (!foodName) return '';
  
  // 1. Retirer le contenu entre parenthèses
  let cleaned = foodName.replace(/\(.*?\)/g, '').trim();
  
  // 2. Retirer les chiffres au début et les unités numériques
  cleaned = cleaned.replace(/^\d+(\.\d+)?\s*/, '').trim();
  cleaned = cleaned.replace(/^\d+\/\d+\s*/, '').trim();
  
  // 3. Découper en mots pour analyse
  const words = cleaned.split(/\s+/);
  if (words.length === 0) return cleaned;
  
  // Vérifier si le premier mot est une unité
  if (words.length > 1) {
    const firstWord = words[0];
    
    // Si c'est une unité connue, la retirer
    if (unitTerms.has(firstWord)) {
      words.shift();
      cleaned = words.join(' ');
    }
  }
  
  // 4. Traiter les patterns comme "X de Y" ou "X d'Y"
  if (words.length >= 3) {
    // Cas: "poignée de laitue" -> "laitue"
    if ((words[1] === 'de' || words[1] === 'd') && words[2]) {
      return words.slice(2).join(' ');
    }
  }
  
  // 5. Amélioration spéciale pour "bœuf haché" et variations
  // Si le texte contient "boeuf" et "hache", on les garde ensemble
  if (cleaned.includes('boeuf') && cleaned.includes('hache')) {
    return 'boeuf hache';
  }
  
  // 6. Retirer les articles et prépositions courants du début
  cleaned = cleaned.replace(/^(le|la|les|du|de la|des|de|d'|l'|en|au|aux|à|a)\s+/i, '');
  
  return cleaned;
}

/**
 * Calcule un score de similarité entre deux chaînes
 * @param {String} str1 Première chaîne
 * @param {String} str2 Deuxième chaîne
 * @returns {Number} Score de similarité entre 0 et 1
 */
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;

  const longerStr = str1.length > str2.length ? str1 : str2;
  const shorterStr = str1.length > str2.length ? str2 : str1;
  
  // Si l'une est contenue dans l'autre
  if (longerStr.includes(shorterStr)) {
    return (shorterStr.length / longerStr.length) * 0.8 + 0.2;
  }
  
  // Traitement des pluriels
  if (shorterStr.length > 2 && longerStr.endsWith('s') && 
      longerStr.slice(0, -1) === shorterStr) {
    return 0.9;
  }
  
  // Recherche de la plus longue sous-chaîne commune
  let longestCommon = 0;
  
  // D'abord vérifier les mots entiers
  const shorterWords = shorterStr.split(/\s+/);
  for (const word of shorterWords) {
    if (word.length >= 3 && longerStr.includes(word)) {
      longestCommon = Math.max(longestCommon, word.length);
    }
  }
  
  // Si aucun mot entier, essayer les sous-chaînes
  if (longestCommon === 0) {
    for (let i = 0; i < shorterStr.length; i++) {
      for (let j = i + 3; j <= shorterStr.length; j++) {
        const subStr = shorterStr.substring(i, j);
        if (longerStr.includes(subStr) && subStr.length > longestCommon) {
          longestCommon = subStr.length;
        }
      }
    }
  }
  
  return longestCommon / longerStr.length;
}


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
   * Version complète et optimisée de l'optimisation des ingrédients
   * @param {String} recipeIdOrSlug - ID ou slug de la recette à optimiser
   * @returns {Promise<Object>} Recette avec ingrédients optimisés
   */
  async optimizeRecipeIngredients(recipeIdOrSlug) {
    if (!recipeIdOrSlug) {
      throw new Error('Identifiant de recette requis');
    }
    
    try {
      const isSlug = recipeIdOrSlug.includes('-') && isNaN(recipeIdOrSlug.charAt(0));
      console.log(`Optimisation des ingrédients pour ${isSlug ? 'slug' : 'ID'}: ${recipeIdOrSlug}`);
      
      // 1. Récupérer les données de la recette
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
      
      if (!recipeData.recipeIngredient || !Array.isArray(recipeData.recipeIngredient) || recipeData.recipeIngredient.length === 0) {
        throw new Error('La recette ne contient pas d\'ingrédients à optimiser');
      }
      
      // 2. Charger les unités et aliments depuis l'API
      console.log("Chargement des unités et aliments depuis l'API...");
      const [unitsResponse, foodsResponse] = await Promise.all([
        referenceService.getUnits(),
        referenceService.getFoods({ perPage: 1000 })
      ]);
      
      const existingUnits = (unitsResponse.data && unitsResponse.data.items) ? unitsResponse.data.items : [];
      const existingFoods = (foodsResponse.data && foodsResponse.data.items) ? foodsResponse.data.items : [];
      
      console.log(`${existingUnits.length} unités et ${existingFoods.length} aliments chargés`);
      
      // 3. Prétraiter et nettoyer les textes d'ingrédients
      const ingredientTexts = recipeData.recipeIngredient.map(ingredient => {
        // Obtenir le texte d'origine
        let text = '';
        if (ingredient.originalText && ingredient.originalText.trim()) {
          text = ingredient.originalText.trim();
        } else if (ingredient.display && ingredient.display.trim()) {
          text = ingredient.display.trim();
        }
        
        // Stocker l'original pour référence future
        ingredient._originalText = text;
        
        return text;
      }).filter(text => text);
      
      if (ingredientTexts.length === 0) {
        console.warn("Aucun texte d'ingrédient à analyser");
        return recipeData;
      }
      
      console.log("Textes d'ingrédients nettoyés à analyser:", ingredientTexts);
      
      // 4. Analyser les ingrédients avec le parser NLP
      const parseResponse = await this.parseIngredients({
        parser: 'nlp',
        ingredients: ingredientTexts
      });
      
      if (!parseResponse.data || !Array.isArray(parseResponse.data)) {
        throw new Error('Réponse invalide du parser d\'ingrédients');
      }
      
      // 5. Optimiser les ingrédients
      const optimizedRecipe = JSON.parse(JSON.stringify(recipeData));
      const parsedResults = parseResponse.data;
      
      // Fonction d'aide pour trouver une unité spécifique par nom/abréviation exacte
      function findExactUnit(unitText) {
        if (!unitText) return null;
        
        const normalizedText = normalizeString(unitText.toLowerCase().trim());
        
        // Chercher par nom exact, pluriel ou abréviation
        const foundUnit = existingUnits.find(unit => {
          const unitName = unit.name ? normalizeString(unit.name.toLowerCase()) : '';
          const unitPluralName = unit.pluralName ? normalizeString(unit.pluralName.toLowerCase()) : '';
          const unitAbbr = unit.abbreviation ? normalizeString(unit.abbreviation.toLowerCase()) : '';
          
          return normalizedText === unitName || 
                normalizedText === unitPluralName || 
                normalizedText === unitAbbr;
        });
        
        return foundUnit || null;
      }
      
      // Fonction pour détecter une unité dans un texte en utilisant des motifs spécifiques
      function detectUnitInText(text) {
        if (!text) return null;
        
        // Détection pour les grammes
        const gramMatch = text.match(/(\d+)\s*g(?:rammes?)?(?:\b|\s|$)/i);
        if (gramMatch) {
          const gramUnit = existingUnits.find(u => u.abbreviation === 'g');
          if (gramUnit) {
            console.log("Unité gramme détectée dans le texte");
            return gramUnit;
          }
        }
        
        // Détection pour les gousses
        const gousseMatch = text.match(/(\d+\/\d+|\d+|\d+[.,]\d+)\s*(?:gou(?:sse)?s?)(?:\b|\s|\.|\d'|\s)/i);
        if (gousseMatch) {
          const gousseUnit = existingUnits.find(u => u.name === 'gousse');
          if (gousseUnit) {
            console.log("Unité gousse détectée dans le texte");
            return gousseUnit;
          }
        }
        
        // Détection pour "cuillère à soupe" et variantes
        const cuillereSoupeMatch = text.match(/(?:c(?:uill[èe]re)?\.?\s*[àa]\.?\s*s(?:oupe)?|c\s*[àa]\s*s|cas|cs)(?:\b|\s|\.)/i);
        if (cuillereSoupeMatch) {
          const casUnit = existingUnits.find(u => u.name === 'cuillère à soupe' || u.abbreviation === 'càs');
          if (casUnit) {
            console.log("Unité cuillère à soupe détectée dans le texte");
            return casUnit;
          }
        }
        
        // Détection pour "cuillère à café" et variantes
        const cuillereCafeMatch = text.match(/(?:c(?:uill[èe]re)?\.?\s*[àa]\.?\s*c(?:af[ée])?|c\s*[àa]\s*c|cac|cc)(?:\b|\s|\.)/i);
        if (cuillereCafeMatch) {
          const cacUnit = existingUnits.find(u => u.name === 'cuillère à café' || u.abbreviation === 'càc');
          if (cacUnit) {
            console.log("Unité cuillère à café détectée dans le texte");
            return cacUnit;
          }
        }
        
        // Aucune unité détectée
        return null;
      }
      
      // Traiter chaque ingrédient
      for (let i = 0; i < Math.min(parsedResults.length, optimizedRecipe.recipeIngredient.length); i++) {
        const originalIngredient = optimizedRecipe.recipeIngredient[i];
        const parsedResult = parsedResults[i];
        const originalText = originalIngredient._originalText || '';
        
        // Initialiser des valeurs par défaut
        let quantity = null;
        let unit = null;
        let food = null;
        let note = '';
        
        // Vérifier si le parsing est suffisamment fiable
        if (parsedResult && parsedResult.ingredient && parsedResult.confidence.average > 0.6) {
          const parsedIngredient = parsedResult.ingredient;
          
          // 1. Extraire la quantité correctement
          
          // 1.1 Vérifier d'abord si le texte contient des fractions
          const fractionValue = extractFraction(originalText);
          if (fractionValue !== null) {
            quantity = fractionValue;
            console.log(`Fraction extraite directement du texte: ${originalText} -> ${quantity}`);
          } else if (parsedIngredient.quantity !== undefined && parsedIngredient.quantity !== null) {
            quantity = parsedIngredient.quantity;
            
            // 1.2 Vérifier si c'est un cas où le parser interprète mal une fraction
            if (quantity === 1.25 && (originalText.includes('1/4') || originalText.includes('¼'))) {
              quantity = 0.25;
              console.log('Correction de 1.25 -> 0.25');
            } else if (quantity === 1.5 && (originalText.includes('1/2') || originalText.includes('½'))) {
              quantity = 0.5;
              console.log('Correction de 1.5 -> 0.5');
            }
            
            // 1.3 Si le texte contient 1 suivi d'une fraction, c'est peut-être juste la fraction
            if (quantity === 1 && /1\s+[¹\/]/.test(originalText)) {
              if (originalText.includes('1/4') || originalText.includes('¹/₄')) {
                quantity = 0.25;
                console.log('Correction de 1 + fraction -> 0.25');
              } else if (originalText.includes('1/2') || originalText.includes('¹/₂')) {
                quantity = 0.5;
                console.log('Correction de 1 + fraction -> 0.5');
              }
            }
            
            // 1.4 Correction spécifique pour les grammes avec nombre
            const gramMatch = originalText.match(/(\d+)\s*g\b/i);
            if (gramMatch && gramMatch[1] && quantity === 1) {
              quantity = parseInt(gramMatch[1], 10);
              console.log(`Correction de quantité pour grammes: ${quantity}g`);
            }
            
            // 1.5 Si la quantité est une valeur fractionnaire, arrondir à 3 décimales
            if (quantity % 1 !== 0) {
              quantity = Math.round(quantity * 1000) / 1000;
            }
          }
          
          // 2. Traiter l'unité correctement et prudemment
          if (parsedIngredient.unit) {
            if (parsedIngredient.unit.id) {
              // 2.1 Vérifier si l'ID existe dans notre base
              const dbUnit = existingUnits.find(u => u.id === parsedIngredient.unit.id);
              if (dbUnit) {
                unit = dbUnit;
                console.log(`Unité trouvée par ID dans la base: ${unit.name}`);
              }
            } else if (parsedIngredient.unit.name) {
              // 2.2 Chercher une correspondance exacte par nom
              const unitName = parsedIngredient.unit.name;
              const exactUnit = findExactUnit(unitName);
              if (exactUnit) {
                unit = exactUnit;
                console.log(`Unité trouvée par correspondance exacte: ${unit.name}`);
              }
            }
          }
          
          // 2.3 Si aucune unité n'a été trouvée, essayer de la détecter dans le texte
          if (!unit) {
            unit = detectUnitInText(originalText);
            
            // Cas spécial pour les grammes sans "g" explicite
            if (!unit && /^\d+$/.test(originalText.trim()) && parseInt(originalText.trim()) >= 5 && parseInt(originalText.trim()) <= 1000) {
              const gramUnit = existingUnits.find(u => u.abbreviation === 'g');
              if (gramUnit) {
                unit = gramUnit;
                console.log(`Attribution de l'unité gramme pour nombre seul: ${originalText.trim()}`);
              }
            }
          }
          
          // 3. Traiter l'aliment
          if (parsedIngredient.food && parsedIngredient.food.name) {
            // Extraire le nom réel de l'aliment
            const foodNameRaw = parsedIngredient.food.name;
            
            // Utiliser notre fonction améliorée pour trouver la meilleure correspondance
            const bestCandidate = await findBestFoodMatch(foodNameRaw, existingFoods, existingUnits);
            
            if (bestCandidate && bestCandidate.food) {
              food = bestCandidate.food;
              console.log(`Correspondance trouvée pour '${foodNameRaw}': ${bestCandidate.food.name} (Score: ${bestCandidate.score.toFixed(2)})`);
              
              // Cas spécial pour "boeuf haché"
              if (originalText.toLowerCase().includes('bœuf') && originalText.toLowerCase().includes('haché')) {
                // Rechercher spécifiquement viande hachée ou équivalent
                const beefMatch = existingFoods.find(f => {
                  if (!f.name) return false;
                  const name = f.name.toLowerCase();
                  return name.includes('haché') && (name.includes('bœuf') || name.includes('boeuf') || name.includes('viande'));
                });
                
                if (beefMatch) {
                  food = beefMatch;
                  console.log(`Correction spéciale pour bœuf haché: ${beefMatch.name}`);
                  
                  // Extraire correctement la quantité et l'unité si c'est en grammes
                  const gramMatch = originalText.match(/(\d+)\s*g\b/i);
                  if (gramMatch && gramMatch[1]) {
                    quantity = parseFloat(gramMatch[1]);
                    
                    // Trouver l'unité "g" dans les unités existantes
                    const gramUnit = existingUnits.find(u => u.abbreviation === 'g');
                    if (gramUnit) {
                      unit = gramUnit;
                    }
                  }
                }
              }
            } else {
              // Si pas de correspondance, garder l'aliment original du parser
              food = parsedIngredient.food;
              console.log(`Aucune correspondance trouvée pour '${foodNameRaw}', utilisation des données du parser`);
            }
          }
          
          // 4. Extraire la note
          if (parsedIngredient.note) {
            note = parsedIngredient.note;
          } else {
            // Pour les ingrédients entre parenthèses
            const parenthesesMatch = originalText.match(/\(([^)]+)\)/);
            if (parenthesesMatch && parenthesesMatch[1]) {
              note = parenthesesMatch[1].trim();
            }
          }
          
          // 5. Nettoyage de la note
          if (note) {
            // Éviter de répéter le nom de l'aliment dans la note
            if (food && food.name && note.includes(food.name)) {
              note = note.replace(new RegExp(food.name, 'gi'), '').trim();
            }
            
            // Éviter de répéter la quantité et l'unité dans la note
            if (quantity && unit && unit.name) {
              const qtyUnitRegex = new RegExp(`${quantity}\\s*${unit.name}`, 'gi');
              note = note.replace(qtyUnitRegex, '').trim();
            }
            
            // Nettoyer les parenthèses vides et caractères de ponctuation superflus
            note = note.replace(/^\(+|\)+$/g, '').trim();
            note = note.replace(/^[,;:\s]+|[,;:\s]+$/g, '').trim();
          }
        } else {
          // Si le parsing n'est pas fiable, conserver les valeurs originales
          quantity = originalIngredient.quantity;
          unit = originalIngredient.unit;
          food = originalIngredient.food;
          note = originalIngredient.note;
        }
        
        // 6. Mettre à jour l'ingrédient
        originalIngredient.quantity = quantity;
        originalIngredient.unit = unit;
        originalIngredient.food = food;
        originalIngredient.note = note;
        
        // 7. Générer un referenceId si absent
        if (!originalIngredient.referenceId) {
          originalIngredient.referenceId = this.generateUUID();
        }
        
        // 8. Mettre à jour l'affichage formaté
        originalIngredient.display = this.formatIngredientDisplay(originalIngredient);
        
        // Nettoyer la propriété temporaire
        delete originalIngredient._originalText;
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
      const originalRecipeResponse = await this.getById(recipeId);
      if (!originalRecipeResponse || !originalRecipeResponse.data) {
        throw new Error('Impossible de récupérer la recette originale');
      }
      
      const originalRecipe = originalRecipeResponse.data;
      const payload = JSON.parse(JSON.stringify(originalRecipe));
      
      if (optimizedRecipe.recipeIngredient && Array.isArray(optimizedRecipe.recipeIngredient)) {
        payload.recipeIngredient = optimizedRecipe.recipeIngredient.map((ingredient, index) => {
          const referenceId = this.generateUUID();
          
          let note = ingredient.note || '';
          if (ingredient.originalText) {
            const match = ingredient.originalText.match(/\(([^)]+)\)/);
            if (match && match[1]) {
              note = match[1].trim();
            }
          }
          
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
      
      return await axiosInstance.put(`/recipes/${originalRecipe.slug}`, payload);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la recette avec les ingrédients optimisés:', error);
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
    
    if (ingredient.quantity) {
      display += ingredient.quantity;
    }
    
    if (ingredient.unit) {
      const unitName = ingredient.unit.abbreviation || ingredient.unit.name;
      if (unitName) {
        display += display ? ' ' + unitName : unitName;
      }
    }
    
    if (ingredient.food && ingredient.food.name) {
      display += display ? ' ' + ingredient.food.name : ingredient.food.name;
    }
    
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