// ==========================
// Configurações
// ==========================
const PIXEL_ID = '03af56d0-f5c0-4455-bd34-7719b4b383c8'; // ID do serviço de API
const API_URL = 'https://njsxezhedrldrfrowpml.supabase.co/functions/v1/meta-conversion';
const FACEBOOK_PIXEL_ID = '324230336566459';
const LINK_GRUPO = 'https://chat.whatsapp.com/Jss9HpySH3k7w5X6EYCqIg';

// ==========================
// Função principal (único ponto de entrada)
// ==========================
async function enviarEvento(eventName, userData = {}, customData = { currency: 'BRL', value: 0 }) {
    try {
        // --- 1. Gera event_id único para desduplicação
        const eventId = crypto.randomUUID();

        // --- 2. Envia via Pixel (client-side)
        if (typeof fbq === 'function') {
            fbq('track', eventName, customData, { eventID: eventId });
            console.log(`Evento '${eventName}' enviado via Pixel (event_id: ${eventId})`);
        } else {
            console.warn('Meta Pixel (fbq) não carregado.');
        }

        // --- 3. Monta o payload para a API (server-side)
        const evento = {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId, // mesmo ID do evento do Pixel para desduplicação
            action_source: 'website',
            event_source_url: window.location.href,
            user_data: userData,
            custom_data: customData,
        };

        // --- 4. Envia via API de Conversões
        await sendConversion(evento);
    } catch (error) {
        console.error('Erro ao enviar evento:', error);
    }
}

// ==========================
// Envio via API de Conversões
// ==========================
async function sendConversion(evento) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-pixel-id': PIXEL_ID,
                'x-origin': window.location.origin
            },
            body: JSON.stringify(evento)
        });

        const result = await response.json();
        console.log('Evento enviado à API de conversões:', result);
        return result;
    } catch (error) {
        console.error('Erro ao enviar conversão API:', error);
    }
}

// ==========================
// Utilitários
// ==========================
function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

async function getUserData() {
    return {
        client_user_agent: navigator.userAgent,
        fbp: getCookie('_fbp'),
        fbc: getCookie('_fbc')
    };
}

// ==========================
// Inicialização dos links e eventos
// ==========================
document.addEventListener('DOMContentLoaded', () => {
    const btsCta = document.querySelectorAll('.btn-cta');

    btsCta.forEach(a => {
        // Configura o link e comportamento
        a.setAttribute("href", LINK_GRUPO);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");

        // Adiciona o listener de clique para tracking
        a.addEventListener("click", async function (e) {
            // Evita disparar múltiplos eventos se o usuário clicar rápido
            if (!this.dataset.pixelSent) {
                const userData = await getUserData();
                const botao_id = this.id ? this.id : 'btn-sem-id';

                enviarEvento('Lead', userData, {
                    content_name: `Lead - Brigadeiros Gourmet`,
                    content_id: botao_id,
                    value: 0.00,
                    currency: 'BRL'
                });

                this.dataset.pixelSent = "true";
            }
        });
    });
});
