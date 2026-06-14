import { useState } from "react";
import { Sparkles } from "lucide-react";
import AIAssistantDrawer from "./AIAssistantDrawer";


export default function FloatingAIButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="
          fixed
          bottom-24
          right-4
          lg:bottom-8
          lg:right-8
          z-50
          flex
          items-center
          gap-2
          rounded-full
          bg-gradient-to-r
          from-cyan-500
          to-blue-500
          px-5
          py-3
          text-sm
          font-semibold
          text-white
          shadow-2xl
          transition-all
          duration-300
          hover:scale-105
        "
      >
        <Sparkles className="h-4 w-4" />

        AI Copilot
      </button>

      <AIAssistantDrawer
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
