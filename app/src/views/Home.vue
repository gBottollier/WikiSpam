<script setup>
import { RouterLink } from 'vue-router'
import { asset } from '../lib/assets.js'

const projects = [
  { to: '/chronologie', title: '📜 Histoire du Royaume', desc: 'La chronologie détaillée des grandes ères et des événements majeurs.' },
  { to: '/personnage', title: '🌙 Les Divinités', desc: 'Les entités qui influencent le destin du monde et ses habitants.' },
  { to: '/carte', title: '🗺️ Cartes et Lieux', desc: 'Une exploration des terres, royaumes et mystères anciens.' },
]

const team = [
  { name: '@AncestralZ', role: "L'Architecte", img: 'AncestralZ' },
  { name: '@Bisdea', role: 'Le Conteur', img: 'Aonoa' },
  { name: '@Blacotte', role: "L'archiviste", img: 'Blacotte' },
  { name: '@Chelonia', role: "L'Aède", img: 'Chelonia' },
  { name: '@ERY', role: 'Le Naturaliste', img: 'ERY' },
  { name: '@Pycsou', role: "L'Explorateur", img: 'Pycsou' },
  { name: '@Zango', role: 'Le Cartographe', img: 'Zango' },
]

const socialIcons = {
  instagram: 'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.0555 1.6884.0688 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.0555-1.281.0688-1.6898.0627-4.948-.0062-3.2583-.0207-3.6668-.0814-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.3169.9905 20.6481.581 19.8557.2762 19.0925-.0195 18.2199-.0208 16.9424.0347 15.665.0902 15.2542.1355 12.001.1414c-3.2555.0059-3.6598.0128-4.9709.0642zm.144 21.6858c-1.17-.0508-1.8055-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.4219-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.4229-.1651 1.0575-.3614 2.2271-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.2452 1.8055-.408 2.2286-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608zM16.153 5.5864c0 .794.6437 1.4396 1.4381 1.4396.7943 0 1.4381-.6456 1.4381-1.4396 0-.7942-.6438-1.438-1.4381-1.438-.7944 0-1.4381.6438-1.4381 1.438zM5.8386 12.0122c.0006 3.4046 2.7635 6.1637 6.168 6.1631 3.4044-.0006 6.1648-2.7631 6.1642-6.1677-.0006-3.4046-2.7639-6.1648-6.1685-6.1642-3.4046.0006-6.1643 2.7642-6.1637 6.1688zM8 12.0089c-.0004-2.2094 1.7897-4.0007 3.999-4.0011 2.2092-.0004 4.0007 1.7896 4.0011 3.999.0004 2.2095-1.7896 4.0007-3.999 4.0011-2.2093.0004-4.0007-1.7893-4.0011-3.999z',
  artstation: 'M0 17.723l2.027 3.505h.001a2.424 2.424 0 0 0 2.164 1.333h13.457l-2.792-4.838H0zm24 .025c0-.484-.143-.935-.388-1.314L15.728 2.728a2.424 2.424 0 0 0-2.142-1.289H9.419L21.598 22.54l1.92-3.325c.378-.637.482-.919.482-1.467zm-11.129-3.462L7.428 4.858l-5.444 9.428h10.887z',
  twitch: 'M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z',
  x: 'M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z',
  web: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2s.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 7.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2s.07-1.35.16-2h4.68c.09.65.16 1.32.16 2s-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2s-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z',
}

const mapper = {
  name: 'Embers',
  img: 'embers',
  links: [
    { type: 'instagram', url: 'https://www.instagram.com/salty_embers/' },
    { type: 'twitch', url: 'https://www.twitch.tv/salty_embers' },
  ],
}

