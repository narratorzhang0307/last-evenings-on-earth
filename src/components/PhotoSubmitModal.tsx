import { useMemo, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { CITIES } from '../data/literaryCities';
import { MAJOR_CITIES } from '../data/majorCities';
import { countryFromCoordinates } from '../lib/countryLookup';
import { rememberServerUserPhoto, saveLocalUserPhoto } from '../lib/localUserPhotos';
import { PhotoApiError, registerServerPhoto } from '../lib/photoApi';
import { useEscapeKey } from '../lib/useEscapeKey';
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
        country: city.country.split(/\s+/)[0],
        lat: city.lat,
        lng: city.lng,
      })),
      ...MAJOR_CITIES.slice(0, 80).map((city) => ({
        key: city.nameEn,
        label: city.nameZh,
        city: city.nameEn,
        city_zh: city.nameZh,
        country: countryFromCoordinates(city.lat, city.lng),
        lat: city.lat,
        lng: city.lng,
      })),
    ],
    [],
  );
  const [cityKey, setCityKey] = useState(cityOptions[0]?.key || '');
  const [url, setUrl] = useState('');
  const [country, setCountry] = useState(cityOptions[0]?.country || '');
  const [description, setDescription] = useState('');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  useEscapeKey(isOpen && !isSubmitting, onClose);

  if (!isOpen) return null;

  const selectedCity = cityOptions.find((city) => city.key === cityKey) || cityOptions[0];
  const handleCityChange = (nextCityKey: string) => {
    const nextCity = cityOptions.find((city) => city.key === nextCityKey);
    setCityKey(nextCityKey);
    setCountry(nextCity?.country || '');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!selectedCity || !url.trim() || !country.trim()) {
      setSubmitError('请补全图片链接和国家或地区。');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
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
    try {
      let savedPhoto = photo;
      try {
        savedPhoto = await registerServerPhoto(photo);
        rememberServerUserPhoto(savedPhoto);
      } catch (error) {
        if (error instanceof PhotoApiError && error.status < 500) throw error;
        saveLocalUserPhoto(photo);
      }
      onSubmitted?.(savedPhoto);
      onClose();
      setUrl('');
      setCountry('');
      setDescription('');
      setSignature('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '投稿暂时没有成功，请稍后再试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="photo-submit-modal" role="presentation" onClick={onClose}>
      <form className="photo-submit-card" onClick={(event) => event.stopPropagation()} onSubmit={handleSubmit}>
        <button className="photo-submit-close" onClick={onClose} type="button" aria-label="关闭投稿表单">
          <X size={18} />
        </button>
        <p>你的黄昏</p>
        <h2>留下你的黄昏</h2>
        <label>
          城市
          <select value={cityKey} onChange={(event) => handleCityChange(event.target.value)}>
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
          <input required value={country} onChange={(event) => setCountry(event.target.value)} placeholder="例如：中国" />
        </label>
        <label>
          写一句话
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
        </label>
        <label>
          署名
          <input value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="匿名也可以" />
        </label>
        {submitError && (
          <p className="photo-submit-error" role="alert">
            {submitError}
          </p>
        )}
        <button className="photo-submit-save" type="submit" disabled={isSubmitting}>
          {isSubmitting ? '正在钉入档案...' : '钉到档案里'}
        </button>
      </form>
    </div>
  );
}
