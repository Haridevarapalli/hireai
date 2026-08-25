const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

async function runLoadTest() {
    const targetUrl = process.env.TEST_URL || 'http://localhost:8000';
    const virtualUsers = parseInt(process.env.CONNECTIONS || '100', 10);
    const duration = parseInt(process.env.DURATION || '60', 10);

    console.log('Starting Baseline/Load Testing...');
    console.log(`• Virtual Users: ${virtualUsers}`);
    console.log(`• Duration: ${duration} seconds`);
    console.log(`• Target API: ${targetUrl}\n`);
    console.log('Running load test for 60 seconds, please wait...\n');

    let result;
    try {
        result = await autocannon({
            url: targetUrl,
            connections: virtualUsers,
            duration: duration,
        });
    } catch (err) {
        console.error('Fatal autocannon execution error:', err);
        const failMarkdown = `# Baseline / Load Testing

Virtual Users: ${virtualUsers}
Duration: ${duration}s
Total Requests: 0
Requests Per Second: 0 req/sec
Minimum Response Time: N/A
Average Response Time: N/A
Maximum Response Time: N/A
Result: FAIL
`;
        writeReports(failMarkdown, `Error: ${err.message}`);
        process.exit(1);
    }

    const totalRequests = result.requests.total || 0;
    const rps = Math.round(result.requests.average || 0);
    const minLatency = result.latency.min !== undefined ? `${result.latency.min} ms` : 'N/A';
    const avgLatency = result.latency.average !== undefined ? `${Math.round(result.latency.average)} ms` : 'N/A';
    const maxLatencyRaw = result.latency.max;
    const maxLatency = maxLatencyRaw !== undefined 
        ? (maxLatencyRaw >= 1000 ? `${(maxLatencyRaw / 1000).toFixed(1)}s (${maxLatencyRaw} ms)` : `${maxLatencyRaw} ms`)
        : 'N/A';

    // Criteria: Total requests > 0 and error rate < 10%
    const errorCount = result.errors || 0;
    const isPass = totalRequests > 0 && ((errorCount / (totalRequests || 1)) < 0.10);
    const resultStatus = isPass ? 'PASS' : 'FAIL';

    console.log('________________________________________');
    console.log('Baseline / Load Testing Results');
    console.log('________________________________________');
    console.log(`Virtual Users: ${virtualUsers}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Requests Per Second: ${rps} req/sec`);
    console.log(`Minimum Response Time: ${minLatency}`);
    console.log(`Average Response Time: ${avgLatency}`);
    console.log(`Maximum Response Time: ${maxLatency}`);
    console.log(`Result: ${resultStatus}`);
    console.log('________________________________________\n');

    const summaryMarkdown = `# Baseline / Load Testing

Virtual Users: ${virtualUsers}
Duration: ${duration}s
Total Requests: ${totalRequests}
Requests Per Second: ${rps} req/sec
Minimum Response Time: ${minLatency}
Average Response Time: ${avgLatency}
Maximum Response Time: ${maxLatency}
Result: ${resultStatus}
`;

    const logDetails = `Baseline / Load Testing Log Details
Target: ${targetUrl}
Virtual Users: ${virtualUsers}
Duration: ${duration}s
Total Requests: ${totalRequests}
Requests Per Second: ${rps}
Min Latency: ${minLatency}
Avg Latency: ${avgLatency}
Max Latency: ${maxLatency}
Errors: ${errorCount}
Result: ${resultStatus}

Full Autocannon Stats:
${JSON.stringify(result, null, 2)}
`;

    writeReports(summaryMarkdown, logDetails);

    if (!isPass) {
        process.exitCode = 1;
    }
}

function writeReports(summaryMarkdown, logDetails) {
    const summaryDir = path.join(__dirname, '..', 'Test Results', 'Summary');
    const logsDir = path.join(__dirname, '..', 'Test Results', 'Logs');

    if (!fs.existsSync(summaryDir)) fs.mkdirSync(summaryDir, { recursive: true });
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

    fs.writeFileSync(path.join(summaryDir, 'load_test_summary.md'), summaryMarkdown, 'utf8');
    fs.writeFileSync(path.join(logsDir, 'load_test_execution.log'), logDetails, 'utf8');

    // Append to GITHUB_STEP_SUMMARY if executing in GitHub Actions runner
    if (process.env.GITHUB_STEP_SUMMARY) {
        try {
            fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMarkdown + '\n', 'utf8');
        } catch (e) {
            console.error('Unable to write to GITHUB_STEP_SUMMARY:', e);
        }
    }
}

runLoadTest().catch((err) => {
    console.error('Unhandled load test error:', err);
    process.exit(1);
});
