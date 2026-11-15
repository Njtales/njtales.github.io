import fs from 'node:fs/promises'
import path from 'node:path'
import {pathToFileURL} from 'node:url'
import ts from 'typescript'

// Generate the plain profile and initial HTML from the same facts as the app.
const temporary=path.resolve('node_modules/.tmp/profile-build')
await fs.mkdir(temporary,{recursive:true});await fs.writeFile(path.join(temporary,'package.json'),'{"type":"module"}')
for(const name of ['profileData','portfolioData','portfolioRoutes']){
  const source=await fs.readFile(`src/scene/${name}.ts`,'utf8')
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/(from\s+['"])(\.\/[^'"]+)(['"])/g,(_,a,p,b)=>`${a}${p}.js${b}`)
  await fs.writeFile(path.join(temporary,`${name}.js`),code)
}
const {profile}=await import(pathToFileURL(path.join(temporary,'profileData.js')))
const {portfolioSpots}=await import(pathToFileURL(path.join(temporary,'portfolioData.js')))
const {projectHref}=await import(pathToFileURL(path.join(temporary,'portfolioRoutes.js')))
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const e=escape
const names={'clocktower':'Experience & approach','cloud-forge':'Skills','data-tower':'Projects','learning-lab':'Learning','about-cottage':'About','hobbies-hut':'Beyond work','signal-station':'Contact'}
const description=`${profile.name}, ${profile.role} in ${profile.location}. Python, SQL, Airflow and PostgreSQL projects, plus Coastlight Village, an interactive portfolio.`
const person={'@context':'https://schema.org','@type':'Person','@id':`${profile.site}/#person`,name:profile.name,jobTitle:profile.role,url:profile.site,sameAs:[profile.linkedin,profile.github]}
const fonts='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
const contacts=`<a href="mailto:${e(profile.email)}">Email Nikhil</a><a href="${e(profile.linkedin)}">LinkedIn</a><a href="${e(profile.github)}">GitHub</a>${profile.cvUrl?`<a href="${e(profile.cvUrl)}">CV</a>`:''}`
const head=(title,url)=>`<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#164c50">
<title>${e(title)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${url}"><link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta property="og:type" content="website"><meta property="og:site_name" content="Coastlight Village"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:url" content="${url}">
<meta property="og:image" content="${profile.site}/assets/coastlight-preview.jpg"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1280"><meta property="og:image:height" content="720"><meta property="og:image:alt" content="Coastlight Village, a coastal portfolio world with Niro the golden fox">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${profile.site}/assets/coastlight-preview.jpg">
<script type="application/ld+json">${JSON.stringify(person).replace(/</g,'\\u003c')}</script>${fonts}`
const projects=portfolioSpots.find(s=>s.id==='data-tower').entries
const initial=`<main class="initial-profile"><p class="initial-brand">COASTLIGHT VILLAGE · ${e(profile.location)}</p><h1>${e(profile.name)}</h1><p><strong>${e(profile.role)}</strong></p><p>Python, SQL and data pipelines, with a walkable portfolio to explore.</p><nav aria-label="Read the portfolio"><a href="/profile/">Read the full profile</a>${contacts}</nav><h2>Selected projects</h2><ul>${projects.map(p=>`<li><a href="/profile/${e(projectHref(p.id))}">${e(p.title)}</a> — ${e(p.status)}</li>`).join('')}</ul></main>`
await fs.writeFile('index.html',`<!doctype html>
<html lang="en"><head>${head(`${profile.name} — ${profile.role} | Coastlight Village`,`${profile.site}/`)}
<style>.initial-profile{max-width:720px;margin:8vh auto;padding:28px;font:16px/1.6 system-ui,sans-serif;color:#173c3d;background:#fff5df;border-radius:18px}.initial-profile h1{font-size:36px;line-height:1.15}.initial-profile a{color:#285d58;text-underline-offset:3px}.initial-profile nav{display:flex;flex-wrap:wrap;gap:16px}.initial-brand{font-size:12px;font-weight:700;letter-spacing:.08em}.noscript-note{max-width:720px;margin:16px auto;padding:0 28px;font:16px/1.5 system-ui,sans-serif;color:#173c3d}</style>
</head><body><div id="root">${initial}</div><noscript><p class="noscript-note">The interactive village needs JavaScript. The <a href="/profile/">full plain profile</a> includes every section and works without it.</p></noscript><script type="module" src="/src/main.tsx"></script></body></html>
`)
const renderEntry=entry=>`<article${entry.id?` id="${e(projectHref(entry.id).slice(1))}"`:''}><header><h3>${e(entry.title)}</h3>${entry.status?`<span class="status">${e(entry.status)}</span>`:''}</header><p>${e(entry.detail)}</p>${entry.highlights?`<dl>${entry.highlights.map(item=>`<div><dt>${e(item.label)}</dt><dd>${e(item.detail)}</dd></div>`).join('')}</dl>`:''}${entry.tags?`<p class="tags">${entry.tags.map(e).join(' · ')}</p>`:''}<div class="entry-actions">${entry.proofProject?`<a href="${e(projectHref(entry.proofProject))}">See supporting project</a>`:''}${entry.link?`<a href="${e(entry.link.href)}">${e(entry.link.label)} ↗</a>`:''}</div></article>`
const sections=portfolioSpots.map(spot=>`<section id="${spot.id==='data-tower'?'projects':e(spot.id)}" aria-labelledby="${e(spot.id)}-heading"><h2 id="${e(spot.id)}-heading">${e(names[spot.id])}</h2><p>${e(spot.description)}</p>${spot.entries.map(renderEntry).join('')}${spot.id==='signal-station'?`<nav class="contact-links" aria-label="Contact Nikhil">${contacts}</nav>`:''}</section>`).join('\n')
await fs.mkdir('public/profile',{recursive:true})
await fs.writeFile('public/profile/index.html',`<!doctype html><html lang="en"><head>${head(`${profile.name} — Profile`,`${profile.site}/profile/`)}<link rel="stylesheet" href="/assets/profile.css"></head><body><a class="skip-link" href="#projects">Skip to projects</a><main><header class="profile-header"><p class="eyebrow">COASTLIGHT VILLAGE · ${e(profile.location)}</p><h1>${e(profile.name)}</h1><p class="role">${e(profile.role)}</p><p>Python, SQL and data pipelines. A plain profile of my work, projects and interests.</p><nav aria-label="Profile navigation"><a href="/">Explore the village</a><a href="#projects">View projects</a>${contacts}</nav><p class="print-note">Use your browser’s Print menu to save a copy of this profile.</p></header>${sections}<footer><a href="/">Return to Coastlight Village</a></footer></main></body></html>`)
await fs.writeFile('public/robots.txt',`User-agent: *\nAllow: /\nSitemap: ${profile.site}/sitemap.xml\n`)
await fs.writeFile('public/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${profile.site}/</loc></url><url><loc>${profile.site}/profile/</loc></url></urlset>\n`)
console.log('Generated shared portfolio metadata, initial HTML and plain profile.')
