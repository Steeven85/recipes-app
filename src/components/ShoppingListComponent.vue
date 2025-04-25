<template>
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-4xl mx-auto px-4 sm:px-6">
        <!-- Header with card effect -->
        <div class="mb-6 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div class="px-4 py-5 sm:px-6 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
              <h1 class="text-2xl font-bold">
                Liste de Courses
              </h1>
              
              <!-- Mobile actions -->
              <div class="mt-4 md:mt-0 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                <div class="flex space-x-2">
                  <button 
                    class="px-3 py-1.5 bg-white text-gray-700 border border-gray-300 rounded-md text-sm font-medium shadow-sm hover:bg-gray-50 transition duration-150 ease-in-out flex items-center"
                    @click="toggleCompletedItems"
                  >
                    <span>{{ showCompleted ? 'Masquer cochés' : 'Tout afficher' }}</span>
                  </button>
                  <button 
                    v-if="items.length > 0"
                    class="px-3 py-1.5 bg-red-500 rounded-md text-sm font-medium shadow-sm hover:bg-red-600 transition duration-150 ease-in-out flex items-center"
                    @click="showClearConfirmation = true"
                  >
                    Purger
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Main content card -->
        <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <!-- Loading state -->
          <div
            v-if="loading"
            class="flex flex-col items-center justify-center py-16"
          >
            <div class="animate-spin h-12 w-12 text-emerald-500 mb-4">
              <!-- Loading spinner -->
            </div>
            <p class="text-gray-500 text-lg">Chargement de votre liste...</p>
          </div>
          
          <!-- Error state -->
          <div
            v-else-if="error"
            class="flex flex-col items-center justify-center py-16 px-4"
          >
            <div class="text-red-500 mb-4 bg-red-50 p-3 rounded-full">
              <!-- Error icon -->
            </div>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">
              Erreur lors du chargement
            </h2>
            <p class="text-gray-500 mb-6 text-center">
              {{ errorMessage }}
            </p>
            <button 
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              @click="loadShoppingList"
            >
              <span class="flex items-center">
                Réessayer
              </span>
            </button>
          </div>
          
          <!-- Empty state -->
          <div
            v-else-if="items.length === 0"
            class="flex flex-col items-center justify-center py-16 px-4"
          >
            <div class="bg-emerald-50 p-3 rounded-full text-emerald-500 mb-6">
              <!-- Empty icon -->
            </div>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Votre liste est vide</h2>
            <p class="text-gray-500 mb-6 text-center">
              Ajoutez des articles manuellement ou générez une liste depuis votre planning de repas.
            </p>
            <button 
              class="px-6 py-3 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 shadow-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              @click="generateShoppingList"
            >
              <span class="flex items-center">
                Générer depuis le planning
              </span>
            </button>
          </div>
          
          <!-- Content - View by category -->
          <div
            v-else
            class="px-4 py-5 sm:p-6 divide-y divide-gray-100"
          >
            <div 
              v-for="(groupItems, category) in groupedItems"
              :key="category"
              class="pt-6 first:pt-0"
            >
              <!-- Category header -->
              <div class="flex items-center mb-3">
                <h3 class="font-semibold text-lg text-gray-800">
                  {{ category }}
                  <span class="ml-2 text-xs font-normal text-gray-500">
                    {{ filteredItemsByCategory(category).length }} articles
                  </span>
                </h3>
              </div>
              
              <!-- Category items -->
              <ul class="divide-y divide-gray-100">
                <li
                  v-for="item in filteredItemsByCategory(category)"
                  :key="item.id"
                  class="py-3 group"
                >
                  <div class="flex items-center group">
                    <div class="relative inline-block">
                      <input 
                        type="checkbox" 
                        :checked="item.checked"
                        class="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 transition-colors duration-150"
                      >
                      <div 
                        @click="toggleItem(item)"
                        class="absolute inset-0 cursor-pointer z-10"
                      ></div>
                    </div>
                    
                    <div class="ml-3 flex-grow">
                      <p 
                        :class="{'line-through text-gray-400': item.checked, 'text-gray-800': !item.checked}"
                        class="font-medium transition-colors duration-200"
                      >
                        {{ getFoodName(item.food) || item.name }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
                      </p>
                    </div>
                    
                    <button
                      class="text-gray-400 hover:text-red-500 transition-colors duration-150 opacity-0 group-hover:opacity-100"
                      @click="removeItem(item.id)"
                      aria-label="Supprimer l'article"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          <!-- Add item form -->
          <div class="bg-gray-50 px-4 py-5 sm:p-6 border-t border-gray-100">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              Ajouter un article
            </h3>
            
            <form
              class="space-y-3"
              @submit.prevent="addNewItem"
            >
              <div class="relative">
                <label for="food-select" class="block text-sm font-medium text-gray-700 mb-1">Aliment</label>
                <select 
                  id="food-select"
                  v-model="newItem.foodId"
                  class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                  required
                >
                  <option value="" disabled>Sélectionnez un aliment</option>
                  <optgroup 
                    v-for="(foods, label) in groupedFoods" 
                    :key="label" 
                    :label="label"
                  >
                    <option 
                      v-for="food in foods" 
                      :key="food.id" 
                      :value="food.id"
                    >
                      {{ food.name }}
                    </option>
                  </optgroup>
                </select>
              </div>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="relative">
                  <label for="quantity-input" class="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                  <input 
                    id="quantity-input"
                    v-model.number="newItem.quantity"
                    type="number"
                    placeholder="Quantité"
                    class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    min="0.01"
                    step="0.01"
                    required
                  >
                </div>
                
                <div class="relative">
                  <label for="unit-select" class="block text-sm font-medium text-gray-700 mb-1">Unité</label>
                  <select 
                    id="unit-select"
                    v-model="newItem.unitId"
                    class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                    required
                  >
                    <option value="" disabled>Sélectionnez une unité</option>
                    <option 
                      v-for="unit in units" 
                      :key="unit.id" 
                      :value="unit.id"
                    >
                      {{ unit.name }} {{ unit.abbreviation ? `(${unit.abbreviation})` : '' }}
                    </option>
                  </select>
                </div>
              </div>
              
              <div class="relative">
                <label for="note-input" class="block text-sm font-medium text-gray-700 mb-1">Note (optionnel)</label>
                <input 
                  id="note-input"
                  v-model="newItem.note"
                  type="text"
                  placeholder="Ex: frais, bio, etc."
                  class="block w-full rounded-md border-gray-300 focus:ring-emerald-500 focus:border-emerald-500 shadow-sm"
                >
              </div>
              
              <button 
                type="submit"
                class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition duration-150 ease-in-out"
              >
                Ajouter à la liste
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed, onMounted } from 'vue';
  import { shoppingService, recipeService, referenceService } from '@/services/api';
  import axiosInstance from '@/services/AxiosInstance';
  
  export default {
    name: 'ShoppingList',
    setup() {
      // ======== État ========
      const items = ref([]);
      const foods = ref([]);
      const units = ref([]);
      const mainListId = ref(null);
      const loading = ref(true);
      const error = ref(false);
      const errorMessage = ref('');
      const showCompleted = ref(true);
      const showClearConfirmation = ref(false);
      
      // Formulaire pour nouvel article
      const newItem = ref({
        foodId: '',
        quantity: 1,
        unitId: '',
        note: ''
      });
      
      // ======== Données calculées ========
      // Groupement des aliments par catégorie
      const groupedFoods = computed(() => {
        const grouped = {};
        
        foods.value.forEach(food => {
          const category = food.label?.name || 'Divers';
          
          if (!grouped[category]) {
            grouped[category] = [];
          }
          
          grouped[category].push(food);
        });
        
        return grouped;
      });
      
      // Groupement des articles par catégorie
      const groupedItems = computed(() => {
        const grouped = {};
        
        items.value.forEach(item => {
          // Déterminer la catégorie
          let category = 'Divers';
          
          if (item.label) {
            category = item.label.name;
          } else if (item.food && item.food.label) {
            category = item.food.label.name;
          }
          
          if (!grouped[category]) {
            grouped[category] = [];
          }
          
          grouped[category].push(item);
        });
        
        return grouped;
      });
      
      // ======== Fonctions de filtrage ========
      const filteredItemsByCategory = (category) => {
        if (showCompleted.value) {
          return groupedItems.value[category] || [];
        }
        return (groupedItems.value[category] || []).filter(item => !item.checked);
      };
      
      // ======== Fonctions utilitaires ========
      const getFoodName = (food) => {
        if (!food) return 'Article sans nom';
        
        if (typeof food === 'string') {
          if (food.includes('"name"')) {
            const match = food.match(/"name"\s*:\s*"([^"]+)"/);
            if (match && match[1]) return match[1];
          }
          return food;
        }
        
        if (typeof food === 'object' && food !== null) {
          return food.name || 'Article sans nom';
        }
        
        return 'Article sans nom';
      };
      
      const getUnitDisplay = (unit) => {
        if (!unit) return '';
        
        if (typeof unit === 'string') {
          return unit;
        }
        
        if (typeof unit === 'object' && unit !== null) {
          return unit.abbreviation || unit.name || '';
        }
        
        return '';
      };
      
      // ======== Fonctions d'API ========
      const loadShoppingList = async () => {
        loading.value = true;
        error.value = false;
        errorMessage.value = '';
        
        try {
          // 1. Récupérer la liste principale
          const listResponse = await shoppingService.getMainShoppingList();
          const mainList = listResponse.data.items?.[0];
          
          if (!mainList || !mainList.id) {
            throw new Error('Aucune liste de courses trouvée');
          }
          
          // Stocker l'ID de la liste principale
          mainListId.value = mainList.id;
          
          // 2. Récupérer les articles de la liste
          const response = await shoppingService.getShoppingList(mainList.id);
          
          // Extraire les données 
          let itemsData = [];
          
          if (Array.isArray(response.data)) {
            itemsData = response.data;
          } else if (response.data && typeof response.data === 'object') {
            if (response.data.listItems) {
              itemsData = response.data.listItems;
            } else if (Array.isArray(response.data.items)) {
              itemsData = response.data.items;
            } else if (response.data.data && Array.isArray(response.data.data.items)) {
              itemsData = response.data.data.items;
            }
          }
          
          // Stocker les articles
          items.value = itemsData;
          
          // 3. Charger la liste des aliments
          await loadFoods();
          
          // 4. Charger la liste des unités
          await loadUnits();
          
        } catch (error) {
          console.error('Erreur lors du chargement de la liste de courses', error);
          error.value = true;
          errorMessage.value = error.message || 'Impossible de charger la liste de courses.';
        } finally {
          loading.value = false;
        }
      };
      
      const loadFoods = async () => {
        try {
          const response = await referenceService.getFoods({ perPage: 500 });
          
          if (response.data && response.data.items) {
            foods.value = response.data.items;
          }
        } catch (error) {
          console.error('Erreur lors du chargement des aliments', error);
        }
      };
      
      const loadUnits = async () => {
        try {
          const response = await referenceService.getUnits();
          
          if (response.data && Array.isArray(response.data.items)) {
            units.value = response.data.items;
          } else if (Array.isArray(response.data)) {
            units.value = response.data;
          }
        } catch (error) {
          console.error('Erreur lors du chargement des unités', error);
        }
      };
      
      // ======== Fonctions d'interaction ========
      const toggleItem = async (item) => {
        try {
          // Mise à jour optimiste de l'interface
          const previousState = item.checked;
          item.checked = !item.checked;
          
          try {
            // Créer une copie complète de l'article avec l'état mis à jour
            const updatedItem = {
              ...item,
              checked: item.checked
            };
            
            // S'assurer que shoppingListId est présent
            if (!updatedItem.shoppingListId && mainListId.value) {
              updatedItem.shoppingListId = mainListId.value;
            }
            
            // Envoyer l'article mis à jour à l'API
            await axiosInstance.put(`/households/shopping/items`, [updatedItem]);
            
          } catch (apiError) {
            // Retour à l'état précédent en cas d'erreur
            console.error('Erreur lors de la mise à jour de l\'article', apiError);
            item.checked = previousState;
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour de l\'article', error);
        }
      };
      
      const removeItem = async (itemId) => {
        try {
          // Mise à jour optimiste de l'interface
          const removedItem = items.value.find(item => item.id === itemId);
          const removedIndex = items.value.findIndex(item => item.id === itemId);
          items.value = items.value.filter(item => item.id !== itemId);
          
          try {
            // Utiliser l'endpoint spécifique
            await axiosInstance.delete(`/households/shopping/items/${itemId}`);
          } catch (apiError) {
            // Retour à l'état précédent en cas d'erreur
            console.error('Erreur lors de la suppression de l\'article', apiError);
            if (removedItem && removedIndex !== -1) {
              items.value.splice(removedIndex, 0, removedItem);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la suppression de l\'article', error);
        }
      };
      
      const addNewItem = async () => {
        if (!newItem.value.foodId || !newItem.value.unitId) return;
        
        try {
          // Vérifier qu'on a bien l'ID de la liste
          if (!mainListId.value) {
            const listResponse = await shoppingService.getMainShoppingList();
            mainListId.value = listResponse.data.items?.[0]?.id;
          }
          
          // Récupérer l'aliment et l'unité sélectionnés
          const selectedFood = foods.value.find(f => f.id === newItem.value.foodId);
          const selectedUnit = units.value.find(u => u.id === newItem.value.unitId);
          
          if (!selectedFood || !selectedUnit) {
            throw new Error('Aliment ou unité invalide');
          }
          
          // Construire le payload au format attendu
          const newItemPayload = {
            id: "", // L'API générera un ID
            shoppingListId: mainListId.value,
            checked: false,
            position: 0, // L'API ajustera ça
            isFood: true,
            quantity: newItem.value.quantity,
            note: newItem.value.note || "",
            labelId: selectedFood.labelId || "",
            unitId: selectedUnit.id,
            foodId: selectedFood.id,
            unit: selectedUnit,
            food: selectedFood,
            label: selectedFood.label
          };
          
          // Appeler l'API avec le bon endpoint et format
          const response = await axiosInstance.post(`/households/shopping/items/create-bulk`, [newItemPayload]);
          
          // Mettre à jour la liste localement
          if (response.data) {
            // Si la réponse contient l'item créé, l'ajouter à la liste
            if (Array.isArray(response.data) && response.data[0]) {
              items.value.push(response.data[0]);
            } else {
              // Sinon recharger toute la liste
              await loadShoppingList();
            }
          }
          
          // Réinitialiser le formulaire
          newItem.value = {
            foodId: '',
            quantity: 1,
            unitId: '',
            note: ''
          };
          
        } catch (error) {
          console.error('Erreur lors de l\'ajout de l\'article', error);
          alert('Erreur lors de l\'ajout de l\'article');
        }
      };
      
      const toggleCompletedItems = () => {
        showCompleted.value = !showCompleted.value;
      };
      
      const generateShoppingList = async () => {
        loading.value = true;
        
        try {
          // Récupérer les dates pour le planning
          const today = new Date();
          const startDate = formatDate(today);
          const endDate = new Date(today);
          endDate.setDate(today.getDate() + 7);
          const formattedEndDate = formatDate(endDate);
          
          // Générer la liste
          await shoppingService.generateShoppingListFromMealPlan(startDate, formattedEndDate);
          
          // Recharger la liste mise à jour
          await loadShoppingList();
          
        } catch (error) {
          console.error('Erreur lors de la génération de la liste', error);
          error.value = true;
          errorMessage.value = error.message || 'Impossible de générer la liste de courses.';
        } finally {
          loading.value = false;
        }
      };
      
      // Utilitaire pour formater la date
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      // Initialisation
      onMounted(async () => {
        await loadShoppingList();
      });
      
      // Exposer les données et méthodes au template
      return {
        items,
        foods,
        units,
        loading,
        error,
        errorMessage,
        showCompleted,
        newItem,
        showClearConfirmation,
        groupedFoods,
        groupedItems,
        filteredItemsByCategory,
        getFoodName,
        getUnitDisplay,
        toggleItem,
        removeItem,
        addNewItem,
        toggleCompletedItems,
        loadShoppingList,
        generateShoppingList
      };
    }
  }
  </script>
  
  <style scoped>
  /* Animations pour les transitions de liste */
  .list-enter-active,
  .list-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  .list-enter-from,
  .list-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }
  
  .list-item-enter-active, 
  .list-item-leave-active {
    transition: all 0.3s ease;
  }
  .list-item-enter-from {
    opacity: 0;
    transform: translateX(-20px);
  }
  .list-item-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
  </style>