const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 9000;
const SECRET = process.env.GITHUB_SECRET || 'your_github_webhook_secret';

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/', (req, res) => {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) {
        return res.status(401).send('No signature provided.');
    }

    // Verify signature
    const hmac = crypto.createHmac('sha256', SECRET);
    const digest = 'sha256=' + hmac.update(JSON.stringify(req.body)).digest('hex');

    if (signature !== digest) {
        // Warning: in production use crypto.timingSafeEqual
        return res.status(401).send('Invalid signature.');
    }

    console.log('Valid webhook received. Pulling latest code and restarting containers...');
    
    // Execute git pull and docker-compose up
    const cmd = `cd /app-repo && git pull origin main && docker-compose build && docker-compose up -d`;
    
    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Exec error: ${error}`);
            return res.status(500).send(`Deployment failed: ${error.message}`);
        }
        console.log(`Stdout: ${stdout}`);
        if (stderr) console.error(`Stderr: ${stderr}`);
        
        res.status(200).send('Deployment triggered successfully.');
    });
});

app.listen(PORT, () => {
    console.log(`Webhook listener running on port ${PORT}`);
});
