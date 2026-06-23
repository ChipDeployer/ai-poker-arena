
function FlyingChips({ flyingChips, chipUrl }) {
  return (
    <>
      {flyingChips.map(chip => (
        <div
          key={chip.id}
          className={`absolute z-30 flex items-center justify-center pointer-events-none ${
            chip.type === 'collect' ? `chip-collect-anim-${chip.seat}` : `chip-win-anim-${chip.seat}`
          }`}
          style={{ width: '22px', height: '22px' }}
        >
          <img
            src={chipUrl}
            alt="Chip"
            className="w-full h-full object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]"
          />
        </div>
      ))}
    </>
  );
}

export default FlyingChips;
