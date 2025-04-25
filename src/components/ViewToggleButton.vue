<!-- filepath: c:\Users\steev\Downloads\recipes-app\src\components\ViewToggleButton.vue -->
<template>
<<<<<<< HEAD
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
=======
    <button 
      @click="onClick"
      :class="[
        'px-4 py-2 font-medium',
        isActive ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
      ]"
    >
      <slot />
    </button>
  </template>
>>>>>>> 53c7b4ed70d3c00647a31fbe10100d13d2c3f7ed
  
  <script>
  export default {
    props: {
      isActive: Boolean,
      onClick: Function
    }
  };
  </script>