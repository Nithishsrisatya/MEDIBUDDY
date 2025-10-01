import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    Link,
    Alert,
    Paper,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    InputAdornment,
    ToggleButton,
    ToggleButtonGroup,
    Stepper,
    Step,
    StepLabel
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useAuth } from '../contexts/AuthContext';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const validationSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(6, 'Password should be of minimum 6 characters length').required('Password is required'),
  role: yup.string().oneOf(['patient','doctor']).required('Role is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be 10 digits').required('Phone number is required'),

  // doctor conditional fields
  specialization: yup.string().when('role', {
    is: 'doctor',
    then: (schema) => schema.required('Specialization is required'),
    otherwise: (schema) => schema.nullable()
  }),
  qualification: yup.string().when('role', {
    is: 'doctor',
    then: (schema) => schema.required('Qualification is required'),
    otherwise: (schema) => schema.nullable()
  }),
  experience: yup.number().when('role', {
    is: 'doctor',
    then: (schema) => schema.min(1,'Experience must be at least 1 year').required('Experience is required'),
    otherwise: (schema) => schema.nullable()
  }),
  availability: yup.string().when('role', {
    is: 'doctor',
    then: (schema) => schema.required('Availability is required'),
    otherwise: (schema) => schema.nullable()
  }),

  // patient conditional fields
  dateOfBirth: yup.string().when('role', {
    is: 'patient',
    then: (schema) => schema.required('Date of Birth is required'),
    otherwise: (schema) => schema.nullable()
  }),
  gender: yup.string().when('role', {
    is: 'patient',
    then: (schema) => schema.required('Gender is required'),
    otherwise: (schema) => schema.nullable()
  })
});

