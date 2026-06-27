import { useEffect, useMemo, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { CITIES, ARCS } from '../data/literaryCities';
import { MAJOR_CITIES } from '../data/majorCities';
import type { CityData, MajorCity } from '../lib/types';

const CONTINENTS = [
  { lat: 40, lng: 90, name: 'ASIA' },
  { lat: -15, lng: -60, name: 'S. AMERICA' },
  { lat: 45, lng: -100, name: 'N. AMERICA' },
  { lat: 5, lng: 20, name: 'AFRICA' },
  { lat: 50, lng: 15, name: 'EUROPE' },
  { lat: -25, lng: 135, name: 'OCEANIA' },
];

interface GlobeViewProps {
  selectedCity?: CityData | null;
  onHoverCity?: (city: CityData | null) => void;
  onClickCity?: (city: CityData) => void;
  rotationSpeed?: number;
  isPaused?: boolean;
}

type CountryFeature = Record<string, unknown>;

type Marker =
  | (MajorCity & { elementType: 'major-city' })
  | (CityData & { elementType: 'literary-city' })
  | (typeof CONTINENTS[number] & { elementType: 'continent' });

export default function GlobeView({
  selectedCity,
  onHoverCity,
  onClickCity,
  rotationSpeed = 0.35,
  isPaused = false,
}: GlobeViewProps) {
  const globeEl = useRef<any>(null);
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const [dimensions, setDimensions] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }));

  useEffect(() => {
    let cancelled = false;
    fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCountries(data.features || []);
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const globe = globeEl.current;
    if (!globe) return;
    globe.pointOfView({ altitude: 1.8 });
    const controls = globe.controls();
    controls.enableZoom = true;
    controls.autoRotate = !isPaused && rotationSpeed > 0;
    controls.autoRotateSpeed = rotationSpeed;
    controls.minDistance = 110;
    controls.maxDistance = 280;

    const scene = globe.scene();
    scene.children.forEach((obj: any) => {
      if (obj.type === 'AmbientLight') {
        obj.color = new THREE.Color('#ffffff');
        obj.intensity = 0.16;
      }
      if (obj.type === 'DirectionalLight') {
        obj.color = new THREE.Color('#fff0df');
        obj.intensity = 2.8;
      }
    });
  }, [isPaused, rotationSpeed]);

  useEffect(() => {
    if (!selectedCity || !globeEl.current) return;
    globeEl.current.pointOfView(
      { lat: selectedCity.lat, lng: selectedCity.lng, altitude: 0.82 },
      1400,
    );
  }, [selectedCity]);

  const globeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#08080a',
        roughness: 0.9,
        metalness: 0.1,
      }),
    [],
  );

  const markers = useMemo<Marker[]>(
    () => [
      ...CONTINENTS.map((continent) => ({ ...continent, elementType: 'continent' as const })),
      ...MAJOR_CITIES.map((city) => ({ ...city, elementType: 'major-city' as const })),
      ...CITIES.map((city) => ({ ...city, elementType: 'literary-city' as const })),
    ],
    [],
  );

  const globeSize = Math.min(dimensions.width * 0.78, dimensions.height * 0.78, 560);
  const globeWidth =
    dimensions.width >= 900
      ? Math.min(dimensions.width, Math.max(680, Math.floor(dimensions.width * 0.68)))
      : dimensions.width;

  return (
    <div className="globe-stage" aria-label="night atlas globe">
      <div
        className="globe-shadow"
        style={{ width: globeSize, height: globeSize }}
        aria-hidden="true"
      />
      <Globe
        ref={globeEl}
        width={globeWidth}
        height={dimensions.height}
        globeMaterial={globeMaterial}
        backgroundColor="rgba(0,0,0,0)"
        showAtmosphere={false}
        polygonsData={countries}
        polygonAltitude={0.015}
        polygonCapColor={() => '#d4ccba'}
        polygonSideColor={() => '#a89d87'}
        polygonStrokeColor={() => '#111111'}
        polygonsTransitionDuration={300}
        arcsData={ARCS}
        arcColor={() => ['rgba(246,173,85,0.08)', 'rgba(237,137,54,0.82)']}
        arcDashLength={0.4}
        arcDashGap={0.2}
        arcDashAnimateTime={4000}
        arcAltitude={0.1}
        htmlElementsData={markers}
        htmlElement={(marker: object) => {
          const d = marker as Marker;
          const el = document.createElement('div');

          if (d.elementType === 'continent') {
            el.className = 'continent-label';
            el.textContent = d.name;
            return el;
          }

          if (d.elementType === 'major-city') {
            el.className = 'major-city-marker';
            el.title = `${d.nameZh} / ${d.nameEn}`;
            el.setAttribute('aria-label', `${d.nameZh} / ${d.nameEn}`);
            el.innerHTML = `<span>${d.nameZh}</span>`;
            return el;
          }

          el.className = 'literary-city-marker';
          el.innerHTML = `<button type="button"><span>${d.nameNative}</span><strong>${d.author}</strong></button>`;
          el.addEventListener('mouseenter', () => onHoverCity?.(d));
          el.addEventListener('mouseleave', () => onHoverCity?.(null));
          el.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            onClickCity?.(d);
          });
          return el;
        }}
      />
    </div>
  );
}
