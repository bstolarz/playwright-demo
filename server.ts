/// <reference types="node" />
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { exec, spawn, ChildProcess } from 'child_process';
import { promisify } from 'util';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';

const execAsync = promisify(exec);

const fastify = Fastify({
  logger: true
});

// Enable CORS
fastify.register(cors, {
  origin: true
});

// Enable Swagger
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Bren Fastify API',
      description: 'Bren Fastify API documentation',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://playwrighttestsservedwithfastify-e9fcaqegf0eef5e3.centralus-01.azurewebsites.net/',
      },
    ],
  },
});

// Enable Swagger UI
await fastify.register(swaggerUI, {
  routePrefix: '/docs',
});

// Store running test processes
const runningTests: Map<string, ChildProcess> = new Map();

// Test configuration - maps endpoint names to test names in the spec file
const TESTS = {
  aysa: 'Accedo a la deuda de AYSA',
  metrogas: 'Accedo a la deuda de Metrogas',
  edenor: 'Accedo a la deuda de Edenor',
  abl: 'Accedo a website de ABL'
} as const;

type TestName = keyof typeof TESTS;

interface TestResult {
  success: boolean;
  testName: string;
  output: string;
  error?: string;
  duration?: number;
}

// Helper to run a Playwright test
async function runPlaywrightTest(testName: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Use grep to run specific test by name
    const { stdout, stderr } = await execAsync(
      `npx playwright test --grep "${testName}" --reporter=line`,
      { 
        cwd: process.cwd(),
        timeout: 300000 // 5 minute timeout
      }
    );
    
    return {
      success: true,
      testName,
      output: stdout + stderr,
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      success: false,
      testName,
      output: error.stdout || '',
      error: error.stderr || error.message,
      duration: Date.now() - startTime
    };
  }
}

// Root endpoint - list available tests
fastify.get('/', {
  schema: {
    description: 'Get API information and list of available endpoints',
    tags: ['Info'],
    response: {
      200: {
        description: 'API information',
        type: 'object',
        properties: {
          message: { type: 'string' },
          availableEndpoints: { type: 'object', additionalProperties: { type: 'string' } },
        },
      },
    },
  },
}, async () => {
  return {
    message: 'Playwright Test Runner API',
    availableEndpoints: {
      'GET /tests': 'List all available tests',
      'POST /tests/run-all': 'Run all tests',
      'POST /tests/aysa': 'Run AYSA debt test',
      'POST /tests/metrogas': 'Run Metrogas debt test',
      'POST /tests/edenor': 'Run Edenor debt test',
      'POST /tests/abl': 'Run ABL website test'
    }
  };
});

// List all tests
fastify.get('/tests', {
  schema: {
    description: 'List all available Playwright tests',
    tags: ['Tests'],
    response: {
      200: {
        description: 'List of available tests',
        type: 'object',
        properties: {
          tests: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                endpoint: { type: 'string' },
                name: { type: 'string' },
                method: { type: 'string' },
              },
            },
          },
        },
      },
    },
  },
}, async () => {
  return {
    tests: Object.entries(TESTS).map(([endpoint, name]) => ({
      endpoint: `/tests/${endpoint}`,
      name,
      method: 'POST'
    }))
  };
});

