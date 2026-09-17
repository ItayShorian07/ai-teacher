import assert from 'node:assert/strict';
const base='http://127.0.0.1:3100';
for(const [path,status,expected] of [['/',200,'טוב שחזרתם'],['/demo',200,'אתם בדמו'],['/register',200,'בית ספר'],['/contact',200,'בואו נדבר.'],['/classroom',307,''],['/account',307,''],['/missing-page',404,'הדף לא נמצא']]){
 const r=await fetch(base+path,{redirect:'manual'});const html=await r.text();if(status===307){const destination=r.headers.get('location');const streamedRedirect=html.includes('http-equiv="refresh"')&&html.includes('url=/login');assert.ok((r.status===307&&destination==='/login')||(r.status===200&&streamedRedirect),`${path}: protected redirect missing`);assert.ok(!html.includes('class="app-shell"'),`${path}: leaked classroom`);}else assert.equal(r.status,status,path);if(expected)assert.ok(html.includes(expected),path);assert.equal(r.headers.get('x-content-type-options'),'nosniff');console.log(path,'OK',r.status);
}
for(const path of ['/api/tutor','/api/answers/pdf','/api/account/delete']){
 const r=await fetch(base+path,{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify(path==='/api/tutor'?{action:'story',lang:'he',subject:'math',stage:'middle',hobby:'football',topic:'אלגברה',level:1,variant:0}:{})});assert.equal(r.status,401,path);console.log(path,'rejects unauthenticated request',r.status);
 const cross=await fetch(base+path,{method:'POST',headers:{origin:'https://untrusted.example','content-type':'application/json'},body:'{}'});assert.equal(cross.status,403,path);console.log(path,'rejects cross-origin request',cross.status);
}
