// src/types/shims-heroicons.d.ts
declare module '@heroicons/vue/solid' {
    import { DefineComponent } from 'vue';
  
    export const ChevronLeftIcon: DefineComponent<{}, {}, any>;
    export const ChevronRightIcon: DefineComponent<{}, {}, any>;
    export const XIcon: DefineComponent<{}, {}, any>;
    export const TrashIcon: DefineComponent<{}, {}, any>;
    export const PlusIcon: DefineComponent<{}, {}, any>;
    export const ShoppingCartIcon: DefineComponent<{}, {}, any>;
    export const CalendarIcon: DefineComponent<{}, {}, any>;
    export const HeartIcon: DefineComponent<{}, {}, any>;
    // Ajoutez d'autres icônes si nécessaire
  }
  
  declare module '@heroicons/vue/outline' {
    import { DefineComponent } from 'vue';
    
    export const PlusIcon: DefineComponent<{}, {}, any>;
    export const MinusIcon: DefineComponent<{}, {}, any>;
    export const CheckIcon: DefineComponent<{}, {}, any>;
    export const XIcon: DefineComponent<{}, {}, any>;
    // Ajoutez d'autres icônes si nécessaire
  }