import test from 'node:test';
import assert from 'node:assert/strict';
import { arithmetic, checkAnswer, checkRecovery } from '../lib/checker';
import { makeQuestion, story, Profile } from '../lib/learning';
const p:Profile={lang:'en',subject:'math',stage:'middle',hobby:'football'};
test('all demo tracks have correct answer keys and bilingual lessons',()=>{
 for(const subject of ['math','cs','ai'] as const)for(const stage of ['primary','middle','high'] as const)for(const hobby of ['football','gaming','music','space'] as const)for(const level of [1,2,3])for(const variant of [0,1,2,3,4]){
  const profile={...p,subject,stage,hobby}; const q=makeQuestion(profile,level,variant);
  assert.equal(checkAnswer(q,String(q.answer),true).status,'correct',q.id);
  assert.equal(checkAnswer(q,String(q.answer+1),true).status,'mistake',q.id);
  assert.equal(checkRecovery(q,String(q.recoveryAnswer)).status,'correct',q.id);
  assert.ok(story(profile).paragraphs.every(x=>x.en&&x.he));
 }
});
test('linear steps accept equivalent methods and catch a wrong operation',()=>{
 const q=makeQuestion(p);
 for(const s of ['3x=15','x+2=7','21=3*x+6','x=3*x-10','x/2=2.5'])assert.equal(checkAnswer(q,s).status,'continue',s);
 assert.equal(checkAnswer(q,'3x=27').status,'mistake');
 assert.equal(checkAnswer(q,'3x=15\nx=5',true).status,'correct');
 assert.equal(checkAnswer(q,'3x=27\nx=5',true).status,'mistake');
 assert.equal(checkAnswer(q,'y=5').status,'clarify');
 assert.equal(checkAnswer(q,'x*x=25').status,'clarify');
 assert.equal(checkAnswer(q,'(x-5)*(x-6)=0').status,'clarify');
 assert.equal(checkAnswer(q,'5=5').status,'correct');
 assert.equal(checkAnswer(q,'x=x').status,'clarify');
 assert.equal(checkAnswer(q,'3x=').status,'clarify');
});
test('quadratic steps preserve the positive solution set',()=>{
 const q=makeQuestion({...p,stage:'high'});
 for(const s of ['x²=9','x*x=9','(x-3)*(x+3)=0'])assert.equal(checkAnswer(q,s).status,'continue',s);
 assert.equal(checkAnswer(q,'x=3').status,'correct');
 assert.equal(checkAnswer(q,'x=-3').status,'mistake');
 assert.equal(checkAnswer(q,'x²=7*x-12').status,'mistake');
 assert.equal(checkAnswer(q,'-x²=9').status,'mistake');
});
test('arithmetic precedence, fractions, and unsafe expressions',()=>{
 assert.equal(arithmetic('-3^2'),-9);assert.equal(arithmetic('(-3)^2'),9);
 assert.equal(arithmetic('10/2'),5);assert.equal(arithmetic('3×4-7'),5);
 for(const s of ['1/0','(1/0)^0','alert(1)','2..3','process.exit()','0^0','1e999','2^100','x/x'])assert.equal(arithmetic(s),null,s);
});
test('recovery accepts standard assignments and arithmetic equalities',()=>{
 assert.equal(checkRecovery(makeQuestion(p),' y = 7 ').status,'correct');
 const q=makeQuestion({...p,stage:'primary'});
 assert.equal(checkRecovery(q,'3×4=12').status,'correct');
 assert.equal(checkRecovery(q,'twelve').status,'clarify');
 assert.equal(checkRecovery(q,'13').status,'mistake');
});
