import axiosInstance from "../utils/axiosInstance.ts";

export interface User {
  id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

class UserService {
  /**
   * Get all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    const response = await axiosInstance.get<User[]>("/users/");
    return response.data;
  }

  /**
   * Toggle admin privileges for a user (admin only)
   */
  async toggleAdmin(userId: string, isAdmin: boolean): Promise<User> {
    const response = await axiosInstance.patch<User>(
      `/users/${userId}/admin`,
      { is_admin: isAdmin }
    );
    return response.data;
  }

  /**
   * Toggle active status for a user (admin only)
   */
  async toggleActive(userId: string, isActive: boolean): Promise<User> {
    const response = await axiosInstance.patch<User>(
      `/users/${userId}/active`,
      { is_active: isActive }
    );
    return response.data;
  }

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    await axiosInstance.delete(`/users/${userId}`);
  }
}

export default new UserService();
