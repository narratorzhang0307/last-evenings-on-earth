import { useState } from 'react';
import GlobeView from './components/GlobeView';
import { CITIES } from './data/literaryCities';
import { getDuskString } from './lib/dusk';
import type { CityData } from './lib/types';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(CITIES[0]);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);
  const activeCity = hoveredCity || selectedCity || CITIES[0];

  return (
    <main className="night-shell">
      <GlobeView
        selectedCity={selectedCity}
        onHoverCity={setHoveredCity}
        onClickCity={setSelectedCity}
        isPaused={!!selectedCity}
      />
      <section className="intro-panel" aria-label="project status">
        <p className="eyebrow">Last Evenings on Earth</p>
        <h1>地球上最后的夜晚 PLUS</h1>
        <p className="summary">
          City light, dusk logic, writers, poems, and photo archives are being rebuilt without the music layer.
        </p>
        <div className="city-strip" aria-label="literary cities">
          {CITIES.map((city) => (
            <button
              className={`city-card ${selectedCity?.id === city.id ? 'is-active' : ''}`}
              key={city.id}
              onClick={() => setSelectedCity(city)}
              type="button"
            >
              <span>{city.nameNative}</span>
              <strong>{city.author}</strong>
            </button>
          ))}
        </div>
        <p className="dusk-line">{getDuskString(activeCity)}</p>
      </section>
    </main>
  );
}
