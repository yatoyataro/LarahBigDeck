import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Footer } from "@/components/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="mb-4 text-6xl font-bold gradient-primary bg-clip-text text-transparent">404</h1>
          <p className="mb-6 text-xl text-muted-foreground">Oops! Page not found</p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-primary text-primary-foreground shadow-card hover:shadow-card-hover transition-smooth font-medium"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default NotFound;
