import { cp, mkdir, readdir, rm, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await rm('dist', {recursive:true, force:true});
await mkdir('dist', {recursive:true});
await cp('public','dist/site',{recursive:true});
await cp('shopify','dist/shopify',{recursive:true});
await mkdir('dist/shopify/assets',{recursive:true});
await cp('public/assets','dist/shopify/assets',{recursive:true});
await cp('public/veltia.js','dist/shopify/assets/veltia.js');
const css=(await readFile('public/veltia.css','utf8')).replaceAll("url('/assets/material-symbols-rounded.woff2')", "url('material-symbols-rounded.woff2')");
await writeFile('dist/shopify/assets/veltia.css',css);
execFileSync('python',['-c',`import pathlib, zipfile
root=pathlib.Path('dist/shopify')
with zipfile.ZipFile('dist/veltia-labs-shopify.zip','w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(root))
`]);
console.log('Built static site in dist/site and Shopify theme in dist/veltia-labs-shopify.zip');
