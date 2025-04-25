import axios from 'axios';

// Configuration de base
const axiosInstance = axios.create({
  baseURL: '/api',  // Utiliser le chemin relatif au lieu de l'URL absolue
  timeout: 30000,
  headers: {
    Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb25nX3Rva2VuIjp0cnVlLCJpZCI6IjA5MGZmMTQ0LTcxNmItNDUyOS05M2RhLTYzOTFiNWE5OTRhOSIsIm5hbWUiOiJBUFBMSVMiLCJpbnRlZ3JhdGlvbl9pZCI6ImdlbmVyaWMiLCJleHAiOjE5MDEzNjQ2NTd9.rnymUqY_UfEmwY8AqOQ-9bK5Rn2PIFTLea3mODCVBRo`,
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
});

// Variables pour la gestion des retries
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const RETRY_STATUS_CODES = [408, 429, 500, 502, 503, 504];

// Fonction helper pour retry avec delay exponentiel
const retryDelay = (retryCount) => {
  return RETRY_DELAY * Math.pow(2, retryCount);
};

// Cache pour les requêtes GET (mise en cache basique)
const cacheMap = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

// Fonction d'aide pour déterminer si on doit retenir une requête
const isCacheable = (config) => {
  return config.method === 'get' && config.cache !== false;
};

// Générer une clé de cache basée sur l'URL et les params
const getCacheKey = (config) => {
  return `${config.url}${JSON.stringify(config.params || {})}`;
};

// Intercepteur pour les requêtes avec support de cache
axiosInstance.interceptors.request.use((config) => {
  // Vérifier le cache pour les requêtes GET
  if (isCacheable(config)) {
    const cacheKey = getCacheKey(config);
    const cachedResponse = cacheMap.get(cacheKey);
    
    if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_DURATION) {
      // Utiliser la réponse en cache si disponible et fraîche
      console.debug('[AXIOS] Using cached response for:', config.url);
      
      // Configuration spéciale pour court-circuiter la requête
      config.adapter = () => {
        return Promise.resolve(cachedResponse.response);
      };
    }
  }
  
  // Ajouter un ID de requête pour le suivi
  config.requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[AXIOS] Requête #${config.requestId} envoyée:`, config.method?.toUpperCase(), config.url);
  }
  
  return config;
}, (error) => {
  console.error('[AXIOS] Erreur de requête :', error);
  return Promise.reject(error);
});

axiosInstance.setAuthToken = (token) => {
  if (token) {
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axiosInstance.defaults.headers.common['Authorization'];
  }
};

// Ajouter un intercepteur pour récupérer le token du localStorage au démarrage
const token = localStorage.getItem('mealieToken');
if (token) {
  axiosInstance.setAuthToken(token);
};

// Intercepteur pour les réponses avec retry et cache
axiosInstance.interceptors.response.use((response) => {
  // Stocker la réponse dans le cache si applicable
  if (isCacheable(response.config)) {
    const cacheKey = getCacheKey(response.config);
    cacheMap.set(cacheKey, {
      response,
      timestamp: Date.now()
    });
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[AXIOS] Réponse #${response.config.requestId} reçue:`, response.status);
  }
  
  return response;
}, async (error) => {
  // Ignorer les erreurs d'annulation
  if (axios.isCancel(error)) {
    return Promise.reject(error);
  }
  
  const config = error.config;
  
  // Vérifier si on peut retry la requête
  if (config && (!config.retryCount || config.retryCount < MAX_RETRIES)) {
    const status = error.response ? error.response.status : null;
    
    // Vérifier si le code d'erreur est dans la liste des codes à retry
    if (RETRY_STATUS_CODES.includes(status) || !status) {
      // Incrémenter le compteur de retry
      config.retryCount = config.retryCount || 0;
      config.retryCount += 1;
      
      // Calculer le délai avec une stratégie de backoff exponentiel
      const delay = retryDelay(config.retryCount - 1);
      
      console.warn(
        `[AXIOS] Retry #${config.retryCount} pour ${config.url} dans ${delay}ms (Status: ${status})`
      );
      
      // Attendre avant de retenter
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Refaire la requête
      return axiosInstance(config);
    }
  }
  
  // Formater les erreurs pour une meilleure consommation
  const errorResponse = {
    status: error.response?.status,
    statusText: error.response?.statusText,
    data: error.response?.data,
    message: error.message,
    requestUrl: config?.url,
    requestMethod: config?.method
  };
  
  console.error('[AXIOS] Erreur de réponse:', errorResponse);
  
  // Enrichir l'objet d'erreur avec des informations formatées
  error.formattedError = errorResponse;
  
  return Promise.reject(error);
});

// Méthode pour vider le cache
axiosInstance.clearCache = () => {
  cacheMap.clear();
};

// Méthode pour modifier le token d'authentification
axiosInstance.setAuthToken = (token) => {
  axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Ajouter une méthode pour annuler facilement les requêtes
axiosInstance.createCancelToken = () => {
  const source = axios.CancelToken.source();
  return source;
};

export default axiosInstance;