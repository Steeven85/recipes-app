<template>
    <div class="p-4">
      <h1 class="text-3xl font-bold mb-6 text-center">Administration des Données</h1>
      
      <!-- Navigation par onglets -->
      <div class="flex flex-wrap justify-center mb-6">
        <button 
          v-for="tab in tabs" 
          :key="tab.id" 
          @click="activeTab = tab.id" 
          :class="['px-4 py-2 m-1 rounded-full focus:outline-none', activeTab === tab.id ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-800']">
          {{ tab.name }}
        </button>
      </div>
  
      <!-- Contenu des onglets -->
      <div>
        <!-- Onglet Ingrédients -->
        <div v-if="activeTab === 'ingredients'">
          <div class="mb-4 flex flex-col sm:flex-row justify-center gap-4">
            <input 
              v-model="ingredientSearch" 
              type="text" 
              placeholder="Recherche d'ingrédients" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="loadIngredients" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Recharger
            </button>
          </div>
          <div class="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              v-model="newIngredient" 
              type="text" 
              placeholder="Nom de l'ingrédient" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="createIngredient" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Créer l'ingrédient
            </button>
          </div>
          <div class="overflow-x-auto">
            <!-- Tableau pour desktop -->
            <table class="min-w-full hidden sm:table">
              <thead>
                <tr class="bg-gray-100">
                  <th class="px-4 py-2 border">ID</th>
                  <th class="px-4 py-2 border">Nom</th>
                  <th class="px-4 py-2 border">Pluriel</th>
                  <th class="px-4 py-2 border">Description</th>
                  <th class="px-4 py-2 border">Étiquette</th>
                  <th class="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in filteredIngredients" :key="item.id" class="hover:bg-gray-50">
                  <td class="px-4 py-2 border">{{ item.id }}</td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingIngredientId === item.id">
                      <input v-model="editedIngredient.name" class="border p-1 rounded w-full" />
                    </div>
                    <div v-else>
                      {{ item.name }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingIngredientId === item.id">
                      <input v-model="editedIngredient.pluralName" class="border p-1 rounded w-full" placeholder="Pluriel"/>
                    </div>
                    <div v-else>
                      {{ item.pluralName || '-' }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingIngredientId === item.id">
                      <input v-model="editedIngredient.description" class="border p-1 rounded w-full" placeholder="Description"/>
                    </div>
                    <div v-else>
                      {{ item.description || '-' }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <!-- Ici, pour simplifier, on affiche l'étiquette sans édition inline -->
                    {{ item.label ? item.label.name : '-' }}
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingIngredientId === item.id">
                      <button @click="saveEditingIngredient" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Sauvegarder</button>
                      <button @click="cancelEditingIngredient" class="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                    </div>
                    <div v-else>
                      <button @click="startEditingIngredient(item)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Éditer</button>
                      <button @click="deleteIngredient(item.id)" class="bg-red-500 text-white px-3 py-1 rounded">Supprimer</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <!-- Cards pour mobile -->
            <div class="sm:hidden">
              <div v-for="item in filteredIngredients" :key="item.id" class="bg-white shadow rounded p-4 mb-3">
                <div class="text-sm font-medium text-gray-600">ID: {{ item.id }}</div>
                <div class="mt-1">
                  <span class="font-medium">Nom: </span>
                  <span v-if="editingIngredientId === item.id">
                    <input v-model="editedIngredient.name" class="border p-1 rounded w-full" />
                  </span>
                  <span v-else>{{ item.name }}</span>
                </div>
                <div class="mt-1">
                  <span class="font-medium">Pluriel: </span>
                  <span v-if="editingIngredientId === item.id">
                    <input v-model="editedIngredient.pluralName" class="border p-1 rounded w-full" placeholder="Pluriel"/>
                  </span>
                  <span v-else>{{ item.pluralName || '-' }}</span>
                </div>
                <div class="mt-1">
                  <span class="font-medium">Description: </span>
                  <span v-if="editingIngredientId === item.id">
                    <input v-model="editedIngredient.description" class="border p-1 rounded w-full" placeholder="Description"/>
                  </span>
                  <span v-else>{{ item.description || '-' }}</span>
                </div>
                <div class="mt-1">
                  <span class="font-medium">Étiquette: </span>
                  {{ item.label ? item.label.name : '-' }}
                </div>
                <div class="mt-2">
                  <div v-if="editingIngredientId === item.id">
                    <button @click="saveEditingIngredient" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Sauvegarder</button>
                    <button @click="cancelEditingIngredient" class="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                  </div>
                  <div v-else>
                    <button @click="startEditingIngredient(item)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Éditer</button>
                    <button @click="deleteIngredient(item.id)" class="bg-red-500 text-white px-3 py-1 rounded">Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Onglet Unités -->
        <div v-if="activeTab === 'units'">
          <div class="mb-4 flex flex-col sm:flex-row justify-center gap-4">
            <input 
              v-model="unitSearch" 
              type="text" 
              placeholder="Recherche d'unités" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="loadUnits" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Recharger
            </button>
          </div>
          <div class="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              v-model="newUnit" 
              type="text" 
              placeholder="Nom de l'unité" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="createUnit" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Créer l'unité
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full hidden sm:table">
              <thead>
                <tr class="bg-gray-100">
                  <th class="px-4 py-2 border">ID</th>
                  <th class="px-4 py-2 border">Nom</th>
                  <th class="px-4 py-2 border">Nom Pluriel</th>
                  <th class="px-4 py-2 border">Fraction</th>
                  <th class="px-4 py-2 border">Abréviation</th>
                  <th class="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="unit in filteredUnits" :key="unit.id" class="hover:bg-gray-50">
                  <td class="px-4 py-2 border">{{ unit.id }}</td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingUnitId === unit.id">
                      <input v-model="editedUnit.name" class="border p-1 rounded w-full" />
                    </div>
                    <div v-else>
                      {{ unit.name }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingUnitId === unit.id">
                      <input v-model="editedUnit.pluralName" class="border p-1 rounded w-full" placeholder="Nom pluriel" />
                    </div>
                    <div v-else>
                      {{ unit.pluralName || '-' }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingUnitId === unit.id">
                      <!-- Par exemple, on utilise une checkbox pour fraction -->
                      <input type="checkbox" v-model="editedUnit.fraction" class="h-5 w-5" />
                    </div>
                    <div v-else>
                      {{ unit.fraction ? 'Oui' : 'Non' }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingUnitId === unit.id">
                      <input v-model="editedUnit.abbreviation" class="border p-1 rounded w-full" placeholder="Abréviation" />
                    </div>
                    <div v-else>
                      {{ unit.abbreviation || '-' }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingUnitId === unit.id">
                      <button @click="saveEditingUnit" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">
                        Sauvegarder
                      </button>
                      <button @click="cancelEditingUnit" class="bg-gray-500 text-white px-3 py-1 rounded">
                        Annuler
                      </button>
                    </div>
                    <div v-else>
                      <button @click="startEditingUnit(unit)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
                        Éditer
                      </button>
                      <button @click="deleteUnit(unit.id)" class="bg-red-500 text-white px-3 py-1 rounded">
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="sm:hidden">
              <div v-for="unit in filteredUnits" :key="unit.id" class="bg-white shadow rounded p-4 mb-3">
                <div class="text-sm font-medium text-gray-600">ID: {{ unit.id }}</div>
                <div class="mt-1">
                  <span class="font-medium">Nom:</span> {{ unit.name }}
                </div>
                <div class="mt-1">
                  <span class="font-medium">Nom Pluriel:</span> {{ unit.pluralName || '-' }}
                </div>
                <div class="mt-1">
                  <span class="font-medium">Fraction:</span> {{ unit.fraction ? 'Oui' : 'Non' }}
                </div>
                <div class="mt-1">
                  <span class="font-medium">Abréviation:</span> {{ unit.abbreviation || '-' }}
                </div>
                <div class="mt-2">
                  <button @click="startEditingUnit(unit)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">
                    Éditer
                  </button>
                  <button @click="deleteUnit(unit.id)" class="bg-red-500 text-white px-3 py-1 rounded">
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Onglet Étiquettes -->
        <div v-if="activeTab === 'tags'">
          <div class="mb-4 flex flex-col sm:flex-row justify-center gap-4">
            <input 
              v-model="tagSearch" 
              type="text" 
              placeholder="Recherche d'étiquettes" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="loadTags" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Recharger
            </button>
          </div>
          <div class="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              v-model="newTag" 
              type="text" 
              placeholder="Nom de l'étiquette" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="createTag" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Créer l'étiquette
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full hidden sm:table">
              <thead>
                <tr class="bg-gray-100">
                  <th class="px-4 py-2 border">ID</th>
                  <th class="px-4 py-2 border">Nom</th>
                  <th class="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="tag in filteredTags" :key="tag.id" class="hover:bg-gray-50">
                  <td class="px-4 py-2 border">{{ tag.id }}</td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingTagId === tag.id">
                      <input v-model="editedTag.name" class="border p-1 rounded w-full" />
                    </div>
                    <div v-else>
                      {{ tag.name }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingTagId === tag.id">
                      <button @click="saveEditingTag" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Sauvegarder</button>
                      <button @click="cancelEditingTag" class="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                    </div>
                    <div v-else>
                      <button @click="startEditingTag(tag)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Éditer</button>
                      <button @click="deleteTag(tag.id)" class="bg-red-500 text-white px-3 py-1 rounded">Supprimer</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="sm:hidden">
              <div v-for="tag in filteredTags" :key="tag.id" class="bg-white shadow rounded p-4 mb-3">
                <div class="text-sm font-medium text-gray-600">ID: {{ tag.id }}</div>
                <div class="mt-1">
                  <span class="font-medium">Nom: </span>
                  <span v-if="editingTagId === tag.id">
                    <input v-model="editedTag.name" class="border p-1 rounded w-full" />
                  </span>
                  <span v-else>{{ tag.name }}</span>
                </div>
                <div class="mt-2">
                  <div v-if="editingTagId === tag.id">
                    <button @click="saveEditingTag" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Sauvegarder</button>
                    <button @click="cancelEditingTag" class="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                  </div>
                  <div v-else>
                    <button @click="startEditingTag(tag)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Éditer</button>
                    <button @click="deleteTag(tag.id)" class="bg-red-500 text-white px-3 py-1 rounded">Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Onglet Catégories -->
        <div v-if="activeTab === 'categories'">
          <div class="mb-4 flex flex-col sm:flex-row justify-center gap-4">
            <input 
              v-model="categorySearch" 
              type="text" 
              placeholder="Recherche de catégories" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="loadCategories" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Recharger
            </button>
          </div>
          <div class="mb-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <input 
              v-model="newCategory" 
              type="text" 
              placeholder="Nom de la catégorie" 
              class="border p-2 rounded w-full sm:w-1/3"
            />
            <button @click="createCategory" class="bg-emerald-600 text-white px-4 py-2 rounded">
              Créer la catégorie
            </button>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full hidden sm:table">
              <thead>
                <tr class="bg-gray-100">
                  <th class="px-4 py-2 border">ID</th>
                  <th class="px-4 py-2 border">Nom</th>
                  <th class="px-4 py-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="cat in filteredCategories" :key="cat.id" class="hover:bg-gray-50">
                  <td class="px-4 py-2 border">{{ cat.id }}</td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingCategoryId === cat.id">
                      <input v-model="editedCategory.name" class="border p-1 rounded w-full" />
                    </div>
                    <div v-else>
                      {{ cat.name }}
                    </div>
                  </td>
                  <td class="px-4 py-2 border">
                    <div v-if="editingCategoryId === cat.id">
                      <button @click="saveEditingCategory" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Sauvegarder</button>
                      <button @click="cancelEditingCategory" class="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                    </div>
                    <div v-else>
                      <button @click="startEditingCategory(cat)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Éditer</button>
                      <button @click="deleteCategory(cat.id)" class="bg-red-500 text-white px-3 py-1 rounded">Supprimer</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="sm:hidden">
              <div v-for="cat in filteredCategories" :key="cat.id" class="bg-white shadow rounded p-4 mb-3">
                <div class="text-sm font-medium text-gray-600">ID: {{ cat.id }}</div>
                <div class="mt-1">
                  <span class="font-medium">Nom: </span>
                  <span v-if="editingCategoryId === cat.id">
                    <input v-model="editedCategory.name" class="border p-1 rounded w-full" />
                  </span>
                  <span v-else>{{ cat.name }}</span>
                </div>
                <div class="mt-2">
                  <div v-if="editingCategoryId === cat.id">
                    <button @click="saveEditingCategory" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">Sauvegarder</button>
                    <button @click="cancelEditingCategory" class="bg-gray-500 text-white px-3 py-1 rounded">Annuler</button>
                  </div>
                  <div v-else>
                    <button @click="startEditingCategory(cat)" class="bg-yellow-500 text-white px-3 py-1 rounded mr-2">Éditer</button>
                    <button @click="deleteCategory(cat.id)" class="bg-red-500 text-white px-3 py-1 rounded">Supprimer</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
  
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, computed } from 'vue';
  import { referenceService, recipeService } from '../services/api';
  
  export default {
    name: 'AdminData',
    setup() {
      // Définition des onglets
      const tabs = [
        { id: 'ingredients', name: 'Ingrédients' },
        { id: 'units', name: 'Unités' },
        { id: 'tags', name: 'Étiquettes' },
        { id: 'categories', name: 'Catégories' },
      ];
      const activeTab = ref('ingredients');
  
      // Listes de données
      const ingredients = ref([]);
      const units = ref([]);
      const tags = ref([]);
      const categories = ref([]);
  
      // Champs de recherche
      const ingredientSearch = ref('');
      const unitSearch = ref('');
      const tagSearch = ref('');
      const categorySearch = ref('');
  
      // Champs de création
      const newIngredient = ref('');
      const newUnit = ref('');
      const newTag = ref('');
      const newCategory = ref('');
  
      // --- ÉTAT POUR L'ÉDITION ---
  
      // Ingrédients
      const editingIngredientId = ref(null);
      const editedIngredient = ref({});
  
      const startEditingIngredient = (item) => {
        editingIngredientId.value = item.id;
        // Créer une copie pour modification
        editedIngredient.value = { ...item };
      };
  
      const cancelEditingIngredient = () => {
        editingIngredientId.value = null;
        editedIngredient.value = {};
      };
  
      const saveEditingIngredient = async () => {
        try {
          // Appel à l'API pour mettre à jour (adapter selon ton API)
          await referenceService.updateFood(editedIngredient.value.id, editedIngredient.value);
          // Mise à jour locale
          ingredients.value = ingredients.value.map(item =>
            item.id === editedIngredient.value.id ? { ...editedIngredient.value } : item
          );
          editingIngredientId.value = null;
          editedIngredient.value = {};
        } catch (e) {
          console.error("Erreur lors de la mise à jour de l'ingrédient", e);
        }
      };
  
      // Unités
      const editingUnitId = ref(null);
      const editedUnit = ref({});
  
      const startEditingUnit = (item) => {
        editingUnitId.value = item.id;
        editedUnit.value = { ...item };
      };
  
      const cancelEditingUnit = () => {
        editingUnitId.value = null;
        editedUnit.value = {};
      };
  
      const saveEditingUnit = async () => {
        try {
          await referenceService.updateUnit(editedUnit.value.id, editedUnit.value);
          units.value = units.value.map(item =>
            item.id === editedUnit.value.id ? { ...editedUnit.value } : item
          );
          editingUnitId.value = null;
          editedUnit.value = {};
        } catch (e) {
          console.error("Erreur lors de la mise à jour de l'unité", e);
        }
      };
  
      // Étiquettes
      const editingTagId = ref(null);
      const editedTag = ref({});
  
      const startEditingTag = (item) => {
        editingTagId.value = item.id;
        editedTag.value = { ...item };
      };
  
      const cancelEditingTag = () => {
        editingTagId.value = null;
        editedTag.value = {};
      };
  
      const saveEditingTag = async () => {
        try {
          await referenceService.updateTag(editedTag.value.id, editedTag.value);
          tags.value = tags.value.map(item =>
            item.id === editedTag.value.id ? { ...editedTag.value } : item
          );
          editingTagId.value = null;
          editedTag.value = {};
        } catch (e) {
          console.error("Erreur lors de la mise à jour de l'étiquette", e);
        }
      };
  
      // Catégories
      const editingCategoryId = ref(null);
      const editedCategory = ref({});
  
      const startEditingCategory = (item) => {
        editingCategoryId.value = item.id;
        editedCategory.value = { ...item };
      };
  
      const cancelEditingCategory = () => {
        editingCategoryId.value = null;
        editedCategory.value = {};
      };
  
      const saveEditingCategory = async () => {
        try {
          await recipeService.updateCategory(editedCategory.value.id, editedCategory.value);
          categories.value = categories.value.map(item =>
            item.id === editedCategory.value.id ? { ...editedCategory.value } : item
          );
          editingCategoryId.value = null;
          editedCategory.value = {};
        } catch (e) {
          console.error("Erreur lors de la mise à jour de la catégorie", e);
        }
      };
  
      // --- FIN D'ÉTAT POUR L'ÉDITION ---
  
      // Fonctions de chargement
      const loadIngredients = async () => {
        try {
          const res = await referenceService.getFoods({ page: 1, perPage: 1000 });
          if (res.data && Array.isArray(res.data.items)) {
            ingredients.value = res.data.items.sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
          }
        } catch (e) {
          console.error("Erreur lors du chargement des ingrédients", e);
        }
      };
  
      const loadUnits = async () => {
        try {
          const res = await referenceService.getUnits();
          if (res.data && Array.isArray(res.data.items)) {
            units.value = res.data.items.sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
          }
        } catch (e) {
          console.error("Erreur lors du chargement des unités", e);
        }
      };
  
      const loadTags = async () => {
        try {
          const res = await referenceService.getTags();
          if (res.data && Array.isArray(res.data.items)) {
            tags.value = res.data.items.sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
          }
        } catch (e) {
          console.error("Erreur lors du chargement des étiquettes", e);
        }
      };
  
      const loadCategories = async () => {
        try {
          const res = await recipeService.getCategories();
          if (res.data && Array.isArray(res.data.items)) {
            categories.value = res.data.items.sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
            );
          }
        } catch (e) {
          console.error("Erreur lors du chargement des catégories", e);
        }
      };
  
      // Fonctions de création
      const createIngredient = async () => {
        if (!newIngredient.value.trim()) return;
        try {
          const res = await referenceService.createFood({ name: newIngredient.value.trim(), Description:  '' });
          if (res.data) {
            ingredients.value.unshift(res.data);
            newIngredient.value = '';
          }
        } catch (e) {
          console.error("Erreur lors de la création de l'ingrédient", e);
        }
      };
  
      const createUnit = async () => {
        if (!newUnit.value.trim()) return;
        try {
          const res = await referenceService.createUnit({ name: newUnit.value.trim() });
          if (res.data) {
            units.value.unshift(res.data);
            newUnit.value = '';
          }
        } catch (e) {
          console.error("Erreur lors de la création de l'unité", e);
        }
      };
  
      const createTag = async () => {
        if (!newTag.value.trim()) return;
        try {
          const res = await referenceService.createTag({ name: newTag.value.trim() });
          if (res.data) {
            tags.value.unshift(res.data);
            newTag.value = '';
          }
        } catch (e) {
          console.error("Erreur lors de la création de l'étiquette", e);
        }
      };
  
      const createCategory = async () => {
        if (!newCategory.value.trim()) return;
        try {
          const slug = newCategory.value
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
          const res = await recipeService.createCategory({ name: newCategory.value.trim(), slug });
          if (res.data) {
            categories.value.unshift(res.data);
            newCategory.value = '';
          }
        } catch (e) {
          console.error("Erreur lors de la création de la catégorie", e);
        }
      };
  
      // Fonctions de suppression
      const deleteIngredient = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cet ingrédient ?")) return;
        try {
          await referenceService.deleteFood(id);
          ingredients.value = ingredients.value.filter(item => item.id !== id);
        } catch (e) {
          console.error("Erreur lors de la suppression de l'ingrédient", e);
        }
      };
  
      const deleteUnit = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cette unité ?")) return;
        try {
          await referenceService.deleteUnit(id);
          units.value = units.value.filter(item => item.id !== id);
        } catch (e) {
          console.error("Erreur lors de la suppression de l'unité", e);
        }
      };
  
      const deleteTag = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cette étiquette ?")) return;
        try {
          await referenceService.deleteTag(id);
          tags.value = tags.value.filter(item => item.id !== id);
        } catch (e) {
          console.error("Erreur lors de la suppression de l'étiquette", e);
        }
      };
  
      const deleteCategory = async (id) => {
        if (!confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;
        try {
          await recipeService.deleteCategory(id);
          categories.value = categories.value.filter(item => item.id !== id);
        } catch (e) {
          console.error("Erreur lors de la suppression de la catégorie", e);
        }
      };
  
      // Propriétés calculées pour filtrer les listes en fonction de la recherche
      const filteredIngredients = computed(() => {
        if (!ingredientSearch.value.trim()) return ingredients.value;
        const lower = ingredientSearch.value.toLowerCase();
        return ingredients.value.filter(item =>
          item.name.toLowerCase().includes(lower)
        );
      });
  
      const filteredUnits = computed(() => {
        if (!unitSearch.value.trim()) return units.value;
        const lower = unitSearch.value.toLowerCase();
        return units.value.filter(item =>
          item.name.toLowerCase().includes(lower)
        );
      });
  
      const filteredTags = computed(() => {
        if (!tagSearch.value.trim()) return tags.value;
        const lower = tagSearch.value.toLowerCase();
        return tags.value.filter(item =>
          item.name.toLowerCase().includes(lower)
        );
      });
  
      const filteredCategories = computed(() => {
        if (!categorySearch.value.trim()) return categories.value;
        const lower = categorySearch.value.toLowerCase();
        return categories.value.filter(item =>
          item.name.toLowerCase().includes(lower)
        );
      });
  
      onMounted(async () => {
        await Promise.all([
          loadIngredients(),
          loadUnits(),
          loadTags(),
          loadCategories()
        ]);
      });
  
      return {
        tabs,
        activeTab,
        ingredients,
        units,
        tags,
        categories,
        ingredientSearch,
        unitSearch,
        tagSearch,
        categorySearch,
        newIngredient,
        newUnit,
        newTag,
        newCategory,
        loadIngredients,
        loadUnits,
        loadTags,
        loadCategories,
        createIngredient,
        createUnit,
        createTag,
        createCategory,
        deleteIngredient,
        deleteUnit,
        deleteTag,
        deleteCategory,
        filteredIngredients,
        filteredUnits,
        filteredTags,
        filteredCategories,
        // Édition Ingrédients
        editingIngredientId,
        editedIngredient,
        startEditingIngredient,
        cancelEditingIngredient,
        saveEditingIngredient,
        // Édition Unités
        editingUnitId,
        editedUnit,
        startEditingUnit,
        cancelEditingUnit,
        saveEditingUnit,
        // Édition Étiquettes
        editingTagId,
        editedTag,
        startEditingTag,
        cancelEditingTag,
        saveEditingTag,
        // Édition Catégories
        editingCategoryId,
        editedCategory,
        startEditingCategory,
        cancelEditingCategory,
        saveEditingCategory
      };
    }
  };
  </script>
  
  <style scoped>
  @media (max-width: 640px) {
    table {
      font-size: 0.875rem;
    }
  }
  </style>
  