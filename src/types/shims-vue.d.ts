// src/types/shims-vue.d.ts
declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
  }
  
  // src/types/shims-api.d.ts
  declare module '../services/api' {
    const api: any;
    export default api;
  }
  
  // src/types/shims-heroicons.d.ts
  declare module '@heroicons/vue/solid' {
    const components: any;
    export default components;
    export const TrashIcon: any;
    export const PlusIcon: any;
    export const ShoppingCartIcon: any;
    export const CalendarIcon: any;
    export const HeartIcon: any;
    // Ajoutez d'autres icônes si nécessaire
  }
  
  declare module '@heroicons/vue/outline' {
    const components: any;
    export default components;
    export const PlusIcon: any;
    export const MinusIcon: any;
    export const CheckIcon: any;
    export const XIcon: any;
    // Ajoutez d'autres icônes si nécessaire
  }
  
  // src/types/shims-drag.d.ts
  declare module 'vue-draggable-next' {
    import { Component } from 'vue';
    export const VueDraggableNext: Component;
    export const draggable: Component;
    export default VueDraggableNext;
  }