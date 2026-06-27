export default function VocabCard({ word, translation }) {
  return (
    <div className="group [perspective:1000px] h-20">
      <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)] cursor-pointer">
        <div className="absolute inset-0 flex items-center justify-center text-center rounded-xl bg-navy text-white font-semibold text-sm shadow-card px-2 [backface-visibility:hidden]">
          {word}
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-center rounded-xl bg-gold text-navy-dark font-semibold text-sm shadow-card px-2 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          {translation}
        </div>
      </div>
    </div>
  );
}
