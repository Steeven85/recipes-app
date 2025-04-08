<template>
  <div 
    class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
    @click="$emit('view', recipe.id)"
  >
    <div class="relative h-48 overflow-hidden">
      <img 
        :src="getRecipeImage(recipe)"
        :alt="recipe.name"
        class="w-full h-full object-cover"
        @error="handleImageError"
      />
      <!-- Badge favoris -->
      <div v-if="isFavorite" class="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
    
    <div class="p-4">
      <h3 class="text-lg font-semibold mb-2 text-gray-800">{{ recipe.name }}</h3>
      
      <div class="flex items-center text-sm text-gray-600 mb-3" v-if="recipe.prepTime || recipe.cookTime">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ formatCookTime(recipe) }}</span>
      </div>
      
      <!-- Affichage des catégories -->
      <div class="flex flex-wrap gap-1 mb-3" v-if="recipe.recipeCategory && recipe.recipeCategory.length > 0">
        <span 
          v-for="category in recipe.recipeCategory" 
          :key="category.id"
          class="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full"
        >
          {{ category.name }}
        </span>
      </div>
      
      <div class="flex justify-end items-center mt-4">
        <div class="flex space-x-2">
          <!-- Bouton favoris -->
          <button 
            @click.stop="toggleFavorite"
            class="p-2 rounded-full hover:bg-red-100 transition-colors"
            :class="isFavorite ? 'bg-red-100 text-red-500' : 'bg-indigo-50 text-gray-500'"
            :title="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path v-if="isFavorite" fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
              <path v-else fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" stroke="currentColor" stroke-width="1" fill="none" />
            </svg>
          </button>
          
          <button 
            @click.stop="$emit('plan', recipe)"
            class="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
            title="Ajouter au planning"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button 
            @click.stop="$emit('shop', recipe)"
            class="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
            title="Ajouter à la liste de courses"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRecipeStore } from '../stores/recipeStore';

export default {
  props: {
    recipe: {
      type: Object,
      required: true
    }
  },
  emits: ['view', 'plan', 'shop', 'favorite-toggle'],
  setup(props, { emit }) {
    const recipeStore = useRecipeStore();
    
    const isFavorite = computed(() => {
      return recipeStore.isFavorite(props.recipe.id);
    });

    const toggleFavorite = () => {
      recipeStore.toggleFavorite(props.recipe.id);
      
      // Émettre l'événement pour notifier le parent
      emit('favorite-toggle', {
        recipeId: props.recipe.id,
        isFavorite: recipeStore.isFavorite(props.recipe.id)
      });
    };

    const formatCookTime = (recipe) => {
      // Convertir totalTime en nombre, avec une valeur par défaut de 0
      const totalTime = Number(recipe.totalTime || 0);
      
      // Si totalTime est valide, le formater
      if (totalTime > 0) {
        if (totalTime < 60) return `${totalTime} min`;
        
        const hours = Math.floor(totalTime / 60);
        const mins = totalTime % 60;
        
        return mins ? `${hours}h ${mins}min` : `${hours}h`;
      }
      
      // Fallback si totalTime n'est pas disponible
      return 'N/A';
    };

    const getRecipeImage = (recipe) => {
      if (!recipe || !recipe.id) {
        return '/default-recipe.png';
      }
      
      const baseUrl = 'http://192.168.85.50:9000';
      const size = 'min-original.webp';
      return `${baseUrl}/api/media/recipes/${recipe.id}/images/${size}`;
    };

    const handleImageError = (e) => {
      e.target.src = '/default-recipe.png';
    };

    return {
      isFavorite,
      toggleFavorite,
      formatCookTime,
      getRecipeImage,
      handleImageError
    };
  }
}
</script>