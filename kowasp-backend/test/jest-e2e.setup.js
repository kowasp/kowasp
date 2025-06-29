// Mock problematic dependencies for e2e tests
jest.mock('../../kowasp-core', () => ({
  ASTAnalyzer: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockReturnValue([])
  })),
  XSSAnalyzer: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockReturnValue([])
  })),
  ExpressConfigAnalyzer: jest.fn().mockImplementation(() => ({
    analyze: jest.fn().mockReturnValue({
      helmet: false,
      contentSecurityPolicy: false,
      xssFilter: false,
      noSniff: false,
      frameguard: false,
      hsts: false
    })
  }))
}));

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());

// Mock fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn(),
  writeFile: jest.fn(),
  readFile: jest.fn(),
  remove: jest.fn(),
  pathExists: jest.fn().mockResolvedValue(true)
}));

// Mock simple-git
const mockGit = {
  clone: jest.fn().mockResolvedValue({}),
  pull: jest.fn().mockResolvedValue({}),
  log: jest.fn().mockResolvedValue({ all: [] })
};

jest.mock('simple-git', () => {
  const mockSimpleGit = jest.fn(() => mockGit);
  mockSimpleGit.default = mockSimpleGit;
  return mockSimpleGit;
}); 