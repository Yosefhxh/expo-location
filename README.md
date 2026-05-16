# GPS Location Demo

Una experiencia simple y pulida para mostrar la ubicacion actual del usuario en tiempo real, con mapa, marcador, nombre del lugar y coordenadas.

## Vista General

Este proyecto es una app de prueba construida con Expo y React Native. Su objetivo es demostrar una implementacion clara de GPS en dispositivo movil, usando la libreria oficial de ubicacion de Expo y un mapa nativo para visualizar la posicion del usuario.

La pantalla principal funciona como una vista unica de localizacion:

- solicita permiso de ubicacion en primer plano
- obtiene la posicion actual del dispositivo
- actualiza el mapa en tiempo real
- coloca un marcador sobre la ubicacion detectada
- intenta resolver el nombre y la direccion aproximada del lugar
- muestra latitud, longitud y precision estimada

## Captura de Pantalla

Agrega aqui una imagen del sistema para documentar como se ve la app.

Recomendacion de ruta para la captura:

`assets/images/gps-preview.png`

Ejemplo de referencia para el README:

```md
![Vista del sistema](./assets/images/gps-preview.png)
```

## Tecnologia Utilizada

- Expo Router para la navegacion basada en archivos
- `expo-location` para permisos, GPS y geocodificacion inversa
- `react-native-maps` para renderizar el mapa y el marcador
- React Native para la interfaz
- TypeScript para tipado y mantenimiento

## Como Funciona

1. Al abrir la app, la pantalla principal carga la vista GPS.
2. La app valida que los servicios de ubicacion esten activos.
3. Solicita permiso de ubicacion al usuario.
4. Si el permiso es concedido, obtiene la posicion actual del dispositivo.
5. Con esa posicion, centra el mapa y coloca un marcador.
6. Luego ejecuta geocodificacion inversa para intentar obtener el nombre del lugar y su direccion aproximada.
7. Con `watchPositionAsync`, la pantalla sigue los cambios de posicion en tiempo real.

## Importante Sobre la Precision

La calidad de la ubicacion depende de varios factores:

- si estas en iPhone real o en simulador
- si tienes activada la ubicacion precisa
- la calidad de la senal GPS
- si estas en interior o exterior

En simulador, la direccion puede no coincidir con tu ubicacion real porque el sistema usa una ubicacion simulada. Para probar resultados reales, usa un iPhone fisico con GPS activo.

## Instalacion

1. Instala dependencias:

```bash
npm install
```

2. Inicia el proyecto:

```bash
npm run ios
```

Tambien puedes usar:

```bash
npm run start
```

## Uso

- Abre la app en iPhone o simulador.
- Permite el acceso a ubicacion cuando el sistema lo solicite.
- Observa el mapa, el marcador y los datos de direccion.
- Presiona `Refrescar GPS` si quieres forzar una nueva lectura.

## Dependencias Clave

- `expo-location`
- `react-native-maps`
- `expo-device`
- `expo-router`

## Estructura Relevante

- `app/(tabs)/index.tsx` - pantalla principal de GPS
- `app/(tabs)/_layout.tsx` - navegacion de pestañas
- `app.json` - permisos y configuracion nativa
- `package.json` - dependencias y scripts

## Scripts Disponibles

```bash
npm run ios
npm run android
npm run web
npm run lint
npm run start
```

## Notas de Desarrollo

- El proyecto usa Expo Router con una sola pestaña visible enfocada en GPS.
- La app esta pensada para una experiencia limpia, centrada en localizacion.
- Si agregas la captura sugerida, el README queda listo como presentacion de proyecto.

## Soporte de Permisos

La app requiere permisos de ubicacion en primer plano para funcionar correctamente.

En iOS, el permiso se define en `app.json` dentro de `ios.infoPlist`.

En Android, la app solicita permisos de ubicacion coarse y fine.

## Proximo Paso Recomendado

Si quieres llevar esta demo a un nivel mas completo, puedes agregar:

- una captura real del mapa en `assets/images/gps-preview.png`
- soporte para compartir ubicacion
- historial de ubicaciones
- un panel mas visual tipo Apple Maps

