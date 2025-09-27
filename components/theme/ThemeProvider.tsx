"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper"
import { useColorScheme } from "react-native"

const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: "#38C02B", // Your logo green - vibrant primary
        secondary: "#22c55e", // green-500 - green secondary
        tertiary: "#dcfce7", // green-100 - light green tertiary
        surface: "#f0fdf4", // green-50 - very light green surface
        surfaceVariant: "#ecfdf5", // green-25 - subtle green variant
        background: "#f7fee7", // lime-50 - very subtle greenish background
        onBackground: "#14532d", // green-900 - dark green text on light green bg
        onSurface: "#166534", // green-800 - readable green text
        accent: "#16a34a", // green-600 - deeper green accent
        card: "#f0fdf4", // green-50 - light green cards
        input: "#ecfdf5", // green-25 - subtle green input
        text: "#14532d", // green-900 - primary green text
        textSecondary: "#166534", // green-800 - secondary green text
        primaryText: "#ffffff", // white text for primary buttons
        border: "#bbf7d0", // green-200 - green borders
        success: "#16a34a", // green-600 - success green
        error: "#dc2626", // red-600 - keep red for errors (contrast)
        warning: "#ca8a04", // yellow-600 - more green-friendly warning
        muted: "#ecfdf5", // green-25 - muted green backgrounds
        cardBorder: "#bbf7d0", // green-200 - green card borders
        // Enhanced UI states with full green theme
        inputFocused: "#dcfce7", // green-100 - focused input background
        inputError: "#fef2f2", // red-50 - error input background (keep for contrast)
        successLight: "#dcfce7", // green-100 - success background
        warningLight: "#fefce8", // yellow-50 - warning background
        disabled: "#d1fae5", // green-100 - green disabled state
        shadow: "#38C02B20", // green shadow
        overlay: "#14532d60", // dark green overlay
        // Additional green variants for more options
        primaryLight: "#bbf7d0", // green-200 - light primary variant
        primaryDark: "#14532d", // green-900 - dark primary variant
        surfaceGreen: "#ecfdf5", // green-25 - subtle green surface
    },
}

const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: "#4ade80", // green-400 - bright green for dark mode visibility
        secondary: "#22c55e", // green-500 - green secondary
        tertiary: "#14532d", // green-900 - dark green tertiary
        surface: "#1a2e05", // very dark green surface
        surfaceVariant: "#0f2027", // darker green variant
        background: "#0a1f0a", // very dark greenish background
        onBackground: "#dcfce7", // green-100 - light green text
        onSurface: "#bbf7d0", // green-200 - readable light green text
        accent: "#16a34a", // green-600 - green accent
        card: "#14532d", // green-900 - dark green cards
        input: "#166534", // green-800 - visible green input
        text: "#dcfce7", // green-100 - primary light green text
        textSecondary: "#bbf7d0", // green-200 - secondary light green text
        primaryText: "#0f172a", // very dark text for primary buttons
        border: "#166534", // green-800 - visible green borders
        success: "#22c55e", // green-500 - bright success
        error: "#f87171", // red-400 - softer error (keep for contrast)
        warning: "#eab308", // yellow-500 - green-friendly warning
        muted: "#14532d", // green-900 - muted dark green backgrounds
        cardBorder: "#166534", // green-800 - green card borders
        // Enhanced UI states for dark mode with full green theme
        inputFocused: "#065f46", // green-800 - focused input background
        inputError: "#7f1d1d", // red-900 - error input background (keep for contrast)
        successLight: "#065f46", // green-800 - success background
        warningLight: "#713f12", // yellow-900 - warning background
        disabled: "#14532d", // green-900 - green disabled state
        shadow: "#00000050", // stronger shadow for dark mode
        overlay: "#0a1f0a80", // dark green overlay
        // Additional green variants for dark mode
        primaryLight: "#86efac", // green-300 - light primary variant for dark mode
        primaryDark: "#052e16", // green-950 - darkest green
        surfaceGreen: "#0f2027", // dark green surface
    },
}


interface ThemeContextType {
    theme: typeof lightTheme
    isDark: boolean
    toggleTheme: () => void
    colors: typeof lightTheme.colors
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const systemColorScheme = useColorScheme()
    const [isDark, setIsDark] = useState(systemColorScheme === "dark")

    useEffect(() => {
        setIsDark(systemColorScheme === "dark")
    }, [systemColorScheme])

    const toggleTheme = () => {
        setIsDark(!isDark)
    }

    const theme = isDark ? darkTheme : lightTheme

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, colors: theme.colors }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useAppTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error("useAppTheme must be used within ThemeProvider")
    }
    return context
}

export const useTheme = useAppTheme
