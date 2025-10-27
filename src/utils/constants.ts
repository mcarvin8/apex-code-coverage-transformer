import { HandlerRegistry } from '../handlers/HandlerRegistry.js';

// Import all handlers to ensure they're registered
import '../handlers/getHandler.js';

/**
 * Get available coverage format options.
 * This dynamically retrieves all registered formats from the HandlerRegistry.
 */
export const formatOptions: string[] = HandlerRegistry.getAvailableFormats();
