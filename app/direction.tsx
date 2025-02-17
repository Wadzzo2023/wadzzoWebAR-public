'use client';

import React, { useEffect, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    ActivityIndicator,
    FlatList,
} from 'react-native';
import Mapbox, {
    Logger,
    Camera,
    Images,
    LocationPuck,
    MapView,
    MarkerView,
    ShapeSource,
    SymbolLayer,
    UserLocation,
    UserTrackingMode,
    PointAnnotation,
    LineLayer,
} from "@rnmapbox/maps";

import { useNavigation, useRoute } from '@react-navigation/native';
import { Text } from 'react-native';
import { useModal } from '@/components/hooks/useModal';
import { useDirectionStore } from '@/components/store/direction-store';
import { Color } from '@/components/utils/all-colors';
import { Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ColorfulCard from '@freakycoder/react-native-colorful-card';
import { Button } from 'react-native-paper';

type LocationType = {
    latitude: number;
    longitude: number;
};

Logger.setLogCallback(log => {
    const { message } = log;

    if (
        message.match('Request failed due to a permanent error: Canceled') ||
        message.match('Request failed due to a permanent error: Socket Closed')
    ) {
        return true;
    }
    return false;
});
Mapbox.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_API!);

const routeProfiles = [
    { id: 'walking', label: 'Walking', icon: 'walk' },
    { id: 'cycling', label: 'Cylcing', icon: 'bicycle' },
    { id: 'driving', label: 'Driving', icon: 'car' },
];

