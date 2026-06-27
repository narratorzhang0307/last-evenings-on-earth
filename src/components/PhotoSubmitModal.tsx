import { useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { CITIES } from '../data/literaryCities';
import { MAJOR_CITIES } from '../data/majorCities';
import { saveLocalUserPhoto } from '../lib/localUserPhotos';
import { registerServerPhoto } from '../lib/photoApi';
import type { PhotoData } from '../lib/types';

interface PhotoSubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: (photo: PhotoData) => void;
}

function slugCityName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user-city';
}

export function PhotoSubmitModal({ isOpen, onClose, onSubmitted }: PhotoSubmitModalProps) {
  const cityOptions = useMemo(
    () => [
      ...CITIES.map((city) => ({
        key: city.id,
        label: city.nameNative,
        city: city.name,
        city_zh: city.nameNative,
        lat: city.lat,
        lng: city.lng,
      })),
      ...MAJOR_CITIES.slice(0, 80).map((city) => ({
        key: city.nameEn,
        label: city.nameZh,
        city: city.nameEn,
        city_zh: city.nameZh,
        lat: city.lat,
        lng: city.lng,
      })),
    ],
    [],
  );
  const [cityKey, setCityKey] = useState(cityOptions[0]?.key || '');
  const [url, setUrl] = useState('');
  const [country, setCountry] = useState('');
  const [description, setDescription] = useState('');
  const [signature, setSignature] = useState('');

  if (!isOpen) return null;

  const selectedCity = cityOptions.find((city) => city.key === cityKey) || cityOptions[0];

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedCity || !url.trim()) return;
    const photo: PhotoData = {
      id: `usr_${Date.now().toString(36)}`,
      lat: selectedCity.lat,
      lng: selectedCity.lng,
      url: url.trim(),
      cityId: slugCityName(selectedCity.city),
      rot: 0,
      city: selectedCity.city,
      city_zh: selectedCity.city_zh,
      country: country.trim() || undefined,
      description: description.trim() || undefined,
      signature: signature.trim() || undefined,
      submittedAt: Date.now(),
      isUserSubmitted: true,
      source: 'unsplash',
      color: '#191713',
    };
    let savedPhoto = photo;
    try {
      savedPhoto = await registerServerPhoto(photo);
    } catch {
      saveLocalUserPhoto(photo);
    }
    onSubmitted?.(savedPhoto);
    onClose();
    setUrl('');
    setDescription('');
    setSignature('');
  };

  return (
    <div className="photo-submit-modal" role="presentation" onClick={onClose}>
      <form className="photo-submit-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <button className="photo-submit-close" onClick={onClose} type="button" aria-label="Close submit form">
          <X size={18} />
        </button>
        <p>YOUR TWILIGHT</p>
        <h2>留下你的黄昏</h2>
        <label>
          城市
          <select value={cityKey} onChange={(event) => setCityKey(event.target.value)}>
            {cityOptions.map((city) => (
              <option key={city.key} value={city.key}>
                {city.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          图片链接
          <input
            required
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          国家或地区
          <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="可选" />
        </label>
        <label>
          写一句话
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
        </label>
        <label>
          署名
          <input value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="匿名也可以" />
        </label>
        <button className="photo-submit-save" type="submit">
          钉到档案里
        </button>
      </form>
    </div>
  );
}
