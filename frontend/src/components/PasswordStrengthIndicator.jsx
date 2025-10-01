import React from 'react';
import { Box, LinearProgress, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';

const PasswordStrengthIndicator = ({ password }) => {
  const criteria = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Contains number', test: /\d/.test(password) },
    { label: 'Contains special character', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passedCriteria = criteria.filter(c => c.test).length;
  const strength = passedCriteria === 0 ? 0 : (passedCriteria / criteria.length) * 100;

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength <= 40) return 'Weak';
    if (strength <= 60) return 'Fair';
    if (strength <= 80) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 40) return 'error';
    if (strength <= 60) return 'warning';
    if (strength <= 80) return 'info';
    return 'success';
  };

  if (!password) return null;

  return (
    <Box sx={{ mt: 1 }}>
      <Typography variant="body2" sx={{ mb: 1 }}>
        Password Strength: <strong>{getStrengthLabel()}</strong>
      </Typography>
      <LinearProgress
        variant="determinate"
        value={strength}
        color={getStrengthColor()}
        sx={{ height: 8, borderRadius: 4, mb: 1 }}
      />
      <List dense>
        {criteria.map((criterion, index) => (
          <ListItem key={index} sx={{ py: 0 }}>
            <ListItemIcon sx={{ minWidth: 30 }}>
              {criterion.test ? (
                <CheckCircle color="success" fontSize="small" />
              ) : (
                <RadioButtonUnchecked color="disabled" fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary={criterion.label}
              primaryTypographyProps={{
                variant: 'body2',
                color: criterion.test ? 'success.main' : 'text.secondary'
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PasswordStrengthIndicator;
