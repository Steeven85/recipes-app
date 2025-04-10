/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, onMounted } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '@heroicons/vue/solid';
import dayjs from 'dayjs';
import { VueDraggableNext as draggable } from 'vue-draggable-next';
import { recipeService } from '../services/api';
import RecipeSelector from './RecipeSelector.vue';
// Initialisation des états avec typage
const startDate = ref(dayjs().startOf('week').format('YYYY-MM-DD'));
const endDate = ref(dayjs().endOf('week').format('YYYY-MM-DD'));
const weekDays = ref([]);
const showRecipeSelector = ref(false);
const selectedDate = ref('');
onMounted(async () => {
    await loadMealPlan();
});
const loadMealPlan = async () => {
    try {
        const response = await recipeService.getMealPlan(startDate.value, endDate.value);
        // Initialiser les jours de la semaine
        weekDays.value = Array.from({ length: 7 }, (_, i) => {
            const date = dayjs(startDate.value).add(i, 'day').format('YYYY-MM-DD');
            return {
                date,
                meals: (response.data?.filter((meal) => meal.date === date) || [])
            };
        });
    }
    catch (error) {
        console.error('Erreur lors du chargement du plan de repas', error);
    }
};
const previousWeek = () => {
    startDate.value = dayjs(startDate.value).subtract(7, 'day').format('YYYY-MM-DD');
    endDate.value = dayjs(endDate.value).subtract(7, 'day').format('YYYY-MM-DD');
    loadMealPlan();
};
const nextWeek = () => {
    startDate.value = dayjs(startDate.value).add(7, 'day').format('YYYY-MM-DD');
    endDate.value = dayjs(endDate.value).add(7, 'day').format('YYYY-MM-DD');
    loadMealPlan();
};
const formatWeekRange = (start, end) => {
    return `${dayjs(start).format('D MMM')} - ${dayjs(end).format('D MMM YYYY')}`;
};
const formatDay = (date) => {
    return dayjs(date).format('ddd');
};
const formatDate = (date) => {
    return dayjs(date).format('D');
};
const openRecipeSelector = (date) => {
    selectedDate.value = date;
    showRecipeSelector.value = true;
};
const addRecipeToDay = async (recipe) => {
    try {
        await recipeService.addToMealPlan({
            date: selectedDate.value,
            recipeId: recipe.id
        });
        // Mettre à jour l'interface
        const dayIndex = weekDays.value.findIndex(day => day.date === selectedDate.value);
        if (dayIndex !== -1) {
            weekDays.value[dayIndex].meals.push({
                id: Date.now(), // Temporaire jusqu'à la réponse de l'API
                date: selectedDate.value,
                recipe
            });
        }
        showRecipeSelector.value = false;
    }
    catch (error) {
        console.error('Erreur lors de l\'ajout au planning', error);
    }
};
const removeMeal = async (meal) => {
    try {
        // Appel API pour supprimer
        await recipeService.removeMealPlan(meal.id);
        // Mettre à jour l'interface
        const dayIndex = weekDays.value.findIndex(day => day.date === meal.date);
        if (dayIndex !== -1) {
            const mealIndex = weekDays.value[dayIndex].meals.findIndex(m => m.id === meal.id);
            if (mealIndex !== -1) {
                weekDays.value[dayIndex].meals.splice(mealIndex, 1);
            }
        }
    }
    catch (error) {
        console.error('Erreur lors de la suppression du repas', error);
    }
};
const updateMealPlan = async () => {
    // Mettre à jour le backend après un drag & drop
    try {
        // Vous pouvez implémenter la logique de mise à jour ici
        // Exemple: await recipeService.updateMealPlan(weekDays.value);
    }
    catch (error) {
        console.error('Erreur lors de la mise à jour du plan', error);
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "bg-white rounded-lg shadow p-4" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "flex justify-between items-center mb-6" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.previousWeek) },
    ...{ class: "p-2 rounded hover:bg-gray-100" },
});
const __VLS_0 = {}.ChevronLeftIcon;
/** @type {[typeof __VLS_components.ChevronLeftIcon, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "h-5 w-5" },
}));
const __VLS_2 = __VLS_1({
    ...{ class: "h-5 w-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_asFunctionalElement(__VLS_intrinsicElements.h2, __VLS_intrinsicElements.h2)({
    ...{ class: "text-xl font-semibold" },
});
(__VLS_ctx.formatWeekRange(__VLS_ctx.startDate, __VLS_ctx.endDate));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (__VLS_ctx.nextWeek) },
    ...{ class: "p-2 rounded hover:bg-gray-100" },
});
const __VLS_4 = {}.ChevronRightIcon;
/** @type {[typeof __VLS_components.ChevronRightIcon, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    ...{ class: "h-5 w-5" },
}));
const __VLS_6 = __VLS_5({
    ...{ class: "h-5 w-5" },
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "grid grid-cols-7 gap-4" },
});
for (const [day] of __VLS_getVForSourceType((__VLS_ctx.weekDays))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (day.date),
        ...{ class: "border rounded-lg p-3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "text-center mb-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "text-sm text-gray-500" },
    });
    (__VLS_ctx.formatDay(day.date));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        ...{ class: "font-semibold" },
    });
    (__VLS_ctx.formatDate(day.date));
    const __VLS_8 = {}.draggable;
    /** @type {[typeof __VLS_components.Draggable, typeof __VLS_components.draggable, typeof __VLS_components.Draggable, typeof __VLS_components.draggable, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onChange': {} },
        modelValue: (day.meals),
        group: "meals",
        itemKey: "id",
        ...{ class: "min-h-[120px]" },
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onChange': {} },
        modelValue: (day.meals),
        group: "meals",
        itemKey: "id",
        ...{ class: "min-h-[120px]" },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onChange: (__VLS_ctx.updateMealPlan)
    };
    __VLS_11.slots.default;
    {
        const { item: __VLS_thisSlot } = __VLS_11.slots;
        const [{ element }] = __VLS_getSlotParams(__VLS_thisSlot);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "bg-indigo-50 p-2 rounded mb-2 text-sm" },
        });
        (element.recipe.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    __VLS_ctx.removeMeal(element);
                } },
            ...{ class: "float-right text-red-500" },
        });
        const __VLS_16 = {}.XIcon;
        /** @type {[typeof __VLS_components.XIcon, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            ...{ class: "h-4 w-4" },
        }));
        const __VLS_18 = __VLS_17({
            ...{ class: "h-4 w-4" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    }
    var __VLS_11;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.openRecipeSelector(day.date);
            } },
        ...{ class: "w-full mt-2 text-xs text-indigo-600 hover:text-indigo-800" },
    });
}
if (__VLS_ctx.showRecipeSelector) {
    /** @type {[typeof RecipeSelector, ]} */ ;
    // @ts-ignore
    const __VLS_20 = __VLS_asFunctionalComponent(RecipeSelector, new RecipeSelector({
        ...{ 'onClose': {} },
        ...{ 'onSelect': {} },
        date: (__VLS_ctx.selectedDate),
    }));
    const __VLS_21 = __VLS_20({
        ...{ 'onClose': {} },
        ...{ 'onSelect': {} },
        date: (__VLS_ctx.selectedDate),
    }, ...__VLS_functionalComponentArgsRest(__VLS_20));
    let __VLS_23;
    let __VLS_24;
    let __VLS_25;
    const __VLS_26 = {
        onClose: (...[$event]) => {
            if (!(__VLS_ctx.showRecipeSelector))
                return;
            __VLS_ctx.showRecipeSelector = false;
        }
    };
    const __VLS_27 = {
        onSelect: (__VLS_ctx.addRecipeToDay)
    };
    var __VLS_22;
}
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-6']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:bg-gray-100']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['grid']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cols-7']} */ ;
/** @type {__VLS_StyleScopedClasses['gap-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['p-3']} */ ;
/** @type {__VLS_StyleScopedClasses['text-center']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-[120px]']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-indigo-50']} */ ;
/** @type {__VLS_StyleScopedClasses['p-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['float-right']} */ ;
/** @type {__VLS_StyleScopedClasses['text-red-500']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['mt-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-xs']} */ ;
/** @type {__VLS_StyleScopedClasses['text-indigo-600']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-indigo-800']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ChevronLeftIcon: ChevronLeftIcon,
            ChevronRightIcon: ChevronRightIcon,
            XIcon: XIcon,
            draggable: draggable,
            RecipeSelector: RecipeSelector,
            startDate: startDate,
            endDate: endDate,
            weekDays: weekDays,
            showRecipeSelector: showRecipeSelector,
            selectedDate: selectedDate,
            previousWeek: previousWeek,
            nextWeek: nextWeek,
            formatWeekRange: formatWeekRange,
            formatDay: formatDay,
            formatDate: formatDate,
            openRecipeSelector: openRecipeSelector,
            addRecipeToDay: addRecipeToDay,
            removeMeal: removeMeal,
            updateMealPlan: updateMealPlan,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=MealPlanner.vue.js.map