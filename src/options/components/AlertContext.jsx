import React, { createContext, useContext, useState } from 'react';
import AlertModal from './AlertModal.jsx';

const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const showAlert = (message, options = {}) => {
    const id = Date.now() + Math.random();
    const alert = {
      id,
      message,
      type: options.type || 'info',
      title: options.title,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    };

    setAlerts(prev => [...prev, alert]);

    return id;
  };

  const showConfirm = (message, options = {}) => {
    return new Promise((resolve) => {
      const id = Date.now() + Math.random();
      const alert = {
        id,
        message,
        type: 'confirm',
        title: options.title,
        onConfirm: () => {
          hideAlert(id);
          resolve(true);
        },
        onCancel: () => {
          hideAlert(id);
          resolve(false);
        },
      };

      setAlerts(prev => [...prev, alert]);
    });
  };

  const hideAlert = (id) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const value = {
    showAlert,
    showConfirm,
    hideAlert,
  };

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alerts.map(alert => (
        <AlertModal
          key={alert.id}
          isOpen={true}
          title={alert.title}
          message={alert.message}
          type={alert.type}
          onConfirm={alert.onConfirm}
          onCancel={alert.onCancel}
          onClose={() => hideAlert(alert.id)}
        />
      ))}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}