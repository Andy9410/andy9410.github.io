import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {

  const location = useLocation();

  useEffect(() => {
    // Solo loguear si no estamos en la raíz del repo
    if (location.pathname !== "/" && location.pathname !== "/learnsoft/") {
      console.error("404 Error en:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
