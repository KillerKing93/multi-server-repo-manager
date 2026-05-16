#!/bin/bash
# Deploy script for AgriHub Microservices
mkdir -p services
cd services

# Clone all repositories
git clone https://github.com/KillerKing93/agribot-ai-tools.git ai-tools || (cd ai-tools && git pull)
git clone https://github.com/KillerKing93/agribot-pihps-scraper.git pihps-scraper || (cd pihps-scraper && git pull)
git clone https://github.com/KillerKing93/agribot-puter-broker.git puter-broker || (cd puter-broker && git pull)
git clone https://github.com/KillerKing93/agribot-rag-data-store.git rag-data-store || (cd rag-data-store && git pull)
git clone https://github.com/KillerKing93/agribot-rag-engine.git rag-engine || (cd rag-engine && git pull)
git clone https://github.com/KillerKing93/agribot-whatsapp-bot.git whatsapp-bot || (cd whatsapp-bot && git pull)

echo "Microservices cloned successfully."
