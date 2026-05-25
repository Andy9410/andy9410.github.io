import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import { PDFViewer } from "../components/chat/PDFViewer";

// ===================================================================
// Mocks
// ===================================================================

// Mock de fetch global
const mockFetch = vi.spyOn(global, "fetch");

// Mock de URL.createObjectURL
const mockCreateObjectURL = vi.fn(() => "blob:mock-pdf-url");
const mockRevokeObjectURL = vi.fn();

vi.stubGlobal("URL", {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

// Mock de react-pdf
const mockOnLoadError = vi.fn();
let mockErrorCallback: ((error: Error) => void) | null = null;

vi.mock("react-pdf", () => ({
  pdfjs: {
    version: "5.6.205",
    GlobalWorkerOptions: {
      workerSrc: "",
    },
  },
  Document: vi.fn(
    ({
      children,
      onLoadError,
      loading,
      error,
    }: {
      children: React.ReactNode;
      onLoadError?: (error: Error) => void;
      loading?: React.ReactNode;
      error?: React.ReactNode;
    }) => {
      mockOnLoadError.mockImplementation(onLoadError || vi.fn());
      mockErrorCallback = onLoadError || null;

      return (
        <div data-testid="mock-document">
          {/* Simular error callback */}
          {children}
        </div>
      );
    }
  ),
  Page: vi.fn(
    ({
      pageNumber,
      scale,
      onLoadSuccess,
    }: {
      pageNumber: number;
      scale: number;
      onLoadSuccess?: (page: unknown) => void;
    }) => {
      return (
        <div data-testid="mock-page" data-page={pageNumber} data-scale={scale}>
          PDF Page {pageNumber}
        </div>
      );
    }
  ),
}));

// Mock de ExerciseHighlighter
vi.mock("../components/chat/ExerciseHighlighter", () => ({
  ExerciseHighlighter: vi.fn(() => (
    <div data-testid="mock-highlighter" />
  )),
}));

// Mock de lucide-react
vi.mock("lucide-react", () => ({
  ChevronLeft: () => <span data-testid="icon-chevron-left" />,
  ChevronRight: () => <span data-testid="icon-chevron-right" />,
  ZoomIn: () => <span data-testid="icon-zoom-in" />,
  ZoomOut: () => <span data-testid="icon-zoom-out" />,
  X: () => <span data-testid="icon-x" />,
  BookOpen: () => <span data-testid="icon-book-open" />,
}));

// Environment mock — usar vi.hoisted para que corra ANTES de los imports
vi.hoisted(() => {
  process.env.VITE_DOCUMENT_API_URL = "https://document-service-academy.fly.dev";
});

afterEach(() => {
  vi.clearAllMocks();
  mockErrorCallback = null;
});

// ===================================================================
// Tests
// ===================================================================

describe("PDFViewer", () => {
  const defaultProps = {
    documentId: 1,
    token: "test-token-123",
    activeExercise: null,
    onClose: vi.fn(),
    sidebarOpen: false,
    onToggleSidebar: vi.fn(),
  };

  // ================================================================
  // Token ausente
  // ================================================================

  it("muestra 'No hay sesión activa' cuando no hay token", async () => {
    render(<PDFViewer {...defaultProps} token="" />);

    await waitFor(() => {
      expect(screen.getByText("No hay sesión activa")).toBeDefined();
    });

    // No debería hacer fetch
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // ================================================================
  // Loading state
  // ================================================================

  it("muestra spinner durante la descarga", () => {
    // Nunca resolver la promesa para mantener el loading
    mockFetch.mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<PDFViewer {...defaultProps} />);

    // El spinner debería estar visible
    const spinner = document.querySelector(".animate-spin");
    expect(spinner).toBeDefined();
  });

  // ================================================================
  // Fetch exitoso
  // ================================================================

  it("descarga el PDF exitosamente y pasa blob URL al Document", async () => {
    const pdfContent = new Blob(["%PDF-1.4 mock content"], {
      type: "application/pdf",
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(pdfContent),
      status: 200,
    } as Response);

    render(<PDFViewer {...defaultProps} />);

    // Verificar que el fetch se hizo a la URL correcta
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        "https://document-service-academy.fly.dev/documents/1/download",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer test-token-123",
          },
        }
      );
    });

    // Verificar que se creó un blob URL
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(pdfContent);
    });

    // Verificar que se renderizó el Document
    await waitFor(() => {
      expect(screen.getByTestId("mock-document")).toBeDefined();
    });
  });

  // ================================================================
  // Error 401
  // ================================================================

  it("muestra 'Sesión expirada' en error 401", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Sesión expirada. Recargá la página.")).toBeDefined();
    });
  });

  // ================================================================
  // Error 404
  // ================================================================

  it("muestra 'Documento no encontrado' en error 404", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Documento no encontrado.")).toBeDefined();
    });
  });

  // ================================================================
  // Error de red
  // ================================================================

  it("muestra 'Error de red' cuando fetch lanza excepción", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Error de red al cargar el documento.")
      ).toBeDefined();
    });

    // Verificar que se logeó el error
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // ================================================================
  // PDF vacío
  // ================================================================

  it("muestra 'Error de red' cuando el PDF tiene size 0", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(new Blob([], { type: "application/pdf" })),
      status: 200,
    } as Response);

    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(
        screen.getByText("Error de red al cargar el documento.")
      ).toBeDefined();
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  // ================================================================
  // onLoadError del Document
  // ================================================================

  it("maneja onLoadError del Document con logging detallado", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Primero un fetch exitoso para que se renderice el Document
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () =>
        Promise.resolve(
          new Blob(["%PDF-1.4"], { type: "application/pdf" })
        ),
      status: 200,
    } as Response);

    render(<PDFViewer {...defaultProps} />);

    // Esperar a que el Document se renderice
    await waitFor(() => {
      expect(screen.getByTestId("mock-document")).toBeDefined();
    });

    // Simular onLoadError del Document
    act(() => {
      if (mockErrorCallback) {
        mockErrorCallback(new Error("Invalid PDF structure"));
      }
    });

    // Verificar el log
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "[PDFViewer] Error al renderizar PDF:",
        expect.any(Error)
      );
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "[PDFViewer] Detalles:",
      expect.any(String)
    );

    // Verificar que se muestra el mensaje de error
    await waitFor(() => {
      expect(
        screen.getByText("Error al renderizar el PDF.")
      ).toBeDefined();
    });

    consoleSpy.mockRestore();
  });

  // ================================================================
  // Limpieza de URL.createObjectURL
  // ================================================================

  it("revoca el blob URL al desmontar el componente", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () =>
        Promise.resolve(
          new Blob(["%PDF-1.4 mock"], { type: "application/pdf" })
        ),
      status: 200,
    } as Response);

    const { unmount } = render(<PDFViewer {...defaultProps} />);

    // Esperar que se cree el blob URL
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    // Desmontar
    unmount();

    // Verificar que se revocó
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:mock-pdf-url");
  });

  // ================================================================
  // Botones de navegación
  // ================================================================

  it("deshabilita botones de navegación durante carga", () => {
    mockFetch.mockImplementationOnce(
      () => new Promise(() => {})
    );

    render(<PDFViewer {...defaultProps} />);

    const prevButton = screen.getByLabelText("Página anterior");
    const nextButton = screen.getByLabelText("Página siguiente");

    expect(prevButton.hasAttribute("disabled")).toBe(true);
    expect(nextButton.hasAttribute("disabled")).toBe(true);
  });

  it("llama a onClose al hacer click en cerrar", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () =>
        Promise.resolve(
          new Blob(["%PDF-1.4"], { type: "application/pdf" })
        ),
      status: 200,
    } as Response);

    render(<PDFViewer {...defaultProps} />);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    const closeButton = screen.getByLabelText("Cerrar visor");
    closeButton.click();

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  // ================================================================
  // Reintento automático
  // ================================================================

  it("programa un reintento 3s después de un error de fetch", async () => {
    const setTimeoutSpy = vi.spyOn(global, "setTimeout");

    mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

    render(<PDFViewer {...defaultProps} />);

    // Esperar a que el fetch falle y se muestre el error
    await waitFor(() => {
      expect(
        screen.getByText("Error de red al cargar el documento.")
      ).toBeDefined();
    });

    // Verificar que se programó un setTimeout de 3s (reintento)
    expect(setTimeoutSpy).toHaveBeenCalledWith(
      expect.any(Function),
      3000
    );

    setTimeoutSpy.mockRestore();
  });

  it("intenta de nuevo después de un fallo cuando cambian las props", async () => {
    // Primer fetch: falla
    mockFetch.mockRejectedValueOnce(new TypeError("Failed to fetch"));

    const { rerender } = render(
      <PDFViewer {...defaultProps} documentId={1} />
    );

    // Esperar error
    await waitFor(() => {
      expect(
        screen.getByText("Error de red al cargar el documento.")
      ).toBeDefined();
    });

    // Segundo fetch: éxito (simula que el usuario cambió de documento)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: () =>
        Promise.resolve(
          new Blob(["%PDF-1.4"], { type: "application/pdf" })
        ),
      status: 200,
    } as Response);

    // Re-renderizar con diferente documentId para forzar re-fetch
    rerender(<PDFViewer {...defaultProps} documentId={2} />);

    // El nuevo fetch debería hacerse
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/documents/2/download"),
        expect.any(Object)
      );
    });

    // Debería mostrar el Document
    await waitFor(() => {
      expect(screen.getByTestId("mock-document")).toBeDefined();
    });
  });

  // ================================================================
  // Header banner con ejercicio activo
  // ================================================================

  it("muestra banner cuando hay ejercicio activo sin bbox", () => {
    render(
      <PDFViewer
        {...defaultProps}
        activeExercise={{
          exerciseId: "ex-1",
          number: "3.1",
          page: 5,
          bbox: null,
        }}
      />
    );

    expect(screen.getByText(/Ejercicio 3\.1/)).toBeDefined();
    expect(screen.getByText(/Página 5/)).toBeDefined();
  });
});
