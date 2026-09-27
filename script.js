/* =========================================================
   CALCULADORA ÁLCOOL x GASOLINA
   Interface em React / Lógica em JavaScript
   ========================================================= */

const { useState, useMemo } = React;
const h = React.createElement;

// Regra prática: o etanol rende, em média, 70% da autonomia da gasolina.
// Ou seja, se o litro do etanol custar até 70% do preço da gasolina,
// compensa abastecer com etanol.
const FATOR_ETANOL = 0.7;

/* ---------------------------------------------------------
   FUNÇÕES AUXILIARES
   --------------------------------------------------------- */

// Converte um texto digitado (ex: "4,59" ou "4.590,50") em número
function parseValor(texto) {
  if (!texto) return NaN;
  const limpo = texto.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  return parseFloat(limpo);
}

// Formata um número no padrão monetário brasileiro (ex: 4,59)
function formatBRL(numero) {
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/* ---------------------------------------------------------
   COMPONENTE: CAMPO DE PREÇO
   --------------------------------------------------------- */
function CampoPreco({ tipo, rotulo, valor, aoAlterar }) {
  return h('div', { className: 'field' },
    h('label', null,
      h('span', { className: 'dot ' + (tipo === 'et' ? 'et' : 'ga') }),
      rotulo
    ),
    h('div', { className: 'input-wrap' },
      h('span', null, 'R$'),
      h('input', {
        type: 'text',
        inputMode: 'decimal',
        placeholder: '0,00',
        value: valor,
        onChange: (e) => aoAlterar(e.target.value),
        'aria-label': rotulo
      })
    )
  );
}

/* ---------------------------------------------------------
   COMPONENTE PRINCIPAL DO APP
   --------------------------------------------------------- */
function App() {
  const [precoAlcool, setPrecoAlcool] = useState('');
  const [precoGasolina, setPrecoGasolina] = useState('');
  const [resultadoAberto, setResultadoAberto] = useState(false);

  const atualizarPrecoAlcool = (valor) => {
    setPrecoAlcool(valor);
    setResultadoAberto(valor.length >= precoAlcool.length);
  };

  const atualizarPrecoGasolina = (valor) => {
    setPrecoGasolina(valor);
    setResultadoAberto(valor.length >= precoGasolina.length);
  };

  // Recalcula o resultado sempre que os preços mudam
  const resultado = useMemo(() => {
    const pa = parseValor(precoAlcool);
    const pg = parseValor(precoGasolina);
    if (!pa || !pg || pa <= 0 || pg <= 0) return null;

    const razao = pa / pg;
    const compensaEtanol = razao <= FATOR_ETANOL;

    // Custo relativo por km rodado (quanto menor, mais econômico)
    const custoEtanolKm = pa / FATOR_ETANOL;
    const custoGasolinaKm = pg;
    const maiorCusto = Math.max(custoEtanolKm, custoGasolinaKm);
    const economiaEstimad = Math.abs(custoEtanolKm - custoGasolinaKm) * 50;

    // Quanto se economiza, em %, escolhendo o combustível vencedor
    const economiaPercentual = compensaEtanol
      ? (1 - custoEtanolKm / custoGasolinaKm) * 100
      : (1 - custoGasolinaKm / custoEtanolKm) * 100;

    return {
      razao,
      compensaEtanol,
      custoEtanolKm,
      custoGasolinaKm,
      economiaEstimad,
      percentualBarraEtanol: (custoEtanolKm / maiorCusto) * 100,
      percentualBarraGasolina: (custoGasolinaKm / maiorCusto) * 100,
      economiaPercentual
    };
  }, [precoAlcool, precoGasolina]);

  const melhorEscolha = resultado ? (resultado.compensaEtanol ? 'ALCOOL' : 'GASOLINA') : '';

  const corDestaque = resultado
    ? (resultado.compensaEtanol ? 'var(--etanol)' : 'var(--gasolina)')
    : 'var(--etanol)';

  return h('div', { className: 'app' },

    // Cabeçalho
    h('div', { className: 'brand-header' },
      h('img', {
        className: 'brand-logo',
        src: 'scripts/logo.png',
        alt: 'Logo do site'
      })
    ),
    h('h2', { className: 'brand-subtitle' }, 'Álcool x Gasolina'),
    h('h1', null, 'Álcool ou gasolina: o que vale mais no seu tanque?'),

    // Card com os campos de preço
    h('div', { className: 'card' },
      h('div', { className: 'field-row' },
        h(CampoPreco, {
          tipo: 'et',
          rotulo: 'Etanol (litro)',
          valor: precoAlcool,
          aoAlterar: atualizarPrecoAlcool
        }),
        h(CampoPreco, {
          tipo: 'ga',
          rotulo: 'Gasolina (litro)',
          valor: precoGasolina,
          aoAlterar: atualizarPrecoGasolina
        })
      )
    ),

    resultado && resultadoAberto
      ? h('div', { className: 'result-banner', role: 'status', 'aria-live': 'polite' },
          h('button', {
            type: 'button',
            className: 'result-close',
            onClick: () => setResultadoAberto(false),
            'aria-label': 'Fechar melhor escolha'
          }, '×'),
          h('div', { className: 'result-banner__label' }, '🏆 MELHOR ESCOLHA'),
          h('div', { className: 'result-banner__fuel' }, melhorEscolha),
          h('div', { className: 'result-banner__economy' }, 'Economia estimada (50 L equivalentes): R$ ' + formatBRL(resultado.economiaEstimad))
        )
      : null,

    // Resultado + gráfico (só aparece quando os dois preços foram informados)
    resultado
      ? h(React.Fragment, null,

          // Card de veredito
          h('div', { className: 'card verdict-card', style: { '--accent': corDestaque } },
            h('p', { className: 'verdict-label' }, 'Vale mais a pena abastecer com'),
            h('p', { className: 'verdict-fuel' }, resultado.compensaEtanol ? 'Etanol' : 'Gasolina'),
            h('p', { className: 'verdict-detail' },
              'O etanol está custando ',
              h('b', null, (resultado.razao * 100).toFixed(0) + '%'),
              ' do preço da gasolina. Abaixo de 70% ele compensa. Nessa proporção, você roda por ',
              h('b', null, resultado.economiaPercentual.toFixed(0) + '% a menos'),
              ' por quilômetro escolhendo ' + (resultado.compensaEtanol ? 'etanol' : 'gasolina') + '.'
            )
          ),

          // Card do gráfico comparativo
          h('div', { className: 'card' },
            h('p', { className: 'chart-title' }, 'Custo relativo por quilômetro rodado'),

            // Barra do etanol
            h('div', { className: 'bar-row' },
              h('div', { className: 'bar-head' },
                h('span', { className: 'name' }, h('span', { className: 'dot et' }), 'Etanol'),
                h('span', { className: 'val' }, 'R$ ' + formatBRL(resultado.custoEtanolKm))
              ),
              h('div', { className: 'bar-track' },
                h('div', { className: 'bar-fill et', style: { width: resultado.percentualBarraEtanol + '%' } })
              )
            ),

            // Barra da gasolina
            h('div', { className: 'bar-row' },
              h('div', { className: 'bar-head' },
                h('span', { className: 'name' }, h('span', { className: 'dot ga' }), 'Gasolina'),
                h('span', { className: 'val' }, 'R$ ' + formatBRL(resultado.custoGasolinaKm))
              ),
              h('div', { className: 'bar-track' },
                h('div', { className: 'bar-fill ga', style: { width: resultado.percentualBarraGasolina + '%' } })
              )
            )
          )
        )
      : h('div', { className: 'card' },
          h('p', { className: 'empty-hint' }, 'Informe os dois preços para ver a comparação')
        ),

    // Nota explicativa
    h('p', { className: 'foot-note' },
      'Cálculo baseado na regra prática de que o etanol rende cerca de 70% da autonomia da gasolina por litro. Motores e condições de uso variam, use como referência.'
    )
  );
}

/* ---------------------------------------------------------
   INICIALIZAÇÃO DO APP
   --------------------------------------------------------- */
ReactDOM.createRoot(document.getElementById('root')).render(h(App));