const Register = () => {
    const { register, loginWithProvider } = useAuth();
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const steps = ['Basic Information', 'Additional Details'];

    const formik = useFormik({
        initialValues: {
            name: '',
            email: '',
            password: '',
            role: 'patient',
            phone: '',
            specialization: '',
            qualification: '',
            experience: '',
            clinicName: '',
            consultationFee: '',
            availability: '',
            registrationNumber: '',
            bio: '',
            dateOfBirth: '',
            gender: ''
        },
        validationSchema: validationSchema,
        onSubmit: async (values) => {
            try {
                const result = await register(values);
                if (result.success) {
                    navigate('/login');
                } else {
                    if (result.errors) {
                        result.errors.forEach(err => formik.setFieldError(err.field, err.message));
                    } else {
                        setError(result.message);
                    }
                }
            } catch (error) {
                setError('An error occurred during registration');
            }
        },
    });

    const handleNext = () => {
        if (activeStep === 0) {
            const basicFields = ['name', 'email', 'password', 'role', 'phone'];
            let isValid = true;
            basicFields.forEach(field => {
                formik.setTouched({ [field]: true });
                if (formik.errors[field]) {
                    isValid = false;
                }
            });
            if (isValid) {
                setActiveStep(1);
            }
        } else {
            formik.handleSubmit();
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box sx={{ width: '100%' }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            id="name"
                            name="name"
                            label="Full Name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            error={formik.touched.name && Boolean(formik.errors.name)}
                            helperText={formik.touched.name && formik.errors.name}
                            autoFocus
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="email"
                            name="email"
                            label="Email Address"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="password"
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() => setShowPassword((s) => !s)}
                                            edge="end"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <PasswordStrengthIndicator password={formik.values.password} />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="phone"
                            name="phone"
                            label="Phone Number"
                            value={formik.values.phone}
                            onChange={(e) => {
                                const value = e.target.value || '';
                                const trimmed = value.replace(/\s+/g, '');
                                if (/^\d*$/.test(trimmed)) {
                                    formik.setFieldValue('phone', trimmed);
                                }
                            }}
                            error={formik.touched.phone && Boolean(formik.errors.phone)}
                            helperText={formik.touched.phone && formik.errors.phone}
                            inputProps={{ maxLength: 10, inputMode: 'numeric', pattern: '[0-9]*' }}
                        />
                        <Box sx={{ my: 1 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>I am a</Typography>
                            <ToggleButtonGroup
                                value={formik.values.role}
                                exclusive
                                onChange={(e, val) => { if (val) formik.setFieldValue('role', val); }}
                                aria-label="role"
                                sx={{ display: 'flex', gap: 1 }}
                            >
                                <ToggleButton value="patient" aria-label="patient">
                                    Patient
                                </ToggleButton>
                                <ToggleButton value="doctor" aria-label="doctor">
                                    Doctor
                                </ToggleButton>
                            </ToggleButtonGroup>
                            {formik.touched.role && formik.errors.role && (
                                <Typography color="error" variant="caption">{formik.errors.role}</Typography>
                            )}
                        </Box>
                    </Box>
                );
            case 1:
                return (
                    <Box sx={{ width: '100%' }}>
                        {formik.values.role === 'patient' && (
                            <>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    label="Date of Birth"
                                    type="date"
                                    value={formik.values.dateOfBirth || ''}
                                    onChange={formik.handleChange}
                                    error={formik.touched.dateOfBirth && Boolean(formik.errors.dateOfBirth)}
                                    helperText={formik.touched.dateOfBirth && formik.errors.dateOfBirth}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                                <FormControl fullWidth margin="normal">
                                    <InputLabel id="gender-label">Gender</InputLabel>
                                    <Select
                                        labelId="gender-label"
                                        id="gender"
                                        name="gender"
                                        value={formik.values.gender || ''}
                                        label="Gender"
                                        onChange={formik.handleChange}
                                    >
                                        <MenuItem value="male">Male</MenuItem>
                                        <MenuItem value="female">Female</MenuItem>
                                        <MenuItem value="other">Other</MenuItem>
                                    </Select>
                                    {formik.touched.gender && formik.errors.gender && (
                                        <Typography color="error" variant="caption">{formik.errors.gender}</Typography>
                                    )}
                                </FormControl>
                            </>
                        )}
                        {formik.values.role === 'doctor' && (
                            <>
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="specialization"
                                    name="specialization"
                                    label="Specialization"
                                    value={formik.values.specialization}
                                    onChange={formik.handleChange}
                                    error={formik.touched.specialization && Boolean(formik.errors.specialization)}
                                    helperText={formik.touched.specialization && formik.errors.specialization}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="qualification"
                                    name="qualification"
                                    label="Qualification"
                                    value={formik.values.qualification}
                                    onChange={formik.handleChange}
                                    error={formik.touched.qualification && Boolean(formik.errors.qualification)}
                                    helperText={formik.touched.qualification && formik.errors.qualification}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="experience"
                                    name="experience"
                                    label="Years of Experience"
                                    type="number"
                                    value={formik.values.experience}
                                    onChange={formik.handleChange}
                                    error={formik.touched.experience && Boolean(formik.errors.experience)}
                                    helperText={formik.touched.experience && formik.errors.experience}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="clinicName"
                                    name="clinicName"
                                    label="Clinic Name"
                                    value={formik.values.clinicName}
                                    onChange={formik.handleChange}
                                    error={formik.touched.clinicName && Boolean(formik.errors.clinicName)}
                                    helperText={formik.touched.clinicName && formik.errors.clinicName}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="consultationFee"
                                    name="consultationFee"
                                    label="Consultation Fee (₹)"
                                    type="number"
                                    value={formik.values.consultationFee}
                                    onChange={formik.handleChange}
                                    error={formik.touched.consultationFee && Boolean(formik.errors.consultationFee)}
                                    helperText={formik.touched.consultationFee && formik.errors.consultationFee}
                                    inputProps={{ min: 0 }}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="availability"
                                    name="availability"
                                    label="Availability (e.g., Mon-Fri 10 AM-2 PM)"
                                    value={formik.values.availability}
                                    onChange={formik.handleChange}
                                    error={formik.touched.availability && Boolean(formik.errors.availability)}
                                    helperText={formik.touched.availability && formik.errors.availability}
                                    placeholder="e.g., Mon-Fri 10 AM-2 PM, Sat 9 AM-1 PM"
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="registrationNumber"
                                    name="registrationNumber"
                                    label="Registration Number"
                                    value={formik.values.registrationNumber}
                                    onChange={formik.handleChange}
                                    error={formik.touched.registrationNumber && Boolean(formik.errors.registrationNumber)}
                                    helperText={formik.touched.registrationNumber && formik.errors.registrationNumber}
                                />
                                <TextField
                                    margin="normal"
                                    fullWidth
                                    id="bio"
                                    name="bio"
                                    label="Bio"
                                    multiline
                                    rows={3}
                                    value={formik.values.bio}
                                    onChange={formik.handleChange}
                                    error={formik.touched.bio && Boolean(formik.errors.bio)}
                                    helperText={formik.touched.bio && formik.errors.bio}
                                    placeholder="Tell us about yourself..."
                                />
                            </>
                        )}
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    return (
        <Container component="main" maxWidth="sm">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper
                    elevation={3}
                    sx={{
                        padding: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '100%',
                    }}
                >
                    <Typography component="h1" variant="h5">
                        Create your MediBuddy Account
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                    <Stepper activeStep={activeStep} sx={{ width: '100%', mt: 2 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <Box sx={{ mt: 2, width: '100%' }}>
                        {getStepContent(activeStep)}
                        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
                            <Button
                                color="inherit"
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                sx={{ mr: 1 }}
                            >
                                Back
                            </Button>
                            <Box sx={{ flex: '1 1 auto' }} />
                            <Button onClick={handleNext}>
                                {activeStep === steps.length - 1 ? 'Sign Up' : 'Next'}
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ mt: 2, width: '100%' }}>
                        <Typography variant="body2" sx={{ textAlign: 'center', mb: 1 }}>Or sign up with</Typography>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => loginWithProvider('google')}
                                sx={{ flex: 1 }}
                            >
                                Google
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => loginWithProvider('facebook')}
                                sx={{ flex: 1 }}
                            >
                                Facebook
                            </Button>
                        </Box>
                    </Box>
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link component={RouterLink} to="/login" variant="body2">
                            {"Already have an account? Sign In"}
                        </Link>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register; 