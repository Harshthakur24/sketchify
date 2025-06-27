import { useState, useCallback, useRef } from "react";
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
  }, [index, session]);

  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prevIndex => prevIndex - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prevIndex => prevIndex + 1);
    }
  }, [index, history.length]);

  return [history[index], setState, undo, redo];
};

export default useHistory;
