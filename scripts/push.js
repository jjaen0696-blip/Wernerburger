const { execSync } = require('child_process');

const message = process.env.COMMIT_MESSAGE || process.argv[2] || 'Auto push from script';

try {
  console.log('Staging changes...');
  execSync('git add .', { stdio: 'inherit' });

  console.log(`Committing with message: ${message}`);
  execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

  console.log('Pushing to origin master...');
  execSync('git push origin master', { stdio: 'inherit' });

  console.log('Push completo.');
} catch (error) {
  console.error('Error during push:', error.message || error);
  process.exit(1);
}
