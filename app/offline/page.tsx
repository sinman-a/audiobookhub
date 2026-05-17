export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#04071a] flex items-center justify-center text-white px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">📵</div>
        <h1 className="text-2xl font-bold mb-3">Немає підключення</h1>
        <p className="text-white/60 mb-8 leading-relaxed">
          Ти офлайн. Сторінки каталогу та книг, які ти вже відвідував, доступні без інтернету.
          Для відтворення відео потрібне підключення.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium transition-colors"
        >
          Спробувати знову
        </button>
      </div>
    </div>
  );
}
