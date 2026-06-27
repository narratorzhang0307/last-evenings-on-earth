# Rebuild Boundary

This rebuild keeps the parts of the original project that make the night atlas feel alive:

- city and dusk calculations
- globe navigation
- curated world photos
- poem and writer interactions
- Frost as a night conversation layer
- user photo submission

The music and playback system stays out of this repository:

- no local audio files
- no YouTube playback bridge
- no DJ pipeline
- no generated song cache
- no TTS audio generation

Large or private runtime inputs stay local and are not committed:

- environment files
- SQLite databases
- raw books and extracted indexes
- generated caches
- private keys
- old deployment bundles

Each commit should leave a small, understandable step behind.
