import { MODES, SKINS, THEMES, POWERUPS } from './config.js';
import { formatNumber, segmentsForMass, displayText, rewardedAdCompleted } from './logic.js';
import { claimDaily, saveData, localDayKey } from './storage.js';
import { MISSIONS } from './missions.js';
import { ACHIEVEMENTS } from './achievements.js';
import { purchaseSkin, purchaseTheme } from './shop.js';
import { getPowerupTimeLeft } from './powerups.js';

const $ = id => document.getElementById(id);
export class UI {
  constructor({save,game,audio,onStart,onPause,onResume,onQuit,onRestart,onContinue}){
    this.save=save;this.game=game;this.audio=audio;this.onStart=onStart;this.onPause=onPause;this.onResume=onResume;this.onQuit=onQuit;this.onRestart=onRestart;this.onContinue=onContinue;this.selectedMode='classic';this.noticeTimer=0;this.bind();this.refreshProfile();
  }
  bind(){
    document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>{this.audio.click();this.showPanel(btn.dataset.view);}));
    $('play-button').addEventListener('click',()=>{this.audio.unlock();this.audio.click();this.onStart(this.selectedMode);});
    $('panel-close').addEventListener('click',()=>this.closePanel());
    $('pause-button').addEventListener('click',()=>this.pause());
    $('resume-button').addEventListener('click',()=>{this.audio.click();this.onResume();$('pause-screen').classList.add('hidden');});
    $('quit-button').addEventListener('click',()=>{this.audio.click();$('pause-screen').classList.add('hidden');this.onQuit();});
    $('restart-button').addEventListener('click',()=>{this.audio.click();$('gameover-screen').classList.add('hidden');this.onRestart();});
    $('continue-ad-button').addEventListener('click',()=>this.continueWithRewardedAd());
    $('gameover-menu').addEventListener('click',()=>{$('gameover-screen').classList.add('hidden');this.onQuit();});
    $('menu-sound').addEventListener('click',()=>{this.save.settings.sound=!this.save.settings.sound;this.audio.setEnabled(this.save.settings.sound);$('menu-sound').textContent=this.save.settings.sound?'🔊':'🔇';saveData(this.save);});
  }
  refreshProfile(){
    $('menu-username').textContent=this.save.username||'Player';$('menu-coins').textContent=formatNumber(this.save.coins);$('menu-level').textContent=`LEVEL ${1+Math.floor(this.save.xp/500)}`;
  }
  openPanel(title,html){$('panel-title').textContent=title;$('panel-content').innerHTML=html;$('panel-screen').classList.remove('hidden');this.wirePanel();}
  closePanel(){$('panel-screen').classList.add('hidden');}
  showPanel(view){
    if(view==='modes')this.renderModes();
    if(view==='wardrobe')this.renderWardrobe();
    if(view==='shop')this.renderShop();
    if(view==='workshop')this.renderWorkshop();
    if(view==='missions')this.renderMissions();
    if(view==='daily')this.renderDaily();
    if(view==='achievements')this.renderAchievements();
    if(view==='leaderboard')this.renderLeaderboard();
    if(view==='profile')this.renderProfile();
    if(view==='settings')this.renderSettings();
  }
  renderModes(){
    const cards=MODES.map(m=>`<button class="mode-card ${this.selectedMode===m.id?'selected':''}" data-mode="${m.id}"><div class="mode-icon">${m.icon}</div><h3>${m.name}</h3><p>${m.desc}</p><div class="select-hint">${this.selectedMode===m.id?'✓ SELECTED':'TAP TO SELECT'}</div></button>`).join('');
    this.openPanel('GAME MODES',`<div class="mode-grid">${cards}</div><div class="panel-action"><button class="play-button" id="mode-start">▶ START ${MODES.find(m=>m.id===this.selectedMode).name.toUpperCase()}</button></div>`);
    $('mode-start').addEventListener('click',()=>{this.audio.click();this.closePanel();this.onStart(this.selectedMode);});
  }
  createSkinCard(s, action, label, selected=false){
    const card=document.createElement('div');
    card.className=`skin-card${selected?' selected':''}`;
    const preview=document.createElement('div');
    preview.className='skin-preview';
    // Keep palette values as rendering styles only; never print raw colour codes as UI text.
    preview.style.background=`linear-gradient(90deg, ${s.a}, ${s.b}, ${s.a})`;
    preview.setAttribute('role','img');
    preview.setAttribute('aria-label',`${s.name} colour preview`);
    const name=document.createElement('b');name.textContent=s.name;
    const detail=document.createElement('small');detail.textContent=label;
    const button=document.createElement('button');button.textContent=action;
    if(action==='BUY')button.dataset.buySkin=String(s.id);else button.dataset.skin=String(s.id);
    card.append(preview,name,detail,button);
    return card;
  }
  createThemeCard(t, mode='shop'){
    const owned=this.save.unlockedThemes.includes(t.id);
    if(mode==='workshop'){
      const button=document.createElement('button');
      button.className=`mode-card${this.save.selectedTheme===t.id?' selected':''}`;
      button.dataset.theme=t.id;
      const swatch=document.createElement('div');swatch.className='theme-preview';
      swatch.style.backgroundColor=t.bg;swatch.style.borderColor=t.grid;
      const name=document.createElement('h3');name.textContent=t.name;
      const status=document.createElement('p');status.textContent=owned?'Unlocked':'Unlock in Shop';
      button.append(swatch,name,status);return button;
    }
    const card=document.createElement('div');card.className='info-card';
    const swatch=document.createElement('div');swatch.className='theme-preview shop-theme-preview';
    swatch.style.backgroundColor=t.bg;swatch.style.borderColor=t.grid;
    const name=document.createElement('h3');name.textContent=t.name;
    const description=document.createElement('p');description.textContent='New arena atmosphere and grid palette.';
    const progress=document.createElement('div');progress.className='progress';
    const fill=document.createElement('span');fill.style.width=owned?'100%':'0%';progress.append(fill);
    const button=document.createElement('button');button.className='small-action';button.dataset.buyTheme=t.id;
    button.textContent=owned?'OWNED':`${formatNumber(t.price)} 🪙`;button.disabled=owned;
    card.append(swatch,name,description,progress,button);return card;
  }
  renderWardrobe(){
    this.openPanel('WORM WARDROBE','');
    const content=$('panel-content');
    const label=document.createElement('div');label.className='section-label';
    label.textContent=`${this.save.unlockedSkins.length} / ${SKINS.length} SKINS UNLOCKED · ${formatNumber(this.save.coins)} 🪙`;
    const grid=document.createElement('div');grid.className='skin-grid';
    SKINS.forEach(s=>{
      const owned=this.save.unlockedSkins.includes(s.id),selected=this.save.selectedSkin===s.id;
      grid.append(this.createSkinCard(s,selected?'EQUIPPED':owned?'EQUIP':'UNLOCK',owned?(selected?'EQUIPPED':'UNLOCKED'):`${formatNumber(s.price)} COINS`,selected));
    });
    content.replaceChildren(label,grid);this.wirePanel();
  }
  renderShop(){
    this.openPanel('GAMERKIE SHOP','');
    const content=$('panel-content');
    const balance=document.createElement('div');balance.className='section-label';balance.textContent=`YOUR BALANCE: ${formatNumber(this.save.coins)} 🪙`;
    const featuredLabel=document.createElement('div');featuredLabel.className='section-label';featuredLabel.textContent='FEATURED SKINS';
    const skinsGrid=document.createElement('div');skinsGrid.className='skin-grid';
    const availableSkins=SKINS.filter(s=>!this.save.unlockedSkins.includes(s.id)).slice(0,12);
    if(availableSkins.length){availableSkins.forEach(s=>skinsGrid.append(this.createSkinCard(s,'BUY',`${formatNumber(s.price)} COINS`)));}
    else{const empty=document.createElement('div');empty.className='info-card';empty.textContent='You own every featured skin. Nice collecting!';skinsGrid.append(empty);}
    const themeLabel=document.createElement('div');themeLabel.className='section-label';themeLabel.textContent='ARENA THEMES';themeLabel.style.marginTop='20px';
    const themesGrid=document.createElement('div');themesGrid.className='two-col';
    THEMES.forEach(t=>themesGrid.append(this.createThemeCard(t,'shop')));
    content.replaceChildren(balance,featuredLabel,skinsGrid,themeLabel,themesGrid);this.wirePanel();
  }
  renderWorkshop(){
    this.openPanel('WORKSHOP','');
    const content=$('panel-content');
    const themeLabel=document.createElement('div');themeLabel.className='section-label';themeLabel.textContent='ARENA THEME';
    const themesGrid=document.createElement('div');themesGrid.className='mode-grid';THEMES.forEach(t=>themesGrid.append(this.createThemeCard(t,'workshop')));
    const foodLabel=document.createElement('div');foodLabel.className='section-label';foodLabel.textContent='FOOD STYLE';foodLabel.style.marginTop='18px';
    const stylesGrid=document.createElement('div');stylesGrid.className='two-col';
    ['classic','sparkle','fruit party'].forEach(style=>{
      const button=document.createElement('button');button.className=`mode-card${this.save.workshop.foodStyle===style?' selected':''}`;button.dataset.foodStyle=style;
      const name=document.createElement('h3');name.textContent=style.toUpperCase();
      const description=document.createElement('p');description.textContent='Choose your food collection look.';
      button.append(name,description);stylesGrid.append(button);
    });
    const particleRow=document.createElement('div');particleRow.className='settings-row';
    const particleName=document.createElement('span');particleName.textContent='Particle effects';
    const toggle=document.createElement('button');toggle.className=`toggle${this.save.workshop.particles?' on':''}`;toggle.dataset.toggleWorkshop='particles';
    particleRow.append(particleName,toggle);
    const emojiRow=document.createElement('div');emojiRow.className='settings-row';
    const emojiLabel=document.createElement('span');emojiLabel.textContent='Worm emoji';
    const emojiSelect=document.createElement('select');emojiSelect.id='workshop-emoji';
    ['😎','😈','🤩','🥷','👑','🤠'].forEach(value=>{const option=document.createElement('option');option.textContent=value;emojiSelect.append(option);});
    emojiRow.append(emojiLabel,emojiSelect);
    content.replaceChildren(themeLabel,themesGrid,foodLabel,stylesGrid,particleRow,emojiRow);this.wirePanel();
    emojiSelect.value=this.save.workshop.emoji||'😎';emojiSelect.addEventListener('change',e=>{this.save.workshop.emoji=e.target.value;saveData(this.save);});
  }
  renderMissions(){
    const cards=MISSIONS.map(m=>{const progress=Math.min(m.target,Number(this.save.missions?.[m.id]||0));const done=progress>=m.target;return `<div class="info-card"><h3>${m.name} ${done?'✅':''}</h3><p>${m.desc}</p><div class="progress"><span style="width:${progress/m.target*100}%"></span></div><div style="display:flex;justify-content:space-between;font-size:10px;color:#6b8879;font-weight:900"><span>${formatNumber(progress)} / ${formatNumber(m.target)}</span><span>REWARD ${m.reward} 🪙</span></div></div>`;}).join('');
    this.openPanel('MISSIONS & QUESTS',`<div class="section-label">MATCH CHALLENGES · COMPLETE OBJECTIVES TO EARN COINS</div><div class="two-col">${cards}</div>`);
  }
  renderDaily(){
    const claimed=this.save.lastDailyClaim===localDayKey();
    const days=Array.from({length:14},(_,i)=>`<div class="reward-card" style="text-align:center"><div style="font-size:22px">${i+1===this.save.dailyStreak?'🎁':i%3===0?'💎':i%3===1?'🪙':'⭐'}</div><b style="font-size:12px">DAY ${i+1}</b><small style="display:block;color:#718b7b;font-size:9px">${60+(i+1)*20} COINS</small></div>`).join('');
    this.openPanel('DAILY REWARDS',`<div class="section-label">14-DAY REWARD STREAK · COME BACK EVERY DAY</div><div class="two-col">${days}</div><div class="panel-action"><button id="claim-daily" class="play-button" ${claimed?'disabled':''}>${claimed?'✓ TODAY CLAIMED':'🎁 CLAIM TODAY\'S REWARD'}</button></div>`);
  }
  renderAchievements(){
    const cards=ACHIEVEMENTS.map(a=>{const value=Number(this.save[a.key]||0),done=this.save.achievements.includes(a.id)||value>=a.goal;return `<div class="info-card"><h3>${a.icon} ${a.name} ${done?'✅':''}</h3><p>${a.desc}</p><div class="progress"><span style="width:${Math.min(100,value/a.goal*100)}%"></span></div><div style="font-size:10px;color:#6b8879;font-weight:900">${formatNumber(Math.min(a.goal,value))} / ${formatNumber(a.goal)} · ${a.reward} 🪙</div></div>`;}).join('');
    this.openPanel('ACHIEVEMENTS',`<div class="two-col">${cards}</div>`);
  }
  renderLeaderboard(){
    const rivals=(this.game.bots||[]).filter(b=>b.alive).map(b=>({name:b.name,score:b.score,mass:b.mass,player:false}));if(this.game.player)rivals.push({name:this.save.username,score:this.game.totalScore,mass:this.game.player.mass,player:true});rivals.sort((a,b)=>b.mass-a.mass);
    this.openPanel('ARENA LEADERBOARD',`<div class="info-card">${rivals.slice(0,20).map((r,i)=>`<div class="leader-row ${r.player?'me':''}" style="padding:7px 3px;border-bottom:1px solid #eef4ef"><span>${i+1}. ${r.player?'⭐ ':''}${r.name}</span><b>${formatNumber(r.score)}</b></div>`).join('')||'Play a match to populate the arena leaderboard.'}</div>`);
  }
  renderProfile(){
    this.openPanel('PLAYER PROFILE',`<div class="profile-strip"><div class="avatar">${this.save.workshop.emoji||'🐛'}</div><div class="profile-name"><b>${this.esc(this.save.username)}</b><small>LEVEL ${1+Math.floor(this.save.xp/500)} · ${formatNumber(this.save.xp)} XP</small></div></div><div class="two-col">${[['GAMES PLAYED',this.save.gamesPlayed],['BEST SCORE',formatNumber(this.save.bestScore)],['TOTAL FOOD',formatNumber(this.save.totalFood)],['RIVALS DEFEATED',this.save.totalKills],['LONGEST WORM',this.save.longestWorm],['BEST SURVIVAL',`${Math.floor(this.save.bestTime/60)}m ${Math.floor(this.save.bestTime%60)}s`],['TOTAL COINS',formatNumber(this.save.coins)],['TOTAL SCORE',formatNumber(this.save.totalScore)]].map(([k,v])=>`<div class="info-card"><p>${k}</p><h3>${v}</h3></div>`).join('')}</div>`);
  }
  renderSettings(){
    this.openPanel('SETTINGS',`<div class="settings-row"><span>Player username</span><input id="username-input" type="text" maxlength="16" value="${this.esc(this.save.username)}"></div><div class="settings-row"><span>Sound effects</span><button class="toggle ${this.save.settings.sound?'on':''}" data-setting="sound"></button></div><div class="settings-row"><span>Background music</span><button class="toggle ${this.save.settings.music?'on':''}" data-setting="music"></button></div><div class="settings-row"><span>Mobile controls</span><b style="font-size:11px;color:#168b5e">LEFT: STEER · RIGHT: BOOST</b></div><div class="settings-row"><span>Graphics quality</span><select id="quality-select"><option value="auto">Auto</option><option value="high">High</option><option value="low">Low</option></select></div><div class="panel-action"><button id="save-settings" class="play-button">SAVE SETTINGS</button></div><p style="font-size:10px;color:#7a9485">Progress is saved on this browser and device. Offline profile does not sync between devices.</p>`);
    $('quality-select').value=this.save.settings.quality||'auto';
  }
  wirePanel(){
    $('panel-content').querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{this.selectedMode=b.dataset.mode;this.renderModes();}));
    $('panel-content').querySelectorAll('[data-skin]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.skin),s=SKINS[id];const result=purchaseSkin(this.save,s);if(result==='insufficient'){this.toast('Not enough coins yet!');return;}this.game.player&&(this.game.player.skin=s);saveData(this.save);this.refreshProfile();this.renderWardrobe();}));
    $('panel-content').querySelectorAll('[data-buy-skin]').forEach(b=>b.addEventListener('click',()=>{const id=Number(b.dataset.buySkin),s=SKINS[id];if(this.save.coins<s.price){this.toast('Not enough coins yet!');return;}this.save.coins-=s.price;this.save.unlockedSkins.push(id);saveData(this.save);this.refreshProfile();this.renderShop();}));
    $('panel-content').querySelectorAll('[data-buy-theme]').forEach(b=>b.addEventListener('click',()=>{const t=THEMES.find(x=>x.id===b.dataset.buyTheme);if(!t){return;}const result=purchaseTheme(this.save,t);if(result==='insufficient'){this.toast('Not enough coins yet!');return;}saveData(this.save);this.refreshProfile();this.renderShop();}));
    $('panel-content').querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{const id=b.dataset.theme;if(!this.save.unlockedThemes.includes(id)){this.toast('Unlock this theme in the shop first.');return;}this.save.selectedTheme=id;saveData(this.save);this.renderWorkshop();}));
    $('panel-content').querySelectorAll('[data-food-style]').forEach(b=>b.addEventListener('click',()=>{this.save.workshop.foodStyle=b.dataset.foodStyle;saveData(this.save);this.renderWorkshop();}));
    $('panel-content').querySelectorAll('[data-toggle-workshop]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.toggleWorkshop;this.save.workshop[key]=!this.save.workshop[key];saveData(this.save);this.renderWorkshop();}));
    $('panel-content').querySelectorAll('[data-setting]').forEach(b=>b.addEventListener('click',()=>{const key=b.dataset.setting;this.save.settings[key]=!this.save.settings[key];if(key==='sound')this.audio.setEnabled(this.save.settings.sound);if(key==='music')this.audio.setMusic(this.save.settings.music);saveData(this.save);this.renderSettings();}));
    const claim=$('claim-daily');if(claim)claim.addEventListener('click',()=>{const result=claimDaily(this.save);if(result.ok){this.refreshProfile();this.renderDaily();this.toast(`DAY ${result.reward.day}: +${result.reward.coins} COINS +${result.reward.xp} XP`);this.audio.power();}else this.toast('Come back tomorrow for your next reward.');});
    const saveSettings=$('save-settings');if(saveSettings)saveSettings.addEventListener('click',()=>{const name=$('username-input').value.trim().slice(0,16);this.save.username=name||'Player';this.save.settings.quality=$('quality-select').value;saveData(this.save);this.game.player&&(this.game.player.name=this.save.username);this.refreshProfile();this.renderSettings();this.toast('Settings saved!');});
  }
  updateHUD(stats){
    $('hud-score').textContent=formatNumber(stats.score);
    $('hud-length').textContent=formatNumber(stats.length);
    $('hud-rank').textContent=stats.rank;
    $('hud-time').textContent=stats.mode==='time'?`${Math.floor(stats.timeLeft/60)}:${String(Math.floor(stats.timeLeft%60)).padStart(2,'0')}`:`${Math.floor(stats.time/60)}:${String(Math.floor(stats.time%60)).padStart(2,'0')}`;
    $('hud-coins').textContent=formatNumber(stats.coins||0);
    $('hud-gems').textContent=formatNumber(stats.gems||0);
    this.drawMinimap();
    this.drawLiveScores();
    this.drawPowerupTimers(stats.powerups||{});
  }
  drawLiveScores(){
    const list=$('live-score-list');
    if(!list||!this.game.player)return;
    const oldScroll=list.scrollTop;
    const entries=this.game.bots.filter(b=>b.alive).map(b=>({name:b.name,score:b.score||Math.round(b.mass*2),mass:b.mass,player:false,skin:b.skin}));
    entries.push({name:this.save.username||'Player',score:this.game.totalScore,mass:this.game.player.mass,player:true,skin:this.game.player.skin});
    entries.sort((a,b)=>b.mass-a.mass);
    $('live-player-count').textContent=String(entries.length);
    const fragment=document.createDocumentFragment();
    entries.forEach((entry,index)=>{
      const row=document.createElement('div');row.className=`live-score-row${entry.player?' me':''}`;
      const rank=document.createElement('span');rank.className='live-rank';rank.textContent=String(index+1);
      const dot=document.createElement('i');dot.className='live-dot';dot.style.backgroundColor=entry.skin?.a||'#ffe16e';
      const name=document.createElement('span');name.className='live-name';name.textContent=entry.player?`★ ${entry.name}`:entry.name;
      const score=document.createElement('b');score.className='live-score';score.textContent=formatNumber(entry.score);
      row.append(rank,dot,name,score);fragment.append(row);
    });
    list.replaceChildren(fragment);
    list.scrollTop=oldScroll;
  }
  drawPowerupTimers(powerups){
    const powerHud=$('powerup-hud');
    const active=Object.entries(powerups).map(([id,expiry])=>({id,expiry,seconds:getPowerupTimeLeft(expiry,this.game.elapsed)})).filter(item=>item.seconds>0);
    powerHud.replaceChildren();
    for(const item of active){
      const power=POWERUPS.find(candidate=>candidate.id===item.id);
      if(!power)continue;
      const badge=document.createElement('div');badge.className='power-badge';badge.setAttribute('aria-label',`${displayText(power.name)}, ${item.seconds} seconds remaining`);
      const icon=document.createElement('span');icon.className='power-icon';icon.textContent=displayText(power.icon);
      const name=document.createElement('b');name.className='power-name';name.textContent=displayText(power.name);
      const timer=document.createElement('strong');timer.className='power-time';timer.textContent=`${item.seconds}s`;
      const track=document.createElement('span');track.className='power-timer-track';
      const fill=document.createElement('i');fill.style.width=`${Math.max(0,Math.min(100,item.seconds/(power.duration/1000)*100))}%`;
      track.append(fill);badge.append(icon,name,timer,track);powerHud.append(badge);
    }
  }
  drawMinimap(){
    const canvas=$('mini-map');if(!canvas||!this.game.player)return;const ctx=canvas.getContext('2d');const w=canvas.width,h=canvas.height;
    ctx.clearRect(0,0,w,h);ctx.fillStyle='rgba(122,190,92,.96)';ctx.fillRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,255,255,.2)';ctx.lineWidth=1;for(let x=0;x<=w;x+=32){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<=h;y+=28){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.strokeStyle='rgba(255,240,120,.95)';ctx.lineWidth=2;ctx.strokeRect(1,1,w-2,h-2);
    const px=this.game.player.x/3200*w,py=this.game.player.y/2400*h;
    for(const bot of this.game.bots){if(!bot.alive)continue;const r=Math.max(1.8,Math.min(4,bot.r*.16));ctx.beginPath();ctx.arc(bot.x/3200*w,bot.y/2400*h,r,0,Math.PI*2);ctx.fillStyle=bot.skin.a;ctx.fill();}
    ctx.beginPath();ctx.arc(px,py,4.3,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#087b51';ctx.stroke();
  }
  showGameOver(summary){
    const reason=summary.reason==='victory'?'ARENA CHAMPION!':summary.reason==='time'?'TIME UP!':summary.reason==='wall'?'ARENA BOUNDARY!':'WORM DOWN!';$('gameover-title').textContent=reason;$('gameover-subtitle').textContent=summary.reason==='victory'?'You outlasted every rival worm!':'That was a wild run. Ready for another?';
    $('gameover-stats').innerHTML=[['FINAL SCORE',formatNumber(summary.score)],['WORM LENGTH',formatNumber(summary.length)],['SURVIVAL TIME',`${Math.floor(summary.time/60)}m ${Math.floor(summary.time%60)}s`],['RIVALS DEFEATED',summary.kills],['FOOD COLLECTED',summary.food],['COINS EARNED',`+${summary.coins}`]].map(([k,v])=>`<div class="result-cell"><small>${k}</small><b>${v}</b></div>`).join('');
    $('continue-ad-button').classList.toggle('hidden',!['collision','wall','arena'].includes(summary.reason));
    $('gameover-screen').classList.remove('hidden');this.refreshProfile();
  }
  async continueWithRewardedAd(){
    const button=$('continue-ad-button');
    const showRewardedAd=window.gamerkieShowRewardedAd;
    if(typeof showRewardedAd!=='function'){
      this.toast('Rewarded ad service is not connected yet.');
      return;
    }
    const original=button.textContent;button.disabled=true;button.textContent='WAITING FOR REWARDED AD…';
    try{
      const result=await showRewardedAd({placement:'worm-revive',reward:'continue'});
      if(rewardedAdCompleted(result)&&this.onContinue?.()){
        $('gameover-screen').classList.add('hidden');
      }else{
        this.toast('Watch the full ad to earn a continue.');
      }
    }catch(error){
      this.toast('Ad could not be completed. Try again.');
    }finally{
      button.disabled=false;button.textContent=original;
    }
  }
  pause(){this.audio.click();this.onPause();$('pause-screen').classList.remove('hidden');}
  toast(message){const el=$('mobile-toast');el.textContent=message;el.classList.add('show');clearTimeout(this.noticeTimer);this.noticeTimer=setTimeout(()=>el.classList.remove('show'),2200);}
  notice(message){const el=$('notice');el.textContent=message;el.classList.add('show');clearTimeout(this.noticeTimer);this.noticeTimer=setTimeout(()=>el.classList.remove('show'),1200);}
  applyProgress(summary){
    for(const m of MISSIONS){let v=summary[m.key]||0;this.save.missions[m.id]=Math.max(Number(this.save.missions[m.id]||0),Math.min(m.target,v));if(this.save.missions[m.id]>=m.target&&!this.save.missionPaid?.includes(m.id)){this.save.coins+=m.reward;this.save.missionPaid=[...(this.save.missionPaid||[]),m.id];}}
    for(const a of ACHIEVEMENTS){if(!this.save.achievements.includes(a.id)&&Number(this.save[a.key]||0)>=a.goal){this.save.achievements.push(a.id);this.save.coins+=a.reward;this.toast(`${a.name} achievement unlocked! +${a.reward} coins`);}}
    saveData(this.save);this.refreshProfile();
  }
  esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
}

