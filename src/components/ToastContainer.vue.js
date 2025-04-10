/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, onMounted, onUnmounted, watch } from 'vue';
import toastService from '../services/toastService';
export default (await import('vue')).defineComponent({
    name: 'ToastContainer',
    setup() {
        // Les toasts sont directement accessibles depuis le service
        const toasts = computed(() => toastService.getToasts());
        // Classes basées sur le type de toast
        const getTypeClass = (type) => {
            const classes = {
                'success': 'bg-green-600 text-white',
                'error': 'bg-red-600 text-white',
                'info': 'bg-blue-600 text-white',
                'warning': 'bg-yellow-600 text-white'
            };
            return classes[type] || classes.info;
        };
        // Classes basées sur la position
        const getPositionClass = (position) => {
            const classes = {
                'top-left': 'top-4 left-4',
                'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
                'top-right': 'top-4 right-4',
                'bottom-left': 'bottom-4 left-4',
                'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
                'bottom-right': 'bottom-4 right-4'
            };
            return classes[position] || classes['bottom-right'];
        };
        // Supprimer un toast spécifique
        const removeToast = (id) => {
            toastService.remove(id);
        };
        // Limiter le nombre de toasts affichés simultanément
        const MAX_TOASTS = 5;
        watch(toasts, (newToasts) => {
            if (newToasts.length > MAX_TOASTS) {
                // Supprimer les toasts les plus anciens
                const oldestToasts = [...newToasts]
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .slice(0, newToasts.length - MAX_TOASTS);
                oldestToasts.forEach(toast => {
                    toastService.remove(toast.id);
                });
            }
        });
        return {
            toasts,
            getTypeClass,
            getPositionClass,
            removeToast
        };
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
// CSS variable injection 
// CSS variable injection end 
const __VLS_0 = {}.Teleport;
/** @type {[typeof __VLS_components.Teleport, typeof __VLS_components.Teleport, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    to: "body",
}));
const __VLS_2 = __VLS_1({
    to: "body",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "toast-container" },
});
const __VLS_4 = {}.TransitionGroup;
/** @type {[typeof __VLS_components.TransitionGroup, typeof __VLS_components.TransitionGroup, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    name: "toast",
}));
const __VLS_6 = __VLS_5({
    name: "toast",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
for (const [toast] of __VLS_getVForSourceType((__VLS_ctx.toasts))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (toast.id),
        ...{ class: (__VLS_ctx.getPositionClass(toast.position)) },
        ...{ class: "fixed z-50" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: (__VLS_ctx.getTypeClass(toast.type)) },
        ...{ class: "rounded-lg shadow-lg px-4 py-2 flex items-center min-w-[300px] max-w-sm mb-2" },
        role: "alert",
    });
    if (toast.icon) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "mr-2" },
        });
        if (toast.type === 'success') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z",
                'clip-rule': "evenodd",
            });
        }
        else if (toast.type === 'error') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z",
                'clip-rule': "evenodd",
            });
        }
        else if (toast.type === 'info') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
                'clip-rule': "evenodd",
            });
        }
        else if (toast.type === 'warning') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                xmlns: "http://www.w3.org/2000/svg",
                ...{ class: "h-5 w-5" },
                viewBox: "0 0 20 20",
                fill: "currentColor",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                'fill-rule': "evenodd",
                d: "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z",
                'clip-rule': "evenodd",
            });
        }
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "flex-grow" },
    });
    (toast.message);
    if (toast.dismissible) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(toast.dismissible))
                        return;
                    __VLS_ctx.removeToast(toast.id);
                } },
            ...{ class: "ml-2 text-white opacity-70 hover:opacity-100 transition-opacity" },
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
}
var __VLS_7;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['toast-container']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['min-w-[300px]']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-sm']} */ ;
/** @type {__VLS_StyleScopedClasses['mb-2']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['flex-grow']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=ToastContainer.vue.js.map