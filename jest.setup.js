global.TextEncoder = require("util").TextEncoder;
global.TextDecoder = require("util").TextDecoder;

// Mock Chart.js para testes
jest.mock("chart.js", () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock("react-chartjs-2", () => ({
  Bar: jest.fn(() => <div data-testid="mock-chart">Mock Chart</div>),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock Next.js server components
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, options) => ({
      status: options?.status || 200,
      json: () => Promise.resolve(data),
    })),
  },
  NextRequest: class MockNextRequest {
    constructor(url, options) {
      this.url = url;
      this.method = options?.method || "GET";
      this.headers = new Map(Object.entries(options?.headers || {}));
      this._body = options?.body;
    }
    async json() {
      return JSON.parse(this._body || "{}");
    }
  },
}));

// Mock global Request and Response for Node.js environment
global.Request = class MockRequest {
  constructor(url, options) {
    this.url = url;
    this.method = options?.method || "GET";
    this.headers = new Map(Object.entries(options?.headers || {}));
    this._body = options?.body;
  }
  async json() {
    return JSON.parse(this._body || "{}");
  }
};

global.Response = class MockResponse {
  constructor(body, options) {
    this._body = body;
    this.status = options?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.headers = new Map(Object.entries(options?.headers || {}));
  }
  async json() {
    return JSON.parse(this._body || "{}");
  }
  async text() {
    return this._body || "";
  }
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = "http://localhost:3000";
