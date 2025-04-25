<!-- filepath: c:\Users\steev\Downloads\recipes-app\src\components\ViewToggleButton.vue -->
<template>
  <button 
    :class="[
      'px-4 py-2 font-medium',
      isActive ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
    ]"
    @click="onClick"
  >
    <slot />
  </button>
</template>
  
  <script>
  export default {
    props: {
      isActive: Boolean,
      onClick: Function
    }
  };
  </script>