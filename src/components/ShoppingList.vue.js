/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, onMounted } from 'vue';
import { TrashIcon } from '@heroicons/vue/outline';
import { shoppingService } from '../services/api';
const items = ref([]);
const loading = ref(true);
const hideCheckedItems = ref(false);
const newItem = ref({
    name: '',
    quantity: 1,
    unit: 'unité',
    category: 'Divers'
});
// Catégories prédéfinies pour organiser les articles
const categories = {
    'Fruits et Légumes': ['pomme', 'banane', 'carotte', 'tomate', 'salade', 'patate', 'courgette', 'aubergine', 'brocoli', 'betterave', 'avocat'],
    'Viandes et Poissons': ['poulet', 'boeuf', 'saumon', 'thon', 'porc', 'dinde', 'escalo', 'chair', 'lardon'],
    'Produits Laitiers': ['lait', 'fromage', 'yaourt', 'beurre', 'crème', 'feta', 'chèvre', 'vache qui rit'],
    'Épicerie': ['riz', 'pâtes', 'farine', 'sucre', 'sel', 'huile', 'spaghetti'],
    'Boissons': ['eau', 'jus', 'vin', 'bière', 'soda'],
    'Divers': []
};
onMounted(async () => {
    await loadShoppingList();
});
// Fonction pour extraire le nom d'un aliment
const getFoodName = (food) => {
    if (!food)
        return 'Article sans nom';
    if (typeof food === 'string') {
        if (food.includes('"name"')) {
            const match = food.match(/"name"\s*:\s*"([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return food;
    }
    if (typeof food === 'object' && food !== null) {
        return food.name || 'Article sans nom';
    }
    return 'Article sans nom';
};
// Fonction pour extraire le nom d'une unité
const getUnitDisplay = (unit) => {
    if (!unit)
        return 'unité';
    if (typeof unit === 'string') {
        if (unit.includes('"name"')) {
            const match = unit.match(/"name"\s*:\s*"([^"]+)"/);
            if (match && match[1]) {
                return match[1];
            }
        }
        return unit;
    }
    if (typeof unit === 'object' && unit !== null) {
        return unit.name || 'unité';
    }
    return 'unité';
};
const loadShoppingList = async () => {
    loading.value = true;
    try {
        const response = await shoppingService.getShoppingList();
        // Traiter les données selon la structure de réponse
        if (response.data && response.data.listItems) {
            items.value = response.data.listItems;
        }
        else if (Array.isArray(response.data)) {
            items.value = response.data;
        }
        else {
            console.error('Format de réponse inattendu:', response);
            items.value = [];
        }
    }
    catch (error) {
        console.error('Erreur lors du chargement de la liste de courses', error);
        items.value = [];
    }
    finally {
        loading.value = false;
    }
};
const determineCategory = (item) => {
    // Utiliser le nom de l'aliment pour la catégorisation
    const foodName = getFoodName(item.food).toLowerCase();
    for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => foodName.includes(keyword))) {
            return category;
        }
    }
    return 'Divers';
};
const groupedItems = computed(() => {
    const grouped = {};
    // Initialiser toutes les catégories
    Object.keys(categories).forEach(category => {
        grouped[category] = [];
    });
    // Grouper les items par catégorie
    items.value.forEach(item => {
        const category = determineCategory(item);
        if (grouped[category]) {
            grouped[category].push(item);
        }
        else {
            grouped['Divers'].push(item);
        }
    });
    // Supprimer les catégories vides
    Object.keys(grouped).forEach(category => {
        if (grouped[category].length === 0) {
            delete grouped[category];
        }
    });
    return grouped;
});
const toggleItem = async (item) => {
    try {
        await shoppingService.updateShoppingItem(item.id, { checked: !item.checked });
        item.checked = !item.checked;
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour de l\'article', error);
    }
};
const removeItem = async (itemId) => {
    try {
        await shoppingService.removeShoppingItem(itemId);
        items.value = items.value.filter(item => item.id !== itemId);
    }
    catch (error) {
        console.error('Erreur lors de la suppression de l\'article', error);
    }
};
const addNewItem = async () => {
    try {
        const itemData = {
            name: newItem.value.name,
            quantity: newItem.value.quantity,
            unit: newItem.value.unit
        };
        const response = await shoppingService.addToShoppingList(itemData);
        if (response.data) {
            items.value.push(response.data);
        }
        newItem.value = {
            name: '',
            quantity: 1,
            unit: 'unité',
            category: 'Divers'
        };
    }
    catch (error) {
        console.error('Erreur lors de l\'ajout d\'un nouvel article', error);
    }
};
const generateFromMealPlan = async () => {
    loading.value = true;
    try {
        const today = new Date();
        const startDate = formatDate(today);
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        const formattedEndDate = formatDate(endDate);
        await shoppingService.generateShoppingListFromMealPlan(startDate, formattedEndDate);
        await loadShoppingList();
    }
    catch (error) {
        console.error('Erreur lors de la génération de la liste de courses', error);
    }
    finally {
        loading.value = false;
    }
};
// Utilitaire pour formater la date en YYYY-MM-DD
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg shadow p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-semibold mb-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "mb-4 flex gap-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.generateFromMealPlan) },
    ...{ class: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.loadShoppingList) },
    ...{ class: "bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300" },
});
if (__VLS_ctx.loading) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center py-8" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        ...{ class: "animate-spin h-8 w-8 text-indigo-600 mx-auto" },
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mb-4 flex items-center" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "checkbox",
        id: "hide-checked",
        ...{ class: "h-4 w-4 text-indigo-600 rounded" },
    });
    (__VLS_ctx.hideCheckedItems);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        for: "hide-checked",
        ...{ class: "ml-2 text-gray-700" },
    });
    for (const [items, category] of __VLS_getVForSourceType((__VLS_ctx.groupedItems))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            key: (category),
            ...{ class: "mb-6" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "font-medium text-lg mb-2 text-gray-700 border-b pb-1" },
        });
        (category);
        for (const [item] of __VLS_getVForSourceType((items))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (item.id),
                ...{ class: "flex items-center py-2 border-b" },
            });
            __VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (!__VLS_ctx.hideCheckedItems || !item.checked) }, null, null);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
                ...{ onChange: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        __VLS_ctx.toggleItem(item);
                    } },
                type: "checkbox",
                checked: (item.checked),
                ...{ class: "h-5 w-5 text-indigo-600 rounded" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "ml-3 flex-grow" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: ({ 'line-through text-gray-400': item.checked }) },
                ...{ class: "font-medium" },
            });
            (__VLS_ctx.getFoodName(item.food));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
                ...{ class: "text-sm text-gray-500" },
            });
            (item.quantity);
            (__VLS_ctx.getUnitDisplay(item.unit));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.loading))
                            return;
                        __VLS_ctx.removeItem(item.id);
                    } },
                ...{ class: "text-red-500" },
            });
            const __VLS_0 = {}.TrashIcon;
            /** @type {[typeof __VLS_components.TrashIcon, ]} */ ;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
                ...{ class: "h-5 w-5" },
            }));
            const __VLS_2 = __VLS_1({
                ...{ class: "h-5 w-5" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
        }
    }
    if (__VLS_ctx.items.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "text-center py-8 text-gray-500" },
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "mt-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.form, __VLS_intrinsicElements.form)({
        ...{ onSubmit: (__VLS_ctx.addNewItem) },
        ...{ class: "flex gap-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        value: (__VLS_ctx.newItem.name),
        type: "text",
        placeholder: "Nouvel article",
        ...{ class: "flex-grow border rounded-lg px-3 py-2" },
        required: true,
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
        type: "number",
        placeholder: "Qté",
        ...{ class: "w-20 border rounded-lg px-3 py-2" },
        min: "1",
        required: true,
    });
    (__VLS_ctx.newItem.quantity);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.select, __VLS_intrinsicElements.select)({
        value: (__VLS_ctx.newItem.unit),
        ...{ class: "border rounded-lg px-3 py-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "unité",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "g",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "kg",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "ml",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.option, __VLS_intrinsicElements.option)({
        value: "L",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        type: "submit",
        ...{ class: "bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" },
    });
}
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-300']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['animate-spin']} */ ;
/** @type {__VLS_StyleScopedClasses['h-8']} */ ;
/** @type {__VLS_StyleScopedClasses['w-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mx-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['pb-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-3']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['line-through']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['font-medium']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['py-8']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['w-20']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-3']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-700']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            TrashIcon: TrashIcon,
            items: items,
            loading: loading,
            hideCheckedItems: hideCheckedItems,
            newItem: newItem,
            getFoodName: getFoodName,
            getUnitDisplay: getUnitDisplay,
            loadShoppingList: loadShoppingList,
            groupedItems: groupedItems,
            toggleItem: toggleItem,
            removeItem: removeItem,
            addNewItem: addNewItem,
            generateFromMealPlan: generateFromMealPlan,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=ShoppingList.vue.js.map