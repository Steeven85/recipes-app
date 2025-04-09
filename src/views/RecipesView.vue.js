/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';
import { recipeService, shoppingService } from '../services/api';
import { useRecipeStore } from '../stores/recipeStore';
import Spinner from '../components/Spinner.vue';
import RecipeCard from '../components/RecipeCard.vue';
// Créer une fonction de debounce réutilisable
const useDebounce = (fn, delay = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};
export default (await import('vue')).defineComponent({
    components: {
        Spinner,
        RecipeCard
    },
    setup() {
        const recipeStore = useRecipeStore();
        const partiallyLoaded = ref(false);
        const searchQuery = ref('');
        const router = useRouter();
        // État pour le mode d'affichage (toutes les recettes ou favoris)
        const activeView = ref('all');
        // État pour le bouton de scroll
        const showScrollToTop = ref(false);
        // Modals et états pour l'ajout de recettes
        const showAddRecipeModal = ref(false);
        const showUrlImport = ref(false);
        const showManualCreate = ref(false);
        const recipeUrl = ref('');
        const urlImportStatus = ref('idle'); // idle, loading, success, error
        const urlImportError = ref('');
        const manualCreateStatus = ref('idle'); // idle, loading, success, error
        const manualCreateError = ref('');
        // Nouvelle recette pour la création manuelle
        const newRecipe = ref({
            name: '',
            description: '',
            prepTime: null,
            cookTime: null,
            recipeYield: 4,
            recipeIngredient: ['', ''],
            recipeInstructions: [
                { text: '' },
                { text: '' }
            ],
            recipeCategory: [] // Ajout pour gérer les catégories
        });
        // === États pour les catégories ===
        const categories = ref([]);
        const selectedCategory = ref(null);
        const showCategoriesFilter = ref(false);
        const showAddCategoryModal = ref(false);
        const newCategoryName = ref('');
        const addCategoryStatus = ref('idle'); // idle, loading, success, error
        const addCategoryError = ref('');
        // Initialiser les favoris depuis le localStorage
        onMounted(() => {
            recipeStore.init();
            // Ajouter un écouteur de scroll pour le bouton de retour en haut
            window.addEventListener('scroll', handleScroll);
            // Charger les catégories
            loadCategories();
        });
        onUnmounted(() => {
            window.removeEventListener('scroll', handleScroll);
        });
        // Gérer le défilement pour afficher/masquer le bouton de retour en haut
        const handleScroll = () => {
            showScrollToTop.value = window.scrollY > 300;
        };
        // Fonction pour défiler vers le haut de la page
        const scrollToTop = () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        };
        // Pour l'optimisation du chargement par lots
        const BATCH_SIZE = 8; // Augmenté pour un meilleur équilibre entre latence et throughput
        let abortController = new AbortController();
        // Debounce la recherche pour éviter des rendus excessifs
        const debouncedSearch = useDebounce(() => {
            // La recherche est déjà réactive grâce au computed
        }, 300);
        // == Méthodes pour gérer les catégories ==
        // Chargement des catégories
        const loadCategories = async () => {
            try {
                // Appel API correct
                const response = await recipeService.getCategories();
                console.log('Réponse API catégories:', response.data);
                // Selon la documentation Mealie, la réponse contient un tableau d'objets
                if (response && response.data) {
                    // Vérifier si c'est un tableau ou s'il contient une propriété items
                    let categoriesArray = [];
                    if (Array.isArray(response.data)) {
                        categoriesArray = response.data;
                    }
                    else if (response.data.items && Array.isArray(response.data.items)) {
                        categoriesArray = response.data.items;
                    }
                    // Filtrer les catégories nulles ou sans ID pour éviter les erreurs
                    const validCategories = categoriesArray.filter(cat => cat && cat.id);
                    categories.value = validCategories;
                    // Si une catégorie était sélectionnée, vérifier qu'elle existe toujours
                    if (selectedCategory.value) {
                        const exists = categories.value.some(cat => cat.id === selectedCategory.value);
                        if (!exists) {
                            selectedCategory.value = null;
                        }
                    }
                }
                else {
                    // Réinitialiser en cas de données invalides
                    categories.value = [];
                    console.warn('Réponse de l\'API des catégories invalide ou vide');
                }
            }
            catch (error) {
                console.error('Erreur lors du chargement des catégories', error);
                // Si l'API échoue, extraire les catégories des recettes comme fallback
                extractCategoriesFromRecipes();
            }
        };
        // Extraction des catégories depuis les recettes (méthode de secours)
        const extractCategoriesFromRecipes = () => {
            const uniqueCategories = new Map();
            // S'assurer que les recettes existent
            if (!recipeStore.recipes || !Array.isArray(recipeStore.recipes)) {
                categories.value = [];
                return;
            }
            recipeStore.recipes.forEach(recipe => {
                if (recipe && recipe.recipeCategory && Array.isArray(recipe.recipeCategory)) {
                    recipe.recipeCategory.forEach(category => {
                        if (category && category.id) {
                            uniqueCategories.set(category.id, category);
                        }
                    });
                }
            });
            categories.value = Array.from(uniqueCategories.values());
        };
        // Sélectionner une catégorie pour filtrer
        const selectCategory = (categoryId) => {
            if (!categoryId)
                return;
            if (selectedCategory.value === categoryId) {
                // Si on clique sur la catégorie déjà sélectionnée, on désélectionne
                selectedCategory.value = null;
                recipeStore.selectCategory(null);
            }
            else {
                selectedCategory.value = categoryId;
                recipeStore.selectCategory(categoryId);
                // Optionnel: charger plus de détails pour cette catégorie
                loadRecipesByCategory(categoryId);
            }
            // Fermer le panneau des catégories
            showCategoriesFilter.value = false;
        };
        // Effacer le filtre de catégorie
        const clearCategoryFilter = () => {
            selectedCategory.value = null;
            recipeStore.selectCategory(null);
        };
        // Chargement des recettes par catégorie
        const loadRecipesByCategory = async (categoryId) => {
            if (!categoryId)
                return;
            try {
                // Utiliser l'appel API correct avec l'ID de la catégorie
                const response = await recipeService.getRecipesByCategory(categoryId);
                console.log('Réponse des recettes par catégorie:', response.data);
                if (response.data) {
                    // Adapter selon la structure réelle de réponse de l'API
                    // Basé sur le log, la réponse contient une propriété 'items'
                    const categoryRecipes = response.data.items || [];
                    // Mettre à jour le store avec les recettes de cette catégorie
                    if (Array.isArray(categoryRecipes) && categoryRecipes.length > 0) {
                        recipeStore.updateRecipesForCategory(categoryId, categoryRecipes);
                    }
                }
            }
            catch (error) {
                console.error(`Erreur lors du chargement des recettes pour la catégorie ${categoryId}`, error);
            }
        };
        // Créer une nouvelle catégorie
        const createCategory = async () => {
            if (!newCategoryName.value.trim())
                return;
            addCategoryStatus.value = 'loading';
            addCategoryError.value = '';
            try {
                // Créer un slug à partir du nom
                const slug = newCategoryName.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                // Créer la payload selon la structure attendue par Mealie
                const categoryPayload = {
                    name: newCategoryName.value.trim(),
                    slug: slug
                };
                // Appel à l'API pour créer la catégorie
                const response = await recipeService.createCategory(categoryPayload);
                if (response && response.data) {
                    // Ajouter la nouvelle catégorie à la liste
                    const newCategory = response.data;
                    categories.value.push(newCategory);
                    recipeStore.addCategory(newCategory);
                    // Ajouter automatiquement cette catégorie à la recette en cours si on est dans le formulaire
                    if (showManualCreate.value) {
                        newRecipe.value.recipeCategory.push({
                            id: newCategory.id,
                            name: newCategory.name,
                            slug: newCategory.slug
                        });
                    }
                    // Réinitialiser le formulaire
                    newCategoryName.value = '';
                    addCategoryStatus.value = 'success';
                    // Fermer le modal après un court délai
                    setTimeout(() => {
                        showAddCategoryModal.value = false;
                        addCategoryStatus.value = 'idle';
                    }, 1500);
                }
            }
            catch (error) {
                console.error('Erreur lors de la création de la catégorie', error);
                addCategoryStatus.value = 'error';
                if (error.response && error.response.data) {
                    addCategoryError.value = error.response.data.detail || 'Impossible de créer cette catégorie.';
                }
                else {
                    addCategoryError.value = 'Erreur lors de la création. Veuillez réessayer.';
                }
            }
        };
        // Ajouter/retirer une catégorie à la recette en cours de création
        const toggleRecipeCategory = (category) => {
            if (!category || !category.id)
                return;
            const index = newRecipe.value.recipeCategory.findIndex(cat => cat && cat.id === category.id);
            if (index === -1) {
                // Ajouter la catégorie
                newRecipe.value.recipeCategory.push({
                    id: category.id,
                    name: category.name || 'Sans nom',
                    slug: category.slug || ''
                });
            }
            else {
                // Retirer la catégorie
                newRecipe.value.recipeCategory.splice(index, 1);
            }
        };
        // Charge les détails des recettes par lots, de manière optimisée
        const loadRecipeDetailsInBatches = async (recipeList) => {
            const signal = abortController.signal;
            const totalRecipes = recipeList.length;
            let loadedRecipes = [];
            // Diviser les recettes en lots
            for (let i = 0; i < totalRecipes; i += BATCH_SIZE) {
                if (signal.aborted)
                    return;
                const batch = recipeList.slice(i, i + BATCH_SIZE);
                // Processus de traitement par lot optimisé
                const batchPromises = batch.map(async (recipe) => {
                    // Éviter les requêtes inutiles si les détails sont déjà chargés
                    if (recipe._detailsLoaded)
                        return recipe;
                    try {
                        const detailResponse = await recipeService.getBySlug(recipe.slug, { signal });
                        return { ...recipe, ...detailResponse.data, _detailsLoaded: true };
                    }
                    catch (err) {
                        if (!signal.aborted) {
                            console.warn(`Erreur lors du chargement des détails pour ${recipe.name}:`, err);
                        }
                        return { ...recipe, _detailsLoaded: false };
                    }
                });
                // Exécuter les requêtes en parallèle
                const batchResults = await Promise.all(batchPromises);
                // Ajouter ce lot au résultat et mettre à jour
                loadedRecipes = [...loadedRecipes, ...batchResults];
                // Optimisation: mettre à jour le store par lots, pas à chaque recette
                recipeStore.updateRecipes(batchResults);
                // Activer le mode "partiellement chargé" après le premier lot
                if (i === 0 && !partiallyLoaded.value) {
                    partiallyLoaded.value = true;
                    // Donner à l'interface utilisateur le temps de se mettre à jour
                    await nextTick();
                }
            }
            return loadedRecipes;
        };
        onMounted(async () => {
            try {
                recipeStore.setLoading(true);
                // Vérifier si nous avons déjà des recettes récentes dans le store
                const hasRecentRecipes = recipeStore.hasRecipes;
                if (hasRecentRecipes) {
                    partiallyLoaded.value = true;
                    await nextTick();
                    recipeStore.setLoading(false);
                    // Rafraîchissement en arrière-plan pour avoir les données à jour
                    recipeService.getAll().then(listResponse => {
                        const recipeList = listResponse.data.items;
                        recipeStore.refreshBasicRecipes(recipeList);
                    }).catch(err => console.warn('Erreur lors du rafraîchissement en arrière-plan', err));
                    return;
                }
                // Récupération rapide de la liste des recettes
                const listResponse = await recipeService.getAll();
                const recipeList = listResponse.data.items;
                // Mettre à jour avec les informations de base immédiatement
                recipeStore.setBasicRecipes(recipeList);
                partiallyLoaded.value = true;
                await nextTick();
                // Charger les détails par lots en arrière-plan
                await loadRecipeDetailsInBatches(recipeList);
            }
            catch (error) {
                console.error('Erreur de chargement', error);
                recipeStore.setError(error);
            }
            finally {
                recipeStore.setLoading(false);
            }
        });
        // Nettoyer les requêtes en cours si le composant est démonté
        onUnmounted(() => {
            abortController.abort();
        });
        // Gérer le changement d'état favori
        const handleFavoriteToggle = ({ recipeId, isFavorite }) => {
            // La mise à jour du store est déjà gérée dans le composant RecipeCard
            // Ici, on peut ajouter une logique supplémentaire si nécessaire
            console.log(`Recette ${recipeId} est maintenant ${isFavorite ? 'favorite' : 'non favorite'}`);
        };
        // Filtrer les recettes avec une recherche optimisée
        const filteredRecipes = computed(() => {
            if (!searchQuery.value.trim())
                return recipeStore.recipes;
            const query = searchQuery.value.toLowerCase().trim();
            const terms = query.split(/\s+/).filter(term => term.length > 0);
            // Recherche multi-termes plus intelligente
            if (terms.length === 0)
                return recipeStore.recipes;
            return recipeStore.recipes.filter(recipe => {
                // Score de pertinence
                let score = 0;
                const name = recipe.name.toLowerCase();
                const description = recipe.description?.toLowerCase() || '';
                for (const term of terms) {
                    // Nom correspond exactement (score élevé)
                    if (name === term)
                        score += 10;
                    // Nom commence par le terme (score élevé)
                    if (name.startsWith(term))
                        score += 8;
                    // Nom contient le terme (score moyen)
                    if (name.includes(term))
                        score += 5;
                    // Description contient le terme (score bas)
                    if (description.includes(term))
                        score += 2;
                    // Tags contiennent le terme
                    if (recipe.tags?.some(tag => tag.name?.toLowerCase()?.includes(term)))
                        score += 3;
                    // Catégories contiennent le terme
                    if (recipe.recipeCategory?.some(cat => cat.name?.toLowerCase()?.includes(term)))
                        score += 4;
                }
                return score > 0;
            }).sort((a, b) => {
                // Tri par pertinence en fonction du nom qui contient les termes
                const aContains = terms.every(term => a.name.toLowerCase().includes(term));
                const bContains = terms.every(term => b.name.toLowerCase().includes(term));
                if (aContains && !bContains)
                    return -1;
                if (!aContains && bContains)
                    return 1;
                return 0;
            });
        });
        // Recettes à afficher selon le mode actif (tous, favoris, ou catégorie)
        const displayedRecipes = computed(() => {
            // Filtrer d'abord selon la recherche
            let filtered = filteredRecipes.value || [];
            // Filtrer selon la catégorie sélectionnée
            if (selectedCategory.value) {
                filtered = filtered.filter(recipe => {
                    // Vérifier que recipe et recipeCategory existent et sont valides
                    if (!recipe || !recipe.recipeCategory)
                        return false;
                    // Vérifier que recipeCategory est un tableau
                    if (!Array.isArray(recipe.recipeCategory))
                        return false;
                    // Filtrer les recettes qui contiennent la catégorie sélectionnée
                    return recipe.recipeCategory.some(cat => cat && cat.id === selectedCategory.value);
                });
            }
            // Puis filtrer selon le mode d'affichage actif
            if (activeView.value === 'favorites') {
                return filtered.filter(recipe => recipe && recipe.id && recipeStore.isFavorite(recipe.id));
            }
            return filtered;
        });
        // Navigation avec préchargement
        const viewRecipe = (recipeOrId) => {
            // Déterminez si nous avons reçu un objet ou juste un ID
            const isObject = typeof recipeOrId === 'object' && recipeOrId !== null;
            // Si c'est juste un ID, récupérez l'objet complet depuis le store
            const recipe = isObject ? recipeOrId : recipeStore.getRecipeById(recipeOrId);
            if (!recipe) {
                console.error("Recette invalide ou introuvable");
                return;
            }
            recipeStore.setCurrentRecipe(recipe);
            if (!recipe._detailsLoaded) {
                // Utilisez le slug si disponible, sinon l'ID
                const identifier = recipe.slug || recipe.id;
                if (identifier) {
                    recipeService.getBySlug(identifier)
                        .then(response => {
                        recipeStore.updateRecipe(recipe.id, {
                            ...response.data,
                            _detailsLoaded: true
                        });
                    })
                        .catch(err => console.warn('Erreur de préchargement', err));
                }
            }
            // Assurez-vous d'utiliser le bon identifiant pour la navigation
            router.push(`/recipes/${recipe.id}`);
        };
        // Observer les changements dans la recherche pour revenir à "toutes les recettes" si nécessaire
        watch(searchQuery, (newValue) => {
            if (newValue && activeView.value === 'favorites' &&
                displayedRecipes.value.length === 0 && recipeStore.favoriteRecipes.length > 0) {
                // Si on cherche quelque chose et qu'il n'y a pas de favoris correspondants, revenir à tous
                activeView.value = 'all';
            }
        });
        const planRecipe = (recipe) => {
            // Naviguez vers le planificateur et passez la recette
            router.push({
                name: 'planner',
                query: {
                    recipeId: recipe.id,
                    recipeName: recipe.name
                }
            });
        };
        const shopRecipe = (recipe) => {
            // Ajoutez la recette à la liste de courses
            try {
                // Utilisez le service approprié pour ajouter les ingrédients à la liste de courses
                shoppingService.addRecipeToShoppingList(recipe.id);
                // Naviguez vers la liste de courses
                router.push('/shopping');
            }
            catch (error) {
                console.error('Erreur lors de l\'ajout à la liste de courses', error);
                // Optionnel : affichez un toast d'erreur
            }
        };
        // Méthode importFromUrl avec route correcte pour votre application
        const importFromUrl = async () => {
            if (!recipeUrl.value)
                return;
            urlImportStatus.value = 'loading';
            urlImportError.value = '';
            try {
                // Appel à l'API Mealie pour importer depuis une URL
                const response = await recipeService.importRecipeFromUrl(recipeUrl.value);
                console.log("Réponse d'importation complète:", response);
                if (response && response.data) {
                    // Succès de l'importation
                    urlImportStatus.value = 'success';
                    // Analyse complète de la réponse pour trouver l'ID ou le slug
                    const responseData = response.data;
                    // Essayer de localiser l'ID ou le slug dans différentes structures possibles
                    let recipeId = null;
                    let slug = null;
                    // Tentative 1: Slug direct (préféré pour la route edit)
                    if (responseData.slug) {
                        slug = responseData.slug;
                        recipeId = responseData.id || responseData.slug;
                    }
                    // Tentative 2: ID direct
                    else if (responseData.id) {
                        recipeId = responseData.id;
                        // Si pas de slug mais ID, on peut parfois utiliser l'ID comme slug
                        slug = responseData.id;
                    }
                    // Tentative 3: Objet recipe imbriqué
                    else if (responseData.recipe) {
                        if (responseData.recipe.slug) {
                            slug = responseData.recipe.slug;
                            recipeId = responseData.recipe.id || responseData.recipe.slug;
                        }
                        else if (responseData.recipe.id) {
                            recipeId = responseData.recipe.id;
                            slug = responseData.recipe.id;
                        }
                    }
                    // Tentative 4: Vérifier si la réponse est une chaîne (parfois l'ID est directement retourné)
                    else if (typeof responseData === 'string' && responseData.trim() !== '') {
                        recipeId = responseData;
                        slug = responseData;
                    }
                    if (slug || recipeId) {
                        // Utiliser le slug si disponible, sinon l'ID
                        const routeParam = slug || recipeId;
                        console.log("Paramètre de route identifié:", routeParam);
                        // Réinitialiser le formulaire
                        setTimeout(() => {
                            recipeUrl.value = '';
                            urlImportStatus.value = 'idle';
                            showUrlImport.value = false;
                            // Utiliser la route nommée 'recipe-edit' qui attend un paramètre 'slug'
                            router.push({
                                name: 'recipe-edit',
                                params: { slug: routeParam }
                            });
                        }, 1500);
                    }
                    else {
                        console.error("Impossible de déterminer l'identifiant de la recette importée:", responseData);
                        // Même sans identifiant, on peut considérer que l'importation a réussi
                        setTimeout(() => {
                            recipeUrl.value = '';
                            urlImportStatus.value = 'idle';
                            showUrlImport.value = false;
                            // Rediriger vers la liste des recettes (route principale)
                            router.push({ name: 'recipes' });
                            // Et rafraîchir les données
                            recipeStore.setLoading(true);
                            recipeService.getAll().then(response => {
                                if (response.data && response.data.items) {
                                    recipeStore.setBasicRecipes(response.data.items);
                                }
                                recipeStore.setLoading(false);
                            }).catch(err => {
                                console.error("Erreur lors du rechargement des recettes:", err);
                                recipeStore.setLoading(false);
                            });
                        }, 1500);
                    }
                }
                else {
                    // Réponse vide ou invalide
                    throw new Error('Réponse invalide de l\'API lors de l\'importation');
                }
            }
            catch (error) {
                console.error('Erreur lors de l\'importation de la recette', error);
                urlImportStatus.value = 'error';
                if (error.response && error.response.data) {
                    // Récupération du message d'erreur de l'API
                    urlImportError.value = error.response.data.detail || 'Impossible d\'importer cette recette. Vérifiez l\'URL.';
                }
                else {
                    urlImportError.value = 'Erreur lors de l\'importation. Vérifiez l\'URL et réessayez.';
                }
            }
        };
        // Méthodes pour la création manuelle de recettes
        const addIngredient = () => {
            newRecipe.value.recipeIngredient.push('');
        };
        const removeIngredient = (index) => {
            newRecipe.value.recipeIngredient.splice(index, 1);
            // Toujours garder au moins un ingrédient
            if (newRecipe.value.recipeIngredient.length === 0) {
                newRecipe.value.recipeIngredient.push('');
            }
        };
        const addInstruction = () => {
            newRecipe.value.recipeInstructions.push({ text: '' });
        };
        const removeInstruction = (index) => {
            newRecipe.value.recipeInstructions.splice(index, 1);
            // Toujours garder au moins une instruction
            if (newRecipe.value.recipeInstructions.length === 0) {
                newRecipe.value.recipeInstructions.push({ text: '' });
            }
        };
        const createRecipeManually = async () => {
            // Validation basique
            if (!newRecipe.value.name)
                return;
            manualCreateStatus.value = 'loading';
            manualCreateError.value = '';
            try {
                // Nettoyage des ingrédients et instructions vides
                const cleanIngredients = newRecipe.value.recipeIngredient.filter(ing => ing.trim() !== '');
                const cleanInstructions = newRecipe.value.recipeInstructions
                    .filter(ins => ins.text.trim() !== '')
                    .map((ins, index) => ({
                    ...ins,
                    position: index + 1 // Ajouter la position
                }));
                // Calcul du temps total
                const prepTime = newRecipe.value.prepTime || 0;
                const cookTime = newRecipe.value.cookTime || 0;
                const totalTime = prepTime + cookTime;
                // Création du slug à partir du nom
                const slug = newRecipe.value.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
                // Construction du payload conforme à l'API Mealie
                const recipePayload = {
                    name: newRecipe.value.name,
                    description: newRecipe.value.description || '',
                    prepTime: prepTime,
                    cookTime: cookTime,
                    totalTime: totalTime,
                    recipeYield: newRecipe.value.recipeYield || null,
                    recipeIngredient: cleanIngredients,
                    recipeInstructions: cleanInstructions,
                    slug: slug,
                    recipeCategory: newRecipe.value.recipeCategory, // Inclure les catégories
                    // Autres champs optionnels
                    categories: [],
                    tags: [],
                    notes: [],
                    dateAdded: new Date().toISOString(),
                    dateUpdated: new Date().toISOString()
                };
                // Appel à l'API pour créer la recette
                const response = await recipeService.createRecipe(recipePayload);
                if (response && response.data) {
                    // Succès de la création
                    manualCreateStatus.value = 'success';
                    // Mise à jour du store
                    const newRecipeData = response.data;
                    recipeStore.addRecipe(newRecipeData);
                    // Réinitialisation du formulaire après quelques secondes
                    setTimeout(() => {
                        newRecipe.value = {
                            name: '',
                            description: '',
                            prepTime: null,
                            cookTime: null,
                            recipeYield: 4,
                            recipeIngredient: ['', ''],
                            recipeInstructions: [
                                { text: '' },
                                { text: '' }
                            ],
                            recipeCategory: []
                        };
                        manualCreateStatus.value = 'idle';
                        showManualCreate.value = false;
                        // Rediriger vers la recette nouvellement créée
                        router.push(`/recipes/${newRecipeData.id}`);
                    }, 1500);
                }
            }
            catch (error) {
                console.error('Erreur lors de la création de la recette', error);
                manualCreateStatus.value = 'error';
                if (error.response && error.response.data) {
                    manualCreateError.value = error.response.data.detail || 'Impossible de créer cette recette. Vérifiez les informations.';
                }
                else {
                    manualCreateError.value = 'Erreur lors de la création. Vérifiez les informations et réessayez.';
                }
            }
        };
        return {
            recipeStore,
            partiallyLoaded,
            searchQuery,
            filteredRecipes,
            displayedRecipes,
            activeView,
            viewRecipe,
            debouncedSearch,
            planRecipe,
            shopRecipe,
            handleFavoriteToggle,
            showScrollToTop,
            scrollToTop,
            // États et méthodes pour l'ajout de recettes
            showAddRecipeModal,
            showUrlImport,
            showManualCreate,
            recipeUrl,
            urlImportStatus,
            urlImportError,
            manualCreateStatus,
            manualCreateError,
            newRecipe,
            importFromUrl,
            createRecipeManually,
            addIngredient,
            removeIngredient,
            addInstruction,
            removeInstruction,
            // Catégories
            categories,
            selectedCategory,
            showCategoriesFilter,
            selectCategory,
            clearCategoryFilter,
            // Modal catégorie
            showAddCategoryModal,
            newCategoryName,
            addCategoryStatus,
            addCategoryError,
            createCategory,
            toggleRecipeCategory
        };
    }
});
const __VLS_ctx = {};
const __VLS_componentsOption = {
    Spinner,
    RecipeCard
};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-between items-center mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
    ...{ class: "text-2xl font-bold" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showAddRecipeModal = true;
        } },
    ...{ class: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    ...{ class: "h-5 w-5 mr-2" },
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M12 6v6m0 0v6m0-6h6m-6 0H6",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
    ...{ onInput: (__VLS_ctx.debouncedSearch) },
    value: (__VLS_ctx.searchQuery),
    type: "text",
    placeholder: "Rechercher une recette...",
    ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeView = 'all';
        } },
    ...{ class: "px-4 py-2 rounded-lg mr-2" },
    ...{ class: (__VLS_ctx.activeView === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.activeView = 'favorites';
        } },
    ...{ class: "px-4 py-2 rounded-lg flex items-center" },
    ...{ class: (__VLS_ctx.activeView === 'favorites' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    ...{ class: "h-5 w-5 mr-1" },
    viewBox: "0 0 20 20",
    fill: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    'fill-rule': "evenodd",
    d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
    'clip-rule': "evenodd",
});
if (__VLS_ctx.recipeStore.favoritesCount > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "ml-1 bg-white text-red-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" },
    });
    (__VLS_ctx.recipeStore.favoritesCount);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-between items-center mb-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.showCategoriesFilter = !__VLS_ctx.showCategoriesFilter;
        } },
    ...{ class: "flex items-center text-indigo-600 font-medium" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    xmlns: "http://www.w3.org/2000/svg",
    ...{ class: "h-5 w-5 ml-1 transition-transform" },
    ...{ class: (__VLS_ctx.showCategoriesFilter ? 'transform rotate-180' : '') },
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
    'stroke-width': "2",
    d: "M19 9l-7 7-7-7",
});
if (__VLS_ctx.selectedCategory) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm text-gray-600 mr-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium text-indigo-600" },
    });
    ((__VLS_ctx.categories.find(c => c && c.id === __VLS_ctx.selectedCategory)?.name) || 'Catégorie inconnue');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.clearCategoryFilter) },
        ...{ class: "text-gray-500 hover:text-gray-700" },
        title: "Effacer le filtre",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-4 w-4" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg shadow-md p-4 mb-4 transition-all duration-300 max-h-72 overflow-y-auto" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.showCategoriesFilter) }, null, null);
