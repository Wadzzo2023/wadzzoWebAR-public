import { useState, useEffect } from 'react';

export function useGeolocation(lat: number, lng: number) {
    const [address, setAddress] = useState<string>('Loading address...');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAddress = async () => {
            setLoading(true);
            const result = await reverseGeocode(lat, lng);
            setAddress(result);
            setLoading(false);
        };

        fetchAddress();
    }, [lat, lng]);

    return { address, loading };
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.EXPO_PUBLIC_MAPBOX_API}`
        );

        if (!response.ok) {
            throw new Error('Mapbox API error');
        }

        const data = await response.json();
        const address = data.features?.[0]?.place_name || 'Address not found';

        return address;
    } catch (error) {
        console.error('Error fetching address:', error);
        return 'Address unavailable';
    }
}