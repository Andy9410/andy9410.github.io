import { motion } from "framer-motion";

interface Props {
  suggestions: string[];
  selectedSuggestion?: string;
  disabled?: boolean;
  onSelect: (text: string) => void;
}

const SuggestionBubbles = ({ suggestions, selectedSuggestion, disabled = false, onSelect }: Props) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2 }}
    className="flex flex-wrap gap-2 px-4 pb-3 pl-14"
  >
    {suggestions.map((s, index) => {
      const isSelected = selectedSuggestion === s;

      return (
        <button
          key={`${s}-${index}`}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) onSelect(s);
          }}
          className={[
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
            isSelected
              ? "border-teal-500 bg-teal-100 text-teal-900 ring-2 ring-teal-300"
              : "border-teal-200 bg-teal-50 text-teal-700",
            disabled
              ? "cursor-not-allowed opacity-60"
              : "hover:border-teal-300 hover:bg-teal-100 hover:shadow-sm active:scale-[0.97]",
          ].join(" ")}
        >
          {s}
        </button>
      );
    })}
  </motion.div>
);

export default SuggestionBubbles;
