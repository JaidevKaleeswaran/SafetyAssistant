import { motion } from 'framer-motion';
import { Car, Phone, ArrowUpRight } from 'lucide-react';

const rideOptions = [
  {
    id: 'uber',
    name: 'Uber',
    actionText: 'Open Uber',
    description: 'Fast, reliable ride request anytime',
    icon: Car,
    badgeColor: 'bg-slate-900/90 border-slate-700/80 text-white',
    buttonColor: 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700',
    url: 'https://m.uber.com',
    storeUrl: 'https://apps.apple.com/us/app/uber/id368677368',
  },
  {
    id: 'lyft',
    name: 'Lyft',
    actionText: 'Open Lyft',
    description: 'Book a ride in seconds nearby',
    icon: Car,
    badgeColor: 'bg-pink-950/70 border-pink-700/60 text-pink-300',
    buttonColor: 'bg-pink-600 hover:bg-pink-500 text-white',
    url: 'https://www.lyft.com',
    storeUrl: 'https://apps.apple.com/us/app/lyft/id529379082',
  },
  {
    id: 'call',
    name: 'Call a Friend',
    actionText: 'Call Now',
    description: 'Connect directly to a trusted driver',
    icon: Phone,
    badgeColor: 'bg-emerald-950/70 border-emerald-700/60 text-emerald-300',
    buttonColor: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    url: 'tel:',
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
    if (!w) {
      window.location.href = option.storeUrl || option.url;
    }
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex items-center gap-2.5">
        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 animate-ping" />
        <span className="text-sm sm:text-base font-black text-slate-200 uppercase tracking-wider">
          Recommended Alternative Transportation
        </span>
      </div>

      {/* Vertical stacked column of larger cards */}
      <div className="flex flex-col space-y-4 sm:space-y-5 w-full">
        {rideOptions.map((option, i) => (
          <motion.div
            key={option.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
            className={`p-6 sm:p-7 rounded-3xl border ${option.badgeColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 transition-all hover:border-slate-500/50 shadow-xl`}
          >
            {/* Left Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
              <div className="p-4 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <option.icon className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-xl sm:text-2xl text-white truncate">{option.name}</p>
                <p className="text-xs sm:text-base text-slate-300 font-medium truncate mt-1">{option.description}</p>
              </div>
            </div>

            {/* Right Action Button — Bigger */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleRideClick(option)}
              className={`w-full sm:w-auto py-4 px-6 sm:px-8 rounded-2xl text-sm sm:text-lg font-black flex items-center justify-center gap-2.5 cursor-pointer shadow-xl transition-all flex-shrink-0 ${option.buttonColor}`}
            >
              <span>{option.actionText}</span>
              <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
