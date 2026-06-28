import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
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

const COUNTRY_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;
const SIGNATURE_MAX_LENGTH = 40;

function formatSubmitError(error: unknown) {
  if (error instanceof PhotoApiError) {
    if (error.status === 429) {
      const resetLabel = formatRateLimitReset(error.rateLimit?.resetAt);
      return resetLabel ? `${error.message} 可以在 ${resetLabel} 后再试。` : error.message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : '投稿暂时没有成功，请稍后再试。';
}

function formatRateLimitReset(resetAt?: number) {
  if (!resetAt) return '';
  const resetDate = new Date(resetAt);
  if (Number.isNaN(resetDate.getTime())) return '';
  return resetDate.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function slugCityName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'user-city';
}

function createUserPhotoId() {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8) || 'dusk';
  return `usr_${timePart}_${randomPart}`;
}

function normalizePhotoUrl(value: string) {
  try {
    const parsed = new URL(value.trim());
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname ? parsed.toString() : '';
  } catch {
    return '';
  }
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
  const urlInputRef = useRef<HTMLInputElement>(null);
  const requestClose = () => {
    if (!isSubmitting) onClose();
  };
  useEscapeKey(isOpen && !isSubmitting, requestClose);

  useEffect(() => {
    if (!isOpen) return;
    const frame = window.requestAnimationFrame(() => urlInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedCity = cityOptions.find((city) => city.key === cityKey) || cityOptions[0];
  const submitErrorId = submitError ? 'photo-submit-error' : undefined;
  const hasUrlError = submitError.includes('图片链接') || submitError.includes('http 或 https');
  const hasCountryError = submitError.includes('国家或地区');
  const descriptionRemaining = DESCRIPTION_MAX_LENGTH - description.length;
  const signatureRemaining = SIGNATURE_MAX_LENGTH - signature.length;
  const clearSubmitError = () => {
    if (submitError) setSubmitError('');
  };
  const handleCityChange = (nextCityKey: string) => {
    const nextCity = cityOptions.find((city) => city.key === nextCityKey);
    clearSubmitError();
    setCityKey(nextCityKey);
    setCountry(nextCity?.country || '');
  };
  const handleUrlBlur = () => {
    const photoUrl = normalizePhotoUrl(url);
    if (photoUrl) setUrl(photoUrl);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;
    const photoUrl = normalizePhotoUrl(url);
    if (!selectedCity || !country.trim()) {
      setSubmitError('请补全图片链接和国家或地区。');
      return;
    }
    if (!photoUrl) {
      setSubmitError('请填写 http 或 https 开头的图片链接。');
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');
    const photo: PhotoData = {
      id: createUserPhotoId(),
      lat: selectedCity.lat,
      lng: selectedCity.lng,
      url: photoUrl,
      cityId: slugCityName(selectedCity.city),
      rot: 0,
      city: selectedCity.city,
      city_zh: selectedCity.city_zh,
      country: country.trim().slice(0, COUNTRY_MAX_LENGTH) || undefined,
      description: description.trim().slice(0, DESCRIPTION_MAX_LENGTH) || undefined,
      signature: signature.trim().slice(0, SIGNATURE_MAX_LENGTH) || undefined,
      submittedAt: Date.now(),
      isUserSubmitted: true,
      color: '#191713',
    };
    try {
      let savedPhoto = photo;
      try {
        savedPhoto = await registerServerPhoto(photo);
        rememberServerUserPhoto(savedPhoto);
      } catch (error) {
        if (error instanceof PhotoApiError && error.status < 500 && error.status !== 404) throw error;
        saveLocalUserPhoto(photo);
      }
      onSubmitted?.(savedPhoto);
      onClose();
      setCityKey(cityOptions[0]?.key || '');
      setUrl('');
      setCountry(cityOptions[0]?.country || '');
      setDescription('');
      setSignature('');
      setSubmitError('');
    } catch (error) {
      setSubmitError(formatSubmitError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="photo-submit-modal" role="presentation" onClick={requestClose}>
      <form
        className="photo-submit-card"
        role="dialog"
        aria-modal="true"
        aria-label="黄昏投稿表单"
        aria-busy={isSubmitting}
        onClick={(event) => event.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <button
          className="photo-submit-close"
          onClick={requestClose}
          type="button"
          aria-label="关闭投稿表单"
          disabled={isSubmitting}
        >
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
            ref={urlInputRef}
            required
            type="url"
            value={url}
            onChange={(event) => {
              clearSubmitError();
              setUrl(event.target.value);
            }}
            onBlur={handleUrlBlur}
            placeholder="https://..."
            aria-describedby={submitErrorId}
            aria-invalid={hasUrlError || undefined}
          />
        </label>
        <label>
          国家或地区
          <input
            required
            value={country}
            onChange={(event) => {
              clearSubmitError();
              setCountry(event.target.value);
            }}
            placeholder="例如：中国"
            maxLength={COUNTRY_MAX_LENGTH}
            aria-describedby={submitErrorId}
            aria-invalid={hasCountryError || undefined}
          />
        </label>
        <label>
          <span className="photo-submit-field-head">
            <span>写一句话</span>
            <em aria-live="polite">剩余 {descriptionRemaining} 字</em>
          </span>
          <textarea
            value={description}
            onChange={(event) => {
              clearSubmitError();
              setDescription(event.target.value);
            }}
            rows={3}
            maxLength={DESCRIPTION_MAX_LENGTH}
          />
        </label>
        <label>
          <span className="photo-submit-field-head">
            <span>署名</span>
            <em aria-live="polite">剩余 {signatureRemaining} 字</em>
          </span>
          <input
            value={signature}
            onChange={(event) => {
              clearSubmitError();
              setSignature(event.target.value);
            }}
            placeholder="匿名也可以"
            maxLength={SIGNATURE_MAX_LENGTH}
          />
        </label>
        {submitError && (
          <p className="photo-submit-error" id="photo-submit-error" role="alert">
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
