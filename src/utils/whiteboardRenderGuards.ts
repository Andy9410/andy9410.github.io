export const hasText = (value?: string | null): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const hasVisibleBoardContent = (item: {
  content?: string | null;
  text?: string | null;
  question?: string | null;
  answer?: string | null;
}) =>
  hasText(item.content) ||
  hasText(item.text) ||
  hasText(item.question) ||
  hasText(item.answer);
