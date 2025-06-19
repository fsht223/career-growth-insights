// import React from 'react';
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import { AuthProvider } from '@/context/AuthContext';
// import { ToastProvider } from '@/context/ToastContext';
// import PrivateRoute from '@/components/common/PrivateRoute';

// // Pages
// import Landing from '@/pages/Landing';
// import Register from '@/pages/Register';
// import Login from '@/pages/Login';
// import Dashboard from '@/pages/Dashboard';
// import TestTaking from '@/pages/TestTaking';

// function App() {
//   return (
//     <Router>
//       <AuthProvider>
//         <ToastProvider>
//           <Routes>
//             <Route path="/" element={<Landing />} />
//             <Route path="/register" element={<Register />} />
//             <Route path="/login" element={<Login />} />
//             <Route
//               path="/dashboard/*"
//               element={
//                 <PrivateRoute>
//                   <Dashboard />
//                 </PrivateRoute>
//               }
//             />
//             <Route path="/test/:testId" element={<TestTaking />} />
//           </Routes>
//         </ToastProvider>
//       </AuthProvider>
//     </Router>
//   );
// }

// export default App;