if (__VLS_ctx.recipeStore.loading && __VLS_ctx.categories.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-gray-500 text-center py-2" },
    });
    const __VLS_0 = {}.Spinner;
    /** @type {[typeof __VLS_components.Spinner, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ class: "mx-auto h-6 w-6" },
    }));
    const __VLS_2 = __VLS_1({
        ...{ class: "mx-auto h-6 w-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
}
else if (__VLS_ctx.categories.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-gray-500 text-center py-2" },
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2" },
    });
    for (const [category, index] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.recipeStore.loading && __VLS_ctx.categories.length === 0))
                        return;
                    if (!!(__VLS_ctx.categories.length === 0))
                        return;
                    category && category.id && __VLS_ctx.selectCategory(category.id);
                } },
            key: (category?.id || `category-${index}`),
            ...{ class: "px-3 py-2 rounded-full text-sm text-center transition-colors truncate" },
            ...{ class: (__VLS_ctx.selectedCategory === (category?.id || '')
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200') },
        });
        (category?.name || 'Catégorie sans nom');
        if (category?.count) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "ml-1 text-xs font-medium" },
            });
            (category.count);
        }
    }
}
if (__VLS_ctx.recipeStore.loading && !__VLS_ctx.partiallyLoaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center py-12" },
    });
    const __VLS_4 = {}.Spinner;
    /** @type {[typeof __VLS_components.Spinner, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({}));
    const __VLS_6 = __VLS_5({}, ...__VLS_functionalComponentArgsRest(__VLS_5));
}
if (__VLS_ctx.recipeStore.loading && __VLS_ctx.partiallyLoaded) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed bottom-4 right-4 bg-white rounded-full shadow-lg p-2" },
    });
    const __VLS_8 = {}.Spinner;
    /** @type {[typeof __VLS_components.Spinner, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ class: "h-6 w-6" },
    }));
    const __VLS_10 = __VLS_9({
        ...{ class: "h-6 w-6" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
}
if (!__VLS_ctx.recipeStore.loading && __VLS_ctx.displayedRecipes.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-gray-500" },
    });
    if (__VLS_ctx.activeView === 'favorites') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    else if (__VLS_ctx.selectedCategory) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
    if (__VLS_ctx.activeView === 'favorites') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-sm text-gray-500 mb-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(!__VLS_ctx.recipeStore.loading && __VLS_ctx.displayedRecipes.length === 0))
                        return;
                    if (!(__VLS_ctx.activeView === 'favorites'))
                        return;
                    __VLS_ctx.activeView = 'all';
                } },
            ...{ class: "px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200" },
        });
    }
    else if (__VLS_ctx.selectedCategory) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.clearCategoryFilter) },
            ...{ class: "px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200" },
        });
    }
}
if (__VLS_ctx.displayedRecipes.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
    });
    for (const [recipe] of __VLS_getVForSourceType((__VLS_ctx.displayedRecipes))) {
        const __VLS_12 = {}.RecipeCard;
        /** @type {[typeof __VLS_components.RecipeCard, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            ...{ 'onView': {} },
            ...{ 'onPlan': {} },
            ...{ 'onShop': {} },
            ...{ 'onFavoriteToggle': {} },
            key: (recipe.id),
            recipe: (recipe),
        }));
        const __VLS_14 = __VLS_13({
            ...{ 'onView': {} },
            ...{ 'onPlan': {} },
            ...{ 'onShop': {} },
            ...{ 'onFavoriteToggle': {} },
            key: (recipe.id),
            recipe: (recipe),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        let __VLS_16;
        let __VLS_17;
        let __VLS_18;
        const __VLS_19 = {
            onView: (__VLS_ctx.viewRecipe)
        };
        const __VLS_20 = {
            onPlan: (__VLS_ctx.planRecipe)
        };
        const __VLS_21 = {
            onShop: (__VLS_ctx.shopRecipe)
        };
        const __VLS_22 = {
            onFavoriteToggle: (__VLS_ctx.handleFavoriteToggle)
        };
        var __VLS_15;
    }
}
if (__VLS_ctx.showScrollToTop) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.scrollToTop) },
        ...{ class: "fixed bottom-16 right-4 bg-indigo-600 text-white p-3 rounded-full shadow-lg hover:bg-indigo-700 transition-colors" },
        'aria-label': "Retourner en haut de la page",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M5 10l7-7m0 0l7 7m-7-7v18",
    });
}
if (__VLS_ctx.showAddRecipeModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow-xl w-full max-w-md" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xl font-bold" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddRecipeModal))
                    return;
                __VLS_ctx.showAddRecipeModal = false;
            } },
        ...{ class: "text-gray-500 hover:text-gray-700" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "space-y-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 gap-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddRecipeModal))
                    return;
                __VLS_ctx.showUrlImport = true;
                __VLS_ctx.showAddRecipeModal = false;
            } },
        ...{ class: "flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6 text-indigo-600" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddRecipeModal))
                    return;
                __VLS_ctx.showManualCreate = true;
                __VLS_ctx.showAddRecipeModal = false;
            } },
        ...{ class: "flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6 text-indigo-600" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "font-medium" },
    });
}
if (__VLS_ctx.showUrlImport) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow-xl w-full max-w-md" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xl font-bold" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showUrlImport))
                    return;
                __VLS_ctx.showUrlImport = false;
            } },
        ...{ class: "text-gray-500 hover:text-gray-700" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
    if (__VLS_ctx.urlImportStatus === 'error') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" },
        });
        (__VLS_ctx.urlImportError);
    }
    if (__VLS_ctx.urlImportStatus === 'success') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.importFromUrl) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "recipe-url",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        id: "recipe-url",
        type: "url",
        placeholder: "https://exemple.com/recette",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
        required: true,
    });
    (__VLS_ctx.recipeUrl);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "mt-1 text-sm text-gray-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end space-x-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showUrlImport))
                    return;
                __VLS_ctx.showUrlImport = false;
            } },
        type: "button",
        ...{ class: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" },
        disabled: (__VLS_ctx.urlImportStatus === 'loading'),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center" },
        disabled: (__VLS_ctx.urlImportStatus === 'loading'),
    });
    if (__VLS_ctx.urlImportStatus === 'loading') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            ...{ class: "animate-spin h-5 w-5 mr-2 text-white" },
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
            ...{ class: "opacity-25" },
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            'stroke-width': "4",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            ...{ class: "opacity-75" },
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
}
if (__VLS_ctx.showManualCreate) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xl font-bold" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showManualCreate))
                    return;
                __VLS_ctx.showManualCreate = false;
            } },
        ...{ class: "text-gray-500 hover:text-gray-700" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
    if (__VLS_ctx.manualCreateStatus === 'error') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" },
        });
        (__VLS_ctx.manualCreateError);
    }
    if (__VLS_ctx.manualCreateStatus === 'success') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.createRecipeManually) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-medium mb-3 text-gray-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "recipe-name",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        id: "recipe-name",
        value: (__VLS_ctx.newRecipe.name),
        type: "text",
        placeholder: "Nom de la recette",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
        required: true,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "recipe-description",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        id: "recipe-description",
        value: (__VLS_ctx.newRecipe.description),
        placeholder: "Description (optionnelle)",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
        rows: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-wrap gap-2" },
    });
    for (const [category] of __VLS_getVForSourceType((__VLS_ctx.categories))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showManualCreate))
                        return;
                    category && __VLS_ctx.toggleRecipeCategory(category);
                } },
            key: (category?.id || __VLS_ctx.index),
            type: "button",
            ...{ class: "px-3 py-1 rounded-full text-sm transition-colors border" },
            ...{ class: (category && __VLS_ctx.newRecipe.recipeCategory.some(cat => cat && cat.id === category.id)
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50') },
        });
        (category?.name || 'Sans nom');
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showManualCreate))
                    return;
                __VLS_ctx.showAddCategoryModal = true;
            } },
        type: "button",
        ...{ class: "px-3 py-1 rounded-full text-sm bg-white border border-dashed border-gray-400 text-gray-700 hover:bg-gray-50 flex items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-4 w-4 mr-1" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-medium mb-3 text-gray-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-1 md:grid-cols-3 gap-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "prep-time",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        id: "prep-time",
        type: "number",
        min: "0",
        placeholder: "20",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
    });
    (__VLS_ctx.newRecipe.prepTime);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "cook-time",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        id: "cook-time",
        type: "number",
        min: "0",
        placeholder: "30",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
    });
    (__VLS_ctx.newRecipe.cookTime);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "servings",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        id: "servings",
        type: "number",
        min: "1",
        placeholder: "4",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
    });
    (__VLS_ctx.newRecipe.recipeYield);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-medium text-gray-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.addIngredient) },
        type: "button",
        ...{ class: "px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700 text-sm flex items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-4 w-4 mr-1" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    });
    for (const [ingredient, index] of __VLS_getVForSourceType((__VLS_ctx.newRecipe.recipeIngredient))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (`ing-${index}`),
            ...{ class: "flex items-center mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            value: (__VLS_ctx.newRecipe.recipeIngredient[index]),
            type: "text",
            placeholder: "200g de farine",
            ...{ class: "flex-grow border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showManualCreate))
                        return;
                    __VLS_ctx.removeIngredient(index);
                } },
            type: "button",
            ...{ class: "ml-2 text-red-500 hover:text-red-700" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
        ...{ class: "text-lg font-medium text-gray-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.addInstruction) },
        type: "button",
        ...{ class: "px-2 py-1 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-700 text-sm flex items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-4 w-4 mr-1" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M12 6v6m0 0v6m0-6h6m-6 0H6",
    });
    for (const [instruction, index] of __VLS_getVForSourceType((__VLS_ctx.newRecipe.recipeInstructions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (`ins-${index}`),
            ...{ class: "flex items-start mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold mr-2 mt-1" },
        });
        (index + 1);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.newRecipe.recipeInstructions[index].text),
            rows: "2",
            placeholder: "Décrivez cette étape",
            ...{ class: "flex-grow border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.showManualCreate))
                        return;
                    __VLS_ctx.removeInstruction(index);
                } },
            type: "button",
            ...{ class: "ml-2 text-red-500 hover:text-red-700" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            fill: "none",
            viewBox: "0 0 24 24",
            stroke: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            'stroke-width': "2",
            d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end space-x-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showManualCreate))
                    return;
                __VLS_ctx.showManualCreate = false;
            } },
        type: "button",
        ...{ class: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" },
        disabled: (__VLS_ctx.manualCreateStatus === 'loading'),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center" },
        disabled: (__VLS_ctx.manualCreateStatus === 'loading'),
    });
    if (__VLS_ctx.manualCreateStatus === 'loading') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            ...{ class: "animate-spin h-5 w-5 mr-2 text-white" },
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
            ...{ class: "opacity-25" },
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            'stroke-width': "4",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            ...{ class: "opacity-75" },
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
}
if (__VLS_ctx.showAddCategoryModal) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-white rounded-lg shadow-xl w-full max-w-md" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "p-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xl font-bold" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddCategoryModal))
                    return;
                __VLS_ctx.showAddCategoryModal = false;
            } },
        ...{ class: "text-gray-500 hover:text-gray-700" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-6 w-6" },
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
        'stroke-width': "2",
        d: "M6 18L18 6M6 6l12 12",
    });
    if (__VLS_ctx.addCategoryStatus === 'error') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" },
        });
        (__VLS_ctx.addCategoryError);
    }
    if (__VLS_ctx.addCategoryStatus === 'success') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.createCategory) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "category-name",
        ...{ class: "block text-sm font-medium text-gray-700 mb-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        id: "category-name",
        value: (__VLS_ctx.newCategoryName),
        type: "text",
        placeholder: "Ex: Desserts, Entrées, Plats principaux...",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" },
        required: true,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-end space-x-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.showAddCategoryModal))
                    return;
                __VLS_ctx.showAddCategoryModal = false;
            } },
        type: "button",
        ...{ class: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50" },
        disabled: (__VLS_ctx.addCategoryStatus === 'loading'),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center" },
        disabled: (__VLS_ctx.addCategoryStatus === 'loading'),
    });
    if (__VLS_ctx.addCategoryStatus === 'loading') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            ...{ class: "animate-spin h-5 w-5 mr-2 text-white" },
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
            ...{ class: "opacity-25" },
            cx: "12",
            cy: "12",
            r: "10",
            stroke: "currentColor",
            'stroke-width': "4",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            ...{ class: "opacity-75" },
            fill: "currentColor",
            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    }
}
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-transform']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-72']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['truncate']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-4']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['lg:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-6']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-16']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-green-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['max-h-[90vh]']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-green-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-dashed']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-3']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-start']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-shrink-0']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-red-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-green-100']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-green-400']} */ ;
/** @type {__VLS_StyleScopedClasses['text-green-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=RecipesView.vue.js.map