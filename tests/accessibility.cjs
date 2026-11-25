const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
(async()=>{
 const root=path.resolve(__dirname,'..'),out=path.join(root,'test-results');fs.mkdirSync(out,{recursive:true});
 const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;try{const file=path.join(root,pathname==='/'?'index.html':pathname);res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end('Not found')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox']});
 const page=await browser.newPage(),results=[];const axePath=require.resolve('axe-core/axe.min.js');
 try{
  for(const width of [1440,390,320])for(const route of ['index.html','vaughan.html','about.html']){
   await page.setViewportSize({width,height:1000});await page.goto(`http://127.0.0.1:${server.address().port}/${route}`);
   if(route==='index.html')await page.waitForFunction(()=>document.querySelector('#count').textContent==='5,482');
   if(route==='vaughan.html')await page.waitForFunction(()=>document.querySelector('#case-count').textContent==='1,382');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${route} overflow at ${width}`);
   await page.addScriptTag({path:axePath});const result=await page.evaluate(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));
   results.push({route,width,violations:result.violations,incomplete:result.incomplete.map(v=>({id:v.id,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passed_rule_count:result.passes.length});
   console.log(`${route} ${width}px: ${result.violations.length} violations`);
   for(const v of result.violations)console.log(v.id,v.nodes.map(n=>({target:n.target,summary:n.failureSummary})));
  }
  fs.writeFileSync(path.join(out,'accessibility.json'),JSON.stringify({axe_version:require('axe-core/package.json').version,results},null,2));
  assert.equal(results.reduce((n,r)=>n+r.violations.length,0),0,'Resolve automated accessibility violations');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
