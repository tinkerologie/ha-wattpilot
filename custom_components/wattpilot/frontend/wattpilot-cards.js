var e=globalThis,t=e.ShadowRoot&&(e.ShadyCSS===void 0||e.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,n=Symbol(),r=new WeakMap,i=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==n)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,n=this.t;if(t&&e===void 0){let t=n!==void 0&&n.length===1;t&&(e=r.get(n)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),t&&r.set(n,e))}return e}toString(){return this.cssText}},a=e=>new i(typeof e==`string`?e:e+``,void 0,n),o=(e,...t)=>new i(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,n),s=(n,r)=>{if(t)n.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let t of r){let r=document.createElement(`style`),i=e.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=t.cssText,n.appendChild(r)}},c=t?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return a(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:ee,getOwnPropertySymbols:te,getPrototypeOf:ne}=Object,f=globalThis,re=f.trustedTypes,ie=re?re.emptyScript:``,ae=f.reactiveElementPolyfillSupport,p=(e,t)=>e,m={toAttribute(e,t){switch(t){case Boolean:e=e?ie:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},oe=(e,t)=>!l(e,t),se={attribute:!0,type:String,converter:m,reflect:!1,useDefault:!1,hasChanged:oe};Symbol.metadata??=Symbol(`metadata`),f.litPropertyMetadata??=new WeakMap;var h=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=se){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??se}static _$Ei(){if(this.hasOwnProperty(p(`elementProperties`)))return;let e=ne(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(p(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(p(`properties`))){let e=this.properties,t=[...ee(e),...te(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?m:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?m:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??oe)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};h.elementStyles=[],h.shadowRootOptions={mode:`open`},h[p(`elementProperties`)]=new Map,h[p(`finalized`)]=new Map,ae?.({ReactiveElement:h}),(f.reactiveElementVersions??=[]).push(`2.1.2`);var g=globalThis,ce=e=>e,_=g.trustedTypes,le=_?_.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ue=`$lit$`,v=`lit$${Math.random().toFixed(9).slice(2)}$`,de=`?`+v,fe=`<${de}>`,y=document,b=()=>y.createComment(``),x=e=>e===null||typeof e!=`object`&&typeof e!=`function`,S=Array.isArray,pe=e=>S(e)||typeof e?.[Symbol.iterator]==`function`,C=`[ 	
\f\r]`,w=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,me=/-->/g,he=/>/g,T=RegExp(`>|${C}(?:([^\\s"'>=/]+)(${C}*=${C}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),ge=/'/g,_e=/"/g,ve=/^(?:script|style|textarea|title)$/i,ye=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),E=ye(1),be=ye(2),D=Symbol.for(`lit-noChange`),O=Symbol.for(`lit-nothing`),xe=new WeakMap,k=y.createTreeWalker(y,129);function Se(e,t){if(!S(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return le===void 0?t:le.createHTML(t)}var Ce=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=w;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===w?c[1]===`!--`?o=me:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=T):(ve.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=T):o=he:o===T?c[0]===`>`?(o=i??w,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?T:c[3]===`"`?_e:ge):o===_e||o===ge?o=T:o===me||o===he?o=w:(o=T,i=void 0);let d=o===T&&e[t+1].startsWith(`/>`)?` `:``;a+=o===w?n+fe:l>=0?(r.push(s),n.slice(0,l)+ue+n.slice(l)+v+d):n+v+(l===-2?t:d)}return[Se(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},A=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=Ce(t,n);if(this.el=e.createElement(l,r),k.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=k.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ue)){let t=u[o++],n=i.getAttribute(e).split(v),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Te:r[1]===`?`?Ee:r[1]===`@`?De:N}),i.removeAttribute(e)}else e.startsWith(v)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(ve.test(i.tagName)){let e=i.textContent.split(v),t=e.length-1;if(t>0){i.textContent=_?_.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],b()),k.nextNode(),c.push({type:2,index:++a});i.append(e[t],b())}}}else if(i.nodeType===8){if(i.data===de)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(v,e+1))!==-1;)c.push({type:7,index:a}),e+=v.length-1}}a++}}static createElement(e,t){let n=y.createElement(`template`);return n.innerHTML=e,n}};function j(e,t,n=e,r){if(t===D)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=x(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=j(e,i._$AS(e,t.values),i,r)),t}var we=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??y).importNode(t,!0);k.currentNode=r;let i=k.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new M(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Oe(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=k.nextNode(),a++)}return k.currentNode=y,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},M=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=O,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=j(this,e,t),x(e)?e===O||e==null||e===``?(this._$AH!==O&&this._$AR(),this._$AH=O):e!==this._$AH&&e!==D&&this._(e):e._$litType$===void 0?e.nodeType===void 0?pe(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==O&&x(this._$AH)?this._$AA.nextSibling.data=e:this.T(y.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=A.createElement(Se(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new we(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=xe.get(e.strings);return t===void 0&&xe.set(e.strings,t=new A(e)),t}k(t){S(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(b()),this.O(b()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ce(e).nextSibling;ce(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},N=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=O,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=O}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=j(this,e,t,0),a=!x(e)||e!==this._$AH&&e!==D,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=j(this,r[n+o],t,o),s===D&&(s=this._$AH[o]),a||=!x(s)||s!==this._$AH[o],s===O?e=O:e!==O&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===O?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Te=class extends N{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===O?void 0:e}},Ee=class extends N{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==O)}},De=class extends N{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=j(this,e,t,0)??O)===D)return;let n=this._$AH,r=e===O&&n!==O||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==O&&(n===O||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Oe=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){j(this,e)}},ke=g.litHtmlPolyfillSupport;ke?.(A,M),(g.litHtmlVersions??=[]).push(`3.3.3`);var Ae=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new M(t.insertBefore(b(),e),e,void 0,n??{})}return i._$AI(e),i},P=globalThis,F=class extends h{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ae(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return D}};F._$litElement$=!0,F.finalized=!0,P.litElementHydrateSupport?.({LitElement:F});var je=P.litElementPolyfillSupport;je?.({LitElement:F}),(P.litElementVersions??=[]).push(`4.2.2`);function Me(e,t,n){let r={config:{entity:t,tap_action:n},action:`tap`};e.dispatchEvent(new CustomEvent(`hass-action`,{detail:r,bubbles:!0,composed:!0}))}function Ne(e,t){Me(e,t,{action:`more-info`})}function Pe(e,t,n,r){r?Me(e,n,{action:`perform-action`,perform_action:`button.press`,target:{entity_id:n},confirmation:{text:r}}):t.callService(`button`,`press`,{},{entity_id:n})}function I(e,t,n){return e.callService(`select`,`select_option`,{option:n},{entity_id:t})}function Fe(e,t,n){return e.callService(`number`,`set_value`,{value:n},{entity_id:t})}function Ie(e,t,n){return e.callService(`time`,`set_value`,{time:n},{entity_id:t})}function Le(e,t,n){return e.callService(`switch`,n?`turn_on`:`turn_off`,{},{entity_id:t})}var Re=`wattpilot`,L={car_state:{domain:`sensor`,key:`car_state`},charging_power:{domain:`sensor`,key:`charging_power`},session_energy:{domain:`sensor`,key:`session_energy`},total_energy:{domain:`sensor`,key:`total_energy`},charging_reason:{domain:`sensor`,key:`charging_reason`},phases_in_use:{domain:`sensor`,key:`phases_in_use`},cable_current_limit:{domain:`sensor`,key:`cable_current_limit`},pv_power:{domain:`sensor`,key:`pv_power`},grid_power:{domain:`sensor`,key:`grid_power`},battery_power:{domain:`sensor`,key:`battery_power`},battery_soc:{domain:`sensor`,key:`battery_soc`},plug_connected:{domain:`binary_sensor`,key:`plug_connected`},charging:{domain:`binary_sensor`,key:`charging`},start_charging:{domain:`button`,key:`start_charging`},stop_charging:{domain:`button`,key:`stop_charging`},start_charging_force:{domain:`button`,key:`start_charging_force`},charging_mode:{domain:`select`,key:`charging_mode`},phase_switch:{domain:`select`,key:`phase_switch`},max_charging_current:{domain:`number`,key:`max_charging_current`},start_charging_at:{domain:`number`,key:`start_charging_at`},pv_battery_threshold:{domain:`number`,key:`pv_battery_threshold`},pv_battery_discharges_until:{domain:`number`,key:`pv_battery_discharges_until`},next_trip_charging:{domain:`number`,key:`next_trip_charging`},next_trip_time:{domain:`time`,key:`next_trip_time`},remain_in_eco_mode:{domain:`switch`,key:`remain_in_eco_mode`},pv_surplus:{domain:`switch`,key:`pv_surplus`},discharge_pv_battery:{domain:`switch`,key:`discharge_pv_battery`}};function ze(e){let t=new Set;for(let n of Object.values(e.entities??{}))n.platform===`wattpilot`&&n.device_id&&t.add(n.device_id);return[...t].map(t=>e.devices?.[t]).filter(e=>e!==void 0)}function Be(e){return e?.name_by_user||e?.name||void 0}function Ve(e,t,n){let r=t.entities?.[n];if(r)return r;if(!t.device_id)return;let{domain:i,key:a}=L[n],o;for(let n of Object.values(e.entities??{}))if(n.platform===`wattpilot`&&n.device_id===t.device_id&&n.translation_key===a&&n.entity_id.startsWith(`${i}.`)){if(R(e.states[n.entity_id]))return n.entity_id;o??=n.entity_id}return o}function He(e,t,n){let r=Ve(e,t,n);return r?e.states[r]:void 0}function R(e){return e!==void 0&&e.state!==`unavailable`&&e.state!==`unknown`}function Ue(e){return e!==void 0&&e.state!==`unavailable`}function z(e){if(!R(e)||e.state.trim()===``)return;let t=Number(e.state);return Number.isFinite(t)?t:void 0}function B(e,t){let n=e?.attributes[t];if(n==null||n===``)return;let r=Number(n);return Number.isFinite(r)?r:void 0}var We=`M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z`,Ge=`M23 8C23 4.13 19.87 1 16 1C12.47 1 9.57 3.61 9.08 7H4.5C3.84 7 3.28 7.42 3.08 8L1 14V22C1 22.55 1.45 23 2 23H3C3.55 23 4 22.55 4 22V21H16V22C16 22.55 16.45 23 17 23H18C18.55 23 19 22.55 19 22V14.32C21.36 13.19 23 10.79 23 8M4.5 8.5H9.03C9.15 10.26 9.92 11.84 11.11 13H3L4.5 8.5M4.5 18C3.67 18 3 17.33 3 16.5S3.67 15 4.5 15 6 15.67 6 16.5 5.33 18 4.5 18M15.5 18C14.67 18 14 17.33 14 16.5S14.67 15 15.5 15 17 15.67 17 16.5 16.33 18 15.5 18M16 13C14.61 13 13.44 12.5 12.47 11.53C11.5 10.56 11 9.39 11 8C11 6.64 11.5 5.46 12.47 4.5C13.44 3.5 14.61 3 16 3C17.36 3 18.54 3.5 19.5 4.5C20.5 5.46 21 6.64 21 8C21 9.39 20.5 10.56 19.5 11.53C18.54 12.5 17.36 13 16 13M16.5 8.25L19.36 9.94L18.61 11.16L15 9V4H16.5V8.25Z`,Ke=`M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z`,qe=`M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z`,Je=`M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M12,10A2,2 0 0,0 10,12A2,2 0 0,0 12,14A2,2 0 0,0 14,12A2,2 0 0,0 12,10M10,22C9.75,22 9.54,21.82 9.5,21.58L9.13,18.93C8.5,18.68 7.96,18.34 7.44,17.94L4.95,18.95C4.73,19.03 4.46,18.95 4.34,18.73L2.34,15.27C2.21,15.05 2.27,14.78 2.46,14.63L4.57,12.97L4.5,12L4.57,11L2.46,9.37C2.27,9.22 2.21,8.95 2.34,8.73L4.34,5.27C4.46,5.05 4.73,4.96 4.95,5.05L7.44,6.05C7.96,5.66 8.5,5.32 9.13,5.07L9.5,2.42C9.54,2.18 9.75,2 10,2H14C14.25,2 14.46,2.18 14.5,2.42L14.87,5.07C15.5,5.32 16.04,5.66 16.56,6.05L19.05,5.05C19.27,4.96 19.54,5.05 19.66,5.27L21.66,8.73C21.79,8.95 21.73,9.22 21.54,9.37L19.43,11L19.5,12L19.43,13L21.54,14.63C21.73,14.78 21.79,15.05 21.66,15.27L19.66,18.73C19.54,18.95 19.27,19.04 19.05,18.95L16.56,17.95C16.04,18.34 15.5,18.68 14.87,18.93L14.5,21.58C14.46,21.82 14.25,22 14,22H10M11.25,4L10.88,6.61C9.68,6.86 8.62,7.5 7.85,8.39L5.44,7.35L4.69,8.65L6.8,10.2C6.4,11.37 6.4,12.64 6.8,13.8L4.68,15.36L5.43,16.66L7.86,15.62C8.63,16.5 9.68,17.14 10.87,17.38L11.24,20H12.76L13.13,17.39C14.32,17.14 15.37,16.5 16.14,15.62L18.57,16.66L19.32,15.36L17.2,13.81C17.6,12.64 17.6,11.37 17.2,10.2L19.31,8.65L18.56,7.35L16.15,8.39C15.38,7.5 14.32,6.86 13.12,6.62L12.75,4H11.25Z`,Ye=`M17.3 5C19 6.5 20 8.6 20 11C20 15.4 16.4 19 12 19S4 15.4 4 11C4 8.6 5.1 6.5 6.7 5H17.3M18 3H6L5.4 3.5C3.2 5.4 2 8.1 2 11C2 16.5 6.5 21 12 21S22 16.5 22 11C22 8.1 20.8 5.4 18.6 3.5L18 3M13 7.5C13 8.3 13.7 9 14.5 9S16 8.3 16 7.5 15.3 6 14.5 6 13 6.7 13 7.5M8 7.5C8 8.3 8.7 9 9.5 9S11 8.3 11 7.5 10.3 6 9.5 6 8 6.7 8 7.5M7 13C8.1 13 9 12.1 9 11C9 9.9 8.1 9 7 9S5 9.9 5 11C5 12.1 5.9 13 7 13M11.5 15C11.5 13.9 10.6 13 9.5 13S7.5 13.9 7.5 15C7.5 16.1 8.4 17 9.5 17S11.5 16.1 11.5 15M12 13C13.1 13 14 12.1 14 11C14 9.9 13.1 9 12 9S10 9.9 10 11C10 12.1 10.9 13 12 13M16.5 15C16.5 13.9 15.6 13 14.5 13S12.5 13.9 12.5 15C12.5 16.1 13.4 17 14.5 17S16.5 16.1 16.5 15M19 11C19 9.9 18.1 9 17 9S15 9.9 15 11C15 12.1 15.9 13 17 13S19 12.1 19 11`,V=`M15 9H16V7.5H20V9H21C21.55 9 22 9.45 22 10V21C22 21.55 21.55 22 21 22H15C14.45 22 14 21.55 14 21V10C14 9.45 14.45 9 15 9M16 11V14H20V11H16M12 5.69L7 10.19V18H12V20H5V12H2L12 3L14.78 5.5H14V7.17L13.76 7.27L12 5.69Z`,H=`M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z`,Xe=`M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z`,Ze=`M11 15H6L13 1V9H18L11 23V15Z`,Qe=`M8,5.14V19.14L19,12.14L8,5.14Z`,$e=`M18,18H6V6H18V18Z`,et=`M8.28,5.45L6.5,4.55L7.76,2H16.23L17.5,4.55L15.72,5.44L15,4H9L8.28,5.45M18.62,8H14.09L13.3,5H10.7L9.91,8H5.38L4.1,10.55L5.89,11.44L6.62,10H17.38L18.1,11.45L19.89,10.56L18.62,8M17.77,22H15.7L15.46,21.1L12,15.9L8.53,21.1L8.3,22H6.23L9.12,11H11.19L10.83,12.35L12,14.1L13.16,12.35L12.81,11H14.88L17.77,22M11.4,15L10.5,13.65L9.32,18.13L11.4,15M14.68,18.12L13.5,13.64L12.6,15L14.68,18.12Z`,tt=`M3.55 19.09L4.96 20.5L6.76 18.71L5.34 17.29M12 6C8.69 6 6 8.69 6 12S8.69 18 12 18 18 15.31 18 12C18 8.68 15.31 6 12 6M20 13H23V11H20M17.24 18.71L19.04 20.5L20.45 19.09L18.66 17.29M20.45 5L19.04 3.6L17.24 5.39L18.66 6.81M13 1H11V4H13M6.76 5.39L4.96 3.6L3.55 5L5.34 6.81L6.76 5.39M1 13H4V11H1M13 20H11V23H13`;function U(e,t=`icon`){return E`<svg
    class=${t}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
  >
    ${be`<path d=${e} fill="currentColor"></path>`}
  </svg>`}var W={"card.charger.name":`Wattpilot charger`,"card.charger.description":`Charging status with live power, session distance and energy, solar flow and quick PV settings.`,"card.mode.name":`Wattpilot charging mode`,"card.mode.description":`Switch between Standard, Eco and Next trip, and control PV battery charging and charging speed.`,"card.next_trip.name":`Wattpilot next trip`,"card.next_trip.description":`Set the departure time and energy the car needs for its next trip.`,"status.no_car.title":`Connect your car`,"status.no_car.subtitle":`Plug in the cable to start charging your car`,"status.charging.title":`Charging`,"status.charging.subtitle":`Your car is charging`,"status.ready.title":`Ready to charge`,"status.ready.subtitle":`Your car is connected and waiting for energy`,"status.complete.title":`Charging complete`,"status.complete.subtitle":`Your car has finished charging`,"status.error.title":`Charger error`,"status.error.subtitle":`Check the charger for details`,"status.unavailable.title":`Charger unavailable`,"status.unavailable.subtitle":`Home Assistant cannot reach the charger`,"label.battery":`PV battery`,"label.solar":`Solar`,"label.grid":`Grid`,"label.charging_power":`Charging power`,"label.distance":`Distance`,"label.energy":`Energy`,"label.per_hour":`{value}/h`,"label.start":`Start`,"label.stop":`Stop`,"label.force_start":`Force start`,"label.overview":`Overview`,"label.pv_quick_settings":`PV quick settings`,"label.pv_surplus":`PV surplus`,"label.pv_battery_soc":`PV battery SOC`,"label.charge_above":`Charge car above`,"label.information":`Information`,"label.show_information":`Show charger information`,"label.current":`Current`,"label.voltage":`Voltage`,"label.power_factor":`Power factor`,"label.charging_plug":`Charging plug`,"label.type2":`Type 2`,"label.mode.Default":`Standard`,"label.mode.Eco":`Eco`,"label.mode.Next Trip":`Next trip`,"label.mode_hint.Default":`Charge at full power right away`,"label.mode_hint.Eco":`Sustainable & cost-efficient`,"label.mode_hint.Next Trip":`Ready by your departure time`,"label.charging_mode":`Charging mode`,"label.mode_details":`Charging mode details`,"label.charging_from_pv_battery":`Charging from PV battery`,"label.pv_battery_settings":`PV battery settings`,"label.charging_speed":`Charging speed`,"label.phase_mode":`Phase mode`,"label.departure":`Departure time`,"label.trip_energy":`Energy for the trip`,"label.remain_in_eco":`Stay in Eco after the trip`,"label.next_trip_inactive":`Next trip charging is not active.`,"label.activate_next_trip":`Use Next trip`,"label.confirm_force_start":`Force charging ignores the charging mode and starts charging immediately. Continue?`,"error.no_device":`No Wattpilot charger found. Select a charger in the card editor.`,"error.entity_missing":`Entity not available`,"editor.device_id":`Charger`,"editor.title":`Title`,"editor.consumption":`Vehicle consumption (kWh/100 km)`,"editor.consumption_helper":`Used to estimate the distance added by the session and the charging speed in km/h.`,"editor.show_power_flow":`Show solar, grid and battery power`,"editor.show_pv_settings":`Show PV quick settings page`,"editor.show_force_start":`Show force start button`,"editor.confirm_force_start":`Ask before force starting`,"editor.show_pv_battery":`Show PV battery charging`,"editor.show_charging_speed":`Show charging speed`,"editor.show_phase_mode":`Show phase mode`,"editor.show_remain_in_eco":`Show stay in Eco switch`,"editor.entities":`Entity overrides`,"editor.entities_helper":`Optional. Pick entities only when automatic detection on the charger picks the wrong one.`},nt={en:W,de:{"card.charger.name":`Wattpilot Ladestation`,"card.charger.description":`Ladestatus mit Leistung, Reichweite und Energie der Sitzung, PV-Fluss und PV-Schnelleinstellungen.`,"card.mode.name":`Wattpilot Lademodus`,"card.mode.description":`Zwischen Standard, Eco und Nächste Fahrt wechseln sowie Laden aus dem PV-Speicher und Ladestrom steuern.`,"card.next_trip.name":`Wattpilot Nächste Fahrt`,"card.next_trip.description":`Abfahrtszeit und benötigte Energie für die nächste Fahrt festlegen.`,"status.no_car.title":`Fahrzeug anschließen`,"status.no_car.subtitle":`Stecke das Kabel ein, um mit dem Laden zu beginnen`,"status.charging.title":`Lädt`,"status.charging.subtitle":`Dein Fahrzeug wird geladen`,"status.ready.title":`Bereit zum Laden`,"status.ready.subtitle":`Fahrzeug verbunden, wartet auf Energie`,"status.complete.title":`Laden abgeschlossen`,"status.complete.subtitle":`Dein Fahrzeug ist fertig geladen`,"status.error.title":`Fehler am Wattpilot`,"status.error.subtitle":`Prüfe die Ladestation für Details`,"status.unavailable.title":`Wattpilot nicht erreichbar`,"status.unavailable.subtitle":`Home Assistant erreicht die Ladestation nicht`,"label.battery":`PV-Speicher`,"label.solar":`PV`,"label.grid":`Netz`,"label.charging_power":`Ladeleistung`,"label.distance":`Reichweite`,"label.energy":`Energie`,"label.start":`Starten`,"label.stop":`Stoppen`,"label.force_start":`Sofort laden`,"label.overview":`Übersicht`,"label.pv_quick_settings":`PV-Schnelleinstellungen`,"label.pv_surplus":`PV-Überschuss`,"label.pv_battery_soc":`PV-Speicher SOC`,"label.charge_above":`Fahrzeug laden ab`,"label.information":`Information`,"label.show_information":`Informationen zur Ladestation anzeigen`,"label.current":`Strom`,"label.voltage":`Spannung`,"label.power_factor":`Leistungsfaktor`,"label.charging_plug":`Ladestecker`,"label.type2":`Typ 2`,"label.mode.Default":`Standard`,"label.mode.Eco":`Eco`,"label.mode.Next Trip":`Nächste Fahrt`,"label.mode_hint.Default":`Sofort mit voller Leistung laden`,"label.mode_hint.Eco":`Nachhaltig & kosteneffizient`,"label.mode_hint.Next Trip":`Bis zur Abfahrt geladen`,"label.charging_mode":`Lademodus`,"label.mode_details":`Details zum Lademodus`,"label.charging_from_pv_battery":`Laden aus dem PV-Speicher`,"label.pv_battery_settings":`Einstellungen PV-Speicher`,"label.charging_speed":`Ladestrom`,"label.phase_mode":`Phasenumschaltung`,"label.departure":`Abfahrtszeit`,"label.trip_energy":`Energie für die Fahrt`,"label.remain_in_eco":`Nach der Fahrt im Eco-Modus bleiben`,"label.next_trip_inactive":`Laden für die nächste Fahrt ist nicht aktiv.`,"label.activate_next_trip":`Nächste Fahrt verwenden`,"label.confirm_force_start":`Sofortladen ignoriert den Lademodus und startet sofort. Fortfahren?`,"error.no_device":`Kein Wattpilot gefunden. Wähle im Karteneditor eine Ladestation aus.`,"error.entity_missing":`Entität nicht verfügbar`,"editor.device_id":`Ladestation`,"editor.title":`Titel`,"editor.consumption":`Fahrzeugverbrauch (kWh/100 km)`,"editor.consumption_helper":`Wird zur Schätzung der geladenen Reichweite und der Ladegeschwindigkeit in km/h verwendet.`,"editor.show_power_flow":`PV-, Netz- und Speicherleistung anzeigen`,"editor.show_pv_settings":`Seite PV-Schnelleinstellungen anzeigen`,"editor.show_force_start":`Schaltfläche Sofort laden anzeigen`,"editor.confirm_force_start":`Vor dem Sofortladen nachfragen`,"editor.show_pv_battery":`Laden aus dem PV-Speicher anzeigen`,"editor.show_charging_speed":`Ladestrom anzeigen`,"editor.show_phase_mode":`Phasenumschaltung anzeigen`,"editor.show_remain_in_eco":`Schalter Im Eco-Modus bleiben anzeigen`,"editor.entities":`Entitäten überschreiben`,"editor.entities_helper":`Optional. Nur auswählen, wenn die automatische Erkennung die falsche Entität findet.`}};function rt(e){return(e?.locale?.language??e?.language??`en`).split(`-`)[0]??`en`}function G(e,t,n={}){let r=nt[rt(e)]?.[t]??W[t];return Object.entries(n).reduce((e,[t,n])=>e.replaceAll(`{${t}}`,n),r)}function K(e,t,n){return t in W?G(e,t):n}var q=o`
  :host {
    --wp-text: var(--primary-text-color);
    --wp-subtext: var(--secondary-text-color);
    --wp-accent: var(--primary-color);
    --wp-on-accent: var(--text-primary-color, #fff);
    --wp-surface: var(--secondary-background-color);
    --wp-divider: var(--divider-color);
    --wp-success: var(--success-color, #43a047);
    --wp-warning: var(--warning-color, #ffa600);
    --wp-error: var(--error-color, #db4437);
    --wp-solar: var(--energy-solar-color, #ff9800);
    --wp-battery: var(--energy-battery-in-color, #f06292);
    --wp-grid: var(--energy-grid-consumption-color, #488fc2);
    --wp-radius: var(--ha-card-border-radius, var(--ha-border-radius-lg, 12px));
    --wp-focus: var(--wp-accent);
    display: block;
  }

  ha-card {
    block-size: 100%;
    box-sizing: border-box;
    padding: var(--ha-space-4, 16px);
    display: flex;
    flex-direction: column;
    gap: var(--ha-space-4, 16px);
    color: var(--wp-text);
  }

  .icon {
    inline-size: var(--mdc-icon-size, 24px);
    block-size: var(--mdc-icon-size, 24px);
    flex: none;
  }

  button {
    font: inherit;
    color: inherit;
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  :where(button, input, select):focus-visible {
    outline: 2px solid var(--wp-focus);
    outline-offset: 2px;
  }

  .header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--ha-space-3, 12px);
  }
  .title {
    margin: 0;
    font-size: var(--ha-font-size-2xl, 24px);
    font-weight: var(--ha-font-weight-bold, 600);
    line-height: var(--ha-line-height-condensed, 1.2);
  }
  .subtitle {
    margin: var(--ha-space-1, 4px) 0 0;
    color: var(--wp-subtext);
    font-size: var(--ha-font-size-m, 14px);
    line-height: var(--ha-line-height-normal, 1.5);
  }
  .section-title {
    margin: 0;
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-bold, 600);
  }

  .icon-button {
    display: inline-grid;
    place-items: center;
    inline-size: 40px;
    block-size: 40px;
    border-radius: 50%;
    color: var(--wp-subtext);
    flex: none;
  }
  .icon-button:hover {
    background: var(--wp-surface);
  }

  .stack {
    display: grid;
    gap: var(--ha-space-4, 16px);
  }
  .stack.tight {
    gap: var(--ha-space-3, 12px);
  }

  .value {
    font-variant-numeric: tabular-nums;
  }
  .unit {
    margin-inline-start: 0.2em;
    font-size: 0.7em;
    font-weight: var(--ha-font-weight-normal, 400);
    color: var(--wp-subtext);
  }

  .pill-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--ha-space-2, 8px);
    min-block-size: 48px;
    padding-inline: var(--ha-space-6, 24px);
    border-radius: var(--ha-border-radius-pill, 9999px);
    font-size: var(--ha-font-size-l, 16px);
    font-weight: var(--ha-font-weight-medium, 500);
  }
  .pill-button.filled {
    background: var(--wp-accent);
    color: var(--wp-on-accent);
  }
  .pill-button.tonal {
    background: var(--wp-surface);
    color: var(--wp-text);
  }
  .pill-button.outlined {
    border: 1px solid var(--wp-divider);
  }
  .pill-button.block {
    inline-size: 100%;
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--ha-space-3, 12px);
    min-block-size: 48px;
  }
  .row .grow {
    flex: 1;
    min-inline-size: 0;
  }
  .row-button {
    inline-size: 100%;
    text-align: start;
    border-radius: var(--ha-border-radius-md, 8px);
  }
  .row-value {
    color: var(--wp-subtext);
    font-variant-numeric: tabular-nums;
  }

  .divider {
    block-size: 1px;
    background: var(--wp-divider);
    border: none;
    margin: 0;
  }

  .warning {
    display: flex;
    gap: var(--ha-space-2, 8px);
    align-items: center;
    color: var(--wp-subtext);
  }
  .warning .icon {
    color: var(--wp-warning);
  }

  .visually-hidden {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
      animation: none !important;
    }
  }
`,J=class extends F{static styles=q;static properties={hass:{attribute:!1},config:{state:!0}};static getStubConfig(e){let t=ze(e)[0];return t?{device_id:t.id}:{}}setConfig(e){if(!e||typeof e!=`object`)throw Error(`Invalid configuration`);if(e.entities!==void 0&&typeof e.entities!=`object`)throw Error(`'entities' must be a mapping of role to entity id`);this.config={...e}}getCardSize(){return 4}getGridOptions(){return{columns:12,rows:`auto`,min_columns:6}}shouldUpdate(e){if(e.has(`config`)||!e.has(`hass`))return!0;let t=e.get(`hass`),n=this.hass;return!t||!n||t.entities!==n.entities||t.devices!==n.devices||t.locale!==n.locale||this.roles.some(e=>{let r=Ve(n,this.config,e);return r!==void 0&&t.states[r]!==n.states[r]})}entity(e){return this.hass?He(this.hass,this.config,e):void 0}t(e,t){return G(this.hass,e,t)}get deviceTitle(){if(this.config.title)return this.config.title;let e=this.config.device_id;return e?Be(this.hass?.devices?.[e]):void 0}get missingDevice(){return!this.roles.some(e=>this.entity(e)!==void 0)}moreInfo(e){e&&Ne(this,e.entity_id)}renderMissingDevice(){return E`<ha-card>
      <p class="warning" role="alert">
        ${U(We)}<span>${this.t(`error.no_device`)}</span>
      </p>
    </ha-card>`}};function it(e,t){let n=e?.locale?.language||void 0;try{return new Intl.NumberFormat(n,{maximumFractionDigits:t})}catch{return new Intl.NumberFormat(void 0,{maximumFractionDigits:t})}}function Y(e,t,n=0){return it(e,n).format(t)}var at={W:1,kW:1e3,MW:1e6},ot={Wh:1,kWh:1e3,MWh:1e6};function st(e,t){let n=z(e);if(n===void 0)return;let r=e?.attributes.unit_of_measurement;return n*(typeof r==`string`?t[r]??1:1)}function X(e){return st(e,at)}function ct(e){return st(e,ot)}function Z(e,t){return t===void 0?{value:`–`,unit:`W`}:Math.abs(t)>=1e3?{value:Y(e,t/1e3,1),unit:`kW`}:{value:Y(e,t,0),unit:`W`}}function lt(e,t){return t===void 0?{value:`–`,unit:`kWh`}:{value:Y(e,t/1e3,t<1e4?2:1),unit:`kWh`}}function ut(e){return e?.config?.unit_system?.length===`mi`?`mi`:`km`}var dt=1.609344;function ft(e,t,n){if(t===void 0||!(n>0))return;let r=t/1e3/n*100;return ut(e)===`mi`?r/dt:r}function Q(e,t){let n=t?.attributes.unit_of_measurement,r=typeof n==`string`?n:``,i=z(t);return i===void 0?{value:`–`,unit:r}:{value:Y(e,i,B(t,`display_precision`)??1),unit:r}}function $(){return{locale:{language:document.documentElement.lang||`en`}}}function pt(e){let t=e.replaceAll(`_`,` `);return t.charAt(0).toUpperCase()+t.slice(1)}function mt(e){let t=[{name:`device_id`,required:!0,selector:{device:{filter:[{integration:Re}]}}},{name:`title`,selector:{text:{}}}];return e.consumption&&t.push({name:`consumption`,default:18,selector:{number:{min:5,max:50,step:.1,mode:`box`,unit_of_measurement:`kWh/100 km`}}}),e.toggles?.length&&t.push({name:``,type:`grid`,flatten:!0,schema:e.toggles.map(e=>({name:e.name,default:e.default,selector:{boolean:{}}}))}),t.push({name:`entities`,type:`expandable`,title:G($(),`editor.entities`),schema:e.roles.map(e=>({name:e,selector:{entity:{filter:[{integration:Re,domain:L[e].domain}]}}}))}),{schema:t,computeLabel:e=>K($(),`editor.${e.name}`,e.name in L?pt(e.name):e.name),computeHelper:e=>{if(e.name===`consumption`)return G($(),`editor.consumption_helper`);if(e.name===`entities`)return G($(),`editor.entities_helper`)}}}var ht=`https://github.com/tinkerologie/ha-wattpilot#dashboard-cards`;function gt(e,t,n,r,i){customElements.get(e)||customElements.define(e,t);let a={locale:{language:document.documentElement.lang||`en`}};window.customCards??=[],window.customCards.some(t=>t.type===e)||window.customCards.push({type:e,name:G(a,n),description:G(a,r),preview:!0,documentationURL:ht,...i?{getEntitySuggestion:i}:{}})}var _t=`wattpilot-charger-card`,vt=230,yt=18,bt=52,xt=2*Math.PI*bt,St={Idle:`no_car`,Charging:`charging`,"Wait Car":`ready`,Complete:`complete`,Error:`error`},Ct=[`car_state`,`charging_power`,`session_energy`,`plug_connected`,`charging`,`start_charging`,`stop_charging`,`start_charging_force`,`max_charging_current`,`phases_in_use`,`cable_current_limit`,`pv_power`,`grid_power`,`battery_power`,`battery_soc`,`start_charging_at`,`pv_battery_threshold`];gt(_t,class extends J{static styles=[q,o`
      .eyebrow {
        display: flex;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
        font-weight: var(--ha-font-weight-medium, 500);
        letter-spacing: 0.02em;
        margin-block-end: var(--ha-space-1, 4px);
      }
      .eyebrow .icon {
        --mdc-icon-size: 16px;
      }
      .flow {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: var(--ha-space-2, 8px);
      }
      .flow-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        padding-block: var(--ha-space-1, 4px);
        border-radius: var(--ha-border-radius-lg, 12px);
      }
      .flow-icon {
        display: grid;
        place-items: center;
        inline-size: 56px;
        block-size: 56px;
        border-radius: 50%;
        border: 1.5px solid var(--wp-divider);
        color: var(--wp-subtext);
      }
      .flow-item.solar .flow-icon.active {
        border-color: var(--wp-solar);
        color: var(--wp-solar);
      }
      .flow-item.battery .flow-icon.active {
        border-color: var(--wp-battery);
        color: var(--wp-battery);
      }
      .flow-item.grid .flow-icon.active {
        border-color: var(--wp-grid);
        color: var(--wp-grid);
      }
      .flow-value {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-m, 14px);
      }
      .hero {
        display: grid;
        justify-items: center;
      }
      .ring {
        position: relative;
        inline-size: min(180px, 60%);
        aspect-ratio: 1;
        border-radius: 50%;
      }
      .ring svg {
        inline-size: 100%;
        block-size: 100%;
        transform: rotate(-90deg);
      }
      .ring-track {
        stroke: var(--wp-surface);
      }
      .ring-progress {
        stroke: var(--wp-accent);
        transition: stroke-dashoffset var(--ha-animation-duration-slow, 400ms) ease;
      }
      .ring.idle .ring-progress {
        stroke: var(--wp-divider);
      }
      .ring-label {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-1, 4px);
      }
      .ring-power {
        font-size: var(--ha-font-size-3xl, 28px);
        font-weight: var(--ha-font-weight-bold, 600);
        line-height: 1;
      }
      .ring-rate {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-m, 14px);
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: var(--ha-space-2, 8px);
      }
      .stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        padding-block: var(--ha-space-2, 8px);
        border-radius: var(--ha-border-radius-lg, 12px);
      }
      .stat-label {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-m, 14px);
      }
      .stat-value {
        font-size: var(--ha-font-size-xl, 20px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
      .actions {
        display: flex;
        gap: var(--ha-space-2, 8px);
      }
      .actions .pill-button {
        flex: 1;
      }
      .pv-tile {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: var(--ha-space-2, 8px) var(--ha-space-4, 16px);
        padding: var(--ha-space-4, 16px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
      }
      .pv-tile h3 {
        margin: 0;
        font-size: var(--ha-font-size-m, 14px);
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .pv-value {
        justify-self: start;
        font-size: var(--ha-font-size-2xl, 24px);
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .threshold {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--ha-space-1, 4px);
        grid-row: span 2;
      }
      .threshold .pill-button {
        min-inline-size: 120px;
        background: var(--ha-card-background, var(--card-background-color));
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .threshold .icon.solar {
        color: var(--wp-solar);
      }
      .threshold .icon.battery {
        color: var(--wp-battery);
      }
      .threshold-caption {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
      }
      .pages {
        display: flex;
        justify-content: center;
        gap: var(--ha-space-2, 8px);
      }
      .page-dot {
        display: grid;
        place-items: center;
        inline-size: 24px;
        block-size: 24px;
      }
      .page-dot::before {
        content: "";
        display: block;
        inline-size: 8px;
        block-size: 8px;
        border-radius: var(--ha-border-radius-pill, 9999px);
        background: var(--wp-divider);
        transition: inline-size var(--ha-animation-duration-fast, 150ms) ease;
      }
      .page-dot[aria-selected="true"]::before {
        inline-size: 20px;
        background: var(--wp-text);
      }
      .info {
        display: grid;
        gap: var(--ha-space-3, 12px);
        margin: 0;
        padding: var(--ha-space-4, 16px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
      }
      .info-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .info dl {
        margin: 0;
        display: grid;
        gap: var(--ha-space-3, 12px);
      }
      .info dt {
        color: var(--wp-subtext);
        font-size: var(--ha-font-size-s, 12px);
      }
      .info dd {
        margin: var(--ha-space-1, 4px) 0 0;
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
        font-weight: var(--ha-font-weight-medium, 500);
      }
    `];static properties={...J.properties,_page:{state:!0},_showInfo:{state:!0}};_swipeStart;roles=Ct;constructor(){super(),this._page=`overview`,this._showInfo=!1}static getConfigForm(){return mt({consumption:!0,toggles:[{name:`show_power_flow`,default:!0},{name:`show_pv_settings`,default:!0},{name:`show_force_start`,default:!1},{name:`confirm_force_start`,default:!0}],roles:Ct})}getCardSize(){return 9}get consumption(){let e=Number(this.config.consumption);return e>0?e:yt}get status(){let e=this.entity(`car_state`);if(R(e))return St[e.state]??`no_car`;let t=this.entity(`charging`),n=this.entity(`plug_connected`);return!R(t)&&!R(n)?`unavailable`:t?.state===`on`?`charging`:n?.state===`on`?`ready`:`no_car`}get maxPower(){let e=z(this.entity(`max_charging_current`));if(e===void 0)return;let t=z(this.entity(`phases_in_use`))??3;return e*vt*Math.max(1,Math.min(3,t))}render(){if(!this.hass)return E``;if(this.missingDevice)return this.renderMissingDevice();let e=this.status,t=this.config.show_pv_settings!==!1&&this.hasPvSettings,n=t?this._page:`overview`;return E`<ha-card
      @pointerdown=${t?this._onPointerDown:O}
      @pointerup=${t?this._onPointerUp:O}
    >
      <div class="header">
        <div>
          ${this.deviceTitle?E`<div class="eyebrow">${U(Ye)}<span>${this.deviceTitle}</span></div>`:O}
          <h2 class="title">
            ${n===`pv`?this.t(`label.pv_quick_settings`):this.t(`status.${e}.title`)}
          </h2>
          ${n===`overview`?E`<p class="subtitle">
                ${this.t(`status.${e}.subtitle`)}
              </p>`:O}
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label=${this.t(`label.show_information`)}
          aria-expanded=${this._showInfo?`true`:`false`}
          aria-controls="info"
          @click=${()=>this._showInfo=!this._showInfo}
        >
          ${U(this._showInfo?qe:H)}
        </button>
      </div>

      ${this._showInfo?this.renderInfo():O}

      <div
        id="panel"
        role=${t?`tabpanel`:O}
        aria-label=${n===`pv`?this.t(`label.pv_quick_settings`):this.t(`label.overview`)}
      >
        ${n===`pv`?this.renderPvSettings():this.renderOverview(e)}
      </div>

      ${t?this.renderPager(n):O}
    </ha-card>`}renderOverview(e){let t=X(this.entity(`charging_power`)),n=this.maxPower,r=e===`charging`&&t!==void 0&&n?Math.max(.02,Math.min(1,t/n)):0,i=Z(this.hass,t),a=this.entity(`session_energy`),o=ct(a),s=ut(this.hass),c=ft(this.hass,o,this.consumption),l=ft(this.hass,e===`charging`?t:void 0,this.consumption);return E`<div class="stack">
      ${this.config.show_power_flow===!1?O:this.renderPowerFlow()}
      <div class="hero">
        <div
          class="ring ${e===`charging`?``:`idle`}"
          role="img"
          aria-label="${this.t(`label.charging_power`)}: ${i.value} ${i.unit}"
        >
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle class="ring-track" cx="60" cy="60" r=${bt} fill="none" stroke-width="8"></circle>
            <circle
              class="ring-progress"
              cx="60"
              cy="60"
              r=${bt}
              fill="none"
              stroke-width="8"
              stroke-linecap="round"
              stroke-dasharray=${xt}
              stroke-dashoffset=${xt*(1-(r||1))}
            ></circle>
          </svg>
          <div class="ring-label">
            <span class="ring-power value">${this.renderParts(i)}</span>
            <span class="ring-rate">
              ${this.t(`label.per_hour`,{value:`${l===void 0?`–`:Y(this.hass,l)} ${s}`})}
            </span>
          </div>
        </div>
      </div>
      <div class="stats">
        <button
          type="button"
          class="stat"
          ?disabled=${!a}
          @click=${()=>this.moreInfo(a)}
        >
          <span class="stat-label">${this.t(`label.distance`)}</span>
          <span class="stat-value value">
            ${this.renderParts({value:c===void 0?`–`:Y(this.hass,c),unit:s})}
          </span>
        </button>
        <button
          type="button"
          class="stat"
          ?disabled=${!a}
          @click=${()=>this.moreInfo(a)}
        >
          <span class="stat-label">${this.t(`label.energy`)}</span>
          <span class="stat-value value">${this.renderParts(lt(this.hass,o))}</span>
        </button>
      </div>
      ${this.renderActions(e)}
    </div>`}renderPowerFlow(){let e=[{role:`battery_power`,kind:`battery`,path:V,label:`label.battery`},{role:`pv_power`,kind:`solar`,path:tt,label:`label.solar`},{role:`grid_power`,kind:`grid`,path:et,label:`label.grid`}].map(e=>({...e,entity:this.entity(e.role)}));return e.some(e=>e.entity)?E`<div class="flow">
      ${e.map(({entity:e,kind:t,path:n,label:r})=>{let i=X(e),a=Z(this.hass,i);return E`<button
          type="button"
          class="flow-item ${t}"
          ?disabled=${!e}
          aria-label="${this.t(r)}: ${a.value} ${a.unit}"
          @click=${()=>this.moreInfo(e)}
        >
          <span class="flow-icon ${i?`active`:``}">${U(n)}</span>
          <span class="flow-value value">${a.value} ${a.unit}</span>
        </button>`})}
    </div>`:O}renderActions(e){let t=e===`charging`,n=this.entity(t?`stop_charging`:`start_charging`),r=this.entity(`start_charging_force`),i=this.config.show_force_start===!0&&r&&!t;if(!n&&!i)return O;let a=R(this.entity(`car_state`))||R(this.entity(`plug_connected`)),o=Ue(n)&&a&&e!==`no_car`&&e!==`unavailable`;return E`<div class="actions">
      ${n?E`<button
            type="button"
            class="pill-button ${o?`filled`:`tonal`}"
            ?disabled=${!o}
            @click=${()=>this.hass&&Pe(this,this.hass,n.entity_id)}
          >
            ${U(t?$e:Qe)}
            <span>${this.t(t?`label.stop`:`label.start`)}</span>
          </button>`:O}
      ${i?E`<button
            type="button"
            class="pill-button tonal"
            ?disabled=${!Ue(r)||e===`no_car`}
            @click=${()=>this.hass&&Pe(this,this.hass,r.entity_id,this.config.confirm_force_start===!1?void 0:this.t(`label.confirm_force_start`))}
          >
            ${U(Ze)}<span>${this.t(`label.force_start`)}</span>
          </button>`:O}
    </div>`}get hasPvSettings(){return this.entity(`start_charging_at`)!==void 0||this.entity(`pv_battery_threshold`)!==void 0}get pvSurplus(){let e=X(this.entity(`grid_power`));if(e===void 0)return;let t=X(this.entity(`charging_power`))??0;return Math.max(0,t-e)}renderPvSettings(){let e=this.entity(`start_charging_at`),t=this.entity(`pv_battery_threshold`),n=this.entity(`battery_soc`);return E`<div class="stack tight">
      ${e?this.renderPvTile(this.t(`label.pv_surplus`),Z(this.hass,this.pvSurplus),this.entity(`grid_power`),e,Z(this.hass,X(e)),tt,`solar`):O}
      ${t?this.renderPvTile(this.t(`label.pv_battery_soc`),Q(this.hass,n),n,t,Q(this.hass,t),V,`battery`):O}
    </div>`}renderPvTile(e,t,n,r,i,a,o){return E`<section class="pv-tile" aria-label=${e}>
      <h3>${e}</h3>
      <div class="threshold">
        <button
          type="button"
          class="pill-button outlined"
          aria-label="${this.t(`label.charge_above`)} ${i.value} ${i.unit}"
          @click=${()=>this.moreInfo(r)}
        >
          ${U(a,`icon ${o}`)}
          <span class="value">${this.renderParts(i)}</span>
        </button>
        <span class="threshold-caption">${this.t(`label.charge_above`)}</span>
      </div>
      <button
        type="button"
        class="pv-value value"
        ?disabled=${!n}
        @click=${()=>this.moreInfo(n)}
      >
        ${this.renderParts(t)}
      </button>
    </section>`}renderPager(e){return E`<div class="pages" role="tablist" @keydown=${this._onPagerKeydown}>
      ${[[`overview`,`label.overview`],[`pv`,`label.pv_quick_settings`]].map(([t,n])=>E`<button
          type="button"
          role="tab"
          class="page-dot"
          aria-controls="panel"
          aria-selected=${e===t?`true`:`false`}
          aria-label=${this.t(n)}
          tabindex=${e===t?0:-1}
          @click=${()=>this._page=t}
        ></button>`)}
    </div>`}renderInfo(){let e=this.entity(`charging_power`),t=z(this.entity(`phases_in_use`)),n=Math.max(1,Math.min(3,t??3)),r=(t,r)=>{let i=[1,2,3].slice(0,n).map(n=>B(e,`L${n}_${t}`)).map(e=>e===void 0?`–`:Y(this.hass,e));return`${n}~ (${i.join(` / `)} ${r})`},i=this.entity(`cable_current_limit`);return E`<section id="info" class="info" aria-label=${this.t(`label.information`)}>
      <div class="info-header">
        <h3 class="section-title">${this.t(`label.information`)}</h3>
      </div>
      <dl>
        <div><dt>${this.t(`label.current`)}</dt><dd class="value">${r(`Ampere`,`A`)}</dd></div>
        <div><dt>${this.t(`label.voltage`)}</dt><dd class="value">${r(`Voltage`,`V`)}</dd></div>
        <div>
          <dt>${this.t(`label.power_factor`)}</dt>
          <dd class="value">${r(`PowerRelative`,`%`)}</dd>
        </div>
        <div>
          <dt>${this.t(`label.charging_plug`)}</dt>
          <dd>
            ${U(Ye)}
            <span>${this.t(`label.type2`)}</span>
            ${R(i)?E`<span class="value">${this.renderParts(Q(this.hass,i))}</span>`:O}
          </dd>
        </div>
      </dl>
    </section>`}renderParts(e){return E`${e.value}${e.unit?E`<span class="unit">${e.unit}</span>`:O}`}_onPagerKeydown=e=>{if(![`ArrowLeft`,`ArrowRight`,`Home`,`End`].includes(e.key))return;e.preventDefault();let t=getComputedStyle(this).direction===`rtl`,n=e.key===`End`||e.key===`ArrowRight`!==t;this._page=e.key===`Home`?`overview`:n?`pv`:`overview`,this.updateComplete.then(()=>this.renderRoot.querySelector(`[role="tab"][aria-selected="true"]`)?.focus())};_onPointerDown=e=>{this._swipeStart=e.pointerType===`mouse`?void 0:e.clientX};_onPointerUp=e=>{if(this._swipeStart===void 0)return;let t=e.clientX-this._swipeStart;if(this._swipeStart=void 0,Math.abs(t)<50)return;let n=getComputedStyle(this).direction===`rtl`;this._page=t<0===n?`overview`:`pv`}},`card.charger.name`,`card.charger.description`,(e,t)=>{let n=e.entities?.[t];return n?.platform===`wattpilot`&&(n.translation_key===`car_state`||n.translation_key===`charging_power`)?{config:{type:`custom:${_t}`,device_id:n.device_id??void 0}}:null});var wt=`wattpilot-mode-card`,Tt={Default:Ze,Eco:Xe,"Next Trip":Ge},Et=[`charging_mode`,`discharge_pv_battery`,`pv_battery_discharges_until`,`max_charging_current`,`phase_switch`];gt(wt,class extends J{static styles=[q,o`
      .modes {
        display: grid;
        grid-template-columns: repeat(var(--mode-count, 3), minmax(0, 1fr));
        grid-template-rows: auto auto;
        column-gap: var(--ha-space-2, 8px);
      }
      .mode {
        /* Subgrid keeps the icons aligned when a translated label wraps. */
        display: grid;
        grid-row: span 2;
        grid-template-rows: subgrid;
        justify-items: center;
        align-items: end;
        row-gap: var(--ha-space-3, 12px);
        padding-block: var(--ha-space-2, 8px);
        border-radius: var(--ha-border-radius-lg, 12px);
      }
      .mode-label {
        text-align: center;
        font-size: var(--ha-font-size-l, 16px);
        font-weight: var(--ha-font-weight-bold, 600);
      }
      .mode-icon {
        display: grid;
        place-items: center;
        inline-size: 64px;
        block-size: 64px;
        border-radius: 50%;
        background: var(--wp-surface);
        box-shadow: var(--ha-box-shadow-s, none);
        transition:
          background-color var(--ha-animation-duration-fast, 150ms) ease,
          color var(--ha-animation-duration-fast, 150ms) ease;
      }
      .mode-icon .icon {
        --mdc-icon-size: 28px;
      }
      .mode[aria-checked="true"] .mode-icon {
        background: var(--wp-accent);
        color: var(--wp-on-accent);
      }
      .mode:focus-visible {
        outline: none;
      }
      .mode:focus-visible .mode-icon {
        outline: 2px solid var(--wp-focus);
        outline-offset: 3px;
      }
      .mode-hint {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--ha-space-1, 4px);
        margin: 0;
        color: var(--wp-text);
      }
      .section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .battery-actions {
        display: flex;
        align-items: center;
        gap: var(--ha-space-3, 12px);
      }
      .battery-actions .pill-button {
        flex: 1;
      }
      .battery-actions .icon.battery {
        color: var(--wp-battery);
      }
      .settings-button {
        inline-size: 48px;
        block-size: 48px;
        border: 1px solid var(--wp-divider);
        color: var(--wp-text);
      }
      select {
        font: inherit;
        color: var(--wp-text);
        background: var(--wp-surface);
        border: 1px solid var(--wp-divider);
        border-radius: var(--ha-border-radius-md, 8px);
        padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
        min-block-size: 40px;
      }
    `];roles=Et;static getConfigForm(){return mt({toggles:[{name:`show_pv_battery`,default:!0},{name:`show_charging_speed`,default:!0},{name:`show_phase_mode`,default:!1}],roles:Et})}getCardSize(){return 6}getGridOptions(){return{columns:12,rows:`auto`,min_columns:6}}render(){if(!this.hass)return E``;if(this.missingDevice)return this.renderMissingDevice();let e=[this.renderModes(),this.config.show_pv_battery===!1?O:this.renderPvBattery(),this.config.show_charging_speed===!1?O:this.renderChargingSpeed(),this.config.show_phase_mode===!0?this.renderPhaseMode():O].filter(e=>e!==O);return E`<ha-card>
      ${this.config.title?E`<h2 class="section-title">${this.config.title}</h2>`:O}
      ${e.map((e,t)=>E`${t>0?E`<hr class="divider" />`:O}${e}`)}
    </ha-card>`}renderModes(){let e=this.entity(`charging_mode`);if(!e)return O;let t=e.attributes.options,n=Array.isArray(t)?t.map(String):[],r=R(e),i=e.state;return E`<div class="stack tight">
      <div
        class="modes"
        role="radiogroup"
        aria-label=${this.t(`label.charging_mode`)}
        style="--mode-count: ${Math.max(1,n.length)}"
        @keydown=${e=>this._onModeKeydown(e,n,i)}
      >
        ${n.map(e=>{let t=e===i;return E`<button
            type="button"
            role="radio"
            class="mode"
            aria-checked=${t?`true`:`false`}
            tabindex=${t||!n.includes(i)&&e===n[0]?0:-1}
            ?disabled=${!r}
            @click=${()=>this._selectMode(e)}
          >
            <span class="mode-label">${K(this.hass,`label.mode.${e}`,e)}</span>
            <span class="mode-icon">${U(Tt[e]??`M11 15H6L13 1V9H18L11 23V15Z`)}</span>
          </button>`})}
      </div>
      <p class="mode-hint">
        <span>${K(this.hass,`label.mode_hint.${i}`,this.hass?.formatEntityState?.(e)??i)}</span>
        <button
          type="button"
          class="icon-button"
          aria-label=${this.t(`label.mode_details`)}
          @click=${()=>this.moreInfo(e)}
        >
          ${U(H)}
        </button>
      </p>
    </div>`}renderPvBattery(){let e=this.entity(`discharge_pv_battery`);if(!e)return O;let t=e.state===`on`,n=this.entity(`pv_battery_discharges_until`);return E`<section class="stack tight" aria-labelledby="pv-battery-title">
      <div class="section-header">
        <h3 id="pv-battery-title" class="section-title">${this.t(`label.charging_from_pv_battery`)}</h3>
        <button
          type="button"
          class="icon-button"
          aria-label="${this.t(`label.charging_from_pv_battery`)}: ${this.t(`label.information`)}"
          @click=${()=>this.moreInfo(e)}
        >
          ${U(H)}
        </button>
      </div>
      <div class="battery-actions">
        <button
          type="button"
          class="pill-button ${t?`filled`:`outlined`}"
          aria-pressed=${t?`true`:`false`}
          ?disabled=${!R(e)}
          @click=${()=>this.hass&&Le(this.hass,e.entity_id,!t)}
        >
          ${U(t?$e:V,t?`icon`:`icon battery`)}
          <span>${this.t(t?`label.stop`:`label.start`)}</span>
        </button>
        ${n?E`<button
              type="button"
              class="icon-button settings-button"
              aria-label=${this.t(`label.pv_battery_settings`)}
              @click=${()=>this.moreInfo(n)}
            >
              ${U(Je)}
            </button>`:O}
      </div>
    </section>`}renderChargingSpeed(){let e=this.entity(`max_charging_current`);if(!e)return O;let t=Q(this.hass,e);return E`<button
      type="button"
      class="row row-button"
      @click=${()=>this.moreInfo(e)}
    >
      <span class="grow">${this.t(`label.charging_speed`)}</span>
      <span class="row-value">${t.value} ${t.unit}</span>
      ${U(Ke)}
    </button>`}renderPhaseMode(){let e=this.entity(`phase_switch`);if(!e)return O;let t=e.attributes.options,n=Array.isArray(t)?t.map(String):[];return E`<label class="row">
      <span class="grow">${this.t(`label.phase_mode`)}</span>
      <select
        .value=${e.state}
        ?disabled=${!R(e)}
        @change=${t=>this.hass&&I(this.hass,e.entity_id,t.target.value)}
      >
        ${n.map(t=>E`<option value=${t} ?selected=${t===e.state}>
              ${this.hass?.formatEntityState?.(e,t)??t}
            </option>`)}
      </select>
    </label>`}_selectMode(e){let t=this.entity(`charging_mode`);this.hass&&t&&t.state!==e&&I(this.hass,t.entity_id,e)}_onModeKeydown(e,t,n){if(![`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`Home`,`End`].includes(e.key))return;e.preventDefault();let r=getComputedStyle(this).direction===`rtl`,i=Math.max(0,t.indexOf(n)),a=e.key===`ArrowDown`||e.key===`ArrowRight`&&!r||e.key===`ArrowLeft`&&r?1:-1,o=e.key===`Home`?0:e.key===`End`?t.length-1:(i+a+t.length)%t.length,s=t[o];s!==void 0&&(this._selectMode(s),this.renderRoot.querySelectorAll(`[role="radio"]`)[o]?.focus())}},`card.mode.name`,`card.mode.description`);var Dt=`wattpilot-next-trip-card`,Ot=`Next Trip`,kt=[`next_trip_time`,`next_trip_charging`,`remain_in_eco_mode`,`charging_mode`];function At(e){return e?.attributes.unit_of_measurement===`Wh`?1e3:1}gt(Dt,class extends J{static styles=[q,o`
      .header {
        align-items: center;
        justify-content: flex-start;
      }
      .header .icon {
        color: var(--wp-accent);
      }
      .field {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--ha-space-3, 12px);
        min-block-size: 48px;
      }
      input[type="time"],
      input[type="number"] {
        font: inherit;
        font-size: var(--ha-font-size-l, 16px);
        font-variant-numeric: tabular-nums;
        color: var(--wp-text);
        background: var(--wp-surface);
        border: 1px solid var(--wp-divider);
        border-radius: var(--ha-border-radius-md, 8px);
        padding: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
        min-block-size: 40px;
        box-sizing: border-box;
      }
      input[type="number"] {
        inline-size: 7em;
        text-align: end;
      }
      .number {
        display: flex;
        align-items: center;
        gap: var(--ha-space-2, 8px);
      }
      input[type="checkbox"][role="switch"] {
        inline-size: 20px;
        block-size: 20px;
        accent-color: var(--wp-accent);
      }
      .hint {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--ha-space-2, 8px) var(--ha-space-3, 12px);
        padding: var(--ha-space-3, 12px);
        border-radius: var(--ha-border-radius-lg, 12px);
        background: var(--wp-surface);
        color: var(--wp-subtext);
        margin: 0;
      }
      .hint .grow {
        flex: 1;
        min-inline-size: 12em;
      }
      .hint .pill-button {
        min-block-size: 40px;
        background: var(--ha-card-background, var(--card-background-color));
        font-size: var(--ha-font-size-m, 14px);
      }
    `];roles=kt;static getConfigForm(){return mt({toggles:[{name:`show_remain_in_eco`,default:!0}],roles:kt})}getCardSize(){return 4}getGridOptions(){return{columns:12,rows:`auto`,min_columns:6}}render(){if(!this.hass)return E``;if(this.missingDevice)return this.renderMissingDevice();let e=this.entity(`next_trip_time`),t=this.entity(`next_trip_charging`),n=this.entity(`remain_in_eco_mode`),r=this.entity(`charging_mode`),i=R(r)&&r.state!==Ot;return E`<ha-card>
      <div class="header">
        ${U(Ge)}
        <h2 class="section-title">
          ${this.config.title||this.t(`label.mode.Next Trip`)}
        </h2>
      </div>
      ${i?this.renderInactiveHint(r):O}
      ${e?this.renderTime(e):O}
      ${t?this.renderEnergy(t):O}
      ${n&&this.config.show_remain_in_eco!==!1?this.renderEco(n):O}
    </ha-card>`}renderInactiveHint(e){let t=e.attributes.options,n=Array.isArray(t)&&t.includes(Ot);return E`<p class="hint" role="status">
      ${U(H)}
      <span class="grow">${this.t(`label.next_trip_inactive`)}</span>
      ${n?E`<button
            type="button"
            class="pill-button outlined"
            @click=${()=>this.hass&&I(this.hass,e.entity_id,Ot)}
          >
            ${this.t(`label.activate_next_trip`)}
          </button>`:O}
    </p>`}renderTime(e){let t=R(e)?e.state.slice(0,5):``;return E`<label class="field">
      <span>${this.t(`label.departure`)}</span>
      <input
        type="time"
        .value=${t}
        ?disabled=${!R(e)}
        @change=${t=>{let n=t.target.value;this.hass&&/^\d{2}:\d{2}$/.test(n)&&Ie(this.hass,e.entity_id,`${n}:00`)}}
      />
    </label>`}renderEnergy(e){let t=At(e),n=t===1e3?`kWh`:String(e.attributes.unit_of_measurement??``),r=z(e),i=(B(e,`min`)??0)/t,a=(B(e,`max`)??2**53-1)/t;return E`<label class="field">
      <span>${this.t(`label.trip_energy`)}</span>
      <span class="number">
        <input
          type="number"
          inputmode="decimal"
          min=${i}
          max=${a}
          step=${t===1e3?.5:B(e,`step`)??1}
          .value=${r===void 0?``:String(r/t)}
          ?disabled=${!R(e)}
          @change=${n=>{let r=n.target,o=Number(r.value);if(!this.hass||r.value===``||!Number.isFinite(o))return;let s=Math.min(a,Math.max(i,o));Fe(this.hass,e.entity_id,Math.round(s*t))}}
        />
        <span class="unit">${n}</span>
      </span>
    </label>`}renderEco(e){let t=e.state===`on`;return E`<label class="field">
      <span>${this.t(`label.remain_in_eco`)}</span>
      <input
        type="checkbox"
        role="switch"
        .checked=${t}
        ?disabled=${!R(e)}
        @change=${t=>this.hass&&Le(this.hass,e.entity_id,t.target.checked)}
      />
    </label>`}},`card.next_trip.name`,`card.next_trip.description`),console.info(`%c WATTPILOT-CARDS %c 2026.10.2 `,`font-weight:bold`,``);