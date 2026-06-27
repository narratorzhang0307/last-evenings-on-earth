import { useEffect, useState } from 'react';
import { Archive, Snowflake } from 'lucide-react';
import { ArchiveDrawer } from './components/ArchiveDrawer';
import { CityDetailsPanel } from './components/CityDetailsPanel';
import { FrostDrawer } from './components/FrostDrawer';
import GlobeView from './components/GlobeView';
import { PhotoStrip } from './components/PhotoStrip';
import { PhotoViewer } from './components/PhotoViewer';
import { PoemViewer } from './components/PoemViewer';
import { WriterPreviewCard } from './components/WriterPreviewCard';
import { WriterWindowPanel } from './components/WriterWindowPanel';
import { CITIES } from './data/literaryCities';
import { MAJOR_CITIES } from './data/majorCities';
import { POEMS } from './data/poems';
import { getDuskString } from './lib/dusk';
import { useAllPhotos } from './lib/localUserPhotos';
import { getPhotosForCity } from './lib/photoArchive';
import { getWriterStats, getWritersForCity } from './lib/writerArchive';
import type { CityData, PhotoData, PoemPoint, WriterData } from './lib/types';

type LayerKey = 'photos' | 'poems' | 'writers';

const LAYER_STORAGE_KEY = 'last-evenings-visible-layers';
const DEFAULT_VISIBLE_LAYERS: Record<LayerKey, boolean> = {
  photos: true,
  poems: true,
  writers: true,
};

function readSavedLayers() {
  try {
    const saved = window.localStorage.getItem(LAYER_STORAGE_KEY);
    if (!saved) return DEFAULT_VISIBLE_LAYERS;
    return { ...DEFAULT_VISIBLE_LAYERS, ...JSON.parse(saved) } as Record<LayerKey, boolean>;
  } catch {
    return DEFAULT_VISIBLE_LAYERS;
  }
}

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityData | null>(null);
  const [detailCity, setDetailCity] = useState<CityData | null>(null);
  const [hoveredCity, setHoveredCity] = useState<CityData | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoData | null>(null);
  const [selectedPoem, setSelectedPoem] = useState<PoemPoint | null>(null);
  const [selectedWriter, setSelectedWriter] = useState<WriterData | null>(null);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isFrostOpen, setIsFrostOpen] = useState(false);
  const [visibleLayers, setVisibleLayers] = useState(readSavedLayers);
  const allPhotos = useAllPhotos();
  const activeCity = hoveredCity || selectedCity || CITIES[0];
  const activePhotos = getPhotosForCity(activeCity, 6, allPhotos);
  const activeWriter = getWritersForCity(activeCity)[0];
  const writerStats = getWriterStats();
  const openCity = (city: CityData) => {
    setSelectedCity(city);
    setDetailCity(city);
  };
  useEffect(() => {
    window.localStorage.setItem(LAYER_STORAGE_KEY, JSON.stringify(visibleLayers));
  }, [visibleLayers]);

  const toggleLayer = (layer: LayerKey) => {
    setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }));
  };

  return (
    <main className="night-shell">
      <GlobeView
        selectedCity={selectedCity}
        onHoverCity={setHoveredCity}
        onClickCity={openCity}
        onClickPhoto={setSelectedPhoto}
        onClickPoem={setSelectedPoem}
        onClickWriter={setSelectedWriter}
        photos={allPhotos}
        showPhotos={visibleLayers.photos}
        showPoems={visibleLayers.poems}
        showWriters={visibleLayers.writers}
        isPaused={!!detailCity}
      />
      <section className="intro-panel" aria-label="项目状态">
        <p className="eyebrow">地球上最后的夜晚</p>
        <h1>地球上最后的夜晚</h1>
        <p className="summary">
          城市灯光、黄昏时间、作家、诗歌和照片档案正在同一颗夜晚地球上展开。
        </p>
        <div className="archive-counts" aria-label="档案数量">
          <span>
            <strong>{CITIES.length}</strong>
            文学城市
          </span>
          <span>
            <strong>{MAJOR_CITIES.length}</strong>
            全球光点
          </span>
          <span>
            <strong>{writerStats.writerCount}</strong>
            夜窗作家
          </span>
        </div>
        <div className="front-actions">
          <button className="archive-open-button" onClick={() => setIsArchiveOpen(true)} type="button">
            <Archive size={16} />
            夜晚档案
          </button>
          <button className="archive-open-button" onClick={() => setIsFrostOpen(true)} type="button">
            <Snowflake size={16} />
            弗洛斯特
          </button>
        </div>
        <div className="layer-toggles" aria-label="地球图层">
          <button
            className={visibleLayers.photos ? 'is-active' : ''}
            onClick={() => toggleLayer('photos')}
            type="button"
            aria-pressed={visibleLayers.photos}
            aria-label={`照片图层，${allPhotos.length} 个点位`}
          >
            <span>照片</span>
            <strong>{allPhotos.length}</strong>
          </button>
          <button
            className={visibleLayers.poems ? 'is-active' : ''}
            onClick={() => toggleLayer('poems')}
            type="button"
            aria-pressed={visibleLayers.poems}
            aria-label={`诗歌图层，${POEMS.length} 个点位`}
          >
            <span>诗歌</span>
            <strong>{POEMS.length}</strong>
          </button>
          <button
            className={visibleLayers.writers ? 'is-active' : ''}
            onClick={() => toggleLayer('writers')}
            type="button"
            aria-pressed={visibleLayers.writers}
            aria-label={`作家图层，${writerStats.writerCount} 个点位`}
          >
            <span>作家</span>
            <strong>{writerStats.writerCount}</strong>
          </button>
        </div>
        <div className="city-strip" aria-label="文学城市">
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
      </section>
      <CityDetailsPanel
        city={detailCity}
        onClose={() => setDetailCity(null)}
        photos={allPhotos}
        onSelectPhoto={(photo) => {
          setSelectedPhoto(photo);
          setDetailCity(null);
        }}
        onSelectWriter={(writer) => {
          setSelectedWriter(writer);
          setDetailCity(null);
        }}
      />
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
        onSelectWriter={(writer) => {
          setSelectedWriter(writer);
          setIsArchiveOpen(false);
        }}
      />
      <FrostDrawer isOpen={isFrostOpen} onClose={() => setIsFrostOpen(false)} />
      {selectedPhoto && (
        <PhotoViewer photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
      {selectedPoem && (
        <PoemViewer poem={selectedPoem} onClose={() => setSelectedPoem(null)} />
      )}
      {selectedWriter && (
        <WriterWindowPanel writer={selectedWriter} onClose={() => setSelectedWriter(null)} />
      )}
    </main>
  );
}
