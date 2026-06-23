
function CardBack({ theme = 'classic', size = 'lg' }) {
  const sizeClasses = size === 'sm'
    ? "w-[30px] h-[42px] min-[400px]:w-[40px] min-[400px]:h-[56px] md:w-[52px] md:h-[73px] rounded-lg"
    : "w-[44px] h-[62px] min-[400px]:w-[60px] min-[400px]:h-[84px] md:w-[84px] md:h-[118px] rounded-xl";

  // Cyber & Vice use generated raster backs; Classic uses a CSS emerald & gold back.
  if (theme === 'cyber' || theme === 'vice') {
    const cardBackImg = theme === 'cyber' ? "/cyberpunk_card_back.png" : "/vice_city_card_back.png";
    const filterClass = theme === 'cyber' ? "card-back-cyber" : "card-back-vice";
    return (
      <div className={`${sizeClasses} border border-gray-800 shadow-xl relative overflow-hidden select-none shrink-0 transform hover:-translate-y-1.5 transition-all duration-300`}>
        <img
          src={cardBackImg}
          alt="Card Back"
          className={`w-full h-full object-cover ${filterClass}`}
        />
        <div className="absolute inset-0 bg-white/5 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses} card-back-classic shadow-xl relative overflow-hidden select-none shrink-0 transform hover:-translate-y-1.5 transition-all duration-300`} />
  );
}

export default CardBack;
