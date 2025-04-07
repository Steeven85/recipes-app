<!-- src/components/MealPlanner.vue -->
<template>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex justify-between items-center mb-6">
      <button @click="previousWeek" class="p-2 rounded hover:bg-gray-100">
        <ChevronLeftIcon class="h-5 w-5" />
      </button>
      
      <h2 class="text-xl font-semibold">
        {{ formatWeekRange(startDate, endDate) }}
      </h2>
      
      <button @click="nextWeek" class="p-2 rounded hover:bg-gray-100">
        <ChevronRightIcon class="h-5 w-5" />
      </button>
    </div>
    
    <div class="grid grid-cols-7 gap-4">
      <div 
        v-for="day in weekDays" 
        :key="day.date"
        class="border rounded-lg p-3"
      >
        <div class="text-center mb-2">
          <p class="text-sm text-gray-500">{{ formatDay(day.date) }}</p>
          <p class="font-semibold">{{ formatDate(day.date) }}</p>
        </div>
        
        <draggable
          v-model="day.meals"
          group="meals"
          item-key="id"
          class="min-h-[120px]"
          @change="updateMealPlan"
        >
          <template #item="{ element }">
            <div class="bg-indigo-50 p-2 rounded mb-2 text-sm">
              {{ element.recipe.name }}
              <button @click="removeMeal(element)" class="float-right text-red-500">
                <XIcon class="h-4 w-4" />
              </button>
            </div>
          </template>
        </draggable>
        
        <button 
          @click="openRecipeSelector(day.date)"
          class="w-full mt-2 text-xs text-indigo-600 hover:text-indigo-800"
        >
          + Ajouter un repas
        </button>
      </div>
    </div>
    
    <!-- Modal pour sélectionner une recette -->
    <RecipeSelector
      v-if="showRecipeSelector"
      :date="selectedDate"
      @close="showRecipeSelector = false"
      @select="addRecipeToDay"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from '@heroicons/vue/solid';
import dayjs from 'dayjs';
import { VueDraggableNext as draggable } from 'vue-draggable-next';
import { recipeService } from '../services/api';
import RecipeSelector from './RecipeSelector.vue';

// Définition des interfaces pour le typage
interface Recipe {
  id: string | number;
  name: string;
  [key: string]: any; // Pour les autres propriétés de la recette
}

interface Meal {
  id: string | number;
  date: string;
  recipe: Recipe;
  [key: string]: any; // Pour les autres propriétés du repas
}

interface DayPlan {
  date: string;
  meals: Meal[];
}

// Initialisation des états avec typage
const startDate = ref<string>(dayjs().startOf('week').format('YYYY-MM-DD'));
const endDate = ref<string>(dayjs().endOf('week').format('YYYY-MM-DD'));
const weekDays = ref<DayPlan[]>([]);
const showRecipeSelector = ref<boolean>(false);
const selectedDate = ref<string>('');

onMounted(async () => {
  await loadMealPlan();
});

const loadMealPlan = async () => {
  try {
    const response = await recipeService.getMealPlan(startDate.value, endDate.value);
    
    // Initialiser les jours de la semaine
    weekDays.value = Array.from({ length: 7 }, (_, i) => {
      const date = dayjs(startDate.value).add(i, 'day').format('YYYY-MM-DD');
      return {
        date,
        meals: (response.data?.filter((meal: Meal) => meal.date === date) || []) as Meal[]
      };
    });
  } catch (error) {
    console.error('Erreur lors du chargement du plan de repas', error);
  }
};

const previousWeek = () => {
  startDate.value = dayjs(startDate.value).subtract(7, 'day').format('YYYY-MM-DD');
  endDate.value = dayjs(endDate.value).subtract(7, 'day').format('YYYY-MM-DD');
  loadMealPlan();
};

const nextWeek = () => {
  startDate.value = dayjs(startDate.value).add(7, 'day').format('YYYY-MM-DD');
  endDate.value = dayjs(endDate.value).add(7, 'day').format('YYYY-MM-DD');
  loadMealPlan();
};

const formatWeekRange = (start: string, end: string): string => {
  return `${dayjs(start).format('D MMM')} - ${dayjs(end).format('D MMM YYYY')}`;
};

const formatDay = (date: string): string => {
  return dayjs(date).format('ddd');
};

const formatDate = (date: string): string => {
  return dayjs(date).format('D');
};

const openRecipeSelector = (date: string): void => {
  selectedDate.value = date;
  showRecipeSelector.value = true;
};

const addRecipeToDay = async (recipe: Recipe): Promise<void> => {
  try {
    await recipeService.addToMealPlan({
      date: selectedDate.value,
      recipeId: recipe.id
    });
    
    // Mettre à jour l'interface
    const dayIndex = weekDays.value.findIndex(day => day.date === selectedDate.value);
    if (dayIndex !== -1) {
      weekDays.value[dayIndex].meals.push({
        id: Date.now(), // Temporaire jusqu'à la réponse de l'API
        date: selectedDate.value,
        recipe
      });
    }
    
    showRecipeSelector.value = false;
  } catch (error) {
    console.error('Erreur lors de l\'ajout au planning', error);
  }
};

const removeMeal = async (meal: Meal): Promise<void> => {
  try {
    // Appel API pour supprimer
    await recipeService.removeMealPlan(meal.id);
    
    // Mettre à jour l'interface
    const dayIndex = weekDays.value.findIndex(day => day.date === meal.date);
    if (dayIndex !== -1) {
      const mealIndex = weekDays.value[dayIndex].meals.findIndex(m => m.id === meal.id);
      if (mealIndex !== -1) {
        weekDays.value[dayIndex].meals.splice(mealIndex, 1);
      }
    }
  } catch (error) {
    console.error('Erreur lors de la suppression du repas', error);
  }
};

const updateMealPlan = async (): Promise<void> => {
  // Mettre à jour le backend après un drag & drop
  try {
    // Vous pouvez implémenter la logique de mise à jour ici
    // Exemple: await recipeService.updateMealPlan(weekDays.value);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du plan', error);
  }
};
</script>