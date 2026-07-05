const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npmCommand = isWin ? 'npm.cmd' : 'npm';
const repoRoot = path.resolve(__dirname, '..');

function runCommand(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' },
  });

  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${command}: ${error.message}`);
  });

  return child;
}

function hasDocker() {
  return new Promise((resolve) => {
    const docker = spawn(isWin ? 'where' : 'which', [isWin ? 'docker' : 'docker'], {
      stdio: 'ignore',
      shell: false,
    });

    docker.on('exit', (code) => resolve(code === 0));
    docker.on('error', () => resolve(false));
  });
}

function hasDockerCompose() {
  return new Promise((resolve) => {
    const dockerCompose = spawn(isWin ? 'where' : 'which', [isWin ? 'docker-compose' : 'docker-compose'], {
      stdio: 'ignore',
      shell: false,
    });

    dockerCompose.on('exit', (code) => resolve(code === 0));
    dockerCompose.on('error', () => resolve(false));
  });
}

async function startDocker() {
  const dockerAvailable = await hasDocker();
  const composeAvailable = await hasDockerCompose();

  if (!dockerAvailable) {
    console.log('[dev] Docker is not available. Skipping container startup.');
    return;
  }

  const composeArgs = composeAvailable ? ['compose', 'up', '-d'] : ['up', '-d'];
  const composeCommand = composeAvailable ? 'docker-compose' : 'docker';

  console.log(`[dev] Starting services with ${composeCommand} ${composeArgs.join(' ')}...`);
  const dockerProcess = runCommand(composeCommand, composeArgs, repoRoot);

  dockerProcess.on('exit', (code) => {
    if (code !== 0) {
      console.warn('[dev] Docker startup finished with a non-zero exit code. Continuing with frontend apps.');
    }
  });
}

function startFrontends() {
  const citizen = runCommand(npmCommand, ['run', 'dev'], path.join(repoRoot, 'apps/citizen-web'));
  const admin = runCommand(npmCommand, ['run', 'dev'], path.join(repoRoot, 'apps/admin-web'));

  const stopAll = () => {
    citizen.kill('SIGINT');
    admin.kill('SIGINT');
  };

  process.on('SIGINT', stopAll);
  process.on('SIGTERM', stopAll);

  citizen.on('exit', (code) => {
    if (code !== 0) {
      console.error('[dev] Citizen web exited unexpectedly.');
    }
  });

  admin.on('exit', (code) => {
    if (code !== 0) {
      console.error('[dev] Admin web exited unexpectedly.');
    }
  });
}

(async () => {
  await startDocker();
  startFrontends();
})();
