import axiosInstance from "../utils/axiosInstance.ts";

export interface LoginCredentials {
  username: string; // OAuth2 uses 'username' field for email
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface UserResponse {
  id: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<UserResponse> {
    const response = await axiosInstance.post<UserResponse>("/users/register", data);
    return response.data;
  }

  /**
   * Login user and store token
   */
  async login(credentials: LoginCredentials): Promise<UserResponse> {
    // OAuth2 requires form data format
    const formData = new URLSearchParams();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);

    const response = await axiosInstance.post<LoginResponse>("/users/login", formData, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Store token in localStorage
    localStorage.setItem("access_token", response.data.access_token);

    // Get current user info
    const userInfo = await this.getCurrentUser();
    
    // Store user info
    localStorage.setItem("user_info", JSON.stringify(userInfo));

    return userInfo;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<UserResponse> {
    const response = await axiosInstance.get<UserResponse>("/users/me");
    return response.data;
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_info");
  }

  /**
   * Check if user is logged in
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }

  /**
   * Check if current user is admin
   */
  isAdmin(): boolean {
    const userInfo = localStorage.getItem("user_info");
    if (!userInfo) return false;
    
    try {
      const user: UserResponse = JSON.parse(userInfo);
      return user.is_admin;
    } catch {
      return false;
    }
  }

  /**
   * Get stored user info
   */
  getUserInfo(): UserResponse | null {
    const userInfo = localStorage.getItem("user_info");
    if (!userInfo) return null;
    
    try {
      return JSON.parse(userInfo);
    } catch {
      return null;
    }
  }
}

export default new AuthService();