const illustrators = [
  { name: 'Embers', img: 'embers', links: [{ type: 'instagram', url: 'https://www.instagram.com/salty_embers/' }, { type: 'twitch', url: 'https://www.twitch.tv/salty_embers' }] },
  { name: 'Nao', img: 'nao', links: [{ type: 'artstation', url: 'https://www.artstation.com/noadumas' }] },
  { name: 'Daerun', img: 'daerun', links: [{ type: 'artstation', url: 'https://www.artstation.com/daerun' }, { type: 'instagram', url: 'https://www.instagram.com/daerun_/' }] },
  { name: 'Atto', img: 'atto', links: [{ type: 'web', url: 'https://linktr.ee/atto_wnd' }] },
  { name: 'Saki', img: 'saki', links: [{ type: 'instagram', url: 'https://www.instagram.com/frozen.redemption/' }, { type: 'web', url: 'https://sakiga.carrd.co/' }] },
  { name: 'Lugalabdubur', img: 'lugalabdubur', links: [] },
  { name: 'Euphy', img: 'euphy', links: [{ type: 'artstation', url: 'https://www.artstation.com/euphyart' }, { type: 'x', url: 'https://x.com/ArtEuphy' }, { type: 'web', url: 'https://euphy.carrd.co/' }] },
  { name: 'Takoo', img: 'takoo', links: [{ type: 'instagram', url: 'https://www.instagram.com/takoo.real/' }, { type: 'x', url: 'https://x.com/Takoo_real' }, { type: 'web', url: 'https://avely.me/takoo' }] },
  { name: 'Trinity', img: 'trinity', links: [] },
  { name: 'La Lune Rouge', links: [{ type: 'instagram', url: 'https://www.instagram.com/thelunerouge' }] },
  { name: 'San', img: 'san', links: [{ type: 'instagram', url: 'https://www.instagram.com/vincent__ricci/' }, { type: 'artstation', url: 'https://www.artstation.com/vincent_ricci' }] },
  { name: 'Nenaosu', img: 'nenaosu', links: [{ type: 'artstation', url: 'https://www.artstation.com/nenaosuart' }, { type: 'instagram', url: 'https://www.instagram.com/nenaosuart/' }, { type: 'x', url: 'https://x.com/nenaosu' }] },
]
</script>

<template>
  <div class="team-lore">
    <section class="intro">
      <h1>Team Lore</h1>
      <p>
        Nous sommes les gardiens du récit et de l'univers de SPAM. Notre mission :
        tisser les histoires, légendes et chronologies qui donnent vie à ce monde.
        De la mythologie fondatrice aux intrigues les plus sombres, nous sculptons
        le cœur narratif du projet.
      </p>
    </section>

    <section class="projects">
      <h2>Nos Travaux</h2>
      <div class="project-grid">
        <RouterLink v-for="p in projects" :key="p.to" class="project-card" :to="p.to">
          <h3>{{ p.title }}</h3>
          <p>{{ p.desc }}</p>
        </RouterLink>
      </div>
    </section>

    <section class="team">
      <h2>Notre Équipe</h2>
      <div class="member-grid">
        <div v-for="m in team" :key="m.name" class="member-card">
          <img :src="asset(`img/avatar/${m.img}.webp`)" :alt="m.name" loading="lazy">
          <div class="member-info">
            <h3>{{ m.name }}</h3>
          </div>
        </div>
      </div>
    </section>

    <section class="credits">
      <h2>🎨 Illustrations</h2>

      <p class="credit-group-label">Cartographie</p>
      <div class="illus-grid">
        <div class="illus-card">
          <span class="avatar">
            <img v-if="mapper.img" :src="asset(`img/illus/${mapper.img}.webp`)" :alt="mapper.name" loading="lazy">
            <svg v-else class="avatar-default" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </span>
          <span class="illus-name">{{ mapper.name }}</span>
          <span class="illus-links">
            <a
              v-for="l in mapper.links"
              :key="l.url"
              class="social"
              :href="l.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${mapper.name} sur ${l.type}`"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path :d="socialIcons[l.type]" /></svg>
            </a>
          </span>
        </div>
      </div>

      <p class="credit-group-label">Illustrateurs des cartes</p>
      <div class="illus-grid">
        <div v-for="a in illustrators" :key="a.name" class="illus-card">
          <span class="avatar">
            <img v-if="a.img" :src="asset(`img/illus/${a.img}.webp`)" :alt="a.name" loading="lazy">
            <svg v-else class="avatar-default" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
          </span>
          <span class="illus-name">{{ a.name }}</span>
          <span v-if="a.links.length" class="illus-links">
            <a
              v-for="l in a.links"
              :key="l.url"
              class="social"
              :href="l.url"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="`${a.name} sur ${l.type}`"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path :d="socialIcons[l.type]" /></svg>
            </a>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.team-lore {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 80px;
  padding: 100px 10%;
}
.team-lore section {
  width: 100%;
  max-width: 1200px;
  background: var(--bg-dark);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  box-shadow: 0 0 24px rgba(126, 63, 242, 0.3);
  padding: 40px 60px;
  text-align: center;
}
.intro h1 { font-size: 2.8rem; text-shadow: 0 0 12px var(--accent-bright); }
.intro p { font-size: 1.1rem; color: var(--text); line-height: 1.7; }

