import { createRouter, createWebHistory } from 'vue-router';
import RecipesView from '../views/RecipesView.vue';
import RecipeDetailView from '../views/RecipeDetailView.vue';
import AdminData from '../views/AdminData.vue';

const routes = [
  {
    path: '/',
    name: 'recipes',
    component: RecipesView,
  },
  {
    path: '/recipes/:id',
    name: 'recipe-detail',
    component: RecipeDetailView,
  },
  {
    path: '/planner',
    name: 'planner',
    component: () => import('../views/PlannerView.vue'),
  },
  {
    path: '/shopping',
    name: 'shopping',
    component: () => import('../views/ShoppingView.vue'),
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminData,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;