import { motion } from 'framer-motion';
import { Users, MoreHorizontal } from 'lucide-react';

const rideOptions = [
  {
    id: 'uber',
    name: 'Uber',
    subtitle: 'Book a ride',
    bgColor: 'bg-slate-900/90 border-slate-800 hover:border-slate-700',
    iconBg: 'bg-black text-white font-black text-xs tracking-wider',
    isUber: true,
    url: 'https://m.uber.com',
    storeUrl: 'https://apps.apple.com/us/app/uber/id368677368',
  },
  {
    id: 'lyft',
    name: 'Lyft',
    subtitle: 'Book a ride',
    bgColor: 'bg-gradient-to-br from-pink-900/80 to-purple-950/90 border-pink-700/60 hover:border-pink-500/80',
    iconBg: 'bg-pink-600 text-white font-black text-xs tracking-wider',
    isLyft: true,
    url: 'https://www.lyft.com',
    storeUrl: 'https://apps.apple.com/us/app/lyft/id529379082',
  },
  {
    id: 'call',
    name: 'Call Friend',
    subtitle: 'Ask a friend',
    bgColor: 'bg-gradient-to-br from-blue-900/80 to-blue-950/90 border-blue-700/60 hover:border-blue-500/80',
    iconBg: 'bg-blue-600 text-white',
    icon: Users,
    url: 'tel:',
    storeUrl: null,
  },
  {
    id: 'more',
    name: 'More Options',
    subtitle: 'Explore more',
    bgColor: 'bg-slate-900/90 border-slate-800 hover:border-slate-700',
    iconBg: 'bg-slate-800 text-slate-300',
    icon: MoreHorizontal,
    url: 'https://www.google.com/search?q=taxi+rideshare+near+me',
    storeUrl: null,
  },
];

export function RideOptions() {
  const handleRideClick = (option: typeof rideOptions[0]) => {
    if (option.id === 'call') {
      window.location.href = 'tel:';
      return;
    }
    const w = window.open(option.url, '_blank');
    if (!w && option.storeUrl) {
      window.location.href = option.storeUrl;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h3 className="text-base sm:text-lg font-black text-white">Get Home Safely</h3>
        <p className="text-xs text-slate-400 font-semibold mt-0.5">Choose an option below</p>
      </div>

      {/* 4 App Cards Grid matching reference UI image */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {rideOptions.map((option, i) => (
          <motion.button
            key={option.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => handleRideClick(option)}
            className={`p-4 rounded-3xl border ${option.bgColor} flex flex-col justify-between items-start text-left space-y-4 cursor-pointer shadow-xl transition-all aspect-[4/3] sm:aspect-square w-full`}
          >
            {/* Top App Icon Badge */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md ${option.iconBg}`}>
              {option.isUber ? (
                <span className="font-black text-sm text-white font-sans">Uber</span>
              ) : option.isLyft ? (
                <span className="font-black text-sm text-white italic font-sans">lyft</span>
              ) : option.icon ? (
                <option.icon className="w-6 h-6" />
              ) : null}
            </div>

            {/* Bottom App Title & Subtitle */}
            <div>
              <p className="font-extrabold text-sm sm:text-base text-white leading-snug">{option.name}</p>
              <p className="text-[11px] text-slate-400 font-medium">{option.subtitle}</p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
