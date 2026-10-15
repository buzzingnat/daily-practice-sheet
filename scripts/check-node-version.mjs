// Plain syntax on purpose: an old Node must be able to parse this file to complain about itself.
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 12)) {
    console.error(`This project needs Node 22.12 or newer; this shell runs ${process.versions.node}. Run "nvm use" first.`);
    process.exit(1);
}
