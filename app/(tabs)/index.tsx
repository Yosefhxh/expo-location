import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  Platform,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import MapView, { Marker, type LatLng, type Region } from 'react-native-maps';
import { isDevice } from 'expo-device';
import * as Location from 'expo-location';

type LocationDetails = {
  title: string;
  subtitle: string;
};

const formatPlaceAddress = (place: Location.LocationGeocodedAddress | undefined) => {
  if (!place) {
    return '';
  }

  return [
    place.street,
    place.streetNumber,
    place.district,
    place.city,
    place.region,
    place.postalCode,
    place.country,
  ]
    .filter(Boolean)
    .join(', ');
};

const resolveLocationDetails = (place: Location.LocationGeocodedAddress | undefined) => {
  const title = place?.name ?? place?.street ?? place?.city ?? 'Ubicación actual';
  const subtitle =
    formatPlaceAddress(place) || place?.country || 'No se pudo resolver la dirección exacta.';

  return { title, subtitle };
};

const DEFAULT_REGION: Region = {
  latitude: 19.4326,
  longitude: -99.1332,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export default function HomeScreen() {
  const mapRef = useRef<MapView | null>(null);
  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const isSimulator = Platform.OS !== 'web' && !isDevice;
  const [coordinate, setCoordinate] = useState<LatLng | null>(null);
  const [locationDetails, setLocationDetails] = useState<LocationDetails | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied'>(
    'unknown',
  );

  const loadLocation = async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();

      if (!servicesEnabled) {
        setCoordinate(null);
        setLocationDetails(null);
        setAccuracy(null);
        setErrorMsg('Activa los servicios de ubicación del dispositivo para poder detectar tu GPS.');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        setCoordinate(null);
        setLocationDetails(null);
        setErrorMsg('El permiso para acceder a la ubicación fue denegado.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const currentCoordinate: LatLng = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };

      setCoordinate(currentCoordinate);
      setAccuracy(currentLocation.coords.accuracy ?? null);
      mapRef.current?.animateToRegion(
        {
          latitude: currentCoordinate.latitude,
          longitude: currentCoordinate.longitude,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        },
        600,
      );

      const reverseGeocoded = await Location.reverseGeocodeAsync(currentCoordinate);
      const place = reverseGeocoded[0];
      const { title, subtitle } = resolveLocationDetails(place);

      setLocationDetails({
        title,
        subtitle,
      });
    } catch {
      setCoordinate(null);
      setLocationDetails(null);
      setErrorMsg('No se pudo obtener la ubicación. Revisa el GPS y los permisos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (!isMounted) {
        return;
      }

      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');

      if (status !== 'granted') {
        setErrorMsg('El permiso para acceder a la ubicación fue denegado.');
        setLoading(false);
        return;
      }

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Highest,
          timeInterval: 2000,
          distanceInterval: 2,
        },
        async (position) => {
          if (!isMounted) {
            return;
          }

          const currentCoordinate: LatLng = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          setCoordinate(currentCoordinate);
          setAccuracy(position.coords.accuracy ?? null);
          setLoading(false);

          mapRef.current?.animateToRegion(
            {
              latitude: currentCoordinate.latitude,
              longitude: currentCoordinate.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            700,
          );

          try {
            const reverseGeocoded = await Location.reverseGeocodeAsync(currentCoordinate);
            const place = reverseGeocoded[0];
            const { title, subtitle } = resolveLocationDetails(place);

            setLocationDetails({
              title,
              subtitle,
            });
          } catch {
            setLocationDetails({
              title: 'Ubicación actual',
              subtitle: 'No se pudo resolver la dirección exacta.',
            });
          }
        },
      );
    };

    setLoading(true);
    void startWatching();

    return () => {
      isMounted = false;
      watchSubscription.current?.remove();
      watchSubscription.current = null;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTextBlock}>
            <Text style={styles.kicker}>Live GPS</Text>
            <Text style={styles.title}>Tu ubicación exacta</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              permissionStatus === 'granted' ? styles.statusGranted : styles.statusMuted,
            ]}>
            <Text style={styles.statusText}>
              {permissionStatus === 'granted'
                ? 'Ubicación activa'
                : permissionStatus === 'denied'
                  ? 'Permiso denegado'
                  : 'Verificando'}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>
          El mapa sigue tu posición en tiempo real, marca tu punto actual y resuelve el nombre del
          lugar junto con sus coordenadas.
        </Text>

        {isSimulator ? (
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Estás en simulador</Text>
            <Text style={styles.noticeText}>
              La dirección exacta depende de la ubicación simulada del iPhone Simulator. En el
              simulador ve a Features {'>'} Location y elige una ubicación real o personalizada.
            </Text>
          </View>
        ) : null}

        <View style={styles.mapCard}>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={DEFAULT_REGION}
            showsUserLocation
            followsUserLocation
            showsMyLocationButton
            loadingEnabled>
            {coordinate ? (
              <Marker coordinate={coordinate} title={locationDetails?.title ?? 'Ubicación actual'} />
            ) : null}
          </MapView>

          <View style={styles.mapOverlay}>
            <Text style={styles.overlayLabel}>Posición</Text>
            <Text style={styles.overlayValue}>
              {coordinate
                ? `${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)}`
                : 'Buscando...'}
            </Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#0a84ff" />
              <Text style={styles.loadingText}>Actualizando ubicación...</Text>
            </View>
          ) : errorMsg ? (
            <Text style={styles.error}>{errorMsg}</Text>
          ) : coordinate && locationDetails ? (
            <>
              <Text style={styles.placeTitle}>{locationDetails.title}</Text>
              <Text style={styles.placeSubtitle}>{locationDetails.subtitle}</Text>

              {isSimulator ? (
                <Text style={styles.precisionWarning}>
                  Si esta dirección no coincide contigo, configura una ubicación real en el
                  simulador o prueba en un iPhone físico.
                </Text>
              ) : null}

              {accuracy && accuracy > 80 ? (
                <Text style={styles.precisionWarning}>
                  La precisión actual es baja. Para una dirección más exacta, activa Ubicación
                  precisa y sal al exterior o cerca de una ventana.
                </Text>
              ) : null}

              <View style={styles.metricsRow}>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Latitud</Text>
                  <Text style={styles.metricValue}>{coordinate.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.metricBox}>
                  <Text style={styles.metricLabel}>Longitud</Text>
                  <Text style={styles.metricValue}>{coordinate.longitude.toFixed(6)}</Text>
                </View>
              </View>

              <View style={styles.metricBoxWide}>
                <Text style={styles.metricLabel}>Precisión</Text>
                <Text style={styles.metricValue}>
                  {accuracy ? `±${Math.round(accuracy)} m` : 'No disponible'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.placeholder}>Esperando datos de ubicación...</Text>
          )}
        </View>

        <Pressable style={styles.button} onPress={() => void loadLocation()}>
          <Text style={styles.buttonText}>Refrescar GPS</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4f7f7',
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: '#f4f7f7',
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#0a84ff',
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
    color: '#0f172a',
    flexShrink: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 22,
    color: '#475569',
    flexShrink: 1,
  },
  noticeCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: '#eef6ff',
    borderWidth: 1,
    borderColor: '#cfe2ff',
    gap: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '45%',
  },
  statusGranted: {
    backgroundColor: '#e7f7f2',
    borderColor: '#b8e7d7',
  },
  statusMuted: {
    backgroundColor: '#eef2f7',
    borderColor: '#d6dce6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  mapCard: {
    height: 300,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: '#dbe9e7',
    borderWidth: 1,
    borderColor: '#e2e8ee',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
  map: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  overlayLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
  },
  overlayValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  infoCard: {
    minHeight: 182,
    borderRadius: 28,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8ee',
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
    gap: 10,
  },
  placeholder: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  placeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  placeSubtitle: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
  precisionWarning: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 18,
    color: '#b45309',
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  metricBox: {
    flexGrow: 1,
    flexBasis: 140,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8ee',
  },
  metricBoxWide: {
    marginTop: 12,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8ee',
  },
  metricLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
    fontWeight: '700',
    flexShrink: 1,
  },
  metricValue: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    flexShrink: 1,
  },
  coords: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 24,
    color: '#0f172a',
    textAlign: 'center',
    fontWeight: '600',
    flexShrink: 1,
  },
  error: {
    fontSize: 16,
    lineHeight: 24,
    color: '#b91c1c',
    textAlign: 'center',
    fontWeight: '600',
  },
  button: {
    alignSelf: 'stretch',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#0a84ff',
    shadowColor: '#0a84ff',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