const StoreLocation: React.FC = () => {
    const { data } = useModal();
    const { data: DirectionData } = useDirectionStore()
    const [routeDirections, setRouteDirections] = useState<any | null>(null);
    const [coords, setCoords] = useState<[number, number]>([
        DirectionData?.currentLocation?.longitude ?? 0,
        DirectionData?.currentLocation?.latitude ?? 0
    ]);
    const [distance, setDistance] = useState<string | null>(null);
    const [duration, setDuration] = useState<string | null>(null);
    const [destinationCoords, setDestinationCoords] = useState<[number, number]>([
        DirectionData?.destinationLocation?.longitude ?? 0,
        DirectionData?.destinationLocation?.latitude ?? 0
    ]);
    const [loading, setLoading] = useState(true);
    const [selectedRouteProfile, setselectedRouteProfile] =
        useState<string>('walking');
    const route = useRoute<any>();
    const navigation = useNavigation<any>();

    console.log("coords", coords);
    console.log("destinationCoords", destinationCoords);

    useEffect(() => {
        if (selectedRouteProfile !== null) {
            createRouterLine([coords[0], coords[1]], selectedRouteProfile);
        }
    }, [selectedRouteProfile, coords[0], coords[1]]); // Added coords[0] and coords[1] to dependencies

    useEffect(() => {
        const fetchData = async () => {
            await createRouterLine(coords, selectedRouteProfile);
        };
        fetchData();
    }, []);

    function makeRouterFeature(coordinates: [number, number][]): any {
        let routerFeature = {
            type: 'FeatureCollection',
            features: [
                {
                    type: 'Feature',
                    properties: {},
                    geometry: {
                        type: 'LineString',
                        coordinates: coordinates,
                    },
                },
            ],
        };
        return routerFeature;
    }

    async function createRouterLine(
        coords: [number, number],
        routeProfile: string,
    ): Promise<void> {
        const startCoords = `${coords[0]},${coords[1]}`;
        const endCoords = `${[destinationCoords[0], destinationCoords[1]]}`;
        console.log("startCoords", startCoords);
        console.log("endCoords", endCoords);
        const geometries = 'geojson';
        const url = `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/${startCoords};${endCoords}?alternatives=true&geometries=${geometries}&steps=true&banner_instructions=true&overview=full&voice_instructions=true&access_token=${process.env.EXPO_PUBLIC_MAPBOX_API}`;

        try {
            let response = await fetch(url);
            let json = await response.json();
            console.log("json", json);
            const data = json.routes.map((data: any) => {
                console.log(data);
                setDistance((data.distance / 1000).toFixed(2));
                setDuration((data.duration / 3600).toFixed(2));
            });
            let coordinates = json['routes'][0]['geometry']['coordinates'];
            let destinationCoordinates =
                json['routes'][0]['geometry']['coordinates'].slice(-1)[0];
            setDestinationCoords(destinationCoordinates);
            if (coordinates.length) {
                const routerFeature = makeRouterFeature([...coordinates]);
                setRouteDirections(routerFeature);
                console.log("routerFeature", routerFeature);
            }
            setLoading(false);
        } catch (e) {
            setLoading(false);
            console.log(e);
        }
    }

    const renderItem = ({
        item,
    }: {
        item: { id: string; label: string; icon: string };
    }) => (
        <TouchableOpacity
            style={[
                styles.routeProfileButton,
                item.id == selectedRouteProfile && styles.selectedRouteProfileButton,
            ]}
            onPress={() => setselectedRouteProfile(item.id)}>

            <Text
                style={[
                    styles.routeProfileButtonText,
                    item.id == selectedRouteProfile &&
                    styles.selectedRouteProfileButtonText,
                ]}>
                <MaterialCommunityIcons name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap} size={24} color="black" />
                {item.label}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                zoomEnabled={true}
                pitchEnabled={true}
                logoEnabled={false}
                attributionEnabled={false}
                styleURL="mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto"
                rotateEnabled={true}
            >
                <Camera
                    zoomLevel={16}
                    defaultSettings={{
                        centerCoordinate: [coords[0], coords[1]],
                    }}
                    centerCoordinate={[coords[0], coords[1]]}
                    animationMode={'flyTo'}
                    followZoomLevel={16}
                    followPitch={16}
                    heading={0}
                    pitch={0}
                />
                {routeDirections && (
                    <ShapeSource id="line1" shape={routeDirections}>
                        <LineLayer
                            id="routerLine01"
                            style={{
                                lineColor: Color.wadzzo,
                                lineWidth: 4,
                                lineCap: 'round',
                                lineDasharray: [1, 1], // This creates the dotted line effect

                            }}
                        />
                    </ShapeSource>
                )}

                {destinationCoords && (
                    <MarkerView
                        id="destinationPoint"
                        allowOverlap={true}
                        allowOverlapWithPuck={true}
                        coordinate={[destinationCoords[0], destinationCoords[1]]}
                    >
                        <Image
                            source={{
                                uri: data.Collection?.brand_image_url,
                            }}
                            height={30}
                            width={30}
                            style={[
                                {
                                    height: 30,
                                    width: 30,
                                    borderWidth: 2,
                                    borderColor: Color.wadzzo,
                                },
                                !data.Collection?.auto_collect && {
                                    borderRadius: 20,
                                },
                                data.Collection?.auto_collect && { opacity: 0.4 },
                            ]}
                        />
                    </MarkerView>
                )}
                <LocationPuck
                    pulsing={{ isEnabled: true }}
                    puckBearingEnabled
                    puckBearing="heading"
                />
            </MapView>
            <Button
                mode="contained"
                onPress={() => {
                    navigation.goBack()
                }}
                style={{
                    position: 'absolute',
                    top: 50,
                    left: 10,
                    zIndex: 1,
                    backgroundColor: Color.wadzzo,
                    padding: 0,
                    borderRadius: 10
                }}
            >
                <MaterialCommunityIcons name='arrow-left' size={24} color='white' />
            </Button>
            <FlatList
                data={routeProfiles}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                horizontal
                contentContainerStyle={styles.routeProfileList}
                showsHorizontalScrollIndicator={false}
                style={styles.flatList}
            />

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
            </TouchableOpacity>
            {loading ? (
                <ActivityIndicator
                    size="large"
                    color="white"
                    style={styles.loadingIndicator}
                />
            ) : (
                routeDirections && (
                    <View style={styles.cardContainer}>
                        <ColorfulCard
                            title={`${data.Collection?.title}`}
                            value={`${duration} h`}
                            footerTitle="Distance"
                            footerValue={`${distance} km`}
                            iconImageSource={require('../assets/icons/info.png')}
                            style={{
                                backgroundColor: Color.wadzzo,
                            }}
                            onPress={() => { }}
                        />
                    </View>
                )
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 1,
        backgroundColor: 'rgba(0, 0 ,0 , 0.5)',
        borderRadius: 20,
        padding: 8,
    },
    loadingIndicator: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        zIndex: 2,
    },
    cardContainer: {
        position: 'absolute',
        top: 50,
        right: 10,
        zIndex: 1,
    },
    destinationIcon: {
        width: 30,
        height: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
    routeProfileList: {
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    flatList: {
        position: 'absolute',
        bottom: 20,
        left: Dimensions.get('window').width / 2 - 170,
        right: 0,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    routeProfileButton: {
        width: 100,
        height: 40,
        borderRadius: 10,
        marginHorizontal: 5,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Color.offWhite,
        color: 'black',
    },
    selectedRouteProfileButton: {
        backgroundColor: Color.wadzzo,
        borderColor: '#FA9E14',
    },
    routeProfileButtonText: {
        color: 'black',
    },
    selectedRouteProfileButtonText: {
        color: 'black',
    },
});

export default StoreLocation;