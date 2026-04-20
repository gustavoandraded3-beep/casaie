#!/bin/bash
cd "$(dirname "$0")"
echo "🏠 Iniciando CasaIE..."
open http://localhost:3000
npm run dev
