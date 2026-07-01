<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const _k = 'TG9yZTIwMjY='
const pwd = ref('')
const error = ref(false)
const route = useRoute()
const router = useRouter()

function tryLogin() {
  if (btoa(pwd.value) === _k) {
    sessionStorage.setItem('sw', '1')
    const r = typeof route.query.r === 'string' ? route.query.r : '/'
    router.replace(r || '/')
  } else {
    error.value = true
    pwd.value = ''
  }
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="login-title">SPAM LORE</div>
      <div class="divider"></div>
      <p class="login-subtitle">Accès restreint — entrez le mot de passe pour continuer.</p>

      <div class="input-wrap">
        <input
          v-model="pwd"
          type="password"
          placeholder="Mot de passe"
          autocomplete="off"
          autofocus
          @keydown.enter="tryLogin"
          @input="error = false"
        >
      </div>

      <button class="login-btn" @click="tryLogin">ENTRER</button>
      <p class="error-msg" :class="{ hidden: !error }">Mot de passe incorrect.</p>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: calc(100vh - var(--nav-h));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.login-card {
  position: relative;
  z-index: 10;
  width: min(420px, 90vw);
  padding: 2.5rem 2rem;
  background: rgba(0, 0, 20, 0.85);
  border: 1px solid rgba(126, 63, 242, 0.35);
  border-radius: 1.5rem;
  box-shadow: 0 0 3rem rgba(126, 63, 242, 0.25), inset 0 0 1.5rem rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(18px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.6rem;
}
.login-title {
  font-family: 'Orbitron', 'Segoe UI', sans-serif;
  font-size: clamp(1.3rem, 4vw, 1.8rem);
  font-weight: 700;
  background: linear-gradient(45deg, #63d0ff, #7e3ff2);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: center;
  letter-spacing: 0.06em;
}
.login-subtitle { font-size: 0.95rem; color: rgba(185, 223, 255, 0.55); text-align: center; line-height: 1.5; }
.input-wrap { width: 100%; position: relative; }
.input-wrap input {
  width: 100%;
  padding: 0.85rem 1.1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(126, 63, 242, 0.3);
  border-radius: 0.75rem;
  color: #c8e8ff;
  font-size: 1.05rem;
  letter-spacing: 0.08em;
  outline: none;
  transition: border-color 0.25s, box-shadow 0.25s;
  text-align: center;
}
.input-wrap input:focus { border-color: rgba(126, 63, 242, 0.7); box-shadow: 0 0 0.8rem rgba(126, 63, 242, 0.3); }
.input-wrap input::placeholder { color: rgba(185, 223, 255, 0.3); letter-spacing: 0.05em; }
.login-btn {
  width: 100%;
  padding: 0.85rem;
  background: linear-gradient(135deg, rgba(126, 63, 242, 0.7), rgba(99, 208, 255, 0.4));
  border: 1px solid rgba(126, 63, 242, 0.5);
  border-radius: 0.75rem;
  color: #fff;
  font-family: 'Orbitron', 'Segoe UI', sans-serif;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: box-shadow 0.25s, transform 0.15s;
}
.login-btn:hover { box-shadow: 0 0 1.5rem rgba(126, 63, 242, 0.5); transform: translateY(-1px); }
.login-btn:active { transform: translateY(0); }
.error-msg { font-size: 0.88rem; color: #ff6b6b; text-align: center; min-height: 1.2em; transition: opacity 0.2s; }
.error-msg.hidden { opacity: 0; }
.divider { width: 60%; height: 1px; background: linear-gradient(to right, transparent, rgba(126, 63, 242, 0.4), transparent); }
</style>
