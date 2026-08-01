/* 
  ===================================================================
  JAVASCRIPT VANILLA - LANDING PAGE LUCAS SALES CARNEIRO
  ===================================================================
  Funcionalidades Interativas de Alto Impacto para Recrutadores:
  1. Menu Mobile Hambúrguer (Abrir/Fechar)
  2. Efeito Máquina de Escrever (Typewriter Subtitle)
  3. Destaque Dinâmico no Menu ao Rolar a Página (ScrollSpy)
  4. Animações Reveladas ao Rolar a Página (Scroll Reveal)
  5. Cópia de Dados de Contato com Notificação Flutuante (Toast)
  ===================================================================
*/

// Executa os scripts assim que o documento HTML estiver totalmente carregado
document.addEventListener('DOMContentLoaded', function () {

  /* -------------------------------------------------------------------
     1. GERENCIAMENTO DO MENU MOBILE (HAMBÚRGUER)
     ------------------------------------------------------------------- */
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Alterna a exibição do menu mobile ao clicar no botão hambúrguer
  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', function () {
      navMenu.classList.toggle('aberto');
    });
  }

  // Fecha o menu mobile automaticamente ao clicar em qualquer opção
  navLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (navMenu && navMenu.classList.contains('aberto')) {
        navMenu.classList.remove('aberto');
      }
    });
  });

  /* -------------------------------------------------------------------
     2. EFEITO MÁQUINA DE ESCREVER (TYPEWRITER EFFECT)
     ------------------------------------------------------------------- */
  const elementoTextoMaquina = document.getElementById('textoMaquina');
  
  // Frases que serão digitadas em ciclo para impressionar recrutadores
  const frases = [
    "Desenvolvedor Web & Full Stack Python",
    "Estudante de ADS na UNINOVE",
    "Criador de Aplicações SaaS & APIs REST",
    "Especializado em IA Generativa & Automação"
  ];

  let indiceFrase = 0;
  let indiceCaractere = 0;
  let apagando = false;
  const velocidadeDigitacao = 70;
  const velocidadeApagar = 40;
  const tempoPausa = 2200;

  function digitarEfeito() {
    if (!elementoTextoMaquina) return;

    const fraseAtual = frases[indiceFrase];

    if (apagando) {
      // Remove um caractere por vez
      elementoTextoMaquina.textContent = fraseAtual.substring(0, indiceCaractere - 1);
      indiceCaractere--;
    } else {
      // Adiciona um caractere por vez
      elementoTextoMaquina.textContent = fraseAtual.substring(0, indiceCaractere + 1);
      indiceCaractere++;
    }

    // Controle do estado de digitação / exclusão
    if (!apagando && indiceCaractere === fraseAtual.length) {
      // Pausa ao terminar de digitar a frase completa
      setTimeout(function () {
        apagando = true;
        digitarEfeito();
      }, tempoPausa);
      return;
    } else if (apagando && indiceCaractere === 0) {
      // Passa para a próxima frase
      apagando = false;
      indiceFrase = (indiceFrase + 1) % frases.length;
    }

    const proximaVelocidade = apagando ? velocidadeApagar : velocidadeDigitacao;
    setTimeout(digitarEfeito, proximaVelocidade);
  }

  // Inicia o efeito de digitação
  digitarEfeito();

  /* -------------------------------------------------------------------
     3. DESTAQUE DINÂMICO DOS LINKS DO MENU AO ROLAR (SCROLLSPY)
     ------------------------------------------------------------------- */
  const secoes = document.querySelectorAll('section[id]');

  function destacarMenuNoScroll() {
    const posicaoScroll = window.scrollY + 200;

    secoes.forEach(function (secao) {
      const topoSecao = secao.offsetTop;
      const alturaSecao = secao.offsetHeight;
      const idSecao = secao.getAttribute('id');

      if (posicaoScroll >= topoSecao && posicaoScroll < topoSecao + alturaSecao) {
        navLinks.forEach(function (link) {
          link.classList.remove('ativo');
        });

        const linkAtivo = document.querySelector('.nav-link[href*="' + idSecao + '"]');
        if (linkAtivo) {
          linkAtivo.classList.add('ativo');
        }
      }
    });
  }

  window.addEventListener('scroll', destacarMenuNoScroll);

  /* -------------------------------------------------------------------
     4. ANIMAÇÕES REVELADAS AO ROLAR (SCROLL REVEAL)
     ------------------------------------------------------------------- */
  // Seleciona elementos importantes da página para aplicar animações de entrada
  const elementosParaRevelar = document.querySelectorAll('.cartao-projeto, .cartao-diferencial, .cartao-certificacao, .cartao-icone-tech, .cartao-habilidade, .cartao-experiencia');

  elementosParaRevelar.forEach(function (el) {
    el.classList.add('revelar-scroll');
  });

  function verificarRevelacaoScroll() {
    const alturaJanela = window.innerHeight;
    const pontoSensivel = 120;

    elementosParaRevelar.forEach(function (el) {
      const topoElemento = el.getBoundingClientRect().top;
      if (topoElemento < alturaJanela - pontoSensivel) {
        el.classList.add('visivel');
      }
    });
  }

  window.addEventListener('scroll', verificarRevelacaoScroll);
  // Executa uma vez no carregamento inicial
  verificarRevelacaoScroll();

});

/* -------------------------------------------------------------------
   5. CÓPIA DE DADOS DE CONTATO PARA ÁREA DE TRANSFERÊNCIA (CLIPBOARD)
   ------------------------------------------------------------------- */
/**
 * Copia o texto contido em um elemento HTML para a área de transferência do usuário.
 * @param {string} idElemento - O ID do elemento SPAN contendo o texto a ser copiado.
 * @param {string} mensagemSucesso - A mensagem exibida na notificação.
 */
function copiarTexto(idElemento, mensagemSucesso) {
  const elementoTexto = document.getElementById(idElemento);

  if (!elementoTexto) {
    console.error('Elemento não encontrado para cópia: ' + idElemento);
    return;
  }

  const textoParaCopiar = elementoTexto.innerText;

  navigator.clipboard.writeText(textoParaCopiar)
    .then(function () {
      mostrarToast(mensagemSucesso);
    })
    .catch(function (erro) {
      console.error('Erro ao copiar texto: ', erro);
      mostrarToast('Não foi possível copiar automaticamente.');
    });
}

/* -------------------------------------------------------------------
   6. EXIBIÇÃO DE NOTIFICAÇÃO FLUTUANTE (TOAST NOTIFICATION)
   ------------------------------------------------------------------- */
/**
 * Exibe uma notificação estilo Toast em tela por alguns segundos.
 * @param {string} mensagem - Texto a ser exibido.
 */
function mostrarToast(mensagem) {
  const toast = document.getElementById('toastNotificacao');

  if (!toast) return;

  toast.innerText = mensagem;
  toast.classList.add('mostrar');

  setTimeout(function () {
    toast.classList.remove('mostrar');
  }, 3000);
}
