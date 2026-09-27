import fs from 'fs';
import path from 'path';

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf-8');
  if (code.includes('Object.assign(wrapped, handler)')) return;

  code = code.replace(
    'function modHandler(handler, ctx) {\n\t\treturn function(node, parent, state, info) {',
    'function modHandler(handler, ctx) {\n\t\tconst wrapped = function(node, parent, state, info) {'
  );
  code = code.replace(
    'default: return handler(node, parent, state, info);\n\t\t\t}\n\t\t};\n\t}',
    'default: return handler(node, parent, state, info);\n\t\t\t}\n\t\t};\n\t\tObject.assign(wrapped, handler);\n\t\treturn wrapped;\n\t}'
  );
  fs.writeFileSync(filePath, code, 'utf-8');
  console.log('[patch-fumadocs] Applied fix to:', filePath);
}

function findAndPatch(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.pnpm')) {
        findAndPatch(fullPath);
      } else if (entry.name === 'mdx-plugins') {
        patchFile(path.join(fullPath, 'stringifier.js'));
      } else {
        findAndPatch(fullPath);
      }
    }
  }
}

const rootNodeModules = path.resolve(process.cwd(), '../../node_modules');
findAndPatch(rootNodeModules);
