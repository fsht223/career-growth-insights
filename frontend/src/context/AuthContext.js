// import React, { createContext, useState, useEffect } from 'react';
// import { authService } from '@/services/auth';
// import api from '@/services/api';

// export const AuthContext = createContext(null);

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const initAuth = async () => {
//       const savedUser = authService.getUser();
//       if (savedUser && authService.isAuthenticated()) {
//         try {
//           await api.verifyToken();
//           setUser(savedUser);
//         } catch (error) {
//           authService.clearAuth();
//         }
//       }
//       setLoading(false);
//     };

//     initAuth();
//   }, []);

//   const login = async (email, password) => {
//     const response = await api.login(email, password);
//     setUser(response.user);
//     return response;
//   };

//   const register = async (data) => {
//     const response = await api.register(data);
//     setUser(response.user);
//     return response;
//   };

//   const logout = () => {
//     authService.clearAuth();
//     setUser(null);
//   };

//   const value = {
//     user,
//     loading,
//     login,
//     register,
//     logout,
//     isAuthenticated: !!user,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };