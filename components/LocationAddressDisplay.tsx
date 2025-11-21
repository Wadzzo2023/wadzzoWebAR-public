import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useGeolocation } from "./hooks/use-geolocation";

interface LocationAddressDisplayProps {
    latitude: number;
    longitude: number;
}

export function LocationAddressDisplay({
    latitude,
    longitude,
}: LocationAddressDisplayProps) {
    const { address, loading } = useGeolocation(latitude, longitude);

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color="#6b7280" style={styles.indicator} />
                    <Text style={styles.text}>Loading address...</Text>
                </View>
            ) : (
                <Text style={styles.text}>{address}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
    },
    icon: {
        marginRight: 8,
        fontSize: 16,
    },
    loadingRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    indicator: {
        marginRight: 6,
    },
    text: {
        fontSize: 14,
        color: "#4b5563",
    },
});