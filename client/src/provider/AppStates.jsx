import { createContext, useContext, useEffect, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import {
  Circle,
  Line,
  Rectangle,
  Selection,
  Diamond,
  Hand,
  Lock,
  Arrow,
  Pen,
} from "../assets/icons";
import { BACKGROUND_COLORS, STROKE_COLORS, STROKE_STYLES } from "../global/var";
import { getElementById, minmax } from "../helper/element";
import useHistory from "../hooks/useHistory";

const AppContext = createContext();

const isElementsInLocal = () => {
  try {
    const storedElements = localStorage.getItem("elements");
    if (!storedElements) {
      console.log("No elements found in localStorage, initializing with empty array");
      return [];
    }
    
    const parsedElements = JSON.parse(storedElements);
    if (!Array.isArray(parsedElements)) {
      console.warn("Invalid elements format in localStorage, resetting to empty array");
      localStorage.removeItem("elements");
      return [];
    }
    
    return parsedElements;
  } catch (err) {
    console.error("Error loading elements from localStorage:", err);
    localStorage.removeItem("elements");
    return [];
  }
};

const AppContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [elements, setElements, undo, redo] = useHistory(isElementsInLocal(), session);
  const [selectedElement, setSelectedElement] = useState(null);
  const [action, setAction] = useState("none");
  const [selectedTool, setSelectedTool] = useState("pen");
  const [translate, setTranslate] = useState({ x: 0, y: 0, sx: 0, sy: 0 });
  const [scale, setScale] = useState(1);
  const [scaleOffset, setScaleOffset] = useState({ x: 0, y: 0 });
  const [lockTool, setLockTool] = useState(false);
  const [style, setStyle] = useState({
    strokeWidth: 3,
    strokeColor: STROKE_COLORS[0],
    strokeStyle: STROKE_STYLES[0].slug,
    fill: BACKGROUND_COLORS[0],
    opacity: 100,
  });

  const saveToLocalStorage = useCallback(() => {
    if (!session && Array.isArray(elements)) {
      try {
        if (elements === undefined || elements === null) {
          console.warn("Attempted to save undefined/null elements to localStorage");
          return;
        }
        
        const validElements = elements.filter(element => {
          return element && typeof element === 'object' && element.id;
        });

        if (validElements.length !== elements.length) {
          console.warn("Some elements were invalid and were filtered out");
        }

        localStorage.setItem("elements", JSON.stringify(validElements));
        console.log("Saved elements to localStorage:", validElements.length);
      } catch (err) {
        console.error("Error saving elements to localStorage:", err);
      }
    }
  }, [elements, session]);

  useEffect(() => {
    saveToLocalStorage();

    window.addEventListener('beforeunload', saveToLocalStorage);
    return () => {
      window.removeEventListener('beforeunload', saveToLocalStorage);
      saveToLocalStorage();
    };
  }, [saveToLocalStorage]);

  useEffect(() => {
    if (selectedElement && !getElementById(selectedElement.id, elements)) {
      setSelectedElement(null);
    }
  }, [elements, selectedElement]);

  const onZoom = useCallback((delta) => {
    if (delta === "default") {
      setScale(1);
      return;
    }
    setScale((prevState) => minmax(prevState + delta, [0.1, 20]));
  }, []);

  const toolAction = useCallback((slug) => {
    if (slug === "lock") {
      setLockTool((prevState) => !prevState);
      return;
    }
    setSelectedTool(slug);
  }, []);

  const tools = [
    [
      {
        slug: "lock",
        icon: Lock,
        title: "Keep selected tool active after drawing",
        toolAction,
      },
    ],
    [
      {
        slug: "hand",
        icon: Hand,
        title: "Hand",
        toolAction,
      },
      {
        slug: "selection",
        icon: Selection,
        title: "Selection",
        toolAction,
      },
      {
        slug: "pen",
        icon: Pen,
        title: "Pen",
        toolAction,
      },
      {
        slug: "rectangle",
        icon: Rectangle,
        title: "Rectangle",
        toolAction,
      },
      {
        slug: "diamond",
        icon: Diamond,
        title: "Diamond",
        toolAction,
      },
      {
        slug: "circle",
        icon: Circle,
        title: "Circle",
        toolAction,
      },
      {
        slug: "arrow",
        icon: Arrow,
        title: "Arrow",
        toolAction,
      },
      {
        slug: "line",
        icon: Line,
        title: "Line",
        toolAction,
      }
    ],
  ];

  const contextValue = {
    action,
    setAction,
    tools,
    selectedTool,
    setSelectedTool,
    elements,
    setElements,
    translate,
    setTranslate,
    scale,
    setScale,
    onZoom,
    scaleOffset,
    setScaleOffset,
    lockTool,
    setLockTool,
    style,
    setStyle,
    selectedElement,
    setSelectedElement,
    undo,
    redo,
    session,
    setSession,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

AppContextProvider.propTypes = {
  children: PropTypes.node.isRequired
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};

export { AppContextProvider, useAppContext };
