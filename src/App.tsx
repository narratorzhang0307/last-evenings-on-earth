import { useState } from 'react';
import { CityDetailsPanel } from './components/CityDetailsPanel';
import GlobeView from './components/GlobeView';
import { CITIES } from './data/literaryCities';
import { MAJOR_CITIES } from './data/majorCities';
import { getDuskString } from './lib/dusk';
import type { CityData } from './lib/types';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [detailCity, setDetailCity] = useState<CityData | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);
  const activeCity = hoveredCity || selectedCity || CITIES[0];
  const openCity = (city: CityData) => {
    setSelectedCity(city);
    setDetailCity(city);
  };

  return (
    <main className="night-shell">
      <GlobeView
        selectedCity={selectedCity}
        onHoverCity={setHoveredCity}
        onClickCity={openCity}
        isPaused={!!detailCity}
      />
      <section className="intro-panel" aria-label="project status">
        <p className="eyebrow">Last Evenings on Earth</p>
        <h1>地球上最后的夜晚 PLUS</h1>
        <p className="summary">
          City light, dusk logic, writers, poems, and photo archives are being rebuilt without the music layer.
        </p>
        <div className="archive-counts" aria-label="archive counts">
          <span>
            <strong>{CITIES.length}</strong>
            文学城市
          </span>
          <span>
            <strong>{MAJOR_CITIES.length}</strong>
            全球光点
          </span>
        </div>
        <div className="city-strip" aria-label="literary cities">
          {CITIES.map((city) => (
            <button
              className={`city-card ${selectedCity?.id === city.id ? 'is-active' : ''}`}
              key={city.id}
              onClick={() => openCity(city)}
              type="button"
            >
              <span>{city.nameNative}</span>
              <strong>{city.author}</strong>
            </button>
          ))}
        </div>
        <p className="dusk-line">{getDuskString(activeCity)}</p>
      </section>
      <CityDetailsPanel city={detailCity} onClose={() => setDetailCity(null)} />
    </main>
  );
}
