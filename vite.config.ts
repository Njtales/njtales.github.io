import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import {readFile} from 'node:fs/promises'

export default defineConfig({ plugins: [react(),{
  name:'plain-profile',
  configureServer(server){
    // Vite's SPA fallback otherwise captures directory URLs in public/.
    server.middlewares.use((request,response,next)=>{
      const pathname=request.url?.split('?')[0]
      if(!['/profile','/profile/','/profile/index.html'].includes(pathname??'')||!['GET','HEAD'].includes(request.method??''))return next()
      readFile(new URL('./public/profile/index.html',import.meta.url),'utf8').then(html=>{
        response.setHeader('Content-Type','text/html; charset=utf-8')
        response.setHeader('Cache-Control','no-cache')
        response.end(request.method==='HEAD'?undefined:html)
      }).catch(next)
    })
  },
}] })
