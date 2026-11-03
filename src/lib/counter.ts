/**
 * Lógica pura del contador eterno (auto amarillo y otros juegos tipo 'counter').
 * Sin dependencias de runtime: solo aritmética.
 */

export interface CounterEvent {
  user_id: string;
  delta: 1 | -1;
}

/**
 * Suma los deltas de un usuario a partir de una lista de eventos.
 * El total nunca baja de 0 (cada -1 se aplica solo si el acumulado parcial > 0).
 */
export function deriveTotal(events: CounterEvent[], userId: string): number {
  let total = 0;
  for (const e of events) {
    if (e.user_id !== userId) continue;
    const next = total + e.delta;
    total = next < 0 ? 0 : next;
  }
  return total;
}

/**
 * Indica si se puede anular el último punto (insertar delta = -1).
 * Solo posible cuando el total actual es mayor que 0.
 */
export function canUndo(total: number): boolean {
  return total > 0;
}
