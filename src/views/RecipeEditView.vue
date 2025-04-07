<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <div v-if="loading" class="text-center py-12">
      <svg class="animate-spin h-12 w-12 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <div v-else>
      <h1 class="text-2xl font-bold mb-6">Modifier la recette</h1>

      <form @submit.prevent="handleSubmit">
        <!-- Nom -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Nom</label>
          <input
            v-model="form.name"
            type="text"
            disabled
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Description -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            v-model="form.description"
            rows="3"
            class="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          ></textarea>
        </div>

        <!-- Mode d'édition -->
        <div class="mb-6">
          <div class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700">Mode d'édition :</span>
            <button
              type="button"
              @click="editMode = 'simple'"
              :class="[
                'px-3 py-1 text-sm rounded',
                editMode === 'simple' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Simplifié
            </button>
            <button
              type="button"
              @click="editMode = 'advanced'"
              :class="[
                'px-3 py-1 text-sm rounded',
                editMode === 'advanced' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              Avancé
            </button>
          </div>
        </div>

        <!-- Mode Simplifié pour recettes importées -->
        <div v-if="editMode === 'simple'">
          <!-- Ingrédients Simples (texte brut) -->
          <div class="mb-6">
            <h2 class="text-xl font-semibold mb-4">Ingrédients</h2>
            <div 
              v-for="(ingredient, index) in simpleIngredients"
              :key="`simple-ing-${index}`"
              class="mb-3 flex items-center"
            >
              <input
                v-model="simpleIngredients[index]"
                type="text"
                placeholder="Par exemple: 100g de farine"
                class="flex-grow border rounded-lg px-4 py-2"
              />
              <button
                type="button"
                @click="removeSimpleIngredient(index)"
                class="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
            <button
              @click="addSimpleIngredient"
              type="button"
              class="mt-2 text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter un ingrédient
            </button>
          </div>
        </div>

        <!-- Mode Avancé -->
        <div v-else>
          <!-- Ingrédients Éditables (structurés) -->
          <div class="mb-6">
            <h2 class="text-xl font-semibold mb-4">Ingrédients</h2>
            <div 
              v-for="(ingredient, index) in form.recipeIngredient"
              :key="`adv-ing-${index}`"
              class="mb-3 p-3 bg-gray-50 rounded-lg"
            >
              <div class="grid grid-cols-12 gap-3">
                <!-- Quantité -->
                <input
                  v-model="ingredient.quantity"
                  type="number"
                  placeholder="Qty"
                  class="col-span-2 border rounded p-2"
                />
                <!-- Unité -->
                <input
                  :value="getUnitName(ingredient)"
                  @input="updateUnitName(index, $event.target.value)"
                  placeholder="Unité"
                  class="col-span-3 border rounded p-2"
                />
                <!-- Nom de l'ingrédient -->
                <input
                  :value="getFoodName(ingredient)"
                  @input="updateFoodName(index, $event.target.value)"
                  placeholder="Ingrédient"
                  class="col-span-5 border rounded p-2"
                />
                <!-- Supprimer -->
                <button
                  type="button"
                  @click="removeIngredient(index)"
                  class="col-span-2 text-red-500 hover:text-red-700"
                >
                  × Supprimer
                </button>
              </div>
            </div>
            <button
              @click="addIngredient"
              type="button"
              class="mt-2 text-indigo-600 hover:text-indigo-800"
            >
              + Ajouter un ingrédient
            </button>
          </div>
        </div>

        <!-- Instructions Éditables -->
        <div class="mb-6">
          <h2 class="text-xl font-semibold mb-4">Instructions</h2>
          <div
            v-for="(instruction, index) in form.recipeInstructions"
            :key="index"
            class="mb-3"
          >
            <div class="flex items-center gap-2">
              <span class="font-medium">Étape {{ index + 1 }}</span>
              <button
                type="button"
                @click="removeInstruction(index)"
                class="text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
            <textarea
              v-model="instruction.text"
              class="w-full border rounded-lg p-2 mt-1"
              rows="2"
            ></textarea>
          </div>
          <button
            @click="addInstruction"
            type="button"
            class="mt-2 text-indigo-600 hover:text-indigo-800"
          >
            + Ajouter une étape
          </button>
        </div>

        <!-- Boutons de formulaire -->
        <div class="flex space-x-4">
          <button
            type="button"
            @click="cancelEdit"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Annuler
          </button>
          <button
            type="submit"
            class="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Sauvegarder
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { recipeService } from '../services/api';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const editMode = ref('simple'); // 'simple' ou 'advanced'
    const simpleIngredients = ref([]);
    const isImportedRecipe = ref(false);
    
    const form = ref({
      name: '',
      description: '',
      recipeIngredient: [],
      recipeInstructions: []
    });

    // Helper functions to get names safely
    const getUnitName = (ingredient) => {
      if (ingredient.unit && ingredient.unit.name) {
        return ingredient.unit.name;
      }
      return ingredient.unitName || '';
    };

    const getFoodName = (ingredient) => {
      if (ingredient.food && ingredient.food.name) {
        return ingredient.food.name;
      }
      return ingredient.foodName || '';
    };

    // Normalize recipe data - ensure all required objects and arrays exist
    const normalizeRecipeData = (data) => {
      // Vérifier si la recette semble être importée
      if (data.orgURL) {
        isImportedRecipe.value = true;
        editMode.value = 'simple'; // Mode simple par défaut pour les recettes importées
      }
      
      // Ensure all required fields exist
      const normalized = {
        ...data,
        name: data.name || '',
        description: data.description || '',
        recipeIngredient: Array.isArray(data.recipeIngredient) ? [...data.recipeIngredient] : [],
        recipeInstructions: Array.isArray(data.recipeInstructions) ? [...data.recipeInstructions] : []
      };

      // Pour le mode simplifié, extraire les ingrédients sous forme de chaînes
      simpleIngredients.value = [];
      
      if (normalized.recipeIngredient.length > 0) {
        normalized.recipeIngredient.forEach(ingredient => {
          // Si c'est déjà une chaîne
          if (typeof ingredient === 'string') {
            simpleIngredients.value.push(ingredient);
          } else {
            // Sinon, essayer de composer une chaîne à partir de l'objet
            const quantity = ingredient.quantity || '';
            const unit = (ingredient.unit?.name || ingredient.unitName || '').trim();
            const food = (ingredient.food?.name || ingredient.foodName || '').trim();
            const note = (ingredient.note || '').trim();
            
            // Composer la chaîne
            let ingredientText = '';
            if (quantity) ingredientText += quantity + ' ';
            if (unit) ingredientText += unit + ' ';
            if (food) ingredientText += food;
            if (note) ingredientText += ' (' + note + ')';
            
            if (ingredientText.trim()) {
              simpleIngredients.value.push(ingredientText.trim());
            }
          }
        });
      }
      
      // Si aucun ingrédient n'a été extrait, ajouter quelques champs vides
      if (simpleIngredients.value.length === 0) {
        simpleIngredients.value.push('');
        simpleIngredients.value.push('');
      }

      // Pour chaque ingrédient, s'assurer que unit et food sont des objets
      normalized.recipeIngredient = normalized.recipeIngredient.map(ingredient => {
        // Si l'ingrédient est une simple chaîne, la convertir en objet
        if (typeof ingredient === 'string') {
          return {
            foodName: ingredient,
            unitName: '',
            quantity: null
          };
        }

        // Sinon, normaliser la structure d'objet existante
        return {
          ...ingredient,
          quantity: ingredient.quantity || null,
          unit: ingredient.unit || { name: '' },
          food: ingredient.food || { name: '' },
          // Ajouter des champs plats pour faciliter la manipulation
          unitName: ingredient.unit?.name || ingredient.unitName || '',
          foodName: ingredient.food?.name || ingredient.foodName || ''
        };
      });

      // Pour chaque instruction, s'assurer qu'il y a un champ text
      normalized.recipeInstructions = normalized.recipeInstructions.map(instruction => {
        // Si l'instruction est une simple chaîne, la convertir en objet
        if (typeof instruction === 'string') {
          return { text: instruction };
        }

        // Sinon, normaliser la structure d'objet existante
        return {
          ...instruction,
          text: instruction.text || ''
        };
      });

      return normalized;
    };

    // Charger la recette
    onMounted(async () => {
      try {
        console.log("Chargement de la recette avec slug:", route.params.slug);
        const response = await recipeService.getBySlug(route.params.slug);
        console.log("Données reçues:", response.data);

        // Normaliser les données avant de les assigner
        form.value = normalizeRecipeData(response.data);
        console.log("Données normalisées:", form.value);
      } catch (error) {
        console.error('Erreur chargement recette', error);
      } finally {
        loading.value = false;
      }
    });

    // Gestion des ingrédients en mode simple
    const addSimpleIngredient = () => {
      simpleIngredients.value.push('');
    };

    const removeSimpleIngredient = (index) => {
      simpleIngredients.value.splice(index, 1);
      // Toujours garder au moins un ingrédient
      if (simpleIngredients.value.length === 0) {
        simpleIngredients.value.push('');
      }
    };

    // Gestion des ingrédients en mode avancé
    const addIngredient = () => {
      form.value.recipeIngredient.push({
        quantity: null,
        unit: { name: '' },
        food: { name: '' },
        unitName: '',
        foodName: ''
      });
    };

    const removeIngredient = (index) => {
      form.value.recipeIngredient.splice(index, 1);
    };

    // Fonctions pour mettre à jour les noms d'unité et d'aliment
    const updateUnitName = (index, value) => {
      const ingredient = form.value.recipeIngredient[index];
      ingredient.unitName = value;
      
      if (!ingredient.unit) {
        ingredient.unit = { name: value };
      } else {
        ingredient.unit.name = value;
      }
    };

    const updateFoodName = (index, value) => {
      const ingredient = form.value.recipeIngredient[index];
      ingredient.foodName = value;
      
      if (!ingredient.food) {
        ingredient.food = { name: value };
      } else {
        ingredient.food.name = value;
      }
    };

    // Préparer les données pour la soumission
    const prepareSubmissionData = () => {
      // Récupère une référence à la recette originale (à ajouter dans le composant)
      const originalName = originalRecipe.value?.name || '';
      
      const submissionData = { ...form.value };
      
      // S'assurer que le nom n'est pas modifié
      if (form.value.name !== originalName) {
        submissionData.name = originalName; // Restaurer le nom original
      }
      // Si en mode simplifié, utiliser les ingrédients textuels
      if (editMode.value === 'simple') {
        submissionData.recipeIngredient = simpleIngredients.value.filter(ing => ing.trim() !== '');
      } else {
        // Transformer les ingrédients au format attendu par l'API
        submissionData.recipeIngredient = form.value.recipeIngredient.map(ingredient => {
          return {
            quantity: ingredient.quantity,
            unit: ingredient.unit || { name: ingredient.unitName || '' },
            food: ingredient.food || { name: ingredient.foodName || '' }
          };
        });
      }

      return submissionData;
    };

    // Gestion des instructions
    const addInstruction = () => {
      form.value.recipeInstructions.push({ text: '' });
    };

    const removeInstruction = (index) => {
      form.value.recipeInstructions.splice(index, 1);
    };

    // Annuler et revenir à la vue de la recette
    const cancelEdit = () => {
      router.push(`/recipes/${route.params.slug}`);
    };

    // Soumission du formulaire
    const handleSubmit = async () => {
      try {
        const dataToSubmit = prepareSubmissionData();
        console.log("Données à soumettre:", dataToSubmit);
        
        await recipeService.updateRecipe(form.value.id, dataToSubmit);
        router.push(`/recipes/${route.params.slug}`);
      } catch (error) {
        console.error('Erreur mise à jour', error);
        alert("Échec de la mise à jour. Veuillez réessayer ou vérifier les données saisies.");
      }
    };

    return {
      loading,
      form,
      editMode,
      simpleIngredients,
      isImportedRecipe,
      getUnitName,
      getFoodName,
      addIngredient,
      removeIngredient,
      addSimpleIngredient,
      removeSimpleIngredient,
      updateUnitName,
      updateFoodName,
      addInstruction,
      removeInstruction,
      cancelEdit,
      handleSubmit
    };
  }
};
</script>