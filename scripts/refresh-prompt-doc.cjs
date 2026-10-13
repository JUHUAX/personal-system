// Print an apply_patch-compatible refresh; this script never writes files.
const fs = require("node:fs");
const path = require("node:path");
const registry = require("../llm-prompt-registry.js");
const examples = require("../llm-prompt-examples.js");
const prompts = require("../llm-prompts.js");
const file = path.resolve(__dirname,"../LLM_PROMPTS_V2.md");
const old = fs.readFileSync(file,"utf8").replace(/\r\n/g,"\n");
let updated = old;
const jsonBlock = data => "```json\n"+JSON.stringify(data,null,2)+"\n```";
function editSection(start,end,fn) {
  const a=updated.indexOf(start), b=updated.indexOf(end,a+start.length);
  if(a<0 || b<0) throw new Error("Missing documentation section: "+start);
  updated=updated.slice(0,a)+fn(updated.slice(a,b))+updated.slice(b);
}
function replaceJson(start,end,value) { editSection(start,end,s=>s.replace(/```json\n[\s\S]*?\n```/,jsonBlock(value))); }
updated=updated.replace(/(#{3,4} `([CRDO]\.[^`]+)`[^\n]*\n[\s\S]*?```text\n)[\s\S]*?(\n```)/g,(all,prefix,id,suffix)=>Object.hasOwn(registry.fragments,id)?prefix+registry.fragments[id]+suffix:all);
replaceJson("### 7.1","### 7.2",registry.modules);
replaceJson("### 7.2","### 7.3",registry.definitions.map(({task,input,rules,errors,extraScope,...definition})=>definition));
replaceJson("### 11.2","### 11.3",examples.exampleIdsByTask);
replaceJson("### 11.5","### 11.6",examples.fixtureTemplates);
replaceJson("### 11.6","### 11.7",examples.exampleRecipes);
editSection("### 11.7","### 11.8",()=>{
  const parts=["### 11.7 全部示例的完整展开输入输出\n\n以下"+examples.exampleRecipes.length+"组配方供维护与回归测试；发送给模型的选择以11.2为准，未选配方不会增加API输入。以下输入输出均为虚构。明确与未明确任务都输出数字预期进度，同一天多任务以taskProgress分别表达。\n"];
  examples.exampleRecipes.forEach((recipe,index)=>{
    const action=recipe.id === "E.TODO_WITH_EXPLICIT_SCHEDULE" ? "daily_todo.generate" : recipe.actions[0];
    const definition=registry.definitions.find(d=>d.action===action && d.outputContract===recipe.outputContract);
    const example=prompts.exampleComposer.compileExample(recipe.id,definition);
    parts.push("### 11.7."+(index+1)+" `"+recipe.id+"`\n\n适用Action：`"+action+"`。输出契约：`"+recipe.outputContract+"`。\n\n示例输入：\n\n"+jsonBlock(example.input)+"\n\n期望输出：\n\n"+jsonBlock(example.output)+"\n");
  });
  return parts.join("\n")+"\n";
});
const start=updated.indexOf("## 12.");
let count=0;
updated=updated.slice(0,start)+updated.slice(start).replace(/```text\n[\s\S]*?\n```/g,()=>{
  const d=registry.definitions[count++];
  return "```text\n"+prompts.compileSystem(d.action,d.variant).system+"\n```";
});
if(count!==registry.definitions.length)throw new Error("Prompt snapshot count mismatch");
if(old===updated)process.exit(0);
// Full exact replacement avoids accidentally matching repeated example text.
process.stdout.write("*** Begin Patch\n*** Update File: LLM_PROMPTS_V2.md\n@@\n"+old.trimEnd().split("\n").map(l=>"-"+l).join("\n")+"\n"+updated.trimEnd().split("\n").map(l=>"+"+l).join("\n")+"\n*** End Patch\n");
