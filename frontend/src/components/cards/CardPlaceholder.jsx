import { Layers } from 'lucide-react';

function CardPlaceholder({ index }) {
  const getStageLabel = (idx) => {
    if (idx < 3) return 'Flop';
    if (idx === 3) return 'Turn';
    return 'River';
  };

  return (
    <div className="w-[64px] h-[88px] sm:w-[84px] sm:h-[118px] rounded-xl border-2 border-dashed border-gray-850 bg-black/55 flex flex-col items-center justify-center text-gray-650 font-mono text-[9px] sm:text-xs select-none shrink-0">
      <Layers className="w-4.5 h-4.5 mb-1 stroke-1 text-gray-700" />
      <span>{getStageLabel(index)}</span>
    </div>
  );
}

export default CardPlaceholder;
