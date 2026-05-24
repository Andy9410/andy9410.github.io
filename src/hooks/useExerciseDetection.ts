export function useExerciseDetection() {
  const detectExercise = (text: string): string | null => {
    const match = text.match(/(ejercicio|ej|problema|problem|exercise)\s*[#°]?\s*(\d+(?:\.\d+)*)/i);
    return match ? match[2] : null;
  };

  const isClosing = (text: string) => /gracias|entendido|siguiente|listo/i.test(text);

  return { detectExercise, isClosing };
}
