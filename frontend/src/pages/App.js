import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import TaskManager from './TaskManager';
import { AuthProvider, useAuth } from '../context/Authcontext';
import Navbar from '../components/navbar';
import Login from './login';
import Register from './register';
import Dashboard from './dashboard';
import Events from './events';
import EventDetails from './EventDetails';
import CreateEvent from './CreateEvent';
import Profile from './Profile';
import OrganizerView from './organizerview';
import Expenses from './expense';
import JoinEvent from './Joinevents'

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <Navigate to="/dashboard" /> : children;
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
                <Routes>
                  <Route path="/login" element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  } />
                  <Route path="/register" element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  } />
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/events" element={
                    <ProtectedRoute>
                      <Events />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/create" element={
                    <ProtectedRoute>
                      <CreateEvent />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:id" element={
                    <ProtectedRoute>
                      <EventDetails />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:id/tasks" element={
                    <ProtectedRoute>
                      <TaskManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/events/:id/expenses" element={
                    <ProtectedRoute>
                     <Expenses />
                    </ProtectedRoute>
                  } />
                  <Route path="/join/:id" element={
                    <ProtectedRoute>
                      <JoinEvent />
                    </ProtectedRoute>
                  } />

                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                  
                  <Route path="/events/:id/organizer" element={
                    <ProtectedRoute>
                      <OrganizerView />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Box>
            </Box>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;