// Run all tests
fastify.post('/tests/run-all', {
  schema: {
    description: 'Execute all Playwright tests sequentially',
    tags: ['Tests'],
    response: {
      200: {
        description: 'Results of all test executions',
        type: 'object',
        properties: {
          totalTests: { type: 'number' },
          passed: { type: 'number' },
          failed: { type: 'number' },
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                success: { type: 'boolean' },
                testName: { type: 'string' },
                output: { type: 'string' },
                error: { type: 'string' },
                duration: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
}, async (request, reply) => {
  reply.header('Content-Type', 'application/json');
  
  const results: TestResult[] = [];
  
  for (const [key, testName] of Object.entries(TESTS)) {
    fastify.log.info(`Running test: ${testName}`);
    const result = await runPlaywrightTest(testName);
    results.push(result);
  }
  
  return {
    totalTests: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
});

// Individual test endpoints
fastify.post<{ Params: { testId: TestName } }>('/tests/:testId', {
  schema: {
    description: 'Execute a specific Playwright test by ID',
    tags: ['Tests'],
    params: {
      type: 'object',
      properties: {
        testId: {
          type: 'string',
          enum: ['aysa', 'metrogas', 'edenor', 'abl'],
          description: 'The test identifier to run',
        },
      },
      required: ['testId'],
    },
    response: {
      200: {
        description: 'Test executed successfully',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          testName: { type: 'string' },
          output: { type: 'string' },
          error: { type: 'string' },
          duration: { type: 'number' },
        },
      },
      404: {
        description: 'Test not found',
        type: 'object',
        properties: {
          error: { type: 'string' },
          availableTests: { type: 'array', items: { type: 'string' } },
        },
      },
      500: {
        description: 'Test execution failed',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { testId } = request.params;
  
  if (!(testId in TESTS)) {
    reply.code(404);
    return { 
      error: 'Test not found',
      availableTests: Object.keys(TESTS)
    };
  }
  
  const testName = TESTS[testId];
  fastify.log.info(`Running test: ${testName}`);
  
  const result = await runPlaywrightTest(testName);
  
  if (!result.success) {
    reply.code(500);
    fastify.log.info('_____ result: ' + result);
    return { error: 'Expected value does not match actual' };
  }
  
  return result;
});

// Stream test output (for long-running tests)
fastify.get<{ Params: { testId: TestName } }>('/tests/:testId/stream', {
  schema: {
    description: 'Stream test output in real-time using Server-Sent Events (SSE)',
    tags: ['Tests'],
    params: {
      type: 'object',
      properties: {
        testId: {
          type: 'string',
          enum: ['aysa', 'metrogas', 'edenor', 'abl'],
          description: 'The test identifier to stream',
        },
      },
      required: ['testId'],
    },
    response: {
      200: {
        description: 'SSE stream of test output',
        type: 'string',
      },
      404: {
        description: 'Test not found',
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { testId } = request.params;
  
  if (!(testId in TESTS)) {
    reply.code(404);
    return { error: 'Test not found' };
  }
  
  const testName = TESTS[testId];
  
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  
  const child = spawn('npx', ['playwright', 'test', '--grep', testName, '--reporter=line'], {
    cwd: process.cwd(),
    shell: true
  });
  
  runningTests.set(testId, child);
  
  child.stdout.on('data', (data) => {
    reply.raw.write(`data: ${JSON.stringify({ type: 'stdout', data: data.toString() })}\n\n`);
  });
  
  child.stderr.on('data', (data) => {
    reply.raw.write(`data: ${JSON.stringify({ type: 'stderr', data: data.toString() })}\n\n`);
  });
  
  child.on('close', (code) => {
    reply.raw.write(`data: ${JSON.stringify({ type: 'done', exitCode: code })}\n\n`);
    reply.raw.end();
    runningTests.delete(testId);
  });
  
  request.raw.on('close', () => {
    if (runningTests.has(testId)) {
      child.kill();
      runningTests.delete(testId);
    }
  });
});

// Health check
fastify.get('/health', {
  schema: {
    description: 'Check API health status',
    tags: ['Health'],
    response: {
      200: {
        description: 'API is healthy',
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['ok'] },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
}, async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   GET  /         - API info`);
    console.log(`   GET  /tests    - List all tests`);
    console.log(`   POST /tests/aysa     - Run AYSA test`);
    console.log(`   POST /tests/metrogas - Run Metrogas test`);
    console.log(`   POST /tests/edenor   - Run Edenor test`);
    console.log(`   POST /tests/abl      - Run ABL test`);
    console.log(`   POST /tests/run-all  - Run all tests`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

