import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock ResizeObserver for React Flow
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// Mock only ReactFlow CSS imports (the problematic ones)
vi.mock("reactflow/dist/style.css", () => ({}));
