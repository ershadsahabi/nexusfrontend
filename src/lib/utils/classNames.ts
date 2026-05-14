// NexusProject\nexus-frontend\src\lib\utils\classNames.ts

import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
