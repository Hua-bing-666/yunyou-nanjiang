export const DRAG_OPEN_THRESHOLD_PX = 8

export function shouldOpenChatAfterPointerUp(
  startX,
  startY,
  endX,
  endY,
  threshold = DRAG_OPEN_THRESHOLD_PX,
) {
  const deltaX = endX - startX
  const deltaY = endY - startY
  return Math.hypot(deltaX, deltaY) <= threshold
}
