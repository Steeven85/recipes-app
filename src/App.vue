<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <!-- Logo à gauche, pas doublé -->
          <router-link to="/">
            <img src="/logoFP.png" alt="Logo" class="h-8 w-8 object-contain" />
          </router-link>
          <!-- Titre en orange -->
          <h1 class="text-2xl font-semibold text-orange-500">Mealie</h1>
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
