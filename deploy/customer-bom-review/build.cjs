const fs=require('node:fs'),z=require('node:zlib'),p=require('node:path');
const files=JSON.parse(z.gunzipSync(fs.readFileSync('site.gz')));
for(const [n,b] of Object.entries(files)){if(n.includes('..')||p.isAbsolute(n))throw Error('Invalid public path');const f=p.join('public',n);fs.mkdirSync(p.dirname(f),{recursive:true});fs.writeFileSync(f,Buffer.from(b,'base64'));}
for(const name of ['job.html','bom-review.js','bom-review.css','customers.html','customers.js','core-client.js'])fs.copyFileSync(name,p.join('public',name));
