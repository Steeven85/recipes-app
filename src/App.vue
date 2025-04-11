<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <!-- Logo toujours visible -->
          <router-link to="/" class="block">
            <img src="/logoFP.png" alt="Logo" class="h-16 w-16 object-contain sm:h-24 sm:w-24" />
          </router-link>
          <!-- Titre visible uniquement sur grand écran -->
          <router-link to="/" class="block">
            <h1 class="hidden sm:block text-2xl font-semibold">Recette</h1>
          </router-link>
        </div>
        <nav class="flex space-x-4">
          <router-link 
            to="/" 
            class="px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
          >
            Recettes
          </router-link>
          <router-link 
            to="/planner" 
            class="px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
          >
            Planning
          </router-link>
          <router-link 
            to="/shopping" 
            class="px-3 py-2 rounded-md text-sm font-medium hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
          >
            Courses
          </router-link>
          <!-- Lien vers l'administration représenté par une icône de roue de configuration -->
          <router-link 
            to="/admin" 
            class="p-2 rounded-md hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg"
                 fill="none" viewBox="0 0 24 24"
                 stroke-width="2" stroke="currentColor"
                 class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M11.25 2.25c.414 0 .75.336.75.75v1.144a1.5 1.5 0 01.987 1.39l.322 1.29a.75.75 0 00.73.606h1.473c.414 0 .75.336.75.75v1.375a.75.75 0 00.73.607l1.313.107a1.5 1.5 0 011.389.987l1.146.646a.75.75 0 01-.02 1.3l-1.146.646a1.5 1.5 0 01-1.389.987l-1.313.107a.75.75 0 00-.73.606v1.375c0 .414-.336.75-.75.75h-1.473a.75.75 0 00-.73.606l-.322 1.29a1.5 1.5 0 01-1.389 1.39V21c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-1.144a1.5 1.5 0 01-1.389-1.39l-.322-1.29a.75.75 0 00-.73-.606H5.25a.75.75 0 01-.75-.75v-1.375a.75.75 0 00-.73-.607l-1.313-.107a1.5 1.5 0 01-1.389-.987L.72 13.3a.75.75 0 01.02-1.3l1.146-.646a1.5 1.5 0 011.389-.987l1.313-.107a.75.75 0 00.73-.606V8.77c0-.414.336-.75.75-.75h1.473a.75.75 0 00.73-.606l.322-1.29A1.5 1.5 0 017.5 4.143V2.25c0-.414.336-.75.75-.75zM12 15a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
          </router-link>
        </nav>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
};
</script>
