(() => {
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const temMouse = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // Títulos: quebra em palavras para cada uma subir da máscara.
  document.querySelectorAll(".dividir").forEach((titulo) => {
    let i = 0;
    const quebrar = (no) => {
      [...no.childNodes].forEach((filho) => {
        if (filho.nodeType === Node.TEXT_NODE) {
          const pedacos = filho.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          pedacos.forEach((p) => {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(" ")); return; }
            const palavra = document.createElement("span");
            palavra.className = "palavra";
            const dentro = document.createElement("span");
            dentro.textContent = p;
            dentro.style.setProperty("--i", i++);
            palavra.appendChild(dentro);
            frag.appendChild(palavra);
          });
          filho.replaceWith(frag);
        } else if (filho.nodeType === Node.ELEMENT_NODE && filho.tagName !== "BR") {
          quebrar(filho);
        }
      });
    };
    titulo.setAttribute("aria-label", titulo.textContent.replace(/\s+/g, " ").trim());
    quebrar(titulo);
  });

  // Barra de status em cada celular (hora, ilha, sinal e bateria).
  const barra = `<div class="barra-status" aria-hidden="true"><span>9:41</span><i class="ilha"></i><span class="icones-status"><svg viewBox="0 0 18 11"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="5" y="5" width="3" height="6" rx="1"/><rect x="10" y="2.5" width="3" height="8.5" rx="1"/><rect x="15" y="0" width="3" height="11" rx="1"/></svg><svg viewBox="0 0 26 12"><rect x="0.5" y="0.5" width="22" height="11" rx="3" fill="none" stroke="#f2f5f4" stroke-opacity=".5"/><rect x="2.5" y="2.5" width="16" height="7" rx="1.5"/><rect x="24" y="4" width="2" height="4" rx="1" fill-opacity=".5"/></svg></span></div>`;
  document.querySelectorAll(".celular-tela").forEach((tela) => tela.insertAdjacentHTML("afterbegin", barra));

  // Topo e símbolo.
  const topo = document.querySelector(".topo");
  document.querySelector(".topo .marca-simbolo").classList.add("montar");

  // Elementos aparecem ao entrar na tela, em sequência dentro do mesmo bloco.
  const revelar = document.querySelectorAll(".revelar");
  const grupos = new Map();
  revelar.forEach((el) => {
    const pai = el.parentElement;
    const i = grupos.get(pai) || 0;
    grupos.set(pai, i + 1);
    el.style.setProperty("--atraso", `${Math.min(i, 6) * 0.08}s`);
  });
  const observador = new IntersectionObserver(
    (entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("visivel");
        observador.unobserve(e.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  revelar.forEach((el) => observador.observe(el));
  document.querySelectorAll(".dividir").forEach((el) => observador.observe(el));

  const simboloFinal = document.querySelector(".final-simbolo");
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    simboloFinal.classList.add("montar");
    obs.disconnect();
  }, { threshold: 0.6 }).observe(simboloFinal);

  // Herói: entrada, telas trocando, timecode e celular inclinando com o mouse.
  const heroi = document.querySelector(".heroi");
  requestAnimationFrame(() => heroi.classList.add("pronto"));

  const telasHeroi = document.querySelectorAll("#heroi-telas img");
  let atual = 0;
  if (telasHeroi.length > 1) {
    setInterval(() => {
      const saindo = telasHeroi[atual];
      saindo.classList.replace("ativa", "saindo");
      setTimeout(() => saindo.classList.remove("saindo"), 900);
      atual = (atual + 1) % telasHeroi.length;
      telasHeroi[atual].classList.add("ativa");
    }, 3200);
  }

  const timecode = document.getElementById("timecode");
  const comeco = performance.now();
  const dois = (n) => String(n).padStart(2, "0");
  {
    setInterval(() => {
      const quadros = Math.floor(((performance.now() - comeco) / 1000) * 24);
      const s = Math.floor(quadros / 24);
      timecode.textContent = `${dois(Math.floor(s / 3600))}:${dois(Math.floor(s / 60) % 60)}:${dois(s % 60)}:${dois(quadros % 24)}`;
    }, 1000 / 24);
  }

  const celular = document.getElementById("celular-heroi");
  if (temMouse) {
    heroi.addEventListener("pointermove", (e) => {
      const r = heroi.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      celular.style.setProperty("--ry", `${-14 + x * 26}deg`);
      celular.style.setProperty("--rx", `${6 - y * 14}deg`);
    });
    heroi.addEventListener("pointerleave", () => {
      celular.style.removeProperty("--ry");
      celular.style.removeProperty("--rx");
    });
    // Só deixa o mouse controlar depois que a entrada terminou.
    celular.addEventListener("animationend", () => { celular.style.animation = "none"; }, { once: true });
  }

  // Botões magnéticos.
  if (temMouse && !semMovimento) {
    document.querySelectorAll(".magnetico").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--tx", `${(e.clientX - r.left - r.width / 2) * 0.25}px`);
        el.style.setProperty("--ty", `${(e.clientY - r.top - r.height / 2) * 0.35}px`);
      });
      el.addEventListener("pointerleave", () => {
        el.style.removeProperty("--tx");
        el.style.removeProperty("--ty");
      });
    });
  }

  // Tudo que depende da rolagem, num só quadro.
  const progresso = document.querySelector(".progresso");
  const estreito = window.matchMedia("(max-width: 960px)");
  const flutuantes = document.querySelectorAll("[data-paralaxe]");
  const heroiGrade = document.querySelector(".heroi-grade");
  const final = document.querySelector(".final");
  const finalDentro = final.querySelector(".dentro");
  const etapas = document.getElementById("etapas");
  const itensEtapa = [...etapas.children];

  function aoRolar() {
    const y = window.scrollY;
    const altura = window.innerHeight;
    topo.classList.toggle("rolou", y > 10);
    const total = document.documentElement.scrollHeight - altura;
    progresso.style.setProperty("--lido", total > 0 ? (y / total).toFixed(4) : 0);

    // Em tela estreita o celular fica embaixo do texto: nada de sumir ou deslizar.
    if (estreito.matches) {
      flutuantes.forEach((el) => el.style.removeProperty("--py"));
      heroiGrade.style.removeProperty("--sobe");
      heroiGrade.style.removeProperty("--some");
    } else if (!semMovimento) {
      flutuantes.forEach((el) => el.style.setProperty("--py", `${y * Number(el.dataset.paralaxe)}px`));
      const saida = Math.min(1, y / (altura * 0.9));
      heroiGrade.style.setProperty("--sobe", `${saida * 120}px`);
      heroiGrade.style.setProperty("--some", (1 - saida * 0.85).toFixed(3));
    }
    if (!semMovimento) {

      const caixaFinal = final.getBoundingClientRect();
      const chegada = Math.min(1, Math.max(0, (altura - caixaFinal.top) / (altura * 0.55)));
      finalDentro.style.setProperty("--escala", (0.9 + chegada * 0.1).toFixed(3));
      finalDentro.style.setProperty("--opac", (0.4 + chegada * 0.6).toFixed(3));
    }

    const caixa = etapas.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (altura * 0.85 - caixa.top) / (altura * 0.5)));
    etapas.style.setProperty("--progresso", p.toFixed(3));
    itensEtapa.forEach((li, i) => li.classList.toggle("feita", p >= i / (itensEtapa.length - 1) - 0.02));

  }
  window.addEventListener("scroll", () => requestAnimationFrame(aoRolar), { passive: true });
  aoRolar();

  // Carrossel infinito em leque: cópias nas pontas, salto invisível ao chegar
  // nelas, arrastar com o mouse, pontinhos com o tempo do avanço automático.
  const trilho = document.getElementById("carrossel");
  const carrossel = trilho.closest(".carrossel");
  const originais = [...trilho.querySelectorAll(".slide")];
  const n = originais.length;
  const copia = (s) => {
    const c = s.cloneNode(true);
    c.setAttribute("aria-hidden", "true");
    c.classList.add("copia");
    return c;
  };
  originais.slice().reverse().forEach((s) => trilho.prepend(copia(s)));
  originais.forEach((s) => trilho.append(copia(s)));
  const slides = [...trilho.querySelectorAll(".slide")];

  const pontos = document.getElementById("pontos");
  const botoesPonto = originais.map((_, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", `Tela ${i + 1}`);
    b.addEventListener("click", () => irPara(n + i));
    pontos.appendChild(b);
    return b;
  });

  let ativo = n;
  const passo = () => slides[1].offsetLeft - slides[0].offsetLeft;
  const posicao = (i) => slides[i].offsetLeft - (trilho.clientWidth - slides[i].clientWidth) / 2;
  function irPara(i, suave = true) {
    trilho.scrollTo({ left: posicao(i), behavior: suave ? "smooth" : "instant" });
  }
  function atualizarAtivo() {
    const meio = trilho.scrollLeft + trilho.clientWidth / 2;
    let melhor = ativo;
    let menor = Infinity;
    const largura = passo();
    slides.forEach((s, i) => {
      const d = s.offsetLeft + s.clientWidth / 2 - meio;
      const rel = d / largura;
      s.style.setProperty("--dist", Math.min(1.6, Math.abs(rel)).toFixed(3));
      s.style.setProperty("--lado", semMovimento ? 0 : Math.max(-1, Math.min(1, rel)).toFixed(3));
      if (Math.abs(d) < menor) { menor = Math.abs(d); melhor = i; }
    });
    if (melhor !== ativo) {
      ativo = melhor;
      slides.forEach((s, i) => s.classList.toggle("ativo", i === ativo));
      botoesPonto.forEach((b, i) => b.classList.toggle("ativo", i === ativo % n));
      reiniciarTempo();
    }
  }
  // Ao parar numa cópia, pula para a original igual sem a pessoa perceber.
  function corrigirPonta() {
    if (arrastando) return;
    if (ativo < n || ativo >= 2 * n) {
      const destino = ((ativo % n) + n) % n + n;
      trilho.style.scrollSnapType = "none";
      trilho.style.scrollBehavior = "auto";
      trilho.scrollLeft += (destino - ativo) * passo();
      ativo = destino;
      atualizarAtivoForcado();
      requestAnimationFrame(() => { trilho.style.scrollSnapType = ""; trilho.style.scrollBehavior = ""; });
    }
  }
  function atualizarAtivoForcado() {
    ativo = -1;
    atualizarAtivo();
  }
  let fimRolagem;
  trilho.addEventListener("scroll", () => {
    requestAnimationFrame(atualizarAtivo);
    clearTimeout(fimRolagem);
    fimRolagem = setTimeout(corrigirPonta, 140);
  }, { passive: true });
  window.addEventListener("resize", () => { irPara(ativo, false); atualizarAtivoForcado(); });

  document.querySelector(".seta-ant").addEventListener("click", () => irPara(ativo - 1));
  document.querySelector(".seta-prox").addEventListener("click", () => irPara(ativo + 1));
  trilho.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); irPara(ativo + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); irPara(ativo - 1); }
  });

  // Arrastar com o mouse no computador (no celular o dedo já rola).
  let arrastando = false;
  let inicioX = 0;
  let inicioScroll = 0;
  let moveu = false;
  let ativoInicio = 0;
  trilho.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse") return;
    arrastando = true;
    moveu = false;
    inicioX = e.clientX;
    inicioScroll = trilho.scrollLeft;
    ativoInicio = ativo;
    trilho.classList.add("arrastando");
    trilho.setPointerCapture(e.pointerId);
  });
  trilho.addEventListener("pointermove", (e) => {
    if (!arrastando) return;
    const dx = e.clientX - inicioX;
    if (Math.abs(dx) > 4) moveu = true;
    trilho.scrollLeft = inicioScroll - dx;
  });
  const soltar = (e) => {
    if (!arrastando) return;
    arrastando = false;
    trilho.classList.remove("arrastando");
    const dx = e.clientX - inicioX;
    // Um puxão rápido já leva para a próxima.
    irPara(Math.abs(dx) > 60 && ativo === ativoInicio ? ativo - Math.sign(dx) : ativo);
  };
  trilho.addEventListener("pointerup", soltar);
  trilho.addEventListener("pointercancel", soltar);
  trilho.addEventListener("click", (e) => { if (moveu) { e.preventDefault(); e.stopPropagation(); } }, true);
  trilho.addEventListener("dragstart", (e) => e.preventDefault());

  // Começa na primeira original, sem animação.
  requestAnimationFrame(() => { irPara(n, false); atualizarAtivoForcado(); });

  // Avanço automático com o tempo aparecendo no pontinho ativo.
  let pausado = false;
  let visivel = false;
  const TEMPO = 4000;
  let relogio;
  function reiniciarTempo() {
    clearTimeout(relogio);
    pontos.style.setProperty("--tempo", `${TEMPO}ms`);
    botoesPonto.forEach((b) => b.classList.remove("contando"));
    if (!visivel || pausado) return;
    void pontos.offsetWidth;
    botoesPonto[ativo % n].classList.add("contando");
    relogio = setTimeout(() => irPara(ativo + 1), TEMPO);
  }
  const pausar = () => { pausado = true; reiniciarTempo(); };
  const continuar = () => { pausado = false; reiniciarTempo(); };
  trilho.addEventListener("pointerenter", pausar);
  trilho.addEventListener("pointerleave", continuar);
  trilho.addEventListener("touchstart", pausar, { passive: true });
  trilho.addEventListener("touchend", () => setTimeout(continuar, 2500), { passive: true });
  trilho.addEventListener("focusin", pausar);
  trilho.addEventListener("focusout", continuar);
  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel) carrossel.classList.add("entrou");
    reiniciarTempo();
  }, { threshold: 0.35 }).observe(trilho);

  // Perguntas abrem e fecham com a altura animada.
  {
    document.querySelectorAll(".duvidas details").forEach((det) => {
      const resumo = det.querySelector("summary");
      resumo.addEventListener("click", (e) => {
        e.preventDefault();
        const fechada = det.offsetHeight;
        if (det.open) {
          det.style.height = `${fechada}px`;
          requestAnimationFrame(() => { det.style.height = `${resumo.offsetHeight}px`; });
          det.addEventListener("transitionend", () => { det.open = false; det.style.height = ""; }, { once: true });
        } else {
          det.style.height = `${fechada}px`;
          det.open = true;
          requestAnimationFrame(() => { det.style.height = `${det.scrollHeight}px`; });
          det.addEventListener("transitionend", () => { det.style.height = ""; }, { once: true });
        }
      });
    });
  }
})();
