import axiosInstance from './axiosInstance';

// Service pour les opérations liées aux utilisateurs
export const userService = {
  // Connexion utilisateur et récupération du token
  async login(username, password, rememberMe = false) {
    try {
      // Créer un FormData avec l'option remember_me
      const formData = new FormData();
      formData.append('username', username);
      formData.append('password', password);
      formData.append('remember_me', rememberMe.toString());
      
      // Utiliser le chemin relatif pour l'API
      const response = await axiosInstance.post('/auth/token', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': undefined
        }
      });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('mealieToken', response.data.access_token);
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
      }
      
      return response;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      throw error;
    }
  },

  // Récupérer les informations de l'utilisateur connecté
  async getCurrentUser() {
    try {
      return await axiosInstance.get('/users/self');
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  },

  // Récupération de tous les utilisateurs (admin uniquement)
  async getUsers() {
    try {
      return await axiosInstance.get('/users');
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },

  // Récupération d'un utilisateur spécifique
  async getUser(userId) {
    try {
      return await axiosInstance.get(`/users/${userId}`);
    } catch (error) {
      console.error(`Erreur lors de la récupération de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },

  // Création d'un nouvel utilisateur (admin uniquement)
  async createUser(userData) {
    try {
      return await axiosInstance.post('/admin/users', userData);
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  },

  // Mise à jour d'un utilisateur
  async updateUser(userId, userData) {
    try {
      return await axiosInstance.put(`/admin/users/${userId}`, userData);
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },

  // Suppression d'un utilisateur
  async deleteUser(userId) {
    try {
      return await axiosInstance.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error(`Erreur lors de la suppression de l'utilisateur ${userId}:`, error);
      throw error;
    }
  },

  // Modification du mot de passe
  async changePassword(userId, currentPassword, newPassword) {
    try {
      return await axiosInstance.put(`/users/${userId}/password`, {
        current_password: currentPassword,
        new_password: newPassword
      });
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      throw error;
    }
  },

  // Déconnexion (suppression du token côté client)
  logout() {
    localStorage.removeItem('mealieToken');
    axiosInstance.setAuthToken('');
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    return !!localStorage.getItem('mealieToken');
  }
};

// Exporter le service pour l'utiliser ailleurs dans l'application
export default userService;