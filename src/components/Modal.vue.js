/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
export default (await import('vue')).defineComponent({
    name: 'Modal',
    props: {
        modelValue: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: ''
        },
        size: {
            type: String,
            default: 'md',
            validator: (val) => ['sm', 'md', 'lg', 'xl', 'full'].includes(val)
        },
        maxWidth: {
            type: String,
            default: null
        },
        maxHeight: {
            type: String,
            default: null
        },
        closable: {
            type: Boolean,
            default: true
        },
        closeOnClickOutside: {
            type: Boolean,
            default: true
        },
        closeOnEsc: {
            type: Boolean,
            default: true
        },
        rounded: {
            type: [Boolean, String],
            default: true
        },
        noPadding: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue', 'close'],
    setup(props, { emit }) {
        // Tailles prédéfinies
        const sizeClasses = {
            'sm': 'max-w-sm',
            'md': 'max-w-md',
            'lg': 'max-w-lg',
            'xl': 'max-w-xl',
            'full': 'max-w-full'
        };
        // Style dynamique pour les dimensions personnalisées
        const contentStyle = computed(() => {
            const style = {};
            if (props.maxWidth) {
                style.maxWidth = props.maxWidth;
            }
            if (props.maxHeight) {
                style.maxHeight = props.maxHeight;
            }
            return style;
        });
        // Classe pour les coins arrondis
        const roundedClass = computed(() => {
            if (props.rounded === false)
                return '';
            if (props.rounded === true)
                return 'rounded-lg';
            return `rounded-${props.rounded}`;
        });
        // Classe pour le padding du corps
        const bodyClass = computed(() => {
            return props.noPadding ? '' : 'p-6';
        });
        // Fermer la modale
        const close = () => {
            emit('update:modelValue', false);
            emit('close');
        };
        // Fermer si clic à l'extérieur
        const closeIfClickOutside = () => {
            if (props.closeOnClickOutside) {
                close();
            }
        };
        // Gestion de la touche Échap
        const handleEscKey = (event) => {
            if (props.closeOnEsc && event.key === 'Escape' && props.modelValue) {
                close();
            }
        };
        // Gestion du défilement du body
        const handleBodyScroll = (shouldDisable) => {
            if (shouldDisable) {
                document.body.style.overflow = 'hidden';
            }
            else {
                document.body.style.overflow = '';
            }
        };
        // Appliquer/supprimer les écouteurs d'événements
        onMounted(() => {
            document.addEventListener('keydown', handleEscKey);
        });
        onBeforeUnmount(() => {
            document.removeEventListener('keydown', handleEscKey);
            handleBodyScroll(false); // Restaurer le défilement
        });
        // Observer les changements de visibilité
        watch(() => props.modelValue, (newVal) => {
            handleBodyScroll(newVal);
        }, { immediate: true });
        return {
            close,
            closeIfClickOutside,
            contentStyle,
            roundedClass,
            bodyClass
        };
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
/** @type {__VLS_StyleScopedClasses['modal-enter-active']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-active']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-enter-from']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['modal-leave-to']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
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
    name: "modal",
}));
const __VLS_6 = __VLS_5({
    name: "modal",
}, ...__VLS_functionalComponentArgsRest(__VLS_5));
__VLS_7.slots.default;
if (__VLS_ctx.modelValue) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeIfClickOutside) },
        ...{ class: "fixed inset-0 z-50 overflow-y-auto" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "flex items-center justify-center min-h-screen p-4" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "fixed inset-0 transition-opacity bg-black bg-opacity-50" },
        'aria-hidden': "true",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: ([__VLS_ctx.size, __VLS_ctx.roundedClass]) },
        ...{ class: "relative bg-white dark:bg-gray-800 overflow-hidden shadow-xl transform transition-all max-w-full" },
        ...{ style: (__VLS_ctx.contentStyle) },
    });
    if (__VLS_ctx.$slots.header || __VLS_ctx.title) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center" },
        });
        var __VLS_8 = {};
        __VLS_asFunctionalElement(__VLS_intrinsicElements.h3, __VLS_intrinsicElements.h3)({
            ...{ class: "text-lg font-semibold text-gray-900 dark:text-white" },
        });
        (__VLS_ctx.title);
        if (__VLS_ctx.closable) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
                ...{ onClick: (__VLS_ctx.close) },
                ...{ class: "text-gray-400 hover:text-gray-500 focus:outline-none" },
                'aria-label': "Fermer",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                ...{ class: "h-6 w-6" },
                xmlns: "http://www.w3.org/2000/svg",
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: (__VLS_ctx.bodyClass) },
    });
    var __VLS_10 = {};
    if (__VLS_ctx.$slots.footer) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "px-6 py-4 border-t border-gray-200 dark:border-gray-700" },
        });
        var __VLS_12 = {};
    }
}
var __VLS_7;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['z-50']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-y-auto']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-center']} */ ;
/** @type {__VLS_StyleScopedClasses['min-h-screen']} */ ;
/** @type {__VLS_StyleScopedClasses['p-4']} */ ;
/** @type {__VLS_StyleScopedClasses['fixed']} */ ;
/** @type {__VLS_StyleScopedClasses['inset-0']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-opacity']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-black']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-opacity-50']} */ ;
/** @type {__VLS_StyleScopedClasses['relative']} */ ;
/** @type {__VLS_StyleScopedClasses['bg-white']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:bg-gray-800']} */ ;
/** @type {__VLS_StyleScopedClasses['overflow-hidden']} */ ;
/** @type {__VLS_StyleScopedClasses['shadow-xl']} */ ;
/** @type {__VLS_StyleScopedClasses['transform']} */ ;
/** @type {__VLS_StyleScopedClasses['transition-all']} */ ;
/** @type {__VLS_StyleScopedClasses['max-w-full']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-b']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
/** @type {__VLS_StyleScopedClasses['flex']} */ ;
/** @type {__VLS_StyleScopedClasses['justify-between']} */ ;
/** @type {__VLS_StyleScopedClasses['items-center']} */ ;
/** @type {__VLS_StyleScopedClasses['text-lg']} */ ;
/** @type {__VLS_StyleScopedClasses['font-semibold']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-900']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:text-white']} */ ;
/** @type {__VLS_StyleScopedClasses['text-gray-400']} */ ;
/** @type {__VLS_StyleScopedClasses['hover:text-gray-500']} */ ;
/** @type {__VLS_StyleScopedClasses['focus:outline-none']} */ ;
/** @type {__VLS_StyleScopedClasses['h-6']} */ ;
/** @type {__VLS_StyleScopedClasses['w-6']} */ ;
/** @type {__VLS_StyleScopedClasses['px-6']} */ ;
/** @type {__VLS_StyleScopedClasses['py-4']} */ ;
/** @type {__VLS_StyleScopedClasses['border-t']} */ ;
/** @type {__VLS_StyleScopedClasses['border-gray-200']} */ ;
/** @type {__VLS_StyleScopedClasses['dark:border-gray-700']} */ ;
// @ts-ignore
var __VLS_9 = __VLS_8, __VLS_11 = __VLS_10, __VLS_13 = __VLS_12;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=Modal.vue.js.map