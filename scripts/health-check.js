const http = require('http');

function healthCheck(host = 'localhost', port = 3000, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const req = http.request({
            hostname: host,
            port: port,
            path: '/api/health',
            method: 'GET',
            timeout: timeout,
        }, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        const health = JSON.parse(data);
                        resolve(health);
                    } catch (e) {
                        reject(new Error('Invalid health response'));
                    }
                } else {
                    reject(new Error(`Health check failed: ${res.statusCode}`));
                }
            });
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Health check timeout'));
        });

        req.on('error', (err) => {
            reject(err);
        });

        req.end();
    });
}

// Run if called directly
if (require.main === module) {
    healthCheck()
        .then((health) => {
            console.log('✅ Health check passed:', health);
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Health check failed:', error.message);
            process.exit(1);
        });
}

module.exports = { healthCheck };
