import { useState, useCallback, useRef, useEffect } from "react";
import { socket } from "../api/socket";

const useHistory = (initialState = [], session = null) => {
  // Ensure initial state is always an array
  const safeInitialState = Array.isArray(initialState) ? initialState : [];
  const [history, setHistory] = useState([safeInitialState]);
  const [index, setIndex] = useState(0);
  
  // Keep a ref to the latest state to prevent stale closures
  const latestState = useRef(history[index]);
  
  // Update ref whenever history or index changes
  if (history[index] !== latestState.current) {
    latestState.current = history[index];
  }

  useEffect(() => {
    if (session) {
      console.log("Setting up socket listeners for session:", session);
      
      const handleSetElements = (elements) => {
        console.log("Received elements from socket:", elements);
        if (Array.isArray(elements)) {
          setState(elements, false, false);
        } else {
          console.warn("Received invalid elements from socket:", elements);
        }
      };

      socket.on("setElements", handleSetElements);
      socket.on("error", (error) => {
        console.error("Socket error:", error);
      });

      return () => {
        console.log("Cleaning up socket listeners");
        socket.off("setElements", handleSetElements);
        socket.off("error");
      };
    }
  }, [session]);

  const validateElements = useCallback((elements) => {
    if (!Array.isArray(elements)) {
      console.warn("Invalid elements array:", elements);
      return [];
    }
    
    return elements.filter(element => {
      const isValid = element && typeof element === 'object' && element.id;
      if (!isValid) {
        console.warn("Invalid element filtered out:", element);
      }
      return isValid;
    });
  }, []);

  const setState = useCallback((action, overwrite = false, emit = true) => {
    setHistory(prevHistory => {
      if (action === "prevState") {
        if (index <= 0) return prevHistory;
        setIndex(prevIndex => prevIndex - 1);
        return prevHistory;
      }

      // Handle function updates
      const newState = typeof action === "function" 
        ? action(latestState.current || []) 
        : action;

      // Validate new state
      const safeNewState = validateElements(newState);

      if (session) {
        if (emit) {
          console.log("Emitting elements to room:", session, safeNewState);
          socket.emit("getElements", { elements: safeNewState, room: session });
        }
        return [safeNewState];
      }

      if (overwrite) {
        const historyCopy = [...prevHistory];
        historyCopy[index] = safeNewState;
        return historyCopy;
      }

      const updatedHistory = [...prevHistory.slice(0, index + 1), safeNewState];
      setIndex(updatedHistory.length - 1);
      return updatedHistory;
    });
  }, [index, session, validateElements]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prevIndex => {
        const newIndex = prevIndex - 1;
        const newState = history[newIndex];
        if (session) {
          socket.emit("getElements", { elements: newState, room: session });
        }
        return newIndex;
      });
    }
  }, [index, session, history]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prevIndex => {
        const newIndex = prevIndex + 1;
        const newState = history[newIndex];
        if (session) {
          socket.emit("getElements", { elements: newState, room: session });
        }
        return newIndex;
      });
    }
  }, [index, history.length, session]);

  return [history[index], setState, undo, redo];
};

export default useHistory;
