import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { createDepthServer } from '../server/http.mjs';
import { generateLevel, normalizeRequest } from '../src/generation/Generator.js';
let server, base;
before(async () => { server=createDepthServer();server.listen(0,'127.0.0.1');await once(server,'listening');base=`http://127.0.0.1:${server.address().port}`; });
after(async () => { server.closeAllConnections();await new Promise(resolve=>server.close(resolve)); });
const post=(path,data,headers={})=>fetch(`${base}/api/v1/${path}`,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(data)});
test('HTTP API and static game run on one local server without dependencies',async()=>{
  const health=await fetch(`${base}/api/v1/health`);assert.equal(health.status,200);assert.equal((await health.json()).defaultGeneratorVersion,5);
  const catalog=await(await fetch(`${base}/api/v1/catalog`)).json();assert.equal(catalog.worlds.length,5);assert.equal(catalog.levels.length,100);
  for(const key of ['worlds','characters','chapters','abilities','obstacles','rewards','memories']) assert.deepEqual(await(await fetch(`${base}/api/v1/${key}`)).json(),catalog[key]);
  const page=await fetch(base);assert.match(page.headers.get('content-type'),/text\/html/);assert.match(await page.text(),/atlas-dialog/);
  const module=await fetch(`${base}/src/generation/Generator.js`);assert.match(module.headers.get('content-type'),/text\/javascript/);
  const head=await fetch(base,{method:'HEAD'});assert.equal(await head.text(),'');
});
test('GET, POST, engine and batched generation produce identical reproducible payloads',async()=>{
  const parameters={mode:'expedition',seed:'MUNDOS',worldId:'nexus',level:1,intensity:4,length:36,generatorVersion:5};
  const direct=generateLevel(parameters), get=await(await fetch(`${base}/api/v1/levels/generate?${new URLSearchParams(parameters)}`)).json();
  assert.deepEqual(get,direct);assert.deepEqual(await(await post('levels/generate',parameters)).json(),direct);
  const batch=await(await post('levels/batch',{...parameters,count:3})).json();assert.equal(batch.count,3);assert.deepEqual(batch.levels[0],direct);
  for(let i=0;i<3;i++)assert.deepEqual(batch.levels[i],generateLevel({...parameters,level:i+1}));
  assert.equal((await post('levels/batch',{...parameters,level:35,count:3})).status,400);
  assert.equal((await post('levels/batch',{count:21})).status,400);
});
test('API rejects unknown keys, invalid types, unsupported versions and unbounded requests',async()=>{
  for(const params of [null,[],{mode:'arcade'},{level:'1'},{level:0},{level:100001,length:0},{level:13,length:12},{length:100000},{generatorVersion:6},{generatorVersion:4,worldId:'core'},
    {mode:'story',worldId:'core'},{worldId:0},{worldId:'none'},{intensity:5.1},{seed:'../oops'},{seed:'x'.repeat(49)},{extra:true},{mode:null},{length:null},{seed:null}]) {
    const response=await post('levels/generate',params);assert.equal(response.status,400,JSON.stringify(params));assert.equal((await response.json()).error.status,400);
  }
  for(const q of ['level=1&level=2','level=1.5','level=-1','level=Infinity','level=','__proto__=x']) assert.equal((await fetch(`${base}/api/v1/levels/generate?${q}`)).status,400,q);
  assert.equal((await fetch(`${base}/api/v2/health`)).status,404);assert.equal((await fetch(`${base}/api/v1/nope`)).status,404);
  assert.equal((await fetch(`${base}/api/v1/levels/generate`,{method:'PUT'})).status,405);
  assert.equal((await post('catalog',{})).status,405);
});
test('JSON parsing, content types and fixed-length payload limits return structured errors',async()=>{
  const path=`${base}/api/v1/levels/generate`;
  assert.equal((await fetch(path,{method:'POST',body:'{}'})).status,415);
  const malformed=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:'{'});assert.equal(malformed.status,400);
  const large=await post('levels/generate',{seed:'x'.repeat(70000)});assert.equal(large.status,413);assert.equal((await large.json()).error.status,413);
});
test('chunked bodies are bounded without storing or parsing excess bytes',async()=>{
  const response=await new Promise((resolve,reject)=>{
    const req=http.request(`${base}/api/v1/levels/generate`,{method:'POST',headers:{'Content-Type':'application/json'}},res=>{
      const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(Buffer.concat(chunks))}));
    });req.on('error',reject);req.write('{"seed":"');for(let i=0;i<8;i++)req.write('x'.repeat(10000));req.end('"}');
  });assert.equal(response.status,413);assert.equal(response.body.error.status,413);
});
test('foreign origins, nonlocal hosts and traversal attempts cannot access local resources',async()=>{
  const foreign=await post('levels/generate',{}, {Origin:'https://example.invalid'});assert.equal(foreign.status,403);assert.equal(foreign.headers.has('access-control-allow-origin'),false);
  assert.equal((await post('levels/generate',{}, {Origin:base})).status,200);
  const hostStatus=await new Promise((resolve,reject)=>{ const req=http.get(`${base}/api/v1/catalog`,{headers:{Host:'attacker.invalid'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode));});req.on('error',reject); });
  assert.equal(hostStatus,403);
  for(const suffix of ['/%2e%2e%2fpackage.json','/%5c..%5cpackage.json','/.git/config','/%00']) assert.equal((await fetch(base+suffix)).status,403);
  assert.equal((await fetch(base+'/%ZZ')).status,400);
});
test('validation endpoint reports structural validity separately from reachability',async()=>{
  const world=generateLevel({worldId:'archives'}).world;
  const response=await post('levels/validate',{world});assert.equal(response.status,200);
  assert.deepEqual(await response.json(),{valid:true,errors:[],reachability:'not-run'});
  world.platforms=[];const invalid=await(await post('levels/validate',{world})).json();assert.equal(invalid.valid,false);assert.equal(invalid.reachability,'not-run');
  assert.equal((await post('levels/validate',{world,extra:true})).status,400);
});
test('v4 remains byte-compatible with baseline chamber fixtures',()=>{
  // JSON hashes captured from the unmodified generators at b4cc2400bec93faaa542878853e6a100cd0e3085.
  const fixtures={story:'94fd684e7993be93df5817e838c19ef7c73837c88d6cc7c9f79845683e771299',expedition:'389528b3cca96a3401e87c34be508e92fb13cbf8a2663cf8c5be1f508d7e5835'};
  for(const [mode,hash] of Object.entries(fixtures)){
    const world=generateLevel({mode,level:mode==='story'?73:19,intensity:5,length:36,seed:'COMPATIBLE',generatorVersion:4}).world;
    assert.equal(createHash('sha256').update(JSON.stringify(world)).digest('hex'),hash);assert.equal(world.abilitiesEnabled,undefined);
  }
  assert.equal(normalizeRequest({seed:'luma'}).seed,'LUMA');
});

test('published OpenAPI and executable JavaScript example agree with the live generator',async()=>{
  const schema=await(await fetch(`${base}/docs/api/openapi.json`)).json();assert.equal(schema.openapi,'3.1.0');
  const example=schema.paths['/levels/generate'].post.requestBody.content['application/json'].example;
  assert.equal((await post('levels/generate',example)).status,200);
  const output=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['examples/generate-level.mjs'],{env:{...process.env,DEPTH_API_URL:base},stdio:['ignore','pipe','pipe']});
    let out='',err='';child.stdout.on('data',chunk=>out+=chunk);child.stderr.on('data',chunk=>err+=chunk);child.on('error',reject);
    child.on('close',code=>code===0?resolve(out):reject(new Error(err)));
  });
  assert.deepEqual(JSON.parse(output),generateLevel(example));
});
