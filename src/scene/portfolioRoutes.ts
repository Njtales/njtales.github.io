import {portfolioSpots,type PortfolioSpot} from './portfolioData'

const sections:Record<string,string>={
  clocktower:'experience','cloud-forge':'skills','data-tower':'projects',
  'learning-lab':'learning','about-cottage':'about','hobbies-hut':'hobbies','signal-station':'contact',
}
export function sectionHref(spot:PortfolioSpot){return `#${sections[spot.id]}`}
export function projectHref(id:string){return `#project-${id}`}
export function selectionForHash(hash:string):{spot:PortfolioSpot|null;projectId:string|null}{
  const spot=portfolioSpots.find(item=>sectionHref(item)===hash||`#${item.id}`===hash)
  if(spot)return{spot,projectId:null}
  const projects=portfolioSpots.find(item=>item.id==='data-tower')!
  const project=projects.entries.find(entry=>entry.id&&projectHref(entry.id)===hash)
  return{spot:project?projects:null,projectId:project?.id??null}
}

/** Uses fragment links so shared sections also work on static GitHub Pages. */
export function navigatePortfolio(hash:string){
  if(window.location.hash===hash)return
  window.history.pushState(window.history.state,'',`${window.location.pathname}${window.location.search}${hash}`)
  window.dispatchEvent(new Event('coastlight:navigate'))
}
