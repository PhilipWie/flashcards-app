// runs before every test file
import "@testing-library/jest-dom/vitest"; // matchers like toBeDisabled(), toBeInTheDocument()
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
    // unmount rendered components and reset storage between tests
    cleanup();
    localStorage.clear();
});
