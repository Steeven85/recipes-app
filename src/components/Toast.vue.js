/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { ref, computed, watch, onBeforeUnmount } from 'vue';
export default (await import('vue')).defineComponent({
    name: 'Toast',
    props: {
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'success',
            validator: value => ['success', 'error', 'info', 'warning'].includes(value)
        },
        duration: {
            type: Number,
            default: 3000 // 3 secondes par défaut
        },
        position: {
            type: String,
            default: 'bottom-right',
            validator: value => [
                'top-left', 'top-center', 'top-right',
                'bottom-left', 'bottom-center', 'bottom-right'
            ].includes(value)
        },
        dismissible: {
            type: Boolean,
            default: true
        },
        icon: {
            type: Boolean,
            default: true
        },
        show: {
            type: Boolean,
            default: false
        }
    },
    emits: ['close'],
    setup(props, { emit }) {
        const isVisible = ref(props.show);
        let timeout = null;
        // Classes basées sur le type
        const typeClasses = {
            'success': 'bg-green-600 text-white',
            'error': 'bg-red-600 text-white',
            'info': 'bg-blue-600 text-white',
            'warning': 'bg-yellow-600 text-white'
        };
        // Classes basées sur la position
        const positionClasses = {
            'top-left': 'top-4 left-4',
            'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
            'top-right': 'top-4 right-4',
            'bottom-left': 'bottom-4 left-4',
            'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
            'bottom-right': 'bottom-4 right-4'
        };
        // Combiner les classes
        const toastClasses = computed(() => {
            return [
                typeClasses[props.type] || typeClasses.success,
                positionClasses[props.position] || positionClasses['bottom-right']
            ];
        });
        // Gestion de la durée d'affichage
        const startTimer = () => {
            if (props.duration > 0) {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    close();
                }, props.duration);
            }
        };
        // Fermer le toast
        const close = () => {
            isVisible.value = false;
            emit('close');
        };
        // Surveiller le changement de la prop show
        watch(() => props.show, (newValue) => {
            isVisible.value = newValue;
            if (newValue) {
                startTimer();
            }
        });
        // Démarrer le timer au montage si visible
        if (props.show) {
            startTimer();
        }
        // Nettoyer le timeout au démontage
        onBeforeUnmount(() => {
            clearTimeout(timeout);
        });
        return {
            isVisible,
            toastClasses,
            close
        };
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['toast-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['toast-leave-to']} */ ;
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
const __VLS_4 = {}.Transition;
/** @type {[typeof __VLS_components.Transition, typeof __VLS_components.Transition, ]} */ ;
// @ts-ignore
const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
    name: "toast",
}));
const __VLS_6 = __VLS_5({
    name: "toast",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
if (__VLS_ctx.isVisible) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: (__VLS_ctx.toastClasses) },
        ...{ class: "fixed px-4 py-2 rounded-lg shadow-lg flex items-center z-50" },
        role: "alert",
    });
    if (__VLS_ctx.icon) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "mr-2" },
        });
        if (__VLS_ctx.type === 'success') {
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
        else if (__VLS_ctx.type === 'error') {
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
        else if (__VLS_ctx.type === 'info') {
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
        else if (__VLS_ctx.type === 'warning') {
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.message);
    if (__VLS_ctx.dismissible) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (__VLS_ctx.close) },
            ...{ class: "ml-2 text-white opacity-70 hover:opacity-100" },
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
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['px-4']} */ ;
/** @type {__VLS_StyleScopedClasses['py-2']} */ ;
/** @type {__VLS_StyleScopedClasses['rounded-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['mr-2']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['h-5']} */ ;
/** @type {__VLS_StyleScopedClasses['w-5']} */ ;
/** @type {__VLS_StyleScopedClasses['ml-2']} */ ;
/** @type {__VLS_StyleScopedClasses['text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-70']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:opacity-100']} */ ;
/** @type {__VLS_StyleScopedClasses['h-4']} */ ;
/** @type {__VLS_StyleScopedClasses['w-4']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=Toast.vue.js.map