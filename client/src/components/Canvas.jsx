import useCanvas from "../hooks/useCanvas";
import { useAppContext } from "../provider/AppStates";

export default function Canvas() {
  const {
    canvasRef,
    dimension,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  } = useCanvas();

  const { selectedTool } = useAppContext();

  return (
    <>
      <canvas
        id="canvas"
        ref={canvasRef}
        width={dimension.width}
        height={dimension.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        data-tool={selectedTool}
      />
    </>
  );
}
