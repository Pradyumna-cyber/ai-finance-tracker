import { motion } from 'framer-motion';

export default function LoadingSplash() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020617] text-white">
      <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden px-6 py-10 text-center">
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-10 top-1/4 h-56 w-56 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute left-8 bottom-24 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center gap-6"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/20 bg-white/5 shadow-[0_0_80px_rgba(34,211,238,0.18)]">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_45px_rgba(34,211,238,0.2)]">
              <span className="text-2xl font-black tracking-[0.2em] text-white">AI</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Welcome to Expense Copilot
            </p>
            <p className="max-w-md text-sm text-slate-300 sm:text-base">
              Loading your smart budget experience. Hold tight while your financial dashboard wakes up.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-cyan-300/90">
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-3 w-3 rounded-full bg-cyan-300"
            />
            <motion.span
              animate={{ x: [0, 6, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
              className="inline-flex h-3 w-3 rounded-full bg-violet-300"
            />
            <motion.span
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
              className="inline-flex h-3 w-3 rounded-full bg-blue-300"
            />
            <span>Booting up your financial engine</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
