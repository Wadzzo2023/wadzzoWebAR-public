// Convert GPS coordinates to AR world coordinates with closer positioning
export const gpsToARPosition = (
    userLat: number,
    userLng: number,
    pinLat: number,
    pinLng: number,
    distance: number,
): [number, number, number] => {
    // Calculate bearing (direction) from user to pin
    const bearing = calculateBearing(userLat, userLng, pinLat, pinLng)

    // Convert bearing to radians
    const bearingRad = (bearing * Math.PI) / 180

    // Much closer distance scaling for AR - bring items much closer
    let arDistance: number
    if (distance < 25) {
        arDistance = 0.8 + (distance / 25) * 0.7 // 0.8-1.5 units for very close items
    } else if (distance < 50) {
        arDistance = 1.5 + ((distance - 25) / 25) * 0.8 // 1.5-2.3 units for close items
    } else if (distance < 100) {
        arDistance = 2.3 + ((distance - 50) / 50) * 1.2 // 2.3-3.5 units for medium distance
    } else {
        arDistance = 3.5 + Math.min((distance - 100) / 100, 1.5) // 3.5-5 units for far items
    }

    // Calculate AR position (x, y, z)
    const x = Math.sin(bearingRad) * arDistance
    const z = -Math.cos(bearingRad) * arDistance // Negative Z is forward in AR

    // Height variation - keep coins at eye level or slightly below
    const y = 0.2 + Math.sin(bearing * 0.05) * 0.15 // Slight height variation, closer to eye level

    return [x, y, z]
}

// Calculate bearing between two GPS points
export const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180

    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

    const bearing = (Math.atan2(y, x) * 180) / Math.PI
    return (bearing + 360) % 360
}

// Get distance between two GPS points in meters
export const getDistanceFromLatLonInMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000 // Radius of Earth in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

// Filter and sort pins to avoid clustering with closer positioning
export const getSpacedARPins = (userLocation: { latitude: number; longitude: number }, pins: any[], maxPins = 8) => {
    // Sort by distance
    const sortedPins = pins
        .map((pin) => ({
            ...pin,
            distance: getDistanceFromLatLonInMeters(userLocation.latitude, userLocation.longitude, pin.lat, pin.lng),
        }))
        .sort((a, b) => a.distance - b.distance)

    // Filter to avoid clustering - reduced minimum bearing difference for closer items
    const spacedPins = []
    const usedBearings: number[] = []
    const minBearingDiff = 15 // Reduced from 20 to 15 degrees for closer spacing

    for (const pin of sortedPins) {
        if (spacedPins.length >= maxPins) break

        const bearing = calculateBearing(userLocation.latitude, userLocation.longitude, pin.lat, pin.lng)

        // Check if this bearing is too close to existing ones
        const tooClose = usedBearings.some((usedBearing) => {
            const diff = Math.abs(bearing - usedBearing)
            return Math.min(diff, 360 - diff) < minBearingDiff
        })

        if (!tooClose) {
            spacedPins.push(pin)
            usedBearings.push(bearing)
        }
    }

    return spacedPins
}
