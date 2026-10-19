/** Giả lập độ trễ mạng của backend thật, để UI thấy được trạng thái loading. */
export function wait(minMs = 400, maxMs = 800): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
