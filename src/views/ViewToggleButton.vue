<!-- filepath: \src\components\ViewToggleButton.vue -->
<template>
    <button
      :class="['px-4 py-2', isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800']"
      @click="$emit('click')"
    >
      <slot></slot>
    </button>
  </template>
  
  <script>
  export default {
    props: {
      isActive: {
        type: Boolean,
        default: false,
      },
    },
  };
  </script>
  
  <style scoped>
  /* Ajoutez des styles personnalisés ici si nécessaire */
  </style>