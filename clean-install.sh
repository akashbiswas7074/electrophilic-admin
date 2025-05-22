# Remove node_modules and package-lock.json, then reinstall everything
rm -rf node_modules package-lock.json
npm install

# Or with yarn
rm -rf node_modules yarn.lock
yarn

# Or with pnpm
rm -rf node_modules pnpm-lock.yaml
pnpm install
