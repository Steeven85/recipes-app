<!-- src/components/ShoppingList.vue -->
<template>
  <div class="bg-white rounded-lg shadow p-4">
    <h2 class="text-xl font-semibold mb-4">Liste de courses</h2>
    
    <div class="mb-4 flex gap-2">
      <button 
        @click="generateFromMealPlan"
        class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
      >
        Générer depuis le planning
      </button>
      
      <button 
        @click="loadShoppingList"
        class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300"
      >
        Actualiser
      </button>
    </div>
    
    <div v-if="loading" class="text-center py-8">
      <svg class="animate-spin h-8 w-8 text-emerald-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <div v-else>
      <div class="mb-4 flex items-center">
        <input 
          type="checkbox" 
          v-model="hideCheckedItems"
          id="hide-checked" 
          class="h-4 w-4 text-emerald-600 rounded"
        />
        <label for="hide-checked" class="ml-2 text-gray-700">Masquer complétés</label>
      </div>
      
      <div v-for="(items, category) in groupedItems" :key="category" class="mb-6">
        <h3 class="font-medium text-lg mb-2 text-gray-700 border-b pb-1">{{ category }}</h3>
        
        <div v-for="item in items" :key="item.id" class="flex items-center py-2 border-b" v-show="!hideCheckedItems || !item.checked">
          <input 
            type="checkbox" 
            :checked="item.checked"
            @change="toggleItem(item)"
            class="h-5 w-5 text-emerald-600 rounded"
          />
          
          <div class="ml-3 flex-grow">
            <p :class="{'line-through text-gray-400': item.checked}" class="font-medium">
              {{ getFoodName(item.food) }}
            </p>
            <p class="text-sm text-gray-500">
              {{ item.quantity }} {{ getUnitDisplay(item.unit) }}
            </p>
          </div>
          
          <button @click="removeItem(item.id)" class="text-red-500">
            <TrashIcon class="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <!-- Afficher un message si la liste est vide -->
      <div v-if="items.length === 0" class="text-center py-8 text-gray-500">
        Votre liste de courses est vide.
      </div>
      
      <div class="mt-4">
        <form @submit.prevent="addNewItem" class="flex gap-2">
          <input 
            v-model="newItem.name"
            type="text"
            placeholder="Nouvel article"
            class="flex-grow border rounded-lg px-3 py-2"
            required
          />
          <input 
            v-model.number="newItem.quantity"
            type="number"
            placeholder="Qté"
            class="w-20 border rounded-lg px-3 py-2"
            min="1"
            required
          />
          <select 
            v-model="newItem.unit"
            class="border rounded-lg px-3 py-2"
          >
            <option value="unité">unité</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
          </select>
          <button 
            type="submit"
            class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
          >
            Ajouter
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { TrashIcon } from '@heroicons/vue/outline';
import { shoppingService } from '../services/api';

const items = ref([]);
const loading = ref(true);
const hideCheckedItems = ref(false);

const newItem = ref({
  name: '',
  quantity: 1,
  unit: 'unité',
  category: 'Divers'
});

// Catégories prédéfinies pour organiser les articles
const categories = {
  'Fruits et Légumes': ['pomme', 'banane', 'carotte', 'tomate', 'salade', 'patate', 'courgette', 'aubergine', 'brocoli', 'betterave', 'avocat'],
  'Viandes et Poissons': ['poulet', 'boeuf', 'saumon', 'thon', 'porc', 'dinde', 'escalo', 'chair', 'lardon'],
  'Produits Laitiers': ['lait', 'fromage', 'yaourt', 'beurre', 'crème', 'feta', 'chèvre', 'vache qui rit'],
  'Épicerie': ['riz', 'pâtes', 'farine', 'sucre', 'sel', 'huile', 'spaghetti'],
  'Boissons': ['eau', 'jus', 'vin', 'bière', 'soda'],
  'Divers': []
};

onMounted(async () => {
  await loadShoppingList();
});

// Fonction pour extraire le nom d'un aliment
const getFoodName = (food) => {
  if (!food) return 'Article sans nom';
  
  if (typeof food === 'string') {
    if (food.includes('"name"')) {
      const match = food.match(/"name"\s*:\s*"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return food;
  }
  
  if (typeof food === 'object' && food !== null) {
    return food.name || 'Article sans nom';
  }
  
  return 'Article sans nom';
};

// Fonction pour extraire le nom d'une unité
const getUnitDisplay = (unit) => {
  if (!unit) return 'unité';
  
  if (typeof unit === 'string') {
    if (unit.includes('"name"')) {
      const match = unit.match(/"name"\s*:\s*"([^"]+)"/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return unit;
  }
  
  if (typeof unit === 'object' && unit !== null) {
    return unit.name || 'unité';
  }
  
  return 'unité';
};

const loadShoppingList = async () => {
  loading.value = true;
  try {
    const response = await shoppingService.getShoppingList();
    
    // Traiter les données selon la structure de réponse
    if (response.data && response.data.listItems) {
      items.value = response.data.listItems;
    } else if (Array.isArray(response.data)) {
      items.value = response.data;
    } else {
      console.error('Format de réponse inattendu:', response);
      items.value = [];
    }
    
  } catch (error) {
    console.error('Erreur lors du chargement de la liste de courses', error);
    items.value = [];
  } finally {
    loading.value = false;
  }
};

const determineCategory = (item) => {
  // Utiliser le nom de l'aliment pour la catégorisation
  const foodName = getFoodName(item.food).toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => foodName.includes(keyword))) {
      return category;
    }
  }
  
  return 'Divers';
};

const groupedItems = computed(() => {
  const grouped = {};
  
  // Initialiser toutes les catégories
  Object.keys(categories).forEach(category => {
    grouped[category] = [];
  });
  
  // Grouper les items par catégorie
  items.value.forEach(item => {
    const category = determineCategory(item);
    
    if (grouped[category]) {
      grouped[category].push(item);
    } else {
      grouped['Divers'].push(item);
    }
  });
  
  // Supprimer les catégories vides
  Object.keys(grouped).forEach(category => {
    if (grouped[category].length === 0) {
      delete grouped[category];
    }
  });
  
  return grouped;
});

const toggleItem = async (item) => {
  try {
    await shoppingService.updateShoppingItem(item.id, { checked: !item.checked });
    item.checked = !item.checked;
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'article', error);
  }
};

const removeItem = async (itemId) => {
  try {
    await shoppingService.removeShoppingItem(itemId);
    items.value = items.value.filter(item => item.id !== itemId);
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'article', error);
  }
};

const addNewItem = async () => {
  try {
    const itemData = {
      name: newItem.value.name,
      quantity: newItem.value.quantity,
      unit: newItem.value.unit
    };
    
    const response = await shoppingService.addToShoppingList(itemData);
    
    if (response.data) {
      items.value.push(response.data);
    }
    
    newItem.value = { 
      name: '', 
      quantity: 1, 
      unit: 'unité', 
      category: 'Divers' 
    };
  } catch (error) {
    console.error('Erreur lors de l\'ajout d\'un nouvel article', error);
  }
};

const generateFromMealPlan = async () => {
  loading.value = true;
  try {
    const today = new Date();
    const startDate = formatDate(today);
    
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7);
    const formattedEndDate = formatDate(endDate);
    
    await shoppingService.generateShoppingListFromMealPlan(startDate, formattedEndDate);
    
    await loadShoppingList();
  } catch (error) {
    console.error('Erreur lors de la génération de la liste de courses', error);
  } finally {
    loading.value = false;
  }
};

// Utilitaire pour formater la date en YYYY-MM-DD
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
</script>