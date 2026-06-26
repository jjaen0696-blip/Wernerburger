type Props = {
  size?: 'sm' | 'md' | 'lg';
};

const sizes = {
  sm: { img: 'w-8 h-8', werner: 'text-[15px]', burguer: 'text-[11px]' },
  md: { img: 'w-11 h-11', werner: 'text-[19px]', burguer: 'text-[14px]' },
  lg: { img: 'w-16 h-16', werner: 'text-[28px]', burguer: 'text-[20px]' },
};

export default function WernerLogo({ size = 'md' }: Props) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/image.png"
        alt="WernerBurguer logo"
        className={`${s.img} rounded-full object-cover flex-shrink-0 border border-white/10`}
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${s.werner} font-black uppercase tracking-wide`}
          style={{
            color: '#e8201a',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            letterSpacing: '0.04em',
          }}
        >
          WERNER
        </span>
        <span
          className={`${s.burguer} font-black uppercase tracking-wide`}
          style={{
            color: '#ffffff',
            fontFamily: "'Arial Black', 'Impact', sans-serif",
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            letterSpacing: '0.06em',
          }}
        >
          BURGUER
        </span>
      </div>
    </div>
  );
}
