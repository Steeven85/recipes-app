/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
import { useRecipeStore } from '../stores/recipeStore';
export default (await import('vue')).defineComponent({
    props: {
        recipe: {
            type: Object,
            required: true
        }
    },
    emits: ['view', 'plan', 'shop', 'favorite-toggle'],
    setup(props, { emit }) {
        const recipeStore = useRecipeStore();
        const isFavorite = computed(() => {
            return recipeStore.isFavorite(props.recipe.id);
        });
        const toggleFavorite = () => {
            recipeStore.toggleFavorite(props.recipe.id);
            // Émettre l'événement pour notifier le parent
            emit('favorite-toggle', {
                recipeId: props.recipe.id,
                isFavorite: recipeStore.isFavorite(props.recipe.id)
            });
        };
        const formatCookTime = (recipe) => {
            // Convertir totalTime en nombre, avec une valeur par défaut de 0
            const totalTime = Number(recipe.totalTime || 0);
            // Si totalTime est valide, le formater
            if (totalTime > 0) {
                if (totalTime < 60)
                    return `${totalTime} min`;
                const hours = Math.floor(totalTime / 60);
                const mins = totalTime % 60;
                return mins ? `${hours}h ${mins}min` : `${hours}h`;
            }
            // Fallback si totalTime n'est pas disponible
            return 'N/A';
        };
        const getRecipeImage = (recipe) => {
            if (!recipe || !recipe.id) {
                return '/assets/images/default-recipe.png';
            }
            const baseUrl = 'http://192.168.85.50:9000';
            const size = 'min-original.webp';
            return `${baseUrl}/api/media/recipes/${recipe.id}/images/${size}`;
        };
        const handleImageError = (e) => {
            e.target.src = '/assets/images/default-recipe.png';
        };
        return {
            isFavorite,
            toggleFavorite,
            formatCookTime,
            getRecipeImage,
            handleImageError
        };
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('view', __VLS_ctx.recipe.id);
        } },
    ...{ class: "bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "relative h-48 overflow-hidden" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ onError: (__VLS_ctx.handleImageError) },
    src: (__VLS_ctx.getRecipeImage(__VLS_ctx.recipe)),
    alt: (__VLS_ctx.recipe.name),
    ...{ class: "w-full h-full object-cover" },
});
if (__VLS_ctx.isFavorite) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        xmlns: "http://www.w3.org/2000/svg",
        ...{ class: "h-4 w-4" },
        viewBox: "0 0 20 20",
        fill: "currentColor",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        'fill-rule': "evenodd",
        d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z",
        'clip-rule': "evenodd",
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
    ...{ class: "text-lg font-semibold mb-2 text-gray-800" },
});
(__VLS_ctx.recipe.name);
if (__VLS_ctx.recipe.prepTime || __VLS_ctx.recipe.cookTime) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center text-sm text-gray-600 mb-3" },
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
        d: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.formatCookTime(__VLS_ctx.recipe));
}
if (__VLS_ctx.recipe.recipeCategory && __VLS_ctx.recipe.recipeCategory.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex flex-wrap gap-1 mb-3" },
    });
    for (const [category] of __VLS_getVForSourceType((__VLS_ctx.recipe.recipeCategory))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            key: (category.id),
            ...{ class: "inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full" },
        });
        (category.name);
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-end items-center mt-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex space-x-2" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.toggleFavorite) },
    ...{ class: "p-2 rounded-full hover:bg-red-100 transition-colors" },
    ...{ class: (__VLS_ctx.isFavorite ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-gray-500') },
    title: (__VLS_ctx.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'),
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
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('plan', __VLS_ctx.recipe);
        } },
    ...{ class: "p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600" },
    title: "Ajouter au planning",
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
    d: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.$emit('shop', __VLS_ctx.recipe);
        } },
    ...{ class: "p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600" },
    title: "Ajouter à la liste de courses",
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
    d: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
});
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['duration-300']} */ ;
/** @type {__VLS_StyleScopedClasses['cursor-pointer']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['h-48']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['h-full']} */ ;
/** @type {__VLS_StyleScopedClasses['object-cover']} */ ;
/** @type {__VLS_StyleScopedClasses['absolute']} */ ;
/** @type {__VLS_StyleScopedClasses['top-2']} */ ;
/** @type {__VLS_StyleScopedClasses['right-2']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['p-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-md']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-600']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-1']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-1']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-3']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-block']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-800']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['px-2']} */ ;
/** @type {__VLS_StyleScopedClasses['py-1']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-end']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['space-x-2']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-red-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-colors']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-full']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-indigo-100']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=RecipeCard.vue.js.map