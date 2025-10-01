import React from 'react';
import LoginForm from '../components/LoginForm';
import { motion } from 'framer-motion';
import '../pages/Login.css';

const Login = () => {
  return (
    <div className="login-page">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="login-container"
      >
        <h1 className="login-title">Welcome Back to MediBuddy</h1>
        <p className="login-subtitle">Please sign in to your account</p>
        <LoginForm />
      </motion.div>
    </div>
  );
};

export default Login;
