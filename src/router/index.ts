import { createRouter, createWebHistory } from 'vue-router';
import RecipesView from '../views/RecipesView.vue';
import RecipeDetailView from '../views/RecipeDetailView.vue';
import AdminData from '../views/AdminData.vue';
import { useUserStore } from '../stores/userStore';

// Importez correctement vos composants d'authentification
import LoginView from '../views/LoginView.vue';
import ProfileView from '../views/ProfileView.vue';
import UserAdminView from '../views/UserAdminView.vue';

const routes = [
  {
    path: '/',
    name: 'recipes',
    component: RecipesView,
    meta: { requiresAuth: true }
  },
  {
    path: '/recipes/:id',
    name: 'recipe-detail',
    component: RecipeDetailView,
    meta: { requiresAuth: true }
  },
  {
    path: '/planner',
    name: 'planner',
    component: () => import('../views/PlannerView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/shopping',
    name: 'shopping',
    component: () => import('../views/ShoppingView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminData,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  // Ajouter les routes pour l'authentification
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfileView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/users',
    name: 'UserAdmin',
    component: UserAdminView,
    meta: { requiresAuth: true, requiresAdmin: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Ajouter la protection des routes
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  
  // Si la route requiert une authentification et l'utilisateur n'est pas connecté
  if (to.meta.requiresAuth && !userStore.isAuthenticated) {
    next('/login');
  } 
  // Si la route requiert des droits d'admin et l'utilisateur n'est pas admin
  else if (to.meta.requiresAdmin && !userStore.isAdmin) {
    next('/');
  }
  // Si l'utilisateur est déjà connecté et tente d'accéder à la page de connexion
  else if (to.path === '/login' && userStore.isAuthenticated) {
    next('/');
  }
  // Dans tous les autres cas, permettre la navigation
  else {
    next();
  }
});

export default router;