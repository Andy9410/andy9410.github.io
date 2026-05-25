import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { PDFViewer } from "@/components/chat/PDFViewer";

const mockFetch = vi.fn();
const pdfMockState = vi.hoisted(() => ({
  failDocument: false,
}));

vi.stubGlobal("fetch", mockFetch);

vi.mock("react-pdf", () => ({
  Document: ({
    children,
    file,
    onLoadError,
    error,
  }: {
    children: React.ReactNode;
    file?: { data?: Uint8Array };
    onLoadError?: (error: Error) => void;
    error?: React.ReactNode;
  }) => {
    if (pdfMockState.failDocument) {
      onLoadError?.(new Error("Invalid PDF structure"));
      return <div data-testid="mock-document-error">{error}</div>;
    }

    return (
      <div data-has-data={String(file?.data instanceof Uint8Array)} data-testid="mock-document">
        {children}
      </div>
    );
  },
  Page: ({
    pageNumber,
    scale,
  }: {
    pageNumber: number;
    scale: number;
    onLoadSuccess?: (page: unknown) => void;
  }) => (
    <div data-page={pageNumber} data-scale={scale} data-testid="mock-page">
      PDF Page {pageNumber}
    </div>
  ),
}));

vi.mock("@/components/chat/ExerciseHighlighter", () => ({
  ExerciseHighlighter: () => <div data-testid="mock-highlighter" />,
}));

vi.mock("lucide-react", () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  ZoomIn: () => <span data-testid="icon-zoom-in" />,
  ZoomOut: () => <span data-testid="icon-zoom-out" />,
  X: () => <span data-testid="icon-x" />,
  BookOpen: () => <span data-testid="icon-book-open" />,
}));

const defaultProps = {
  documentId: 1,
  token: "test-token-123",
  activeExercise: null,
  onClose: vi.fn(),
  sidebarOpen: false,
  onToggleSidebar: vi.fn(),
};

const pdfBuffer = (content = "%PDF-1.4 mock content") =>
  new TextEncoder().encode(content).buffer;

const okPdfResponse = (content?: string) =>
  ({
    ok: true,
    status: 200,
    arrayBuffer: () => Promise.resolve(pdfBuffer(content)),
  }) as Response;

describe("PDFViewer", () => {
  beforeEach(() => {
    mockFetch.mockReset();
    pdfMockState.failDocument = false;
    defaultProps.onClose.mockReset();
    defaultProps.onToggleSidebar.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra error de sesión cuando no hay token", async () => {
    render(<PDFViewer {...defaultProps} token="" />);

    expect(await screen.findByText(/No hay sesión activa/)).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("muestra spinner durante la descarga", () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(<PDFViewer {...defaultProps} />);

    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("descarga el PDF con Authorization y pasa bytes al Document", async () => {
    mockFetch.mockResolvedValueOnce(okPdfResponse());

    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/documents/1/download"),
        expect.objectContaining({
          headers: { Authorization: "Bearer test-token-123" },
          signal: expect.any(AbortSignal),
        })
      );
    });

    expect(await screen.findByTestId("mock-document")).toHaveAttribute("data-has-data", "true");
    expect(screen.getByTestId("mock-page")).toHaveAttribute("data-page", "1");
  });

  it("muestra el status HTTP cuando el backend rechaza la descarga", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 401 } as Response);

    render(<PDFViewer {...defaultProps} />);

    expect(await screen.findByText(/HTTP 401/)).toBeInTheDocument();
  });

  it("muestra error cuando la respuesta no es un PDF", async () => {
    mockFetch.mockResolvedValueOnce(okPdfResponse("<html>no pdf</html>"));

    render(<PDFViewer {...defaultProps} />);

    expect(await screen.findByText(/Respuesta inválida/)).toBeInTheDocument();
  });

  it("muestra error de render de PDF.js", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    pdfMockState.failDocument = true;
    mockFetch.mockResolvedValueOnce(okPdfResponse());

    render(<PDFViewer {...defaultProps} />);

    expect(await screen.findByText(/Invalid PDF structure/)).toBeInTheDocument();
    expect(consoleSpy).toHaveBeenCalledWith("[PDFViewer] Error cargando PDF:", expect.any(Error));
  });

  it("llama a onClose al hacer click en cerrar", async () => {
    mockFetch.mockResolvedValueOnce(okPdfResponse());
    render(<PDFViewer {...defaultProps} />);

    await screen.findByTestId("mock-document");

    act(() => {
      screen.getByLabelText("Cerrar visor").click();
    });

    expect(defaultProps.onClose).toHaveBeenCalledOnce();
  });

  it("muestra banner cuando hay ejercicio activo sin bbox", () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <PDFViewer
        {...defaultProps}
        activeExercise={{
          number: "3.1",
          page: 5,
        }}
      />
    );

    expect(screen.getByText(/Ejercicio 3\.1/)).toBeInTheDocument();
    expect(screen.getByText(/Página 5/)).toBeInTheDocument();
  });
});
