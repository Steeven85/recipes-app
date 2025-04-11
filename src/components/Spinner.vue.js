/// <reference types="../../node_modules/.vue-global-types/vue_3.5_0_0_0.d.ts" />
import { computed } from 'vue';
export default (await import('vue')).defineComponent({
    name: 'Spinner',
    props: {
        size: {
            type: String,
            default: 'md',
            validator: value => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
        },
        color: {
            type: String,
            default: 'emerald'
        },
        strokeWidth: {
            type: Number,
            default: 4
        },
        centered: {
            type: Boolean,
            default: false
        },
        class: {
            type: String,
            default: ''
        }
    },
    setup(props) {
        // Map des tailles
        const sizeClasses = {
            'xs': 'h-4 w-4',
            'sm': 'h-6 w-6',
            'md': 'h-10 w-10',
            'lg': 'h-12 w-12',
            'xl': 'h-16 w-16'
        };
        // Map des couleurs
        const colorClasses = {
            'emerald': 'text-emerald-600',
            'blue': 'text-blue-600',
            'green': 'text-green-600',
            'red': 'text-red-600',
            'yellow': 'text-yellow-600',
            'gray': 'text-gray-600',
            'white': 'text-white'
        };
        // Classes calculées
        const computedClasses = computed(() => {
            const classes = ['animate-spin'];
            // Ajouter la classe de taille
            classes.push(sizeClasses[props.size] || sizeClasses.md);
            // Ajouter la classe de couleur
            classes.push(colorClasses[props.color] || colorClasses.emerald);
            // Ajouter mx-auto si centré
            if (props.centered) {
                classes.push('mx-auto');
            }
            // Ajouter les classes personnalisées
            if (props.class) {
                classes.push(props.class);
            }
            return classes.join(' ');
        });
        return {
            computedClasses
        };
    }
});
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    ...{ class: (__VLS_ctx.computedClasses) },
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
    'stroke-width': (__VLS_ctx.strokeWidth),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    ...{ class: "opacity-75" },
    fill: "currentColor",
    d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z",
});
/** @type {__VLS_StyleScopedClasses['opacity-25']} */ ;
/** @type {__VLS_StyleScopedClasses['opacity-75']} */ ;
var __VLS_dollars;
let __VLS_self;
//# sourceMappingURL=Spinner.vue.js.map