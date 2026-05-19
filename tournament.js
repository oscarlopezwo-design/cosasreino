// Simple single-elimination tournament app supporting any number of players
(function(){
  const state = {players:[], rounds:[]};

  const els = {
    playerName: document.getElementById('playerName'),
    addBtn: document.getElementById('addBtn'),
    generateBtn: document.getElementById('generateBtn'),
    exportBtn: document.getElementById('exportBtn'),
    resetBtn: document.getElementById('resetBtn'),
    playersList: document.getElementById('playersList'),
    rounds: document.getElementById('rounds'),
  };

  function renderPlayers(){
    els.playersList.innerHTML = '';
    state.players.forEach((p, i)=>{
      const li = document.createElement('li');
      li.textContent = p;
      const span = document.createElement('span'); span.textContent = p;
      const rem = document.createElement('button');
      rem.textContent = '✕';
      rem.className = 'btn btn-secondary';
      rem.style.padding = '6px 10px';
      rem.onclick = ()=>{ state.players.splice(i,1); renderPlayers(); };
      li.appendChild(rem);
      li.insertBefore(span, rem);
      els.playersList.appendChild(li);
    });
  }

  function shuffle(a){
    for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
    return a;
  }

  function createRoundFromPlayers(players){
    const matches = [];
    for(let i=0;i<players.length;i+=2){
      const a = players[i];
      const b = (i+1<players.length)?players[i+1]:null;
      matches.push({a,b,winner:null});
    }
    return matches;
  }

  function generateBracket(){
    if(state.players.length<1) return alert('Add at least one player');
    const seeded = shuffle(state.players.slice());
    state.rounds = [];
    state.rounds.push(createRoundFromPlayers(seeded));
    // compute number of rounds needed
    let remaining = Math.ceil(seeded.length/2);
    while(remaining>1){
      const placeholder = Array.from({length:remaining}).map(()=>({a:null,b:null,winner:null}));
      state.rounds.push(placeholder);
      remaining = Math.ceil(remaining/2);
    }
    // auto-advance byes in round 0
    state.rounds[0].forEach((m,idx)=>{ if(m.b===null){ m.winner=m.a; placeWinner(0,idx,m.a); } });
    renderRounds();
  }

  function placeWinner(roundIdx, matchIdx, winner){
    const next = roundIdx+1;
    if(next>=state.rounds.length) return; // final winner
    const targetMatch = Math.floor(matchIdx/2);
    const slot = (matchIdx%2===0)?'a':'b';
    const dest = state.rounds[next][targetMatch];
    dest[slot] = winner;
    // if dest.b===null (bye) auto-advance
    if(dest.a && dest.b===null){ dest.winner = dest.a; placeWinner(next,targetMatch,dest.a); }
  }

  function selectWinner(roundIdx, matchIdx, choice){
    const match = state.rounds[roundIdx][matchIdx];
    match.winner = choice;
    placeWinner(roundIdx, matchIdx, choice);
    renderRounds();
  }

  function renderRounds(){
    els.rounds.innerHTML = '';
    state.rounds.forEach((round, rIdx)=>{
      const col = document.createElement('div'); col.className='round';
      const h = document.createElement('h4'); h.textContent = (rIdx===state.rounds.length-1)?'Final':'Round '+(rIdx+1);
      col.appendChild(h);
      round.forEach((m,i)=>{
        const d = document.createElement('div'); d.className='match';
        const a = document.createElement('div'); a.textContent = m.a || '—';
        const b = document.createElement('div'); b.textContent = m.b || (m.b===null? 'BYE' : '—');
        d.appendChild(a); d.appendChild(b);
        if(m.winner){ const w = document.createElement('div'); w.className='winner'; w.textContent='Winner: '+m.winner; d.appendChild(w);} 
        else if(m.a && m.b){
          const c = document.createElement('div'); c.className='controls';
          const ba = document.createElement('button'); ba.textContent = 'Select '+m.a; ba.className='btn btn-primary'; ba.onclick = ()=>selectWinner(rIdx,i,m.a);
          const bb = document.createElement('button'); bb.textContent = 'Select '+m.b; bb.className='btn btn-secondary'; bb.style.marginLeft='8px'; bb.onclick = ()=>selectWinner(rIdx,i,m.b);
          c.appendChild(ba); c.appendChild(bb); d.appendChild(c);
        }
        col.appendChild(d);
      });
      els.rounds.appendChild(col);
    });
  }

  function escapeCsvCell(v){
    if(v===null||v===undefined) return '';
    const s = String(v);
    if(s.indexOf(',')>=0 || s.indexOf('"')>=0 || s.indexOf('\n')>=0){
      return '"'+s.replace(/"/g,'""')+'"';
    }
    return s;
  }

  function exportCSV(){
    if(!state.rounds || state.rounds.length===0) return alert('No bracket to export');
    const rows = [];
    rows.push(['Round','Match','Player A','Player B','Winner']);
    state.rounds.forEach((round, rIdx)=>{
      const roundLabel = (rIdx===state.rounds.length-1)?'Final':'Round '+(rIdx+1);
      round.forEach((m,i)=>{
        rows.push([roundLabel, i+1, m.a||'', m.b||'', m.winner||'']);
      });
    });
    const csv = rows.map(r=>r.map(escapeCsvCell).join(',')).join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const filename = `tournament-results-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}.csv`;
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  // wire events
  els.addBtn.onclick = ()=>{
    const v = els.playerName.value.trim(); if(!v) return; state.players.push(v); els.playerName.value=''; renderPlayers();
  };
  els.generateBtn.onclick = generateBracket;
  els.exportBtn.onclick = exportCSV;
  els.resetBtn.onclick = ()=>{ state.players=[]; state.rounds=[]; renderPlayers(); renderRounds(); };

  // expose for quick debugging
  window.Tournament = {state, generateBracket, selectWinner};

})();
