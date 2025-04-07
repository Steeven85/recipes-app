import { createRouter, createWebHistory } from 'vue-router';
import RecipesView from '../views/RecipesView.vue';
import RecipeDetailView from '../views/RecipeDetailView.vue';

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
    path: '/recipes/edit/:slug',
    name: 'recipe-edit',
    component: () => import('../views/RecipeEditView.vue'),
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
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;