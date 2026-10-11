import Matter from 'matter-js';
import {H,W,sizes,type Kind,type Part,type Level} from './levels';
export class Editor {
 parts:Part[]=[]; selected:string|null=null; private past:Part[][]=[];private future:Part[][]=[];private serial=0;
 constructor(public level:Level){}
 remaining(kind:Kind){return (this.level.inventory[kind]??0)-this.parts.filter(p=>p.kind===kind).length}
 private save(){this.past.push(structuredClone(this.parts));this.past=this.past.slice(-100);this.future=[]}
 valid(p:Part,ignore=p.id){const [w,h]=sizes[p.kind],a=p.angle*Math.PI/180;const ex=(Math.abs(Math.cos(a))*w+Math.abs(Math.sin(a))*h)/2,ey=(Math.abs(Math.sin(a))*w+Math.abs(Math.cos(a))*h)/2;if(p.x-ex<10||p.x+ex>W-10||p.y-ey<10||p.y+ey>H-30)return false;const body=(q:Part)=>{const [qw,qh]=sizes[q.kind];return q.kind==='steel'||q.kind==='rubber'?Matter.Bodies.circle(q.x,q.y,16):Matter.Bodies.rectangle(q.x,q.y,qw,qh,{angle:q.angle*Math.PI/180})};const b=body(p);const others=[...this.parts,...this.level.fixed].filter(q=>q.id!==ignore).map(body);const t=this.level.target;others.push(Matter.Bodies.rectangle(t.x,t.y+31,104,12),Matter.Bodies.rectangle(t.x-50,t.y,10,65),Matter.Bodies.rectangle(t.x+50,t.y,10,65));return !others.some(q=>{const collision=Matter.Collision.collides(b,q);return collision&&collision.depth>0.5})}
 place(kind:Kind,x:number,y:number,angle=0){const p={id:`part-${++this.serial}`,kind,x,y,angle};if(this.remaining(kind)<=0||!this.valid(p))return false;this.save();this.parts.push(p);this.selected=p.id;return true}
 move(id:string,x:number,y:number,angle?:number){const p=this.parts.find(p=>p.id===id);if(!p)return false;const n={...p,x,y,angle:angle??p.angle};if(!this.valid(n))return false;this.save();Object.assign(p,n);return true}
 remove(id:string){if(!this.parts.some(p=>p.id===id))return;this.save();this.parts=this.parts.filter(p=>p.id!==id);this.selected=null}
 undo(){const p=this.past.pop();if(p){this.future.push(structuredClone(this.parts));this.parts=p;this.selected=null}}
 redo(){const p=this.future.pop();if(p){this.past.push(structuredClone(this.parts));this.parts=p;this.selected=null}}
 get canUndo(){return this.past.length>0}get canRedo(){return this.future.length>0}
 load(parts:Part[]){this.parts=[];for(const p of parts){if(!this.parts.some(q=>q.id===p.id)&&!this.level.fixed.some(q=>q.id===p.id)&&this.remaining(p.kind)>0&&this.valid(p))this.parts.push({...p})}this.serial=Date.now();this.past=[];this.future=[]}
}
