const express = require('express');
const app = express();
const port = 3000;

app.get('/node-api', (req, res) => {
  res.json({
    service: "Node.js Microservice",
    status: "Running",
    timestamp: Date.now()
  });
});

app.listen(port, () => {
  console.log(`Node service listening on port ${port}`);
});
