import { ref, reactive } from 'vue';

// État global pour les toasts
const toasts = reactive([]);
let counter = 0;

/**
 * Service centralisant la gestion des notifications toast
 */
const toastService = {
  /**
   * Ajoute un toast à la pile
   * @param {Object} options Options du toast
   * @returns {Number} ID du toast créé
   */
  add(options) {
    const id = counter++;
    const defaultDuration = 3000;
    
    const toast = {
      id,
      message: options.message || '',
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : defaultDuration,
      position: options.position || 'bottom-right',
      dismissible: options.dismissible !== undefined ? options.dismissible : true,
      icon: options.icon !== undefined ? options.icon : true,
      timestamp: Date.now()
    };
    
    // Ajouter le toast à la pile
    toasts.push(toast);
    
    // Retirer automatiquement le toast après sa durée
    if (toast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, toast.duration);
    }
    
    return id;
  },
  
  /**
   * Créer un toast de succès
   * @param {String} message Message du toast
   * @param {Object} options Options additionnelles
   * @returns {Number} ID du toast créé
   */
  success(message, options = {}) {
    return this.add({
      message,
      type: 'success',
      ...options
    });
  },
  
  /**
   * Créer un toast d'erreur
   * @param {String} message Message du toast
   * @param {Object} options Options additionnelles
   * @returns {Number} ID du toast créé
   */
  error(message, options = {}) {
    return this.add({
      message,
      type: 'error',
      ...options
    });
  },
  
  /**
   * Créer un toast d'information
   * @param {String} message Message du toast
   * @param {Object} options Options additionnelles
   * @returns {Number} ID du toast créé
   */
  info(message, options = {}) {
    return this.add({
      message,
      type: 'info',
      ...options
    });
  },
  
  /**
   * Créer un toast d'avertissement
   * @param {String} message Message du toast
   * @param {Object} options Options additionnelles
   * @returns {Number} ID du toast créé
   */
  warning(message, options = {}) {
    return this.add({
      message,
      type: 'warning',
      ...options
    });
  },
  
  /**
   * Supprimer un toast spécifique
   * @param {Number} id ID du toast à supprimer
   */
  remove(id) {
    const index = toasts.findIndex(t => t.id === id);
    if (index !== -1) {
      toasts.splice(index, 1);
    }
  },
  
  /**
   * Supprimer tous les toasts
   */
  clear() {
    toasts.splice(0, toasts.length);
  },
  
  /**
   * Récupérer la liste des toasts
   * @returns {Array} Liste des toasts
   */
  getToasts() {
    return toasts;
  }
};

export default toastService;