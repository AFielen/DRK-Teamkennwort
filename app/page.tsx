export default function Home() {
  return (
    <div className="bg-gray-50 min-h-[calc(100vh-theme(spacing.16))] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* ── Hero Box ── */}
        <div className="drk-card drk-fade-in">
          <div className="flex items-start gap-4">
            <div className="bg-[#e30613]/10 p-3 rounded-xl shrink-0">
              <span className="text-3xl">🛡️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                APP_TITEL
              </h2>
              <p className="text-gray-600">
                APP_BESCHREIBUNG – Einfach, digital, DSGVO-konform.
              </p>
            </div>
          </div>
        </div>

        {/* ── Content Box ── */}
        <div className="drk-card drk-slide-up">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Loslegen
          </h3>
          <p className="text-gray-600 mb-6">
            Hier beginnt die eigentliche App-Logik. Diese Seite durch den
            tatsächlichen Inhalt ersetzen.
          </p>
          <button className="drk-btn-primary">
            Starten
          </button>
        </div>

        {/* ── Info Box (optional) ── */}
        <div className="drk-card border-l-4 border-[#17a2b8] bg-blue-50/50">
          <div className="flex gap-3">
            <span className="text-xl shrink-0">ℹ️</span>
            <div>
              <p className="text-sm font-semibold text-gray-800">Hinweis</p>
              <p className="text-sm text-gray-600 mt-1">
                Dies ist ein Template. Passen Sie diese Seite an die
                Anforderungen Ihrer App an.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
