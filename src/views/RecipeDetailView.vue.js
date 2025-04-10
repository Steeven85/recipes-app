/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted, onBeforeUnmount, reactive, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { recipeService } from '../services/api';
import { useRecipeStore } from '../stores/recipeStore';
export default (await import('vue')).defineComponent({
    setup() {
        const route = useRoute();
        const router = useRouter();
        const recipeStore = useRecipeStore();
        const recipe = ref(null);
        const loading = ref(true);
        const error = ref(null);
        const imageLoading = ref(true);
        const abortController = new AbortController();
        const isFavorite = ref(false);
        const isSaving = ref(false);
        // Gestion du mode édition
        const isEditing = ref(false);
        const editableRecipe = ref(null);
        const previewImage = ref(null);
        // Gestion des portions
        const originalServings = ref(4); // Valeur par défaut
        const servings = ref(4); // Nombre actuel de portions
        // État pour les tabs sur mobile
        const activeTab = ref('ingredients');
        const isMobile = computed(() => window.innerWidth < 768);
        const windowWidth = ref(window.innerWidth);
        // Gestionnaire de redimensionnement
        const handleResize = () => {
            windowWidth.value = window.innerWidth;
        };
        // Fonction d'aide pour nettoyer les données
        const cleanRecipeData = (data) => {
            const cleanedData = { ...data };
            // Nettoyer les champs de temps
            const timeFields = ['prepTime', 'cookTime', 'totalTime', 'performTime'];
            timeFields.forEach(field => {
                if (field in cleanedData) {
                    if (typeof cleanedData[field] === 'string') {
                        // Si c'est une chaîne, extraire le nombre
                        const match = cleanedData[field].match(/^(\d+)/);
                        cleanedData[field] = match ? match[1] : "";
                    }
                    else if (typeof cleanedData[field] === 'number') {
                        // Si c'est un nombre, convertir en chaîne
                        cleanedData[field] = String(cleanedData[field]);
                    }
                }
            });
            return cleanedData;
        };
        // Toggle mode édition
        const toggleEditMode = () => {
            try {
                if (isEditing.value) {
                    isEditing.value = false;
                    previewImage.value = null;
                    console.log("Mode édition désactivé");
                }
                else {
                    resetEditableRecipe(); // Assurez-vous que cette fonction s'exécute correctement
                    console.log("editableRecipe initialisé:", editableRecipe.value); // Vérifiez les données
                    isEditing.value = true;
                    console.log("Mode édition activé");
                }
            }
            catch (error) {
                console.error("Erreur lors du changement de mode d'édition:", error);
                isEditing.value = false;
            }
        };
        const ensureUnitExists = (ingredient, index) => {
            if (!ingredient.unit) {
                // Vue reactive assignment
                ingredient.unit = { name: '', pluralName: '' };
            }
        };
        const ensureFoodExists = (ingredient, index) => {
            if (!ingredient.food) {
                // Vue reactive assignment
                ingredient.food = { name: '', pluralName: '' };
            }
        };
        // Réinitialiser la recette éditable (copie profonde et valeurs par défaut)
        const resetEditableRecipe = () => {
            if (recipe.value) {
                // Copier la recette actuelle
                editableRecipe.value = JSON.parse(JSON.stringify(recipe.value));
                // Convertir les champs de temps en nombres
                const timeFields = ['prepTime', 'cookTime', 'totalTime', 'performTime'];
                timeFields.forEach(field => {
                    if (editableRecipe.value[field]) {
                        // Si c'est une chaîne, extraire le nombre
                        if (typeof editableRecipe.value[field] === 'string') {
                            const match = editableRecipe.value[field].match(/^(\d+)/);
                            editableRecipe.value[field] = match ? parseInt(match[1]) : 0;
                        }
                    }
                });
                // S'assurer que toutes les propriétés requises existent
                if (!editableRecipe.value.recipeIngredient) {
                    editableRecipe.value.recipeIngredient = [];
                }
                // Vérifier et initialiser chaque ingrédient
                editableRecipe.value.recipeIngredient = editableRecipe.value.recipeIngredient.map(ingredient => {
                    if (!ingredient)
                        return {
                            quantity: 0,
                            unit: { name: '', pluralName: '' },
                            food: { name: '', pluralName: '' },
                            note: '',
                            isFood: true
                        };
                    // S'assurer que unit et food existent
                    if (!ingredient.unit)
                        ingredient.unit = { name: '', pluralName: '' };
                    if (!ingredient.food)
                        ingredient.food = { name: '', pluralName: '' };
                    return ingredient;
                });
                // S'assurer que recipeInstructions existe
                if (!editableRecipe.value.recipeInstructions) {
                    editableRecipe.value.recipeInstructions = [];
                }
                // S'assurer que nutrition existe avec toutes les propriétés
                if (!editableRecipe.value.nutrition) {
                    editableRecipe.value.nutrition = {
                        calories: null,
                        carbohydrateContent: null,
                        fatContent: null,
                        proteinContent: null,
                        fiberContent: null,
                        sugarContent: null,
                        sodiumContent: null
                    };
                }
                // S'assurer que recipeServings existe
                if (!editableRecipe.value.recipeServings) {
                    editableRecipe.value.recipeServings = 4; // Valeur par défaut
                }
            }
            else {
                // Si recipe.value est null, créer un objet vide avec des valeurs par défaut
                editableRecipe.value = {
                    name: '',
                    description: '',
                    recipeServings: 4,
                    prepTime: 0,
                    cookTime: 0,
                    totalTime: 0,
                    recipeIngredient: [],
                    recipeInstructions: [],
                    nutrition: {
                        calories: "",
                        carbohydrateContent: "",
                        fatContent: "",
                        proteinContent: "",
                        fiberContent: "",
                        sugarContent: "",
                        sodiumContent: ""
                    }
                };
            }
        };
        // Annuler l'édition
        const cancelEditing = () => {
            isEditing.value = false;
            previewImage.value = null; // Réinitialiser l'image prévisualisée
            resetEditableRecipe();
        };
        async function getModifiedFields(editedRecipe, originalRecipe) {
            const modified = { id: editedRecipe.id };
            const fieldsToCheck = [
                'name', 'description', 'prepTime', 'cookTime',
                'totalTime', 'recipeServings', 'recipeYield'
            ];
            fieldsToCheck.forEach(field => {
                if (JSON.stringify(editedRecipe[field]) !== JSON.stringify(originalRecipe[field])) {
                    modified[field] = editedRecipe[field];
                }
            });
            // Gestion spécifique pour les tableaux complexes
            if (JSON.stringify(editedRecipe.recipeIngredient) !== JSON.stringify(originalRecipe.recipeIngredient)) {
                modified.recipeIngredient = editedRecipe.recipeIngredient;
            }
            if (JSON.stringify(editedRecipe.recipeInstructions) !== JSON.stringify(originalRecipe.recipeInstructions)) {
                modified.recipeInstructions = editedRecipe.recipeInstructions;
            }
            return modified;
        }
        // Fonction utilitaire pour convertir les temps
        const convertTimeToMinutes = (time) => {
            // Si déjà un nombre, le retourner tel quel
            if (typeof time === 'number')
                return time;
            // Si null ou undefined, retourner 0
            if (time == null)
                return 0;
            // Si chaîne
            if (typeof time === 'string') {
                // Essayer d'extraire un nombre
                const match = time.match(/(\d+)/);
                if (match) {
                    return parseInt(match[1], 10);
                }
            }
            // Dernier recours
            return 0;
        };
        const saveRecipe = async () => {
            if (!editableRecipe.value)
                return;
            try {
                isSaving.value = true;
                // Création d'un payload minimal sans les ingrédients
                const payload = {
                    // Champs de base
                    id: editableRecipe.value.id,
                    slug: editableRecipe.value.slug,
                    // Champs modifiables essentiels
                    name: editableRecipe.value.name,
                    description: editableRecipe.value.description,
                    // Temps
                    prepTime: String(editableRecipe.value.prepTime),
                    performTime: String(editableRecipe.value.performTime),
                    totalTime: String(editableRecipe.value.totalTime),
                    // Portions
                    recipeServings: editableRecipe.value.recipeServings,
                    recipeYield: `${editableRecipe.value.recipeServings} portions`,
                    // Date de mise à jour
                    dateUpdated: new Date().toISOString()
                };
                console.log('Payload minimal:', payload);
                const response = await recipeService.updateRecipe(payload.slug, payload);
                // Reste du code inchangé
                if (response && response.data) {
                    // Mise à jour de la recette locale
                    recipe.value = response.data;
                    // Mise à jour dans le store
                    recipeStore.updateRecipe(recipe.value.id, response.data);
                    // Notification de succès
                    alert('Recette enregistrée avec succès');
                    // Désactiver le mode édition
                    isEditing.value = false;
                }
            }
            catch (error) {
                console.error('Détails de l\'erreur:', {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                // Gestion plus détaillée des erreurs
                alert(`Erreur lors de la sauvegarde : ${error.message}`);
            }
            finally {
                isSaving.value = false;
            }
        };
        // Fonction pour sauvegarder une version minimale compatible avec Mealie
        const saveRecipeMealieMinimal = async () => {
            if (!editableRecipe.value)
                return;
            try {
                isSaving.value = true;
                // Créer une version minimale compatible avec Mealie
                const minimalData = {
                    // Champs d'identification
                    id: editableRecipe.value.id,
                    userId: editableRecipe.value.userId || '',
                    // Champs requis selon la documentation Mealie
                    name: editableRecipe.value.name,
                    slug: editableRecipe.value.slug || editableRecipe.value.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                    recipeYield: `${editableRecipe.value.recipeServings || 4} portions`, // Champ requis par Mealie
                    // Description
                    description: editableRecipe.value.description || '',
                    // Valeurs numériques
                    recipeServings: Number(editableRecipe.value.recipeServings) || 4,
                    // Champs de temps au format string
                    prepTime: editableRecipe.value.prepTime ? String(editableRecipe.value.prepTime) : '',
                    cookTime: editableRecipe.value.cookTime ? String(editableRecipe.value.cookTime) : '',
                    totalTime: editableRecipe.value.totalTime ? String(editableRecipe.value.totalTime) : '',
                    // Tableaux vides pour les champs obligatoires
                    recipeIngredient: [],
                    recipeInstructions: [],
                    recipeCategory: [],
                    tags: [],
                    tools: []
                };
                console.log('Tentative de sauvegarde minimale Mealie:', minimalData);
                // Appel API en utilisant le slug
                const response = await recipeService.updateRecipe(minimalData.id, minimalData);
                if (response && response.data) {
                    alert('Version minimale de la recette enregistrée avec succès');
                    // Mise à jour des données locales
                    recipe.value = response.data;
                    isEditing.value = false;
                }
            }
            catch (error) {
                console.error('Erreur lors de la sauvegarde minimale', error);
                alert('Erreur lors de la sauvegarde minimale');
            }
            finally {
                isSaving.value = false;
            }
        };
        // Méthode pour confirmer la suppression avec une boîte de dialogue
        const confirmDelete = () => {
            if (!recipe.value)
                return;
            // Utiliser une confirmation pour éviter les suppressions accidentelles
            const isConfirmed = window.confirm(`Êtes-vous sûr de vouloir supprimer la recette "${recipe.value.name}" ? Cette action est irréversible.`);
            if (isConfirmed) {
                deleteRecipe();
            }
        };
        // Méthode pour supprimer la recette
        const deleteRecipe = async () => {
            if (!recipe.value)
                return;
            try {
                loading.value = true;
                // Appel API pour supprimer la recette
                await recipeService.deleteRecipe(recipe.value.id);
                // Suppression dans le store local
                recipeStore.removeRecipe(recipe.value.id);
                // Notification de succès
                alert('Recette supprimée avec succès');
                // Redirection vers la liste des recettes
                router.push('/');
            }
            catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert(`Erreur lors de la suppression : ${error.message}`);
            }
            finally {
                loading.value = false;
            }
        };
        // Utilitaires de débogage spécifiques à l'API Mealie
        // Vérifier la conformité des données avec les exigences de Mealie
        const validateMealieFormat = () => {
            if (!editableRecipe.value)
                return false;
            const issues = [];
            // Vérifier les champs obligatoires de base
            if (!editableRecipe.value.name)
                issues.push("Le champ 'name' est requis");
            if (!editableRecipe.value.slug)
                issues.push("Le champ 'slug' est requis");
            // Vérifier recipeYield (spécifique à Mealie)
            if (!editableRecipe.value.recipeYield) {
                issues.push("Le champ 'recipeYield' est requis par Mealie");
            }
            // Vérifier que les temps sont bien des chaînes
            const timeFields = ['totalTime', 'prepTime', 'cookTime', 'performTime'];
            for (const field of timeFields) {
                if (editableRecipe.value[field] !== null &&
                    editableRecipe.value[field] !== undefined &&
                    typeof editableRecipe.value[field] !== 'string') {
                    issues.push(`Le champ '${field}' doit être une chaîne de caractères`);
                }
            }
            // Vérifier la structure des ingrédients
            if (editableRecipe.value.recipeIngredient) {
                editableRecipe.value.recipeIngredient.forEach((ing, index) => {
                    if (!ing) {
                        issues.push(`Ingrédient ${index} est null ou undefined`);
                    }
                    else {
                        if (!ing.food || !ing.food.name)
                            issues.push(`Ingrédient ${index}: food.name manquant`);
                        if (!ing.unit || !ing.unit.name)
                            issues.push(`Ingrédient ${index}: unit.name manquant`);
                        if (ing.quantity === undefined || ing.quantity === null)
                            issues.push(`Ingrédient ${index}: quantity manquant`);
                    }
                });
            }
            // Vérifier la structure des instructions
            if (editableRecipe.value.recipeInstructions) {
                editableRecipe.value.recipeInstructions.forEach((inst, index) => {
                    if (!inst) {
                        issues.push(`Instruction ${index} est null ou undefined`);
                    }
                    else if (!inst.text && !inst.title) {
                        issues.push(`Instruction ${index}: text ou title requis`);
                    }
                });
            }
            // Afficher les problèmes
            if (issues.length > 0) {
                console.error('Problèmes de validation Mealie:', issues);
                alert(`Validation Mealie: ${issues.length} problème(s) trouvé(s). Voir la console.`);
                return false;
            }
            console.log('Validation Mealie: OK');
            alert('Validation Mealie: Aucun problème détecté');
            return true;
        };
        // Tester la récupération d'une recette pour vérifier la structure attendue
        const testGetRecipe = async () => {
            try {
                // On essaie de récupérer une recette existante pour voir sa structure
                console.log('Test de récupération de recette...');
                // Si vous avez l'ID d'une recette connue qui fonctionne
                const recipeId = editableRecipe.value?.id || '21b29605-6021-49ff-8340-0ff70cfa202a';
                const response = await recipeService.getById(recipeId);
                if (response && response.data) {
                    console.log('Structure d\'une recette Mealie valide:', response.data);
                    alert('Récupération réussie, vérifiez la console pour voir la structure');
                    // Extraire les champs clés pour la mise à jour
                    const keyFields = {
                        id: response.data.id,
                        name: response.data.name,
                        slug: response.data.slug,
                        recipeYield: response.data.recipeYield,
                        // Autres champs importants
                        totalTime: response.data.totalTime,
                        prepTime: response.data.prepTime,
                        cookTime: response.data.cookTime
                    };
                    console.log('Champs clés à inclure dans la mise à jour:', keyFields);
                }
            }
            catch (error) {
                console.error('Erreur lors du test de récupération:', error);
                alert('Erreur lors du test de récupération');
            }
        };
        // Réparer les données selon les exigences de Mealie
        const fixMealieData = () => {
            if (!editableRecipe.value)
                return;
            // Correction du slug
            if (!editableRecipe.value.slug) {
                editableRecipe.value.slug = editableRecipe.value.name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            }
            // Correction de recipeYield (spécifique à Mealie)
            if (!editableRecipe.value.recipeYield) {
                editableRecipe.value.recipeYield = `${editableRecipe.value.recipeServings || 4} portions`;
            }
            // Conversion des temps en chaînes
            const timeFields = ['totalTime', 'prepTime', 'cookTime', 'performTime'];
            for (const field of timeFields) {
                if (editableRecipe.value[field] !== null &&
                    editableRecipe.value[field] !== undefined &&
                    typeof editableRecipe.value[field] !== 'string') {
                    editableRecipe.value[field] = String(editableRecipe.value[field]);
                }
            }
            // Réparation des ingrédients
            if (editableRecipe.value.recipeIngredient) {
                editableRecipe.value.recipeIngredient = editableRecipe.value.recipeIngredient
                    .filter(ing => ing) // Supprimer les null
                    .map(ing => {
                    // Créer une copie pour ne pas modifier l'original
                    const fixedIng = { ...ing };
                    // S'assurer que unit existe
                    if (!fixedIng.unit)
                        fixedIng.unit = { name: 'unité', pluralName: 'unités' };
                    // S'assurer que food existe
                    if (!fixedIng.food)
                        fixedIng.food = { name: '', pluralName: '' };
                    // S'assurer que quantity existe
                    if (fixedIng.quantity === undefined || fixedIng.quantity === null) {
                        fixedIng.quantity = 0;
                    }
                    return fixedIng;
                });
            }
            // Réparation des instructions
            if (editableRecipe.value.recipeInstructions) {
                editableRecipe.value.recipeInstructions = editableRecipe.value.recipeInstructions
                    .filter(inst => inst) // Supprimer les null
                    .map((inst, index) => {
                    // Créer une copie pour ne pas modifier l'original
                    const fixedInst = { ...inst };
                    // S'assurer que text existe
                    if (!fixedInst.text)
                        fixedInst.text = fixedInst.title || '';
                    // S'assurer que id existe
                    if (!fixedInst.id)
                        fixedInst.id = `inst-${Date.now()}-${index}`;
                    return fixedInst;
                });
            }
            console.log("Données réparées selon les exigences Mealie:", editableRecipe.value);
            alert("Données réparées, vérifiez la console");
        };
        // Gérer l'upload d'image
        const handleImageUpload = (event) => {
            const file = event.target.files[0];
            if (!file)
                return;
            // Vérifier le type et la taille de l'image
            if (!file.type.match('image.*')) {
                alert('Veuillez sélectionner une image');
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                alert('L\'image est trop volumineuse (max 5MB)');
                return;
            }
            // Créer une prévisualisation
            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.value = e.target.result;
            };
            reader.readAsDataURL(file);
            // Stocker le fichier pour l'upload ultérieur
            uploadFile.value = file;
        };
        // Upload de l'image vers le serveur
        const uploadFile = ref(null);
        const uploadRecipeImage = async (recipeId) => {
            if (!uploadFile.value)
                return;
            try {
                const formData = new FormData();
                formData.append('image', uploadFile.value);
                await recipeService.uploadRecipeImageFixed(recipeSlug, uploadFile.value);
                // Réinitialiser
                uploadFile.value = null;
            }
            catch (error) {
                console.error('Erreur lors de l\'upload de l\'image', error);
                throw error;
            }
        };
        // Modification du nombre de portions
        const increaseServings = () => {
            servings.value += 1;
        };
        const decreaseServings = () => {
            if (servings.value > 1) {
                servings.value -= 1;
            }
        };
        // Gestion des ingrédients en mode édition
        const addNewIngredient = () => {
            if (!editableRecipe.value)
                return;
            // Créer un nouvel ingrédient avec la structure attendue
            const newIngredient = {
                quantity: 0,
                unit: {
                    name: 'unité',
                    pluralName: 'unités',
                    abbreviation: 'u'
                },
                food: {
                    name: '',
                    pluralName: null
                },
                note: '',
                isFood: true,
                disableAmount: false,
                display: ''
            };
            editableRecipe.value.recipeIngredient.push(newIngredient);
        };
        const removeIngredient = (index) => {
            if (!editableRecipe.value || !editableRecipe.value.recipeIngredient)
                return;
            editableRecipe.value.recipeIngredient.splice(index, 1);
        };
        // Gestion des instructions en mode édition
        const addNewInstruction = () => {
            if (!editableRecipe.value)
                return;
            // Créer une nouvelle instruction avec la structure attendue
            const newInstruction = {
                id: `temp-${Date.now()}`, // ID temporaire
                title: '',
                summary: '',
                text: '',
                ingredientReferences: []
            };
            editableRecipe.value.recipeInstructions.push(newInstruction);
        };
        const removeInstruction = (index) => {
            if (!editableRecipe.value || !editableRecipe.value.recipeInstructions)
                return;
            editableRecipe.value.recipeInstructions.splice(index, 1);
        };
        const moveInstructionUp = (index) => {
            if (index === 0 || !editableRecipe.value || !editableRecipe.value.recipeInstructions)
                return;
            const instructions = editableRecipe.value.recipeInstructions;
            const temp = instructions[index];
            instructions[index] = instructions[index - 1];
            instructions[index - 1] = temp;
        };
        const moveInstructionDown = (index) => {
            if (!editableRecipe.value || !editableRecipe.value.recipeInstructions)
                return;
            const instructions = editableRecipe.value.recipeInstructions;
            if (index === instructions.length - 1)
                return;
            const temp = instructions[index];
            instructions[index] = instructions[index + 1];
            instructions[index + 1] = temp;
        };
        // Ajustement des ingrédients en fonction du nombre de portions
        const adjustedIngredients = computed(() => {
            if (!recipe.value || !originalServings.value || !recipe.value.recipeIngredient)
                return [];
            const ratio = servings.value / originalServings.value;
            return recipe.value.recipeIngredient.map(ingredient => {
                if (!ingredient)
                    return {};
                // Créer une copie profonde pour ne pas modifier l'original
                const adjustedIngredient = JSON.parse(JSON.stringify(ingredient));
                // S'assurer que les propriétés nécessaires existent
                if (!adjustedIngredient.unit)
                    adjustedIngredient.unit = { name: '' };
                if (!adjustedIngredient.food)
                    adjustedIngredient.food = { name: '' };
                // Ajuster la quantité si elle existe
                if (adjustedIngredient.quantity !== null && adjustedIngredient.quantity !== undefined) {
                    adjustedIngredient.quantity = (adjustedIngredient.quantity * ratio).toFixed(1);
                    // Supprimer les zéros décimaux inutiles (ex: 2.0 -> 2)
                    adjustedIngredient.quantity = parseFloat(adjustedIngredient.quantity);
                }
                return adjustedIngredient;
            });
        });
        // Ajustement des valeurs nutritionnelles
        const adjustedNutrition = computed(() => {
            if (!recipe.value || !recipe.value.nutrition || !originalServings.value)
                return {};
            const ratio = servings.value / originalServings.value;
            const result = {};
            // Pour chaque valeur nutritionnelle, l'ajuster selon le ratio
            for (const [key, value] of Object.entries(recipe.value.nutrition || {})) {
                if (value === null || value === undefined) {
                    result[key] = value;
                    continue;
                }
                // Calcul de la nouvelle valeur nutritionnelle
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    result[key] = (numValue * ratio).toFixed(1);
                    // Si la valeur est un entier, on supprime la partie décimale
                    if (result[key].endsWith('.0')) {
                        result[key] = result[key].slice(0, -2);
                    }
                }
                else {
                    result[key] = value;
                }
            }
            return result;
        });
        // Formatage du temps en heures/minutes
        const formatTime = (minutes) => {
            // Conversion explicite en nombre
            const minutesNum = convertTimeToMinutes(minutes);
            // Différents cas de formatage
            if (minutesNum === 0)
                return 'N/A';
            const hours = Math.floor(minutesNum / 60);
            const mins = Math.floor(minutesNum % 60);
            if (hours > 0 && mins > 0) {
                return `${hours}h${mins.toString().padStart(2, '0')}`;
            }
            else if (hours > 0) {
                return `${hours}h`;
            }
            else if (mins > 0) {
                return `${mins}min`;
            }
            return 'N/A';
        };
        const editRecipe = () => {
            router.push(`/recipes/edit/${route.params.slug}`);
        };
        // Fonction pour ajouter/retirer des favoris
        const toggleFavorite = () => {
            isFavorite.value = !isFavorite.value;
            // Si on a un service/store pour gérer les favoris
            if (recipe.value) {
                if (isFavorite.value) {
                    // Ajouter aux favoris via le store ou un service
                    recipeStore.addFavorite(recipe.value.id);
                }
                else {
                    // Retirer des favoris
                    recipeStore.removeFavorite(recipe.value.id);
                }
            }
        };
        // Récupération de l'image avec taille adaptative
        const getRecipeImage = (id) => {
            // Utiliser une image plus petite sur mobile pour optimiser le chargement
            const size = windowWidth.value < 768 ? 'min-original.webp' : 'original.webp';
            return `http://192.168.85.50:9000/api/media/recipes/${id}/images/${size}`;
        };
        const nutritionLabels = {
            calories: 'Calories',
            carbohydrateContent: 'Glucides',
            cholesterolContent: 'Cholestérol',
            fatContent: 'Lipides',
            fiberContent: 'Fibres',
            proteinContent: 'Protéines',
            saturatedFatContent: 'Graisses saturées',
            sodiumContent: 'Sodium',
            sugarContent: 'Sucres',
            transFatContent: 'Graisses trans',
            unsaturatedFatContent: 'Graisses insaturées',
        };
        const formatIngredient = (ingredient) => {
            if (!ingredient)
                return '';
            const parts = [];
            // Quantité
            if (ingredient.quantity)
                parts.push(ingredient.quantity);
            // Unité avec gestion du pluriel
            if (ingredient.unit && ingredient.unit.name) {
                const quantity = ingredient.quantity || 1;
                const unit = quantity > 1 && ingredient.unit.pluralName ?
                    ingredient.unit.pluralName :
                    ingredient.unit.name;
                parts.push(unit);
            }
            // Nom de l'aliment
            if (ingredient.food && ingredient.food.name) {
                const foodName = ingredient.quantity > 1 && ingredient.food.pluralName ?
                    ingredient.food.pluralName :
                    ingredient.food.name;
                parts.push(foodName);
            }
            // Note entre parenthèses
            if (ingredient.note)
                parts.push(`(${ingredient.note})`);
            return parts.join(' ');
        };
        // Dans la fonction onMounted
        onMounted(async () => {
            // Ajouter l'écouteur de redimensionnement
            window.addEventListener('resize', handleResize);
            try {
                const recipeId = route.params.id;
                if (!recipeId) {
                    error.value = 'Identifiant de recette manquant';
                    loading.value = false;
                    return;
                }
                // Vérifier si la recette est déjà dans le store
                const cachedRecipe = recipeStore.getRecipeById(recipeId);
                if (cachedRecipe && cachedRecipe._detailsLoaded) {
                    // Utiliser la recette en cache si les détails sont chargés
                    recipe.value = cachedRecipe;
                    // Initialiser originalServings à partir de la recette
                    if (recipe.value && recipe.value.recipeServings) {
                        originalServings.value = recipe.value.recipeServings;
                        servings.value = recipe.value.recipeServings;
                    }
                    loading.value = false;
                }
                else if (cachedRecipe) {
                    // Utiliser la version en cache temporairement, mais charger les détails complets
                    recipe.value = cachedRecipe;
                }
                // Utiliser getById au lieu de getRecipeById
                const response = await recipeService.getById(recipeId, { signal: abortController.signal });
                if (!response.data) {
                    throw new Error('Recette non trouvée');
                }
                recipe.value = response.data;
                // Initialiser originalServings à partir de la recette
                if (recipe.value && recipe.value.recipeServings) {
                    originalServings.value = recipe.value.recipeServings;
                    servings.value = recipe.value.recipeServings;
                }
                // Vérifier si la recette est en favoris
                if (recipeStore.isFavorite && recipeStore.isFavorite(recipeId)) {
                    isFavorite.value = true;
                }
                // Mettre à jour le store avec les détails complets
                if (cachedRecipe) {
                    recipeStore.updateRecipe(recipeId, { ...response.data, _detailsLoaded: true });
                }
                // Conversion explicite des temps
                const processedRecipe = {
                    ...response.data,
                    prepTime: convertTimeToMinutes(response.data.prepTime),
                    performTime: convertTimeToMinutes(response.data.performTime),
                    totalTime: convertTimeToMinutes(response.data.totalTime),
                    cookTime: convertTimeToMinutes(response.data.cookTime)
                };
                // S'assurer que les propriétés réactives sont correctement initialisées
                resetEditableRecipe();
            }
            catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err);
                    error.value = 'Erreur lors du chargement de la recette';
                }
            }
            finally {
                loading.value = false;
            }
        });
        onBeforeUnmount(() => {
            // Nettoyer l'écouteur et annuler les requêtes en cours
            window.removeEventListener('resize', handleResize);
            abortController.abort();
        });
        return {
            recipe,
            loading,
            error,
            imageLoading,
            formatTime,
            editRecipe,
            getRecipeImage,
            nutritionLabels,
            formatIngredient,
            activeTab,
            isMobile,
            router,
            isFavorite,
            toggleFavorite,
            // Ajout des propriétés manquantes
            isEditing,
            editableRecipe,
            previewImage,
            originalServings,
            servings,
            increaseServings,
            decreaseServings,
            adjustedIngredients,
            adjustedNutrition,
            toggleEditMode,
            cancelEditing,
            saveRecipe,
            saveRecipeMealieMinimal,
            validateMealieFormat,
            testGetRecipe,
            fixMealieData,
            handleImageUpload,
            addNewIngredient,
            removeIngredient,
            addNewInstruction,
            removeInstruction,
            moveInstructionUp,
            moveInstructionDown,
            isSaving,
            confirmDelete,
            deleteRecipe,
            ensureUnitExists,
            ensureFoodExists
        };
    },
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
if (__VLS_ctx.loading && !__VLS_ctx.recipe) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-12" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        ...{ class: "animate-spin h-12 w-12 text-indigo-600 mx-auto" },
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
else if (__VLS_ctx.error) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-12 text-red-500" },
    });
    (__VLS_ctx.error);
}
else if (__VLS_ctx.recipe) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "max-w-4xl mx-auto px-4 py-8" },
        ...{ class: ({ 'pb-32': __VLS_ctx.isEditing }) },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4 z-10 flex justify-between items-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.cancelEditing) },
            ...{ class: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-gray-600" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.saveRecipe) },
            ...{ class: "px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors" },
            disabled: (__VLS_ctx.isSaving),
        });
        if (__VLS_ctx.isSaving) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-8 relative" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ class: "text-3xl font-bold text-gray-900 text-center w-full border-b-2 border-indigo-300 focus:border-indigo-500 focus:outline-none pb-1" },
            placeholder: "Titre de la recette",
        });
        (__VLS_ctx.editableRecipe.name);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
            ...{ class: "text-3xl font-bold text-gray-900 mb-2" },
        });
        (__VLS_ctx.recipe.name);
    }
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mt-4" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: (__VLS_ctx.editableRecipe.description),
            ...{ class: "text-gray-600 text-lg w-full border-2 border-indigo-100 rounded-lg p-2 focus:border-indigo-300 focus:outline-none" },
            placeholder: "Description de la recette",
            rows: "3",
        });
    }
    else if (__VLS_ctx.recipe.description) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-gray-600 text-lg" },
        });
        (__VLS_ctx.recipe.description);
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-center md:absolute md:top-0 md:right-0 mt-4 md:mt-0 space-x-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleEditMode) },
        ...{ class: "p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-md transition-all" },
        title: (__VLS_ctx.isEditing ? 'Visualiser la recette' : 'Modifier la recette'),
    });
    if (!__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M10 12a2 2 0 100-4 2 2 0 000 4z",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z",
            'clip-rule': "evenodd",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleFavorite) },
        ...{ class: "p-2 rounded-full shadow-md transition-all" },
        ...{ class: (__VLS_ctx.isFavorite ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-100') },
        title: "Ajouter aux favoris",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-5 w-5" },
        viewBox: "0 0 20 20",
        fill: "currentColor",
    });
    if (__VLS_ctx.isFavorite) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
            'clip-rule': "evenodd",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
            'clip-rule': "evenodd",
            stroke: "currentColor",
            'stroke-width': "1",
            fill: "none",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.confirmDelete) },
        ...{ class: "p-2 bg-white text-red-600 rounded-full hover:bg-red-100 shadow-md transition-all" },
        title: "Supprimer la recette",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-5 w-5" },
        viewBox: "0 0 20 20",
        fill: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'fill-rule': "evenodd",
        d: "M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z",
        'clip-rule': "evenodd",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-8 relative" },
    });
    if (__VLS_ctx.imageLoading) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            ...{ class: "animate-spin h-8 w-8 text-indigo-400" },
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
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "absolute bottom-4 right-4 z-10" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            for: "image-upload",
            ...{ class: "p-3 bg-white bg-opacity-80 rounded-full cursor-pointer hover:bg-opacity-100 shadow-md transition-all flex items-center justify-center" },
            title: "Changer l'image",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5 text-indigo-600" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z",
            'clip-rule': "evenodd",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (__VLS_ctx.handleImageUpload) },
            id: "image-upload",
            type: "file",
            accept: "image/*",
            ...{ class: "hidden" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ onLoad: (...[$event]) => {
                if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.recipe))
                    return;
                __VLS_ctx.imageLoading = false;
            } },
        src: (__VLS_ctx.previewImage || __VLS_ctx.getRecipeImage(__VLS_ctx.recipe.id)),
        alt: (__VLS_ctx.recipe.name),
        ...{ class: "w-full h-96 object-cover rounded-xl shadow-lg" },
        loading: "lazy",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-indigo-50 p-4 rounded-lg text-center col-span-2 md:col-span-1" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-semibold text-indigo-600 mb-1" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "number",
            min: "1",
            ...{ class: "w-16 text-center border border-indigo-300 rounded-md p-1" },
        });
        (__VLS_ctx.editableRecipe.recipeServings);
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.decreaseServings) },
            ...{ class: "bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors" },
            disabled: (__VLS_ctx.servings <= 1),
            ...{ class: ({ 'opacity-50 cursor-not-allowed': __VLS_ctx.servings <= 1 }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z",
            'clip-rule': "evenodd",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "mx-3 text-lg font-medium text-gray-900" },
        });
        (__VLS_ctx.servings);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.increaseServings) },
            ...{ class: "bg-indigo-100 text-indigo-800 w-8 h-8 rounded-full flex items-center justify-center hover:bg-indigo-200 transition-colors" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z",
            'clip-rule': "evenodd",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-indigo-50 p-4 rounded-lg text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-semibold text-indigo-600 mb-1" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "number",
            min: "0",
            ...{ class: "w-16 text-center border border-indigo-300 rounded-md p-1" },
        });
        (__VLS_ctx.editableRecipe.prepTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "ml-1 text-sm text-gray-600" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-lg text-gray-900" },
        });
        (__VLS_ctx.formatTime(__VLS_ctx.recipe.prepTime));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-indigo-50 p-4 rounded-lg text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-semibold text-indigo-600 mb-1" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "number",
            min: "0",
            ...{ class: "w-16 text-center border border-indigo-300 rounded-md p-1" },
        });
        (__VLS_ctx.editableRecipe.performTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "ml-1 text-sm text-gray-600" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-lg text-gray-900" },
        });
        (__VLS_ctx.formatTime(__VLS_ctx.recipe.performTime));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "bg-indigo-50 p-4 rounded-lg text-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm font-semibold text-indigo-600 mb-1" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center justify-center" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            type: "number",
            min: "0",
            ...{ class: "w-16 text-center border border-indigo-300 rounded-md p-1" },
        });
        (__VLS_ctx.editableRecipe.totalTime);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "ml-1 text-sm text-gray-600" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
            ...{ class: "text-lg text-gray-900" },
        });
        (__VLS_ctx.formatTime(__VLS_ctx.recipe.totalTime));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "md:hidden mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex space-x-2 overflow-x-auto pb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.recipe))
                    return;
                __VLS_ctx.activeTab = 'ingredients';
            } },
        ...{ class: (['px-4 py-2 rounded-lg text-sm whitespace-nowrap', __VLS_ctx.activeTab === 'ingredients' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800']) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.recipe))
                    return;
                __VLS_ctx.activeTab = 'instructions';
            } },
        ...{ class: (['px-4 py-2 rounded-lg text-sm whitespace-nowrap', __VLS_ctx.activeTab === 'instructions' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800']) },
    });
    if (__VLS_ctx.recipe.nutrition) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                        return;
                    if (!!(__VLS_ctx.error))
                        return;
                    if (!(__VLS_ctx.recipe))
                        return;
                    if (!(__VLS_ctx.recipe.nutrition))
                        return;
                    __VLS_ctx.activeTab = 'nutrition';
                } },
            ...{ class: (['px-4 py-2 rounded-lg text-sm whitespace-nowrap', __VLS_ctx.activeTab === 'nutrition' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800']) },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "mb-8 bg-white p-6 rounded-xl shadow-sm" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'ingredients' || !__VLS_ctx.isMobile) }, null, null);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-2xl font-bold text-gray-900" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addNewIngredient) },
            ...{ class: "p-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors" },
            title: "Ajouter un ingrédient",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z",
            'clip-rule': "evenodd",
        });
    }
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ class: "space-y-3" },
        });
        for (const [ingredient, index] of __VLS_getVForSourceType((__VLS_ctx.editableRecipe.recipeIngredient))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (index),
                ...{ class: "flex items-center bg-gray-50 p-3 rounded-lg" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex-1 grid grid-cols-12 gap-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "number",
                min: "0",
                step: "0.1",
                ...{ class: "col-span-2 border border-gray-300 rounded p-1 text-center" },
                placeholder: "Qté",
            });
            (ingredient.quantity);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onFocus: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.recipe))
                            return;
                        if (!(__VLS_ctx.isEditing))
                            return;
                        __VLS_ctx.ensureUnitExists(ingredient, index);
                    } },
                ...{ class: "col-span-3 border border-gray-300 rounded p-1" },
                placeholder: "Unité",
            });
            (ingredient.unit.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onFocus: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.recipe))
                            return;
                        if (!(__VLS_ctx.isEditing))
                            return;
                        __VLS_ctx.ensureFoodExists(ingredient, index);
                    } },
                ...{ class: "col-span-5 border border-gray-300 rounded p-1" },
                placeholder: "Ingrédient",
            });
            (ingredient.food.name);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.recipe))
                            return;
                        if (!(__VLS_ctx.isEditing))
                            return;
                        __VLS_ctx.removeIngredient(index);
                    } },
                ...{ class: "col-span-2 p-1 text-red-500 hover:text-red-700 transition-colors" },
                title: "Supprimer cet ingrédient",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5 mx-auto" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z",
                'clip-rule': "evenodd",
            });
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ul, __VLS_intrinsicElements.ul)({
            ...{ class: "grid grid-cols-1 md:grid-cols-2 gap-3" },
        });
        for (const [ingredient, index] of __VLS_getVForSourceType((__VLS_ctx.adjustedIngredients))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (index),
                ...{ class: "flex items-center bg-gray-50 p-3 rounded-lg" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "mr-2 text-indigo-500" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ class: "text-gray-700" },
            });
            (__VLS_ctx.formatIngredient(ingredient));
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "mb-8 bg-white p-6 rounded-xl shadow-sm" },
    });
    __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'instructions' || !__VLS_ctx.isMobile) }, null, null);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex justify-between items-center mb-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-2xl font-bold text-gray-900" },
    });
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addNewInstruction) },
            ...{ class: "p-2 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors" },
            title: "Ajouter une étape",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            xmlns: "http://www.w3.org/2000/svg",
            ...{ class: "h-5 w-5" },
            viewBox: "0 0 20 20",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            'fill-rule': "evenodd",
            d: "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z",
            'clip-rule': "evenodd",
        });
    }
    if (__VLS_ctx.isEditing) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ol, __VLS_intrinsicElements.ol)({
            ...{ class: "space-y-4" },
        });
        for (const [step, index] of __VLS_getVForSourceType((__VLS_ctx.editableRecipe.recipeInstructions))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (index),
                ...{ class: "bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex justify-between items-center mb-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "font-semibold text-indigo-600" },
            });
            (index + 1);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "flex space-x-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.recipe))
                            return;
                        if (!(__VLS_ctx.isEditing))
                            return;
                        __VLS_ctx.moveInstructionUp(index);
                    } },
                disabled: (index === 0),
                ...{ class: ({ 'opacity-50 cursor-not-allowed': index === 0 }) },
                ...{ class: "p-1 text-gray-500 hover:text-gray-700 transition-colors" },
                title: "Déplacer vers le haut",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z",
                'clip-rule': "evenodd",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.recipe))
                            return;
                        if (!(__VLS_ctx.isEditing))
                            return;
                        __VLS_ctx.moveInstructionDown(index);
                    } },
                disabled: (index === __VLS_ctx.editableRecipe.recipeInstructions.length - 1),
                ...{ class: ({ 'opacity-50 cursor-not-allowed': index === __VLS_ctx.editableRecipe.recipeInstructions.length - 1 }) },
                ...{ class: "p-1 text-gray-500 hover:text-gray-700 transition-colors" },
                title: "Déplacer vers le bas",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z",
                'clip-rule': "evenodd",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                            return;
                        if (!!(__VLS_ctx.error))
                            return;
                        if (!(__VLS_ctx.recipe))
                            return;
                        if (!(__VLS_ctx.isEditing))
                            return;
                        __VLS_ctx.removeInstruction(index);
                    } },
                ...{ class: "p-1 text-red-500 hover:text-red-700 transition-colors" },
                title: "Supprimer cette étape",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z",
                'clip-rule': "evenodd",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ class: "w-full mb-2 border border-indigo-200 rounded p-2 text-gray-700" },
                placeholder: "Résumé de l'étape (optionnel)",
            });
            (step.summary);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
                value: (step.text),
                ...{ class: "w-full border border-indigo-200 rounded p-2 text-gray-700" },
                placeholder: "Instruction détaillée",
                rows: "3",
            });
        }
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.ol, __VLS_intrinsicElements.ol)({
            ...{ class: "space-y-4" },
        });
        for (const [step, index] of __VLS_getVForSourceType((__VLS_ctx.recipe.recipeInstructions))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.li, __VLS_intrinsicElements.li)({
                key: (index),
                ...{ class: "bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "font-semibold text-indigo-600 mb-2" },
            });
            (index + 1);
            if (step.summary) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ class: "ml-2" },
                });
                (step.summary);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-gray-700" },
            });
            (step.text);
        }
    }
    if (__VLS_ctx.recipe.nutrition) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "bg-white p-6 rounded-xl shadow-sm mb-8" },
        });
        __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.activeTab === 'nutrition' || !__VLS_ctx.isMobile) }, null, null);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: "text-2xl font-bold text-gray-900 mb-4" },
        });
        if (__VLS_ctx.isEditing) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-2 md:grid-cols-4 gap-4" },
            });
            for (const [label, key] of __VLS_getVForSourceType((__VLS_ctx.nutritionLabels))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (key),
                    ...{ class: "bg-gray-50 p-3 rounded-lg" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-sm font-semibold text-gray-600 capitalize mb-1" },
                });
                (label);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                    ...{ class: "w-full text-center border border-gray-300 rounded p-1" },
                    placeholder: "0",
                });
                (__VLS_ctx.editableRecipe.nutrition[key]);
            }
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-2 md:grid-cols-4 gap-4" },
            });
            for (const [[key, value], index] of __VLS_getVForSourceType((Object.entries(__VLS_ctx.adjustedNutrition || {}).filter(([_, value]) => value)))) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    key: (index),
                    ...{ class: "bg-gray-50 p-3 rounded-lg text-center" },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-sm font-semibold text-gray-600 capitalize" },
                });
                (__VLS_ctx.nutritionLabels[key] || key);
                __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                    ...{ class: "text-lg text-gray-900" },
                });
                (value);
            }
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center mt-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading && !__VLS_ctx.recipe))
                    return;
                if (!!(__VLS_ctx.error))
                    return;
                if (!(__VLS_ctx.recipe))
                    return;
                __VLS_ctx.router.back();
            } },
        ...{ class: "px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300" },
    });
}
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-32']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-0']} */ ;
/** @type {__VLS_StyleScopedClasses['left-0']} */ ;
/** @type {__VLS_StyleScopedClasses['right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-3xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:border-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['md:absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['md:top-0']} */ ;
/** @type {__VLS_StyleScopedClasses['md:right-0']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['md:mt-0']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-400']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['bottom-4']} */ ;
/** @type {__VLS_StyleScopedClasses['right-4']} */ ;
/** @type {__VLS_StyleScopedClasses['z-10']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-80']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-96']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['md:col-span-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['w-16']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-md']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['md:hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-x-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['whitespace-nowrap']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-1']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-12']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-5']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-1']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border-l-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-not-allowed']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-200']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['space-y-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['border-l-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-6']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-2']} */ ;
/** @type {__VLS_StyleScopedClasses['md:grid-cols-4']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['capitalize']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-8']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-300']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=RecipeDetailView.vue.js.map