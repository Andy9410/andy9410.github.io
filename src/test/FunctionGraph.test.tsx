import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import FunctionGraph from "@/components/chat/FunctionGraph";

const mocks = vi.hoisted(() => ({
  createMock: vi.fn(),
  resizeContainerMock: vi.fn(),
  updateMock: vi.fn(),
  freeBoardMock: vi.fn(),
}));

vi.mock("jsxgraph", () => ({
  default: {
    JSXGraph: {
      initBoard: vi.fn(() => ({
        create: mocks.createMock,
        resizeContainer: mocks.resizeContainerMock,
        update: mocks.updateMock,
      })),
      freeBoard: mocks.freeBoardMock,
    },
  },
}));

class ResizeObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
}

describe("FunctionGraph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
  });

  it.each(["x^2", "sin(x)", "cos(x)", "x^3", "sqrt(x)", "e^x"])(
    "renderiza un gráfico para %s",
    (expression) => {
      render(<FunctionGraph expression={expression} />);

      expect(screen.getByText(expression)).toBeInTheDocument();
      expect(mocks.createMock).toHaveBeenCalledWith("functiongraph", [expect.any(Function)], expect.any(Object));
    },
  );

  it("muestra un error si la expresión no es válida", () => {
    render(<FunctionGraph expression="alert(x)" />);

    expect(screen.getByText("No se pudo generar el gráfico.")).toBeInTheDocument();
    expect(mocks.createMock).not.toHaveBeenCalled();
  });
});
