import { motion } from 'framer-motion';

export default function LoadingSplash() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-[#050b16] px-6 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_18%_18%,rgba(16,185,129,0.06),transparent_24%)]" />

      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.42, ease: 'easeOut' }}
          className="relative"
        >
          <div className="absolute inset-4 rounded-full bg-cyan-400/20 blur-2xl" />
          <img
            src="/brand/aira-logo.png"
            alt="Aira"
            className="relative h-28 w-28 object-contain drop-shadow-[0_18px_35px_rgba(8,145,178,0.24)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.16, ease: 'easeOut' }}
          className="mt-6"
        >
          <p className="text-2xl font-semibold tracking-tight text-white">Aira</p>
          <p className="mt-1 text-sm text-slate-400">Your money, in focus.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
          className="mt-10 h-1 w-32 overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
