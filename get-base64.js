const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'screenshot.png');
if (fs.existsSync(p)) {
  const data = fs.readFileSync(p);
  console.log(data.toString('base64'));
}
