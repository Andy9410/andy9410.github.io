export const QUESTION_RESPONSE_CARD_GAP = 20;
export const COLLAPSED_QUESTION_RESPONSE_HEIGHT = 58;

export function getQuestionResponsePairHeight(questionHeight: number, answerHeight: number) {
  return questionHeight + QUESTION_RESPONSE_CARD_GAP + answerHeight + 18;
}
