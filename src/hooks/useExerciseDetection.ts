export function useExerciseDetection() {
  const detectExercise = (text: string): string | null => {
    const match = text.match(
      /\b(ejercicio|ej\.?|problema|problem|exercise)\s*[#°º]?\s*(\d+(?:\.\d+)*(?:\.[a-z])?|\d+\.[a-z])\b/i,
    );
    return match ? match[2].toLowerCase() : null;
  };

  const isClosing = (text: string) => /gracias|entendido|siguiente|listo/i.test(text);

  return { detectExercise, isClosing };
}
