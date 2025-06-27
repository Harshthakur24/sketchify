import { distance } from "./canvas";
import { v4 as uuid } from "uuid";

export function isWithinElement(x, y, element) {
  let { tool, x1, y1, x2, y2, strokeWidth, points } = element;
  let a, b, c, offset, width, height, centreX, centreY, mouseToCentreX, mouseToCentreY, radiusX, radiusY, minX, maxX, minY, maxY;

  switch (tool) {
    case "pen":
      if (!points || points.length < 2) return false;
      for (let i = 1; i < points.length; i++) {
        a = points[i - 1];
        b = points[i];
        c = { x, y };
        offset = distance(a, b) - (distance(a, c) + distance(b, c));
        if (Math.abs(offset) < (strokeWidth || 1)) {
          return true;
        }
      }
      return false;
    case "arrow":
    case "line":
      a = { x: x1, y: y1 };
      b = { x: x2, y: y2 };
      c = { x, y };
      offset = distance(a, b) - (distance(a, c) + distance(b, c));
      return Math.abs(offset) < (0.05 * strokeWidth || 1);
    case "circle":
      width = x2 - x1 + strokeWidth;
      height = y2 - y1 + strokeWidth;
      x1 -= strokeWidth / 2;
      y1 -= strokeWidth / 2;

      centreX = x1 + width / 2;
      centreY = y1 + height / 2;

      mouseToCentreX = centreX - x;
      mouseToCentreY = centreY - y;

      radiusX = Math.abs(width) / 2;
      radiusY = Math.abs(height) / 2;

      return (
        (mouseToCentreX * mouseToCentreX) / (radiusX * radiusX) +
          (mouseToCentreY * mouseToCentreY) / (radiusY * radiusY) <=
        1
      );

    case "diamond":
    case "rectangle":
      minX = Math.min(x1, x2) - strokeWidth / 2;
      maxX = Math.max(x1, x2) + strokeWidth / 2;
      minY = Math.min(y1, y2) - strokeWidth / 2;
      maxY = Math.max(y1, y2) + strokeWidth / 2;

      return x >= minX && x <= maxX && y >= minY && y <= maxY;
  }
}

export function getElementPosition(x, y, elements) {
  return elements?.filter((element) => isWithinElement(x, y, element)).at(-1);
}

export function createElement(x1, y1, x2, y2, style, tool) {
  const element = { id: uuid(), x1, y1, x2, y2, ...style, tool };
  if (tool === 'pen') {
    element.points = [{x: x1, y: y1}];
  }
  return element;
}

export function updateElement(
  id,
  stateOption,
  setState,
  state,
  overwrite = false
) {
  const index = state.findIndex((ele) => ele.id == id);

  const stateCopy = [...state];

  stateCopy[index] = {
    ...stateCopy[index],
    ...stateOption,
  };

  setState(stateCopy, overwrite);
}

export function deleteElement(s_element, setState, setSelectedElement) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) => prevState.filter((element) => element.id != id));
  setSelectedElement(null);
}

export function duplicateElement(
  s_element,
  setState,
  setSelected,
  factor,
  offsets = {}
) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) =>
    prevState
      .map((element) => {
        if (element.id == id) {
          const duplicated = { ...moveElement(element, factor), id: uuid() };
          setSelected({ ...duplicated, ...offsets });
          return [element, duplicated];
        }
        return element;
      })
      .flat()
  );
}

export function moveElement(element, factorX, factorY = null) {
  if (element.tool === "pen" && element.points) {
    return {
      ...element,
      points: element.points.map(point => ({
        x: point.x + factorX,
        y: point.y + (factorY ?? factorX)
      })),
      x1: element.x1 + factorX,
      y1: element.y1 + (factorY ?? factorX),
      x2: element.x2 + factorX,
      y2: element.y2 + (factorY ?? factorX),
    };
  }
  
  return {
    ...element,
    x1: element.x1 + factorX,
    y1: element.y1 + (factorY ?? factorX),
    x2: element.x2 + factorX,
    y2: element.y2 + (factorY ?? factorX),
  };
}

export function moveElementLayer(id, to, setState, state) {
  const index = state.findIndex((ele) => ele.id == id);
  const stateCopy = [...state];
  let replace = stateCopy[index];
  stateCopy.splice(index, 1);

  let toReplaceIndex = index;
  if (to == 1 && index < state.length - 1) {
    toReplaceIndex = index + 1;
  } else if (to == -1 && index > 0) {
    toReplaceIndex = index - 1;
  } else if (to == 0) {
    toReplaceIndex = 0;
  } else if (to == 2) {
    toReplaceIndex = state.length - 1;
  }

  const firstPart = stateCopy.slice(0, toReplaceIndex);
  const lastPart = stateCopy.slice(toReplaceIndex);

  setState([...firstPart, replace, ...lastPart]);
}

export function arrowMove(s_element, x, y, setState) {
  if (!s_element) return;

  const { id } = s_element;
  setState((prevState) =>
    prevState.map((element) => {
      if (element.id == id) {
        return moveElement(element, x, y);
      }
      return element;
    })
  );
}

export function minmax(value, interval) {
  return Math.max(Math.min(value, interval[1]), interval[0]);
}

export function getElementById(id, elements) {
  return elements?.find((element) => element.id == id);
}

export function adjustCoordinates(element) {
  const { id, x1, x2, y1, y2, tool } = element;
  if (tool == "line" || tool == "arrow") return { id, x1, x2, y1, y2 };

  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return { id, x1: minX, y1: minY, x2: maxX, y2: maxY };
}

export function resizeValue(
  corner,
  type,
  x,
  y,
  padding,
  { x1, x2, y1, y2 },
  offset,
  elementOffset
) {
  const getPadding = (condition) => {
    return condition ? padding : padding * -1;
  };

  const getType = (y, coordinate, originalCoordinate, eleOffset, te = false) => {
    if (type == "default") return originalCoordinate;

    const def = coordinate - y;
    if (te) return eleOffset - def;
    return eleOffset + def;
  };

  switch (corner) {
    case "tt":
      return {
        y1: y + getPadding(y < y2),
        y2: getType(y, offset.y, y2, elementOffset.y2),
        x1: getType(y, offset.y, x1, elementOffset.x1, true),
        x2: getType(y, offset.y, x2, elementOffset.x2),
      };
    case "bb":
      return { y2: y + getPadding(y < y1) };
    case "rr":
      return { x2: x + getPadding(x < x1) };
    case "ll":
      return { x1: x + getPadding(x < x2) };
    case "tl":
      return { x1: x + getPadding(x < x2), y1: y + getPadding(y < y2) };
    case "tr":
      return { x2: x + getPadding(x < x1), y1: y + getPadding(y < y2) };
    case "bl":
      return { x1: x + getPadding(x < x2), y2: y + getPadding(y < y1) };
    case "br":
      return { x2: x + getPadding(x < x1), y2: y + getPadding(y < y1) };
    case "l1":
      return { x1: x, y1: y };
    case "l2":
      return { x2: x, y2: y };
  }
}

export function saveElements(elements) {
  const jsonString = JSON.stringify(elements);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.download = "canvas.sketchFlow";
  link.href = url;
  link.click();
}

export function uploadElements(setElements) {
  function uploadJSON(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setElements(data);
      } catch (error) {
        console.error("Error :", error);
      }
    };

    reader.readAsText(file);
  }

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = ".kyrosDraw";
  fileInput.onchange = uploadJSON;
  fileInput.click();
}
