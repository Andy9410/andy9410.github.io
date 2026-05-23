import { motion } from "framer-motion";

interface Props {
  suggestions: string[];
  onSelect: (text: string) => void;
}

const SuggestionBubbles = ({ suggestions, onSelect }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="flex flex-wrap gap-2 px-4 pb-3 pl-14"
  >
    {suggestions.map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onSelect(s)}
        className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition-all hover:bg-teal-100 hover:border-teal-300 hover:shadow-sm active:scale-[0.97]"
      >
        {s}
      </button>
    ))}
  </motion.div>
);

export default SuggestionBubbles;
