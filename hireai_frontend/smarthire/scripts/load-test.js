const autocannon = require('autocannon');

async function runLoadTest() {
    console.log('Starting Baseline/Load Testing...');
    console.log('• 100 virtual users');
    console.log('• Running continuously for 1 minute');
    console.log('• Target: http://localhost:3000\n');
    console.log('Please wait 60 seconds...\n');

    const result = await autocannon({
        url: 'http://localhost:3000',
        connections: 100,
        duration: 60,
    });

    console.log('________________________________________');
    console.log('What you will see');
    console.log('Requests per second (RPS)');
    console.log(`Example:\n${Math.round(result.requests.average)} req/sec`);
    console.log(`Meaning your API is handling about ${Math.round(result.requests.average)} requests every second.`);
    console.log('________________________________________');
    console.log('Response Time');
    console.log('Example:');
    console.log(`Average: ${Math.round(result.latency.average)}ms`);
    console.log(`Min: ${result.latency.min}ms`);
    console.log(`Max: ${result.latency.max}ms`);
    console.log('Meaning:');
    console.log(`• Fastest response = ${result.latency.min}ms`);
    console.log(`• Average = ${Math.round(result.latency.average)}ms`);
    console.log(`• Slowest = ${result.latency.max >= 1000 ? (result.latency.max / 1000).toFixed(1) + 's' : result.latency.max + 'ms'}`);
}

runLoadTest().catch(console.error);
