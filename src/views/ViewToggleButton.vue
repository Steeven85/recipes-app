<!-- filepath: \src\components\ViewToggleButton.vue -->
<template>
<<<<<<< HEAD
  <button
    :class="['px-4 py-2', isActive ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800']"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>
=======
    <button
      :class="['px-4 py-2', isActive ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800']"
      @click="$emit('click')"
    >
      <slot></slot>
    </button>
  </template>
>>>>>>> 53c7b4ed70d3c00647a31fbe10100d13d2c3f7ed
  
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