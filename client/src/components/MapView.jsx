import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import useSupercluster from 'use-supercluster';
import useVehicleStore from '../store/vehicleStore';

const DEFAULT_MAP_CENTER = [40.7128, -74.0060];
const DEFAULT_ZOOM = 12;
const MAX_CLUSTER_ZOOM = 18;
const SUPERCLUSTER_RADIUS = 75;

const createClusterCustomIcon = (clusterFeature) => {
  const vehicleCountInCluster = clusterFeature.properties.point_count;
  let iconSizeInPixels = vehicleCountInCluster < 100 ? 30 : vehicleCountInCluster < 1000 ? 40 : 50;
  
  return L.divIcon({
    html: `<div class="cluster-marker" style="width: ${iconSizeInPixels}px; height: ${iconSizeInPixels}px;">${vehicleCountInCluster}</div>`,
    className: 'custom-cluster-marker',
    iconSize: L.point(iconSizeInPixels, iconSizeInPixels, true),
  });
};

const defaultVehicleIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const selectedVehicleIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function MapInteractionHandler() {
  const findNearestDriver = useVehicleStore(state => state.findNearestDriver);
  const clearCurrentSelection = useVehicleStore(state => state.clearSelection);
  const isSearchingForDriver = useVehicleStore(state => state.isSearching);

  useMapEvents({
    click(event) {
      if (!isSearchingForDriver) {
        clearCurrentSelection();
        findNearestDriver(event.latlng.lat, event.latlng.lng);
      }
    }
  });

  return null;
}

function MarkersRenderer() {
  const leafletMapInstance = useMap();
  
  const [visibleBounds, setVisibleBounds] = useState(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState(DEFAULT_ZOOM);
  
  const liveVehiclesDictionary = useVehicleStore(state => state.vehicles);
  const userSelectedVehicle = useVehicleStore(state => state.selectedVehicle);

  const handleMapMovement = useCallback(() => {
    const leafletBounds = leafletMapInstance.getBounds();
    setVisibleBounds([
      leafletBounds.getSouthWest().lng,
      leafletBounds.getSouthWest().lat,
      leafletBounds.getNorthEast().lng,
      leafletBounds.getNorthEast().lat
    ]);
    setCurrentZoomLevel(leafletMapInstance.getZoom());
  }, [leafletMapInstance]);

  useEffect(() => {
    handleMapMovement();
    leafletMapInstance.on('moveend', handleMapMovement);
    
    return () => leafletMapInstance.off('moveend', handleMapMovement);
  }, [leafletMapInstance, handleMapMovement]);

  const geoJsonPoints = useMemo(() => {
    return Object.values(liveVehiclesDictionary).map(vehicle => ({
      type: 'Feature',
      properties: { 
        cluster: false, 
        vehicleId: vehicle.id, 
        vehicleData: vehicle 
      },
      geometry: { 
        type: 'Point', 
        coordinates: [vehicle.longitude, vehicle.latitude] 
      }
    }));
  }, [liveVehiclesDictionary]);

  const { clusters, supercluster } = useSupercluster({
    points: geoJsonPoints,
    bounds: visibleBounds,
    zoom: currentZoomLevel,
    options: { radius: SUPERCLUSTER_RADIUS, maxZoom: MAX_CLUSTER_ZOOM }
  });

  return (
    <>
      {clusters.map(clusterFeature => {
        const [longitude, latitude] = clusterFeature.geometry.coordinates;
        const isThisACluster = clusterFeature.properties.cluster;

        if (isThisACluster) {
          return (
             <Marker
                key={`cluster-${clusterFeature.id}`}
                position={[latitude, longitude]}
                icon={createClusterCustomIcon(clusterFeature)}
                eventHandlers={{
                  click: () => {
                    const expansionZoomLevel = Math.min(
                      supercluster.getClusterExpansionZoom(clusterFeature.id),
                      MAX_CLUSTER_ZOOM
                    );
                    leafletMapInstance.setView([latitude, longitude], expansionZoomLevel, {
                      animate: true
                    });
                  }
                }}
             />
          );
        }

        const vehicleInfo = clusterFeature.properties.vehicleData;
        const isVehicleCurrentlySelected = userSelectedVehicle?.id === vehicleInfo.id;

        return (
          <Marker
            key={vehicleInfo.id}
            position={[latitude, longitude]}
            icon={isVehicleCurrentlySelected ? selectedVehicleIcon : defaultVehicleIcon}
            zIndexOffset={isVehicleCurrentlySelected ? 1000 : 0}
          >
            <Popup>
               <div className="font-sans min-w-[120px]">
                 <h3 className="font-bold text-gray-800 text-base">{vehicleInfo.id}</h3>
                 <p className="text-gray-600 my-1 text-sm border-b pb-1">Driver: {vehicleInfo.driverName}</p>
                 <div className="flex justify-between text-xs mt-2 text-gray-500">
                   <span>{vehicleInfo.speed} km/h</span>
                   <span className="uppercase font-bold text-emerald-600">{vehicleInfo.status}</span>
                 </div>
               </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

export default function MapView() {
  const generatedRouteParams = useVehicleStore(state => state.activeRoute);
  const isAwaitingWorkerCalculation = useVehicleStore(state => state.isSearching);

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={DEFAULT_MAP_CENTER} 
        zoom={DEFAULT_ZOOM} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        
        <MapInteractionHandler />
        <MarkersRenderer />

        {generatedRouteParams && generatedRouteParams.length > 0 && (
          <Polyline 
            positions={generatedRouteParams.map(point => [point.lat, point.lng])} 
            color="#3b82f6" 
            weight={5} 
            opacity={0.8}
            dashArray="10, 10"
          />
        )}
      </MapContainer>

      {isAwaitingWorkerCalculation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 text-white px-6 py-3 rounded-full shadow-lg z-[1000] flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="font-medium tracking-wide">Calculating route mathematically...</span>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur border border-slate-700 p-4 rounded-lg shadow-xl z-[1000] text-sm text-slate-300">
        <p className="mb-2 flex items-center gap-2">
           <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span> 
           <span><strong className="text-white">Click anywhere on the map</strong> to find the nearest driver.</span>
        </p>
        <p className="flex items-center gap-2">
           <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block"></span> 
           <span><strong className="text-white">Scroll / Zoom</strong> to group markers and prevent visual clutter.</span>
        </p>
      </div>
    </div>
  );
}
