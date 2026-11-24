import { Game } from './game.js';
import { UI } from './ui.js';
import { Controls } from './controls.js';
import { AudioManager } from './audio.js';
import { loadSave, saveData } from './storage.js';

const $=id=>document.getElementById(id);
const save=loadSave();
const audio=new AudioManager();audio.setEnabled(save.settings.sound);audio.setMusic(save.settings.music);
let ui;
const game=new Game($('game-canvas'),{
  onUpdate:stats=>ui?.updateHUD(stats),
  onNotice:message=>{ui?.notice(message);},
  onSound:type=>{if(type==='collect')audio.collect();if(type==='power')audio.power();},
  onGameOver:summary=>{
    if(summary.reason==='victory')audio.power();else audio.death();
    ui.showGameOver(summary);
  }
});
ui=new UI({save,game,audio,
  onStart:mode=>startGame(mode),
  onPause:()=>{game.pause();},
  onResume:()=>game.resume(),
  onQuit:()=>{finalizeCurrentRun();showMenu();},
  onRestart:()=>startGame(game.mode),
  onContinue:()=>game.continueAfterReward()
});
new Controls({canvas:$('game-canvas'),game,touchStick:$('touch-stick')});

// Progressive Web App installation: open the browser's native install confirmation.
let pendingInstallPrompt = null;
const installButton = $('install-app-button');
const isStandaloneApp = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isEmbeddedGame = () => window.self !== window.top;
function syncInstallButton(){
  if(!installButton)return;
  if(isStandaloneApp()){
    installButton.textContent='✓ APP INSTALLED';installButton.classList.add('installed');installButton.disabled=true;
  }else{
    installButton.disabled=isEmbeddedGame()?false:!pendingInstallPrompt;
  }
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();pendingInstallPrompt=event;
  if(installButton){installButton.textContent='⬇ INSTALL APP';installButton.disabled=false;}
});
window.addEventListener('appinstalled',()=>{
  pendingInstallPrompt=null;syncInstallButton();ui?.toast('WORMS BATTLE installed successfully!');
});
installButton?.addEventListener('click',async()=>{
  if(isStandaloneApp()){syncInstallButton();return;}
  // A PWA install prompt belongs to its top-level page, not a cross-origin XML/Blogger iframe.
  if(isEmbeddedGame()) {
    window.open(new URL('./', window.location.href).href, '_blank', 'noopener,noreferrer');
    return;
  }
  const promptEvent=pendingInstallPrompt;
  if(!promptEvent)return;
  pendingInstallPrompt=null;
  installButton.disabled=true;
  try{
    const result=await promptEvent.prompt();
    const outcome=result?.outcome||(await promptEvent.userChoice?.then(choice=>choice?.outcome).catch(()=>''));
    if(outcome==='accepted'){
      installButton.textContent='INSTALLING…';
    }else{
      installButton.disabled=false;
    }
  }catch(error){
    console.warn('The browser install prompt could not be opened:',error);
    installButton.disabled=false;
  }
});
if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
  window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(error=>console.warn('Offline install support unavailable:',error)));
}
syncInstallButton();

function finalizeCurrentRun(){
  const summary=game.finalizeRun();
  if(summary)ui?.applyProgress(summary);
  if(summary)saveData(save);
}
async function startGame(mode='classic'){
  finalizeCurrentRun();
  const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||window.matchMedia('(pointer: coarse)').matches;
  if(mobile&&!document.fullscreenElement){
    try{await $('app').requestFullscreen?.();}catch{}
    try{await screen.orientation?.lock?.('landscape');}catch{}
  }
  $('menu-screen').classList.remove('active');$('panel-screen').classList.add('hidden');$('pause-screen').classList.add('hidden');$('gameover-screen').classList.add('hidden');$('game-hud').classList.remove('hidden');
  syncViewport();
  game.start(mode,save);
  updateOrientationPrompt();
}
function showMenu(){
  finalizeCurrentRun();
  game.state='menu';game.player=null;game.bots=[];game.boost=false;
  $('game-hud').classList.add('hidden');$('pause-screen').classList.add('hidden');$('gameover-screen').classList.add('hidden');$('panel-screen').classList.add('hidden');$('menu-screen').classList.add('active');
  ui.refreshProfile();saveData(save);
}
window.addEventListener('keydown',e=>{if(e.key==='Escape'){if(game.state==='playing')ui.pause();else if(game.state==='paused'){$('pause-screen').classList.add('hidden');game.resume();}}});
window.addEventListener('beforeunload',()=>{finalizeCurrentRun();saveData(save);});
function syncViewport(){
  const viewport=window.visualViewport;
  const fullscreen=Boolean(document.fullscreenElement);
  const width=Math.round(fullscreen?window.innerWidth:(viewport?.width||window.innerWidth));
  const height=Math.round(fullscreen?window.innerHeight:(viewport?.height||window.innerHeight));
  document.documentElement.style.setProperty('--app-width',`${width}px`);
  document.documentElement.style.setProperty('--app-height',`${height}px`);
  requestAnimationFrame(()=>game.resize());
}
function updateOrientationPrompt(){
  const mobile=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||window.matchMedia('(pointer: coarse)').matches;
  const portrait=window.matchMedia('(orientation: portrait)').matches;
  $('rotate-overlay').classList.toggle('hidden',!mobile||!portrait||!['playing','paused'].includes(game.state));
}
$('rotate-continue').addEventListener('click',()=>{$('rotate-overlay').classList.add('hidden');});
syncViewport();
window.addEventListener('orientationchange',()=>setTimeout(()=>{syncViewport();updateOrientationPrompt();},220));
window.addEventListener('resize',()=>{syncViewport();updateOrientationPrompt();});
window.addEventListener('fullscreenchange',()=>{syncViewport();updateOrientationPrompt();});
window.visualViewport?.addEventListener('resize',()=>{syncViewport();updateOrientationPrompt();});
