import { defineStore } from 'pinia';
import { userService } from '../services/userService';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAdmin: false,
    loading: false,
    error: null,
    isAuthenticated: false,
    users: [] // Pour la gestion des utilisateurs par l'admin
  }),

  getters: {
    // Récupérer l'utilisateur actuel
    currentUser: (state) => state.user,
    
    // Vérifier si l'utilisateur est un administrateur
    userIsAdmin: (state) => state.isAdmin,
    
    // Vérifier si un utilisateur est connecté
    userIsAuthenticated: (state) => state.isAuthenticated
  },

  actions: {
    // Initialiser le store au démarrage de l'application
    async init() {
      // Vérifier s'il y a un token existant
      const token = localStorage.getItem('mealieToken');
      if (token) {
        this.isAuthenticated = true;
        await this.fetchCurrentUser();
      }
    },

    // Connexion utilisateur
    async login(username, password, rememberMe = false) {
      this.loading = true;
      this.error = null;
      try {
        const data = await userService.login(username, password, rememberMe);
        this.isAuthenticated = true;
        await this.fetchCurrentUser();
        return true;
      } catch (error) {
        this.error = error.message || 'Erreur lors de la connexion';
        this.isAuthenticated = false;
        this.user = null;
        return false;
      } finally {
        this.loading = false;
      }
    },

    // Récupérer les informations de l'utilisateur connecté
    async fetchCurrentUser() {
      this.loading = true;
      try {
        const response = await userService.getCurrentUser();
        this.user = response.data;
        this.isAdmin = this.user?.admin || false;
      } catch (error) {
        this.error = error.message;
        this.user = null;
        this.isAdmin = false;
        this.isAuthenticated = false;
      } finally {
        this.loading = false;
      }
    },

    // Déconnexion
    logout() {
      userService.logout();
      this.user = null;
      this.isAdmin = false;
      this.isAuthenticated = false;
    },

    // ACTIONS ADMIN
    
    // Récupérer tous les utilisateurs (admin uniquement)
    async fetchUsers() {
        if (!this.isAdmin) {
          this.error = "Accès non autorisé";
          return;
        }
        
        this.loading = true;
        try {
          const response = await userService.getUsers();
          
          // Extraire le tableau d'utilisateurs de l'objet paginé
          if (response.data && Array.isArray(response.data.items)) {
            this.users = response.data.items;
          } else {
            console.warn("Format de données inattendu:", response.data);
            this.users = [];
          }
        } catch (error) {
          this.error = error.message;
          this.users = []; 
        } finally {
          this.loading = false;
        }
      },

    // Créer un nouvel utilisateur (admin uniquement)
    async createUser(userData) {
      if (!this.isAdmin) {
        this.error = "Accès non autorisé";
        return null;
      }
      
      this.loading = true;
      try {
        const response = await userService.createUser(userData);
        // Rafraîchir la liste des utilisateurs
        await this.fetchUsers();
        return response.data;
      } catch (error) {
        this.error = error.message;
        return null;
      } finally {
        this.loading = false;
      }
    },

    // Mettre à jour un utilisateur
    async updateUser(userId, userData) {
        this.loading = true;
        try {
          // Trouver l'utilisateur complet dans le tableau des utilisateurs
          const existingUser = this.users.find(u => u.id === userId);
          
          if (!existingUser) {
            throw new Error("Utilisateur non trouvé");
          }
          
          // Définir explicitement chaque champ pour éviter les valeurs null
          const completeUserData = {
            id: existingUser.id,
            username: userData.username || existingUser.username,
            email: userData.email || existingUser.email,
            fullName: userData.full_name || existingUser.fullName,
            admin: userData.admin !== undefined ? userData.admin : existingUser.admin,
            group: existingUser.group,
            household: existingUser.household,
            groupId: existingUser.groupId,
            groupSlug: existingUser.groupSlug,
            householdId: existingUser.householdId,
            householdSlug: existingUser.householdSlug,
            cacheKey: existingUser.cacheKey,
            
            // Ces champs pourraient aussi être requis dans un format particulier
            authMethod: existingUser.authMethod,
            advanced: existingUser.advanced !== undefined ? existingUser.advanced : false,
            canInvite: existingUser.canInvite !== undefined ? existingUser.canInvite : false,
            canManage: existingUser.canManage !== undefined ? existingUser.canManage : false,
            canManageHousehold: existingUser.canManageHousehold !== undefined ? existingUser.canManageHousehold : false,
            canOrganize: existingUser.canOrganize !== undefined ? existingUser.canOrganize : false,
            
            // Si tokens est un tableau dans l'objet original, s'assurer qu'il est envoyé comme un tableau
            tokens: Array.isArray(existingUser.tokens) ? existingUser.tokens : []
          };
          
          console.log("Données envoyées à l'API:", completeUserData);
          
          const response = await userService.updateUser(userId, completeUserData);
          
          // Si c'est l'utilisateur actuel, mettre à jour les données locales
          if (this.user && this.user.id === userId) {
            this.user = response.data;
          }
          
          // Si c'est un admin qui modifie un autre utilisateur, rafraîchir la liste
          if (this.isAdmin) {
            await this.fetchUsers();
          }
          
          return response.data;
        } catch (error) {
          this.error = error.message || (error.response?.data?.detail?.message || JSON.stringify(error.response?.data?.detail));
          return null;
        } finally {
          this.loading = false;
        }
      },

    // Supprimer un utilisateur (admin uniquement)
    async deleteUser(userId) {
      if (!this.isAdmin) {
        this.error = "Accès non autorisé";
        return false;
      }
      
      this.loading = true;
      try {
        await userService.deleteUser(userId);
        // Rafraîchir la liste des utilisateurs
        await this.fetchUsers();
        return true;
      } catch (error) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    },

    // Changer le mot de passe
    async changePassword(userId, currentPassword, newPassword) {
      this.loading = true;
      try {
        await userService.changePassword(userId, currentPassword, newPassword);
        return true;
      } catch (error) {
        this.error = error.message;
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});