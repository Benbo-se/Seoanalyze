module.exports=[55108,(e,t,r)=>{let i={"missing-h1":{impact:9,effort:2,priority:45,category:"critical-seo",title:"Saknar H1-rubrik",description:"Sidan saknar huvudrubrik som beskriver innehållet för sökmotorer",fixSnippet:{type:"html",code:"<h1>Huvudrubrik som beskriver sidans syfte</h1>",placement:"Placera i <main> eller direkt under <header>"},businessImpact:"Kan förbättra rankings med 15-30% för målsökord",timeToFix:"2-5 minuter"},"missing-meta-description":{impact:7,effort:2,priority:35,category:"important-seo",title:"Saknar meta description",description:"Metabeskrivning saknas - påverkar klickfrekvens i sökresultat",fixSnippet:{type:"html",code:`<meta name="description" content="Beskrivande text 150-160 tecken som lockar klick fr\xe5n s\xf6kresultat">`,placement:"Placera i <head>-sektionen"},businessImpact:"Kan öka CTR med 5-15% från sökresultat",timeToFix:"3-10 minuter"},"title-too-long":{impact:6,effort:3,priority:18,category:"seo-optimization",title:"Title-tag för lång",description:"Title-tag över 60 tecken kapas av i sökresultat",fixSnippet:{type:"html",code:"<title>Kort beskrivande titel under 60 tecken</title>",placement:"Ersätt befintlig <title> i <head>"},businessImpact:"Förbättrar titel-visning i sökresultat",timeToFix:"2-5 minuter"},"images-missing-alt":{impact:5,effort:4,priority:20,category:"accessibility-seo",title:"Bilder saknar alt-text",description:"Bilder utan alt-attribut är otillgängliga för skärmläsare och sökmotorer",fixSnippet:{type:"html",code:`<img src="bild.jpg" alt="Beskrivande text f\xf6r bildens inneh\xe5ll">`,placement:"Lägg till alt-attribut på alla <img> taggar"},businessImpact:"Förbättrar tillgänglighet och bildersökning",timeToFix:"1-2 minuter per bild"},"slow-lcp":{impact:8,effort:7,priority:56,category:"performance-critical",title:"Långsam Largest Contentful Paint",description:"Huvudinnehåll laddar för långsamt - påverkar användarupplevelse och rankings",fixSnippet:{type:"optimization",code:`// Optimera st\xf6rsta elementet
// 1. Komprimera bilder (WebP format)
// 2. L\xe4gg till fetchpriority="high" p\xe5 hero-bild
<img src="hero.webp" fetchpriority="high" alt="Hero">

// 3. Preload kritiska resurser
<link rel="preload" href="/fonts/main.woff2" as="font" crossorigin>`,placement:"Implementera i <head> och optimera största synliga element"},businessImpact:"Kritisk Core Web Vital - påverkar rankings direkt",timeToFix:"30-120 minuter"},"missing-robots-txt":{impact:4,effort:2,priority:8,category:"technical-seo",title:"Saknar robots.txt",description:"Robots.txt-fil saknas - kan förvirra sökmotorernas crawling",fixSnippet:{type:"file",code:`User-agent: *
Allow: /

# Sitemap location
Sitemap: https://yourdomain.com/sitemap.xml

# Block admin areas
Disallow: /admin/
Disallow: /wp-admin/`,placement:"Skapa fil på /robots.txt i webbroot"},businessImpact:"Förbättrar crawling-effektivitet",timeToFix:"5-10 minuter"},"duplicate-h1":{impact:7,effort:3,priority:21,category:"seo-structure",title:"Flera H1-rubriker på samma sida",description:"Flera H1-taggar förvirrar sökmotorer om sidans huvudämne",fixSnippet:{type:"html",code:`<!-- Beh\xe5ll endast en H1 per sida -->
<h1>Huvudrubrik</h1>

<!-- \xc4ndra \xf6vriga till H2-H6 -->
<h2>Underrubrik</h2>
<h3>Delrubrik</h3>`,placement:"Ändra extra H1-taggar till H2-H6 baserat på hierarki"},businessImpact:"Tydligare innehållsstruktur för sökmotorer",timeToFix:"5-15 minuter"},"poor-cls":{impact:6,effort:8,priority:48,category:"performance-ux",title:"Hög Cumulative Layout Shift",description:"Innehåll hoppar runt när sidan laddar - dålig användarupplevelse",fixSnippet:{type:"css",code:`/* Reservera utrymme f\xf6r bilder */
img {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9; /* Eller faktiska proportioner */
}

/* Reservera utrymme f\xf6r annonser */
.ad-container {
  width: 300px;
  height: 250px;
  display: block;
}

/* Anv\xe4nd transform ist\xe4llet f\xf6r att \xe4ndra layout */
.animation {
  transform: translateY(20px);
  transition: transform 0.3s ease;
}`,placement:"Lägg till i CSS för element som orsakar layout-shift"},businessImpact:"Core Web Vital - kritisk för användarupplevelse",timeToFix:"60-180 minuter"},"missing-structured-data":{impact:6,effort:4,priority:24,category:"seo-enhancement",title:"Saknar strukturerad data (Schema.org)",description:"Strukturerad data hjälper sökmotorer förstå innehållet bättre",fixSnippet:{type:"json-ld",code:`<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "F\xf6retagsnamn",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png",
  "sameAs": [
    "https://www.facebook.com/yourpage",
    "https://www.linkedin.com/company/yourcompany"
  ]
}
</script>

<!-- F\xf6r artiklar/blogginl\xe4gg -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Artikelrubrik",
  "author": {
    "@type": "Person",
    "name": "F\xf6rfattarnamn"
  },
  "datePublished": "2024-01-01",
  "description": "Artikelbeskrivning"
}
</script>`,placement:"Lägg till i <head>-sektionen innan </head>"},businessImpact:"Rich snippets i sökresultat - höjer CTR",timeToFix:"15-45 minuter"},"slow-font-loading":{impact:5,effort:3,priority:15,category:"performance",title:"Långsam typsnittsladdning",description:"Externa typsnitt blockerar textrendering",fixSnippet:{type:"html",code:`<!-- Preload kritiska typsnitt -->
<link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>

<!-- Anv\xe4nd font-display f\xf6r b\xe4ttre laddning -->
<style>
@font-face {
  font-family: 'MainFont';
  src: url('/fonts/main-font.woff2') format('woff2');
  font-display: swap; /* Visar fallback-font medan den laddar */
}

body {
  font-family: 'MainFont', 'Segoe UI', Tahoma, sans-serif;
}
</style>`,placement:"Lägg till i <head> före andra stylesheets"},businessImpact:"Snabbare text-rendering förbättrar upplevd prestanda",timeToFix:"10-30 minuter"},"missing-canonical":{impact:8,effort:2,priority:40,category:"critical-seo",title:"Saknar canonical URL",description:"Canonical-taggen förhindrar duplicerat innehåll och stärker sidans auktoritet",fixSnippet:{type:"html",code:'<link rel="canonical" href="https://yourdomain.com/full-page-url">',placement:"Lägg till i <head>-sektionen efter <title>"},businessImpact:"Förhindrar SEO-duplicering och stärker sidauktoritet",timeToFix:"2-5 minuter"},"mixed-content":{impact:7,effort:5,priority:35,category:"security-seo",title:"HTTP-innehåll på HTTPS-sida",description:"Blandat innehåll (HTTP på HTTPS) skapar säkerhetsvarningar",fixSnippet:{type:"html",code:`<!-- \xc4ndra alla HTTP-referenser till HTTPS -->

<!-- F\xf6re (os\xe4kert) -->
<img src="http://example.com/image.jpg" alt="Bild">
<script src="http://example.com/script.js"></script>

<!-- Efter (s\xe4kert) -->
<img src="https://example.com/image.jpg" alt="Bild">
<script src="https://example.com/script.js"></script>

<!-- Eller anv\xe4nd protokoll-relative URLs -->
<img src="//example.com/image.jpg" alt="Bild">`,placement:"Uppdatera alla HTTP-länkar i HTML, CSS och JS"},businessImpact:"Eliminerar säkerhetsvarningar och förbättrar trust-signaler",timeToFix:"30-90 minuter"}},a={"unoptimized-images":{impact:7,effort:5,priority:35,category:"performance",title:"Bilder inte optimerade",description:"Stora bildstorlekar saktar ner sidladdning",fixSnippet:{type:"html",code:`<!-- Anv\xe4nd moderna bildformat och responsive bilder -->
<picture>
  <source media="(min-width: 800px)" srcset="hero-large.webp" type="image/webp">
  <source media="(min-width: 400px)" srcset="hero-medium.webp" type="image/webp">
  <img src="hero-small.webp" alt="Hero image" loading="lazy" width="400" height="300">
</picture>`,placement:"Ersätt stora img-taggar med optimerade picture-element"},businessImpact:"Snabbare laddning = bättre användarupplevelse och SEO",timeToFix:"30-90 minuter"}};t.exports={RuleEngine:class{static analyzeAndPrioritize(e,t="seo"){let r=this.findApplicableRules(e,t),i=this.calculatePriorityScores(r);return this.sortByPriority(i)}static findApplicableRules(e,t){let r=[];for(let[n,s]of Object.entries("lighthouse"===t?a:i))this.ruleMatches(n,s,e)&&r.push({id:n,...s,detectedIssue:this.extractIssueDetails(n,e)});return r}static ruleMatches(e,t,r){switch(e){case"missing-h1":return!r.headings?.h1||0===r.headings.h1.length;case"missing-meta-description":return!r.metaDescription||0===r.metaDescription.length;case"title-too-long":return r.title&&r.title.length>60;case"images-missing-alt":return r.images?.some(e=>!e.alt);case"duplicate-h1":return r.headings?.h1&&r.headings.h1.length>1;case"slow-lcp":return r.performance?.lcp>2500;case"poor-cls":return r.performance?.cls>.1;case"missing-robots-txt":return!r.robots||"not_found"===r.robots.status;case"unoptimized-images":return r.images?.some(e=>e.sizeKB>100);case"missing-structured-data":return!r.structuredData||0===r.structuredData.length;case"slow-font-loading":return r.performance?.fonts?.some(e=>e.loadTime>1e3);case"missing-canonical":return!r.canonical||!r.canonicalUrl;case"mixed-content":return r.security?.mixedContent===!0||r.resources&&r.resources.some(e=>"http"===e.protocol);default:return!1}}static extractIssueDetails(e,t){switch(e){case"title-too-long":return{currentLength:t.title?.length,currentTitle:t.title,suggestedLength:60};case"images-missing-alt":let r=t.images?.filter(e=>!e.alt)||[];return{affectedImages:r.length,examples:r.slice(0,3).map(e=>e.src)};case"slow-lcp":return{currentLCP:t.performance?.lcp,targetLCP:2500,slowdownFactor:Math.round(t.performance?.lcp/2500*100)+"%"};default:return{}}}static calculatePriorityScores(e){return e.map(e=>({...e,finalScore:e.impact*(10-e.effort),impactScore:e.impact,effortScore:e.effort,roi:Math.round(e.impact/e.effort*100)/100}))}static sortByPriority(e){return e.sort((e,t)=>t.finalScore!==e.finalScore?t.finalScore-e.finalScore:t.roi-e.roi)}static generateActionableList(e,t=5){return e.slice(0,t).map((e,t)=>({priority:t+1,title:e.title,description:e.description,impact:`${e.impact}/9`,effort:`${e.effort}/9`,roi:e.roi,businessValue:e.businessImpact,timeToFix:e.timeToFix,fixSnippet:e.fixSnippet,category:e.category,detectedIssue:e.detectedIssue||{}}))}},analyzeWithRules:async function(e,t){return{summary:{totalIssues:0,criticalIssues:0,quickWins:0,averageROI:0,categories:[]},actionableList:[],totalActions:0}},SEO_RULES:i,PERFORMANCE_RULES:a}},97564,e=>{"use strict";e.s(["handler",()=>P,"patchFetch",()=>A,"routeModule",()=>S,"serverHooks",()=>E,"workAsyncStorage",()=>T,"workUnitAsyncStorage",()=>I],97564);var t=e.i(47909),r=e.i(74017),i=e.i(96250),a=e.i(59756),n=e.i(61916),s=e.i(69741),o=e.i(16795),l=e.i(87718),c=e.i(73895),p=e.i(47587),d=e.i(66012),u=e.i(70101),m=e.i(26937),g=e.i(10372),f=e.i(93695);e.i(52474);var h=e.i(220);e.s(["GET",()=>v,"POST",()=>R,"runtime",()=>b],72604);var y=e.i(89171);let{RuleEngine:x}=e.r(55108),k=e.r(31793);e.r(8529);let b="nodejs";async function v(e){try{let{searchParams:t}=new URL(e.url),r=t.get("analysisId"),i=Number(t.get("limit")||10),a=t.get("category");if(!r)return y.NextResponse.json({error:"analysisId krävs för att generera åtgärder"},{status:400});let n=await k.getById(r);if(!n)return y.NextResponse.json({error:"Analys hittades inte"},{status:404});let s=x.analyzeAndPrioritize({title:"Example Domain - Detta är en lång titel som är över 60 tecken vilket triggar regeln",metaDescription:"",headings:{h1:[]},images:[{src:"test1.jpg",alt:""},{src:"test2.jpg",alt:"OK alt text"}],canonical:null,robots:{status:"not_found"},structuredData:[],performance:{lcp:3200,cls:.15}},n.type),o=a?s.filter(e=>e.category===a):s,l=x.generateActionableList(o,i),c={totalIssues:s.length,criticalIssues:s.filter(e=>e.impact>=8).length,quickWins:s.filter(e=>e.impact>=6&&e.effort<=3).length,averageROI:s.length>0?Math.round(s.reduce((e,t)=>e+t.roi,0)/s.length*100)/100:0,categories:[...new Set(s.map(e=>e.category))]};return y.NextResponse.json({success:!0,analysis:{id:r,url:n.targetUrl,type:n.type,analyzedAt:n.createdAt},summary:c,actionableList:l,totalActions:l.length})}catch(e){return console.error("Rule Engine API error:",e),y.NextResponse.json({error:"Misslyckades att generera prioriterade åtgärder",message:e.message},{status:500})}}async function R(e){try{let t=await e.json().catch(()=>null);if(!t?.analysisId||!t?.ruleId)return y.NextResponse.json({error:"analysisId och ruleId krävs"},{status:400});return console.log(`✅ \xc5tg\xe4rd markerad som genomf\xf6rd: ${t.ruleId} f\xf6r analys ${t.analysisId}`),y.NextResponse.json({success:!0,message:`\xc5tg\xe4rd ${t.ruleId} markerad som genomf\xf6rd`,ruleId:t.ruleId,analysisId:t.analysisId,completedAt:new Date})}catch(e){return console.error("Rule Engine POST error:",e),y.NextResponse.json({error:"Misslyckades att markera åtgärd som genomförd",message:e.message},{status:500})}}var w=e.i(72604);let S=new t.AppRouteRouteModule({definition:{kind:r.RouteKind.APP_ROUTE,page:"/api/rule-engine/route",pathname:"/api/rule-engine",filename:"route",bundlePath:""},distDir:".next",relativeProjectDir:"",resolvedPagePath:"[project]/src/app/api/rule-engine/route.js",nextConfigOutput:"standalone",userland:w}),{workAsyncStorage:T,workUnitAsyncStorage:I,serverHooks:E}=S;function A(){return(0,i.patchFetch)({workAsyncStorage:T,workUnitAsyncStorage:I})}async function P(e,t,i){var y;let x="/api/rule-engine/route";x=x.replace(/\/index$/,"")||"/";let k=await S.prepare(e,t,{srcPage:x,multiZoneDraftMode:!1});if(!k)return t.statusCode=400,t.end("Bad Request"),null==i.waitUntil||i.waitUntil.call(i,Promise.resolve()),null;let{buildId:b,params:v,nextConfig:R,isDraftMode:w,prerenderManifest:T,routerServerContext:I,isOnDemandRevalidate:E,revalidateOnlyGenerated:A,resolvedPathname:P}=k,C=(0,s.normalizeAppPath)(x),H=!!(T.dynamicRoutes[C]||T.routes[P]);if(H&&!w){let e=!!T.routes[P],t=T.dynamicRoutes[C];if(t&&!1===t.fallback&&!e)throw new f.NoFallbackError}let F=null;!H||S.isDev||w||(F="/index"===(F=P)?"/":F);let j=!0===S.isDev||!H,N=H&&!j,O=e.method||"GET",D=(0,n.getTracer)(),L=D.getActiveScopeSpan(),M={params:v,prerenderManifest:T,renderOpts:{experimental:{cacheComponents:!!R.experimental.cacheComponents,authInterrupts:!!R.experimental.authInterrupts},supportsDynamicResponse:j,incrementalCache:(0,a.getRequestMeta)(e,"incrementalCache"),cacheLifeProfiles:null==(y=R.experimental)?void 0:y.cacheLife,isRevalidate:N,waitUntil:i.waitUntil,onClose:e=>{t.on("close",e)},onAfterTaskError:void 0,onInstrumentationRequestError:(t,r,i)=>S.onRequestError(e,t,i,I)},sharedContext:{buildId:b}},U=new o.NodeNextRequest(e),_=new o.NodeNextResponse(t),B=l.NextRequestAdapter.fromNodeNextRequest(U,(0,l.signalFromNodeResponse)(t));try{let s=async r=>S.handle(B,M).finally(()=>{if(!r)return;r.setAttributes({"http.status_code":t.statusCode,"next.rsc":!1});let i=D.getRootSpanAttributes();if(!i)return;if(i.get("next.span_type")!==c.BaseServerSpan.handleRequest)return void console.warn(`Unexpected root span type '${i.get("next.span_type")}'. Please report this Next.js issue https://github.com/vercel/next.js`);let a=i.get("next.route");if(a){let e=`${O} ${a}`;r.setAttributes({"next.route":a,"http.route":a,"next.span_name":e}),r.updateName(e)}else r.updateName(`${O} ${e.url}`)}),o=async n=>{var o,l;let c=async({previousCacheEntry:r})=>{try{if(!(0,a.getRequestMeta)(e,"minimalMode")&&E&&A&&!r)return t.statusCode=404,t.setHeader("x-nextjs-cache","REVALIDATED"),t.end("This page could not be found"),null;let o=await s(n);e.fetchMetrics=M.renderOpts.fetchMetrics;let l=M.renderOpts.pendingWaitUntil;l&&i.waitUntil&&(i.waitUntil(l),l=void 0);let c=M.renderOpts.collectedTags;if(!H)return await (0,d.sendResponse)(U,_,o,M.renderOpts.pendingWaitUntil),null;{let e=await o.blob(),t=(0,u.toNodeOutgoingHttpHeaders)(o.headers);c&&(t[g.NEXT_CACHE_TAGS_HEADER]=c),!t["content-type"]&&e.type&&(t["content-type"]=e.type);let r=void 0!==M.renderOpts.collectedRevalidate&&!(M.renderOpts.collectedRevalidate>=g.INFINITE_CACHE)&&M.renderOpts.collectedRevalidate,i=void 0===M.renderOpts.collectedExpire||M.renderOpts.collectedExpire>=g.INFINITE_CACHE?void 0:M.renderOpts.collectedExpire;return{value:{kind:h.CachedRouteKind.APP_ROUTE,status:o.status,body:Buffer.from(await e.arrayBuffer()),headers:t},cacheControl:{revalidate:r,expire:i}}}}catch(t){throw(null==r?void 0:r.isStale)&&await S.onRequestError(e,t,{routerKind:"App Router",routePath:x,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isRevalidate:N,isOnDemandRevalidate:E})},I),t}},f=await S.handleResponse({req:e,nextConfig:R,cacheKey:F,routeKind:r.RouteKind.APP_ROUTE,isFallback:!1,prerenderManifest:T,isRoutePPREnabled:!1,isOnDemandRevalidate:E,revalidateOnlyGenerated:A,responseGenerator:c,waitUntil:i.waitUntil});if(!H)return null;if((null==f||null==(o=f.value)?void 0:o.kind)!==h.CachedRouteKind.APP_ROUTE)throw Object.defineProperty(Error(`Invariant: app-route received invalid cache entry ${null==f||null==(l=f.value)?void 0:l.kind}`),"__NEXT_ERROR_CODE",{value:"E701",enumerable:!1,configurable:!0});(0,a.getRequestMeta)(e,"minimalMode")||t.setHeader("x-nextjs-cache",E?"REVALIDATED":f.isMiss?"MISS":f.isStale?"STALE":"HIT"),w&&t.setHeader("Cache-Control","private, no-cache, no-store, max-age=0, must-revalidate");let y=(0,u.fromNodeOutgoingHttpHeaders)(f.value.headers);return(0,a.getRequestMeta)(e,"minimalMode")&&H||y.delete(g.NEXT_CACHE_TAGS_HEADER),!f.cacheControl||t.getHeader("Cache-Control")||y.get("Cache-Control")||y.set("Cache-Control",(0,m.getCacheControlHeader)(f.cacheControl)),await (0,d.sendResponse)(U,_,new Response(f.value.body,{headers:y,status:f.value.status||200})),null};L?await o(L):await D.withPropagatedContext(e.headers,()=>D.trace(c.BaseServerSpan.handleRequest,{spanName:`${O} ${e.url}`,kind:n.SpanKind.SERVER,attributes:{"http.method":O,"http.target":e.url}},o))}catch(t){if(L||t instanceof f.NoFallbackError||await S.onRequestError(e,t,{routerKind:"App Router",routePath:C,routeType:"route",revalidateReason:(0,p.getRevalidateReason)({isRevalidate:N,isOnDemandRevalidate:E})}),H)throw t;return await (0,d.sendResponse)(U,_,new Response(null,{status:500})),null}}}];

//# sourceMappingURL=_129c0099._.js.map