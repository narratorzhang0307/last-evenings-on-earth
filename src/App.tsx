import { CITIES } from './data/literaryCities';
import { getDuskString } from './lib/dusk';

export default function App() {
  const firstCity = CITIES[0];

  return (
    <main className="night-shell">
      <section className="intro-panel" aria-label="project status">
        <p className="eyebrow">Last Evenings on Earth</p>
        <h1>地球上最后的夜晚 PLUS</h1>
        <p className="summary">
          A clean rebuild is starting here: city light, dusk logic, writers, poems, and photo archives first.
        </p>
        <div className="city-strip" aria-label="literary cities">
          {CITIES.map((city) => (
            <article className="city-card" key={city.id}>
              <span>{city.nameNative}</span>
              <strong>{city.author}</strong>
            </article>
          ))}
        </div>
        <p className="dusk-line">{getDuskString(firstCity)}</p>
      </section>
    </main>
  );
}
