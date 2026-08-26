import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Ref to always access the latest currentPage without recreating listener
  const currentPageRef = useRef(currentPage);
  
  // Track last processed message to ignore duplicates
  const lastProcessedMessageRef = useRef(null);
  
  // Update ref whenever currentPage changes
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // Navigation functions with locking and boundaries
  const nextPage = useCallback(() => {
    // Lock navigation if already navigating
    if (isNavigating) return;
    
    // Page boundary check
    if (currentPageRef.current >= 6) return;
    
    // Lock and navigate
    setIsNavigating(true);
    setCurrentPage(prev => Math.min(prev + 1, 6));
    
    // Release lock after transition (slightly longer for safety)
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  }, [isNavigating]);

  const prevPage = useCallback(() => {
    if (isNavigating) return;
    if (currentPageRef.current <= 1) return;
    
    setIsNavigating(true);
    setCurrentPage(prev => Math.max(prev - 1, 1));
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  }, [isNavigating]);

  const restart = useCallback(() => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    setCurrentPage(1);
    
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  }, [isNavigating]);

  // SINGLE message listener — created ONCE, never recreated
  useEffect(() => {
    const handleMessage = (event) => {
      // Ignore messages from unknown sources (optional security)
      // if (event.source !== window.parent) return;
      
      const { type } = event.data || {};
      
      // Create a unique ID for this message to detect duplicates
      const messageId = `${type}_${Date.now()}_${Math.random()}`;
      
      // If same message type is already being processed, ignore
      if (lastProcessedMessageRef.current === type) {
        console.log('⚠️ Duplicate message ignored:', type);
        return;
      }
      
      if (type === "NEXT_PAGE") {
        // Set last processed message
        lastProcessedMessageRef.current = type;
        nextPage();
        // Clear after a short delay to allow next legitimate click
        setTimeout(() => {
          lastProcessedMessageRef.current = null;
        }, 1200);
      } else if (type === "PREV_PAGE") {
        lastProcessedMessageRef.current = type;
        prevPage();
        setTimeout(() => {
          lastProcessedMessageRef.current = null;
        }, 1200);
      } else if (type === "RESTART") {
        lastProcessedMessageRef.current = type;
        restart();
        setTimeout(() => {
          lastProcessedMessageRef.current = null;
        }, 1200);
      }
    };

    window.addEventListener("message", handleMessage);

    // Cleanup: remove listener only once when component unmounts
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [nextPage, prevPage, restart]); // Dependencies are stable (useCallback)

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <iframe
        src={`/page${currentPage}/page${currentPage}.html`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        title={`Page ${currentPage}`}
      />
    </div>
  );
}

export default App;