/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { recipeService } from '../services/api';
export default (await import('vue')).defineComponent({
    setup() {
        const route = useRoute();
        const router = useRouter();
        const loading = ref(true);
        const editMode = ref('simple'); // 'simple' ou 'advanced'
        const simpleIngredients = ref([]);
        const isImportedRecipe = ref(false);
        const form = ref({
            name: '',
            description: '',
            recipeIngredient: [],
            recipeInstructions: []
        });
        // Helper functions to get names safely
        const getUnitName = (ingredient) => {
            if (ingredient.unit && ingredient.unit.name) {
                return ingredient.unit.name;
            }
            return ingredient.unitName || '';
        };
        const getFoodName = (ingredient) => {
            if (ingredient.food && ingredient.food.name) {
                return ingredient.food.name;
            }
            return ingredient.foodName || '';
        };
        // Normalize recipe data - ensure all required objects and arrays exist
        const normalizeRecipeData = (data) => {
            // Vérifier si la recette semble être importée
            if (data.orgURL) {
                isImportedRecipe.value = true;
                editMode.value = 'simple'; // Mode simple par défaut pour les recettes importées
            }
            // Ensure all required fields exist
            const normalized = {
                ...data,
                name: data.name || '',
                description: data.description || '',
                recipeIngredient: Array.isArray(data.recipeIngredient) ? [...data.recipeIngredient] : [],
                recipeInstructions: Array.isArray(data.recipeInstructions) ? [...data.recipeInstructions] : []
            };
            // Pour le mode simplifié, extraire les ingrédients sous forme de chaînes
            simpleIngredients.value = [];
            if (normalized.recipeIngredient.length > 0) {
                normalized.recipeIngredient.forEach(ingredient => {
                    // Si c'est déjà une chaîne
                    if (typeof ingredient === 'string') {
                        simpleIngredients.value.push(ingredient);
                    }
                    else {
                        // Sinon, essayer de composer une chaîne à partir de l'objet
                        const quantity = ingredient.quantity || '';
                        const unit = (ingredient.unit?.name || ingredient.unitName || '').trim();
                        const food = (ingredient.food?.name || ingredient.foodName || '').trim();
                        const note = (ingredient.note || '').trim();
                        // Composer la chaîne
                        let ingredientText = '';
                        if (quantity)
                            ingredientText += quantity + ' ';
                        if (unit)
                            ingredientText += unit + ' ';
                        if (food)
                            ingredientText += food;
                        if (note)
                            ingredientText += ' (' + note + ')';
                        if (ingredientText.trim()) {
                            simpleIngredients.value.push(ingredientText.trim());
                        }
                    }
                });
            }
            // Si aucun ingrédient n'a été extrait, ajouter quelques champs vides
            if (simpleIngredients.value.length === 0) {
                simpleIngredients.value.push('');
                simpleIngredients.value.push('');
            }
            // Pour chaque ingrédient, s'assurer que unit et food sont des objets
            normalized.recipeIngredient = normalized.recipeIngredient.map(ingredient => {
                // Si l'ingrédient est une simple chaîne, la convertir en objet
                if (typeof ingredient === 'string') {
                    return {
                        foodName: ingredient,
                        unitName: '',
                        quantity: null
                    };
                }
                // Sinon, normaliser la structure d'objet existante
                return {
                    ...ingredient,
                    quantity: ingredient.quantity || null,
                    unit: ingredient.unit || { name: '' },
                    food: ingredient.food || { name: '' },
                    // Ajouter des champs plats pour faciliter la manipulation
                    unitName: ingredient.unit?.name || ingredient.unitName || '',
                    foodName: ingredient.food?.name || ingredient.foodName || ''
                };
            });
            // Pour chaque instruction, s'assurer qu'il y a un champ text
            normalized.recipeInstructions = normalized.recipeInstructions.map(instruction => {
                // Si l'instruction est une simple chaîne, la convertir en objet
                if (typeof instruction === 'string') {
                    return { text: instruction };
                }
                // Sinon, normaliser la structure d'objet existante
                return {
                    ...instruction,
                    text: instruction.text || ''
                };
            });
            return normalized;
        };
        // Charger la recette
        onMounted(async () => {
            try {
                console.log("Chargement de la recette avec slug:", route.params.slug);
                const response = await recipeService.getBySlug(route.params.slug);
                console.log("Données reçues:", response.data);
                // Normaliser les données avant de les assigner
                form.value = normalizeRecipeData(response.data);
                console.log("Données normalisées:", form.value);
            }
            catch (error) {
                console.error('Erreur chargement recette', error);
            }
            finally {
                loading.value = false;
            }
        });
        // Gestion des ingrédients en mode simple
        const addSimpleIngredient = () => {
            simpleIngredients.value.push('');
        };
        const removeSimpleIngredient = (index) => {
            simpleIngredients.value.splice(index, 1);
            // Toujours garder au moins un ingrédient
            if (simpleIngredients.value.length === 0) {
                simpleIngredients.value.push('');
            }
        };
        // Gestion des ingrédients en mode avancé
        const addIngredient = () => {
            form.value.recipeIngredient.push({
                quantity: null,
                unit: { name: '' },
                food: { name: '' },
                unitName: '',
                foodName: ''
            });
        };
        const removeIngredient = (index) => {
            form.value.recipeIngredient.splice(index, 1);
        };
        // Fonctions pour mettre à jour les noms d'unité et d'aliment
        const updateUnitName = (index, value) => {
            const ingredient = form.value.recipeIngredient[index];
            ingredient.unitName = value;
            if (!ingredient.unit) {
                ingredient.unit = { name: value };
            }
            else {
                ingredient.unit.name = value;
            }
        };
        const updateFoodName = (index, value) => {
            const ingredient = form.value.recipeIngredient[index];
            ingredient.foodName = value;
            if (!ingredient.food) {
                ingredient.food = { name: value };
            }
            else {
                ingredient.food.name = value;
            }
        };
        // Préparer les données pour la soumission
        const prepareSubmissionData = () => {
            // Récupère une référence à la recette originale (à ajouter dans le composant)
            const originalName = originalRecipe.value?.name || '';
            const submissionData = { ...form.value };
            // S'assurer que le nom n'est pas modifié
            if (form.value.name !== originalName) {
                submissionData.name = originalName; // Restaurer le nom original
            }
            // Si en mode simplifié, utiliser les ingrédients textuels
            if (editMode.value === 'simple') {
                submissionData.recipeIngredient = simpleIngredients.value.filter(ing => ing.trim() !== '');
            }
            else {
                // Transformer les ingrédients au format attendu par l'API
                submissionData.recipeIngredient = form.value.recipeIngredient.map(ingredient => {
                    return {
                        quantity: ingredient.quantity,
                        unit: ingredient.unit || { name: ingredient.unitName || '' },
                        food: ingredient.food || { name: ingredient.foodName || '' }
                    };
                });
            }
            return submissionData;
        };
        // Gestion des instructions
        const addInstruction = () => {
            form.value.recipeInstructions.push({ text: '' });
        };
        const removeInstruction = (index) => {
            form.value.recipeInstructions.splice(index, 1);
        };
        // Annuler et revenir à la vue de la recette
        const cancelEdit = () => {
            router.push(`/recipes/${route.params.slug}`);
        };
        // Soumission du formulaire
        const handleSubmit = async () => {
            try {
                const dataToSubmit = prepareSubmissionData();
                console.log("Données à soumettre:", dataToSubmit);
                await recipeService.updateRecipe(form.value.id, dataToSubmit);
                router.push(`/recipes/${route.params.slug}`);
            }
            catch (error) {
                console.error('Erreur mise à jour', error);
                alert("Échec de la mise à jour. Veuillez réessayer ou vérifier les données saisies.");
            }
        };
        return {
            loading,
            form,
            editMode,
            simpleIngredients,
            isImportedRecipe,
            getUnitName,
            getFoodName,
            addIngredient,
            removeIngredient,
            addSimpleIngredient,
            removeSimpleIngredient,
            updateUnitName,
            updateFoodName,
            addInstruction,
            removeInstruction,
            cancelEdit,
            handleSubmit
        };
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "max-w-4xl mx-auto px-4 py-8" },
});
if (__VLS_ctx.loading) {
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
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({
        ...{ class: "text-2xl font-bold mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.handleSubmit) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.form.name),
        type: "text",
        disabled: true,
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "block text-sm font-medium text-gray-700 mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
        value: (__VLS_ctx.form.description),
        rows: "3",
        ...{ class: "w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center space-x-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "text-sm font-medium text-gray-700" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.editMode = 'simple';
            } },
        type: "button",
        ...{ class: ([
                'px-3 py-1 text-sm rounded',
                __VLS_ctx.editMode === 'simple'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.loading))
                    return;
                __VLS_ctx.editMode = 'advanced';
            } },
        type: "button",
        ...{ class: ([
                'px-3 py-1 text-sm rounded',
                __VLS_ctx.editMode === 'advanced'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            ]) },
    });
    if (__VLS_ctx.editMode === 'simple') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: "text-xl font-semibold mb-4" },
        });
        for (const [ingredient, index] of __VLS_getVForSourceType((__VLS_ctx.simpleIngredients))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (`simple-ing-${index}`),
                ...{ class: "mb-3 flex items-center" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                value: (__VLS_ctx.simpleIngredients[index]),
                type: "text",
                placeholder: "Par exemple: 100g de farine",
                ...{ class: "flex-grow border rounded-lg px-4 py-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!(__VLS_ctx.editMode === 'simple'))
                            return;
                        __VLS_ctx.removeSimpleIngredient(index);
                    } },
                type: "button",
                ...{ class: "ml-2 text-red-500 hover:text-red-700" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addSimpleIngredient) },
            type: "button",
            ...{ class: "mt-2 text-indigo-600 hover:text-indigo-800" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "mb-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
            ...{ class: "text-xl font-semibold mb-4" },
        });
        for (const [ingredient, index] of __VLS_getVForSourceType((__VLS_ctx.form.recipeIngredient))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (`adv-ing-${index}`),
                ...{ class: "mb-3 p-3 bg-gray-50 rounded-lg" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "grid grid-cols-12 gap-3" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                type: "number",
                placeholder: "Qty",
                ...{ class: "col-span-2 border rounded p-2" },
            });
            (ingredient.quantity);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.editMode === 'simple'))
                            return;
                        __VLS_ctx.updateUnitName(index, $event.target.value);
                    } },
                value: (__VLS_ctx.getUnitName(ingredient)),
                placeholder: "Unité",
                ...{ class: "col-span-3 border rounded p-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onInput: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.editMode === 'simple'))
                            return;
                        __VLS_ctx.updateFoodName(index, $event.target.value);
                    } },
                value: (__VLS_ctx.getFoodName(ingredient)),
                placeholder: "Ingrédient",
                ...{ class: "col-span-5 border rounded p-2" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        if (!!(__VLS_ctx.editMode === 'simple'))
                            return;
                        __VLS_ctx.removeIngredient(index);
                    } },
                type: "button",
                ...{ class: "col-span-2 text-red-500 hover:text-red-700" },
            });
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.addIngredient) },
            type: "button",
            ...{ class: "mt-2 text-indigo-600 hover:text-indigo-800" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-6" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
        ...{ class: "text-xl font-semibold mb-4" },
    });
    for (const [instruction, index] of __VLS_getVForSourceType((__VLS_ctx.form.recipeInstructions))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (index),
            ...{ class: "mb-3" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "flex items-center gap-2" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "font-medium" },
        });
        (index + 1);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.loading))
                        return;
                    __VLS_ctx.removeInstruction(index);
                } },
            type: "button",
            ...{ class: "text-red-500 hover:text-red-700" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.textarea, __VLS_intrinsicElements.textarea)({
            value: (instruction.text),
            ...{ class: "w-full border rounded-lg p-2 mt-1" },
            rows: "2",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.addInstruction) },
        type: "button",
        ...{ class: "mt-2 text-indigo-600 hover:text-indigo-800" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex space-x-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.cancelEdit) },
        type: "button",
        ...{ class: "px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" },
    });
}
/** @type {__VLS_StyleScopedClasses['max-w-4xl']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-12']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-12']} */ ;
/** @type {__VLS_StyleScopedClasses['w-12']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['text-2xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-bold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['block']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-2']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:ring-indigo-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-12']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-3']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-3']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-5']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['col-span-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-red-700']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-4']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-3']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=RecipeEditView.vue.js.map