import { motion } from 'framer-motion';

export default function LoadingSplash() {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#020617] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.12),_transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,_rgba(8,19,33,0.9),_rgba(2,6,23,0.98))]" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-14 text-center">
        <div className="absolute inset-x-0 top-1/4 mx-auto h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative z-20 flex w-full flex-col items-center gap-8 rounded-[32px] border border-white/10 bg-white/5 px-8 py-12 shadow-[0_40px_140px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="relative flex items-center justify-center rounded-full border border-cyan-300/20 bg-white/5 p-4 shadow-[0_0_50px_rgba(34,211,238,0.18)]">
            <motion.div
              className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_24px_80px_rgba(34,211,238,0.24)]"
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-950">
                <span className="text-2xl font-black tracking-[0.35em] text-cyan-100">AI</span>
              </div>
            </motion.div>
          </div>

          <div className="max-w-2xl space-y-4">
            <p className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Initializing Expense Copilot
            </p>
            <p className="mx-auto max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Engaging secure finance engines, loading enterprise-grade intelligence, and preparing your budget insights.
            </p>
          </div>

          <div className="grid w-full gap-4 sm:grid-cols-3">
            {[
              { label: 'Secure connection', accent: 'from-cyan-400 to-sky-400' },
              { label: 'Data synthesis', accent: 'from-violet-400 to-fuchsia-400' },
              { label: 'Insight ready', accent: 'from-blue-400 to-cyan-400' },
            ].map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 * index }}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 text-left shadow-[0_24px_70px_rgba(0,0,0,0.14)]"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-3.5 w-3.5 rounded-full bg-gradient-to-br ${item.accent}`} />
                  <p className="text-sm uppercase tracking-[0.28em] text-slate-400">{item.label}</p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${item.accent}`}
                    initial={{ width: '0%' }}
                    animate={{ width: ['0%', '100%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.32em] text-cyan-300/80">
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300"
            />
            <span>Powered by secure finance AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}
