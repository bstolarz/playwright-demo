"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference types="node" />
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const fastify = (0, fastify_1.default)({
    logger: true
});
// Enable CORS
fastify.register(cors_1.default, {
    origin: true
});
// Store running test processes
const runningTests = new Map();
// Test configuration - maps endpoint names to test names in the spec file
const TESTS = {
    aysa: 'Accedo a la deuda de AYSA',
    metrogas: 'Accedo a la deuda de Metrogas',
    edenor: 'Accedo a la deuda de Edenor',
    abl: 'Accedo a website de ABL'
};
// Helper to run a Playwright test
async function runPlaywrightTest(testName) {
    const startTime = Date.now();
    try {
        // Use grep to run specific test by name
        const { stdout, stderr } = await execAsync(`npx playwright test --grep "${testName}" --reporter=line`, {
            cwd: process.cwd(),
            timeout: 300000 // 5 minute timeout
        });
        return {
            success: true,
            testName,
            output: stdout + stderr,
            duration: Date.now() - startTime
        };
    }
    catch (error) {
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
fastify.get('/', async () => {
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
fastify.get('/tests', async () => {
    return {
        tests: Object.entries(TESTS).map(([endpoint, name]) => ({
            endpoint: `/tests/${endpoint}`,
            name,
            method: 'POST'
        }))
    };
});
// Run all tests
fastify.post('/tests/run-all', async (request, reply) => {
    reply.header('Content-Type', 'application/json');
    const results = [];
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
fastify.post('/tests/:testId', async (request, reply) => {
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
        return { error: 'Expected value does not match actual' };
    }
    return result;
});
// Stream test output (for long-running tests)
fastify.get('/tests/:testId/stream', async (request, reply) => {
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
    const child = (0, child_process_1.spawn)('npx', ['playwright', 'test', '--grep', testName, '--reporter=line'], {
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
fastify.get('/health', async () => {
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
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=server.js.map