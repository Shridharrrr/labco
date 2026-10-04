import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server .env
const serverEnvPath = path.resolve(__dirname, '../../server/.env');
if (fs.existsSync(serverEnvPath)) {
  dotenv.config({ path: serverEnvPath });
} else {
  dotenv.config();
}

const secret = process.env.JWT_ACCESS_SECRET;
if (!secret) {
  console.error('Error: JWT_ACCESS_SECRET not found in server/.env');
  process.exit(1);
}

const args = process.argv.slice(2);
const emailOrId = args[0] || 'admin@example.com';
const userId = args[1] || '6ac28b75e9c09f31c4b5a4bc';

// Generate long-lived token (1 year)
const token = jwt.sign(
  { userId, email: emailOrId },
  secret,
  { expiresIn: '365d' }
);

console.log('\n============================================================');
console.log('  LabCo MCP Long-Lived Token (Valid for 1 Year)');
console.log('============================================================');
console.log(`User: ${emailOrId}`);
console.log(`UserId: ${userId}`);
console.log('\nToken:');
console.log(token);
console.log('\n------------------------------------------------------------');
console.log('  Add this to your Claude Desktop configuration:');
console.log('  Path: %APPDATA%\\Claude\\claude_desktop_config.json');
console.log('------------------------------------------------------------\n');

const mcpIndexPath = path.resolve(__dirname, 'index.js').replace(/\\/g, '/');

const config = {
  mcpServers: {
    labco: {
      command: 'node',
      args: [mcpIndexPath],
      env: {
        LABCO_API_URL: 'http://localhost:5000/api',
        LABCO_TOKEN: token,
      },
    },
  },
};

console.log(JSON.stringify(config, null, 2));
console.log('\n============================================================\n');
