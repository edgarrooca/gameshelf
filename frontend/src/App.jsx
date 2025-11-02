import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { theme } from './theme';

import { TopHeader } from './components/TopHeader/TopHeader';

import { LoginPage } from './pages/LoginPage/LoginPage';
import { RegisterPage } from './pages/RegisterPage/RegisterPage';
import GameListPage from './pages/GameListPage/GameListPage';
import MyLibraryPage from './pages/MyLibraryPage/MyLibraryPage';
import ExplorePage from './pages/ExplorePage/ExplorePage';
import GameFormPage from './pages/GameFormPage/GameFormPage';

import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute/ProtectedRoute';

import classes from './App.module.css';

// Layout principal con header
function MainLayout() {
  const [selectedSearchGame, setSelectedSearchGame] = useState(null);

  const handleGameSelect = (game) => {
    setSelectedSearchGame(game);
  };

  const handleGameProcessed = () => {
    setSelectedSearchGame(null);
  };

  const contextValue = {
    selectedSearchGame,
    onGameProcessed: handleGameProcessed,
  };

  return (
    <div className={classes.appContainer}>
      <TopHeader onGameSelect={handleGameSelect} />
      <main className={classes.mainContent}>
        <Outlet context={contextValue} />
      </main>
    </div>
  );
}

// Componente principal
function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <Notifications />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<GameListPage />} />
              <Route path="my-library" element={<MyLibraryPage />} />
              <Route path="explore" element={<ExplorePage />} />
              <Route path="games/new" element={<GameFormPage />} />
              <Route path="games/:id/edit" element={<GameFormPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;