.projects h2, .team h2 {
  font-size: 2rem;
  text-shadow: 0 0 10px var(--accent);
  margin-bottom: 40px;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}
.project-card {
  display: block;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 25px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}
.project-card:hover,
.project-card:active {
  transform: translateY(-5px);
  box-shadow: 0 0 18px rgba(0, 180, 255, 0.4);
  border-color: rgba(0, 180, 255, 0.5);
}
.project-card h3 { color: var(--accent); }
.project-card p { color: var(--text); }

.member-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 40px;
  justify-items: center;
}
.member-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 18px;
  padding: 25px;
  transition: all 0.3s ease;
  width: 100%;
}
.member-card:hover { transform: translateY(-5px); box-shadow: 0 0 18px rgba(126, 63, 242, 0.4); }
.member-card img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--accent);
}
.member-card h3 { color: var(--accent); font-size: 1.2rem; margin: 0; }
.member-card p { color: #b9dfff; font-size: 0.9rem; margin: 4px 0 0; }

/* ---------- Credits: cartography + illustrators ---------- */
.credits h2 {
  font-size: 2rem;
  text-shadow: 0 0 10px var(--accent);
  margin-bottom: 24px;
}
.credit-group-label {
  color: #9fc4ec;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-size: 0.8rem;
  font-weight: 700;
  margin: 28px 0 16px;
}
.credit-group-label:first-of-type { margin-top: 0; }

.illus-grid { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; }
.illus-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 140px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 18px 14px;
  transition: all 0.25s ease;
}
.illus-card:hover { transform: translateY(-4px); box-shadow: 0 0 16px rgba(126, 63, 242, 0.4); }
.avatar {
  width: 72px; height: 72px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(126, 63, 242, 0.15);
  flex-shrink: 0;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar-default { width: 56%; height: 56%; fill: #9fc4ec; opacity: 0.85; }
.illus-name { color: var(--accent); font-weight: 600; text-align: center; }
.illus-links { display: inline-flex; gap: 8px; }
.social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 50%;
  color: #b9dfff;
  border: 1px solid var(--glass-border);
  background: rgba(255, 255, 255, 0.04);
  transition: all 0.25s ease;
}
.social:hover {
  color: #fff;
  border-color: rgba(0, 180, 255, 0.5);
  box-shadow: 0 0 12px rgba(0, 180, 255, 0.4);
  transform: translateY(-2px);
}

@media (max-width: 900px) {
  .team-lore { gap: 36px; padding: 40px 5%; }
  .team-lore section { padding: 28px 22px; }
  .intro h1 { font-size: 2.1rem; }
  .intro p { font-size: 1rem; }
  .projects h2, .team h2 { font-size: 1.5rem; margin-bottom: 24px; }
  .project-grid { gap: 16px; }
  .project-card { padding: 18px; }
  .member-grid { gap: 18px; }
  .member-card {
    padding: 16px;
    flex-direction: row;
    text-align: left;
  }
  .member-card img { width: 64px; height: 64px; flex-shrink: 0; }
  .member-info { text-align: left; }
  .member-card h3 { font-size: 1.05rem; }

  .credits h2 { font-size: 1.5rem; }
  .illus-card { width: 120px; padding: 14px 10px; }
}
</style>
