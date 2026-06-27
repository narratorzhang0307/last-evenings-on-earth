import { useState } from 'react';
import { Archive } from 'lucide-react';
import { ArchiveDrawer } from './components/ArchiveDrawer';
import { CityDetailsPanel } from './components/CityDetailsPanel';
import GlobeView from './components/GlobeView';
import { PhotoStrip } from './components/PhotoStrip';
import { PhotoViewer } from './components/PhotoViewer';
import { PoemViewer } from './components/PoemViewer';
import { WriterPreviewCard } from './components/WriterPreviewCard';
import { CITIES } from './data/literaryCities';
import { MAJOR_CITIES } from './data/majorCities';
import { getDuskString } from './lib/dusk';
import { getPhotosForCity } from './lib/photoArchive';
import { getWritersForCity } from './lib/writerArchive';
import type { CityData, PhotoData, PoemPoint, WriterData } from './lib/types';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [detailCity, setDetailCity] = useState<CityData | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [selectedPoem, setSelectedPoem] = useState<PoemPoint | null>(null);
  const [selectedWriter, setSelectedWriter] = useState<WriterData | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const activeCity = hoveredCity || selectedCity || CITIES[0];
  const activePhotos = getPhotosForCity(activeCity);
  const activeWriter = getWritersForCity(activeCity)[0];
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
        onClickPhoto={setSelectedPhoto}
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
        <button className="archive-open-button" onClick={() => setIsArchiveOpen(true)} type="button">
          <Archive size={16} />
          夜晚档案
        </button>
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
        <PhotoStrip photos={activePhotos} onSelectPhoto={setSelectedPhoto} />
        {selectedPhoto && (
          <p className="photo-selection">
            {selectedPhoto.city_zh || selectedPhoto.city} · {selectedPhoto.photographer || '夜晚照片'}
          </p>
        )}
        {activeWriter && (
          <WriterPreviewCard writer={activeWriter} onEnter={setSelectedWriter} />
        )}
        {selectedWriter && (
          <p className="writer-selection">
            {selectedWriter.knock_text.zh_title} {selectedWriter.knock_text.zh_question}
          </p>
        )}
      </section>
      <CityDetailsPanel city={detailCity} onClose={() => setDetailCity(null)} />
      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        onSelectPhoto={(photo) => {
          setSelectedPhoto(photo);
          setIsArchiveOpen(false);
        }}
        onSelectPoem={(poem) => {
          setSelectedPoem(poem);
          setIsArchiveOpen(false);
        }}
      />
      {selectedPhoto && (
        <PhotoViewer photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
      {selectedPoem && (
        <PoemViewer poem={selectedPoem} onClose={() => setSelectedPoem(null)} />
      )}
    </main>
  );
}
