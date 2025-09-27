import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Eye, EyeOff, Mail, Lock, Trophy } from 'lucide-react-native';

interface AuthFormProps {
    onAuthSuccess: () => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});


    const validateForm = () => {
        const newErrors: { email?: string; password?: string; confirm?: string } = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email';
        }

        if (!password.trim()) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!isLogin && password !== confirmPassword) {
            newErrors.confirm = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAuth = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setErrors({});

        try {


        } catch (error) {
            setErrors({ email: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setErrors({});
        setPassword('');
        setConfirmPassword('');
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <LinearGradient
                colors={['#0F172A', '#1E293B', '#334155']}
                style={styles.background}
            >
                <View style={styles.content}>
                    {/* Logo Section */}
                    <View style={styles.logoContainer}>
                        <View style={styles.logoWrapper}>
                            <LinearGradient
                                colors={['#F59E0B', '#D97706']}
                                style={styles.logoGradient}
                            >
                                <Trophy size={48} color="white" strokeWidth={2} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.appName}>Wadzzo</Text>
                        <Text style={styles.tagline}>Discover treasures in AR</Text>
                    </View>

                    {/* Form Section */}
                    <View style={styles.formContainer}>
                        <Text style={styles.formTitle}>
                            {isLogin ? 'Welcome Back' : 'Join the Hunt'}
                        </Text>
                        <Text style={styles.formSubtitle}>
                            {isLogin
                                ? 'Sign in to continue your treasure hunting adventure'
                                : 'Create your account and start discovering treasures'
                            }
                        </Text>

                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, errors.email && styles.inputError]}>
                                <Mail size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.textInput}
                                    placeholder="Email address"
                                    placeholderTextColor="#64748B"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                />
                            </View>
                            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <View style={[styles.inputWrapper, errors.password && styles.inputError]}>
                                <Lock size={20} color="#64748B" style={styles.inputIcon} />
                                <TextInput
                                    style={[styles.textInput, styles.passwordInput]}
                                    placeholder="Password"
                                    placeholderTextColor="#64748B"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                                <TouchableOpacity
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} color="#64748B" />
                                    ) : (
                                        <Eye size={20} color="#64748B" />
                                    )}
                                </TouchableOpacity>
                            </View>
                            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                        </View>

                        {/* Confirm Password Input (Sign Up Only) */}
                        {!isLogin && (
                            <View style={styles.inputContainer}>
                                <View style={[styles.inputWrapper, errors.confirm && styles.inputError]}>
                                    <Lock size={20} color="#64748B" style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.textInput, styles.passwordInput]}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#64748B"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        autoComplete="new-password"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff size={20} color="#64748B" />
                                        ) : (
                                            <Eye size={20} color="#64748B" />
                                        )}
                                    </TouchableOpacity>
                                </View>
                                {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}
                            </View>
                        )}

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                            onPress={handleAuth}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={loading ? ['#64748B', '#475569'] : ['#F59E0B', '#D97706']}
                                style={styles.submitGradient}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white" size="small" />
                                ) : (
                                    <Text style={styles.submitText}>
                                        {isLogin ? 'Sign In' : 'Create Account'}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        {/* Toggle Mode */}
                        <View style={styles.toggleContainer}>
                            <Text style={styles.toggleText}>
                                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                            </Text>
                            <TouchableOpacity onPress={toggleMode}>
                                <Text style={styles.toggleLink}>
                                    {isLogin ? 'Sign Up' : 'Sign In'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 40,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoWrapper: {
        marginBottom: 16,
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    appName: {
        fontSize: 32,
        fontFamily: 'Inter-Bold',
        color: '#F8FAFC',
        marginBottom: 4,
    },
    tagline: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
    },
    formContainer: {
        flex: 1,
    },
    formTitle: {
        fontSize: 28,
        fontFamily: 'Inter-Bold',
        color: '#F8FAFC',
        marginBottom: 8,
        textAlign: 'center',
    },
    formSubtitle: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        paddingHorizontal: 16,
        height: 56,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputIcon: {
        marginRight: 12,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#F8FAFC',
    },
    passwordInput: {
        marginRight: 12,
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        color: '#EF4444',
        marginTop: 8,
        marginLeft: 4,
    },
    submitButton: {
        marginTop: 12,
        marginBottom: 24,
        borderRadius: 12,
        overflow: 'hidden',
    },
    submitButtonDisabled: {
        opacity: 0.7,
    },
    submitGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitText: {
        fontSize: 18,
        fontFamily: 'Inter-SemiBold',
        color: 'white',
    },
    toggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleText: {
        fontSize: 16,
        fontFamily: 'Inter-Regular',
        color: '#94A3B8',
    },
    toggleLink: {
        fontSize: 16,
        fontFamily: 'Inter-SemiBold',
        color: '#F59E0B',
    },
});