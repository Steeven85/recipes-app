import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './index.css';

// Imports de composants globaux
import Spinner from './components/Spinner.vue';
import ToastContainer from './components/ToastContainer.vue';
// Import de services
import { useRecipeStore } from './stores/recipeStore';
import axiosInstance from './services/axiosInstance';
import { useUserStore } from './stores/userStore';

// Créer l'instance de Pinia
const pinia = createPinia();
// Créer l'application Vue
const app = createApp(App);
// Enregistrer les composants globaux
app.component('Spinner', Spinner);
app.component('ToastContainer', ToastContainer);
// Configurer l'intercepteur d'erreur global
app.config.errorHandler = (err, vm, info) => {
    console.error('Erreur globale Vue :', err);
    console.error('Info :', info);
    // Ajouter la gestion d'erreur spécifique si nécessaire
    if (process.env.NODE_ENV !== 'production') {
        // En développement, afficher plus de détails
        console.debug('Vue instance:', vm);
    }
};
// Utiliser Pinia et Router
app.use(pinia);
app.use(router);
// Initialiser les stores après leur installation
const recipeStoreInstance = useRecipeStore();
const userStoreInstance = useUserStore();
if (recipeStoreInstance && typeof recipeStoreInstance.init === 'function') {
    recipeStoreInstance.init();
}
// Configurer les propriétés globales
app.config.globalProperties.$axios = axiosInstance;
// Monter l'application
app.mount('#app');
// Exposer l'instance de l'application globalement en mode développement
if (process.env.NODE_ENV === 'development') {
    window.app = app;
}
//# sourceMappingURL=main.js.